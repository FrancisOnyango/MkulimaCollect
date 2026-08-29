import { useMemo, useState } from "react";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { Image, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, DataRow, FooterActions, FormScreen, Notice, PrimaryButton, SecondaryButton, SectionCard, StepHeader, TextField } from "@/components/ui/FormKit";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterpriseById } from "@/features/enterprises/enterpriseRepository";
import { createEvidence, type CreateEvidenceInput } from "@/features/evidence/evidenceRepository";
import { getSectorMeta } from "@/features/sectors/catalog";

type SelectedAsset = {
  uri: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  source: "CAMERA" | "PICKER";
};

type PersistedAsset = {
  localUri: string;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256: string;
};

export default function EvidenceCaptureScreen() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; enterpriseId?: string; sector?: string; category?: string; dependsOn?: string }>();
  const sectorMeta = useMemo(() => getSectorMeta(params.sector ?? ""), [params.sector]);
  const defaultCategory = params.category ?? sectorMeta.evidenceCategories[0] ?? "farm-photo";
  const [category, setCategory] = useState(defaultCategory);
  const [asset, setAsset] = useState<SelectedAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function captureFromCamera() {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
      setError("Camera permission is required to capture evidence.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setAsset(buildSelectedAsset(result.assets[0], "CAMERA"));
    }
  }

  async function pickDocumentImage() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
      setError("Photo library permission is required to attach evidence.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setAsset(buildSelectedAsset(result.assets[0], "PICKER"));
    }
  }

  async function handleSave() {
    if (!asset) {
      setError("Capture or select an evidence image first.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const enterprise = params.enterpriseId ? await getEnterpriseById(db, params.enterpriseId) : null;
      const farmerId = params.farmerId ?? enterprise?.farmerId;

      if (!farmerId) {
        setError("Evidence needs a farmer or enterprise link.");
        return;
      }

      const savedAsset = await persistEvidenceAsset(asset, category);
      const farmId = params.farmId ?? enterprise?.farmId;
      const evidenceInput: CreateEvidenceInput = {
        farmerId,
        category,
        localUri: savedAsset.localUri,
        mimeType: savedAsset.mimeType,
        fileSizeBytes: savedAsset.fileSizeBytes,
        sha256: savedAsset.sha256,
        filename: savedAsset.filename,
        source: asset.source,
        dependsOn: params.dependsOn ? [params.dependsOn] : [],
      };

      if (farmId) {
        evidenceInput.farmId = farmId;
      }

      if (params.enterpriseId) {
        evidenceInput.enterpriseId = params.enterpriseId;
      }

      const { evidenceId } = await createEvidence(db, evidenceInput);
      router.replace({ pathname: "/evidence/[evidenceId]", params: { evidenceId } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save evidence");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen
      footer={
        <FooterActions
          secondary={<SecondaryButton label="Select image" disabled={saving} onPress={pickDocumentImage} />}
          primary={<PrimaryButton label="Save evidence" loading={saving} onPress={handleSave} />}
        />
      }
    >
      <StepHeader
        eyebrow="Evidence vault"
        title="Capture verifiable evidence"
        description={`Attach ${sectorMeta.label} evidence to the farmer profile. Files are copied into app-owned storage before the sync record is queued.`}
      />

      <SectionCard title="Evidence category" description={`Recommended categories for ${sectorMeta.label}: ${sectorMeta.evidenceCategories.join(", ")}.`}>
        <ChoiceGroup label="Category" value={category} options={sectorMeta.evidenceCategories} onChange={(value) => setCategory(value as string)} required />
        <TextField label="Custom category" value={category} onChangeText={setCategory} placeholder="e.g. buyer-delivery-note" helper="Use lowercase labels such as farm-photo, payment-statement, input-receipt, or sector-specific records." />
      </SectionCard>

      <SectionCard title="Attachment" description="Capture directly from the device camera, or select an existing image from the gallery.">
        {asset ? (
          <View>
            <Image source={{ uri: asset.uri }} style={styles.preview} />
            <DataRow label="Source" value={asset.source === "CAMERA" ? "Camera" : "Gallery"} />
            <DataRow label="Original name" value={asset.fileName ?? "Captured image"} />
            <DataRow label="Save target" value="Device evidence vault" tone="success" />
          </View>
        ) : (
          <Notice title="No image selected" message="Capture a fresh field photo or attach an existing evidence image before saving." tone="warning" />
        )}
        <SecondaryButton label="Capture photo" disabled={saving} onPress={captureFromCamera} />
      </SectionCard>

      <SectionCard title="Routing context" description={sectorMeta.description}>
        <DataRow label="Sector" value={sectorMeta.label} />
        <DataRow label="Score path" value={sectorMeta.scorePath} />
        <DataRow label="Local-first save" value="Enabled" tone="success" />
      </SectionCard>

      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}

async function persistEvidenceAsset(asset: SelectedAsset, category: string): Promise<PersistedAsset> {
  const documentDirectory = FileSystem.documentDirectory;

  if (!documentDirectory) {
    throw new Error("Device storage is not available for evidence capture.");
  }

  const evidenceDirectory = `${documentDirectory}evidence/`;
  await FileSystem.makeDirectoryAsync(evidenceDirectory, { intermediates: true });

  const mimeType = asset.mimeType ?? "image/jpeg";
  const extension = extensionFor(asset, mimeType);
  const filename = `${new Date().toISOString().replace(/[:.]/g, "-")}-${sanitizeFilePart(category)}-${Crypto.randomUUID()}.${extension}`;
  const localUri = `${evidenceDirectory}${filename}`;

  await FileSystem.copyAsync({ from: asset.uri, to: localUri });

  const fileInfo = await FileSystem.getInfoAsync(localUri, { md5: true });
  const fileSizeBytes = fileInfo.exists ? fileInfo.size ?? asset.fileSize ?? 0 : asset.fileSize ?? 0;
  const checksumSeed = fileInfo.exists && "md5" in fileInfo && fileInfo.md5 ? `${fileInfo.md5}:${fileSizeBytes}` : `${localUri}:${fileSizeBytes}`;
  const sha256 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, checksumSeed);

  return {
    localUri,
    filename,
    mimeType,
    fileSizeBytes,
    sha256,
  };
}

function buildSelectedAsset(asset: ImagePicker.ImagePickerAsset, source: SelectedAsset["source"]): SelectedAsset {
  const selected: SelectedAsset = {
    uri: asset.uri,
    source,
  };

  if (asset.fileName) {
    selected.fileName = asset.fileName;
  }

  if (asset.mimeType) {
    selected.mimeType = asset.mimeType;
  }

  if (typeof asset.fileSize === "number") {
    selected.fileSize = asset.fileSize;
  }

  return selected;
}

function extensionFor(asset: SelectedAsset, mimeType: string) {
  const fromName = asset.fileName?.split(".").pop();

  if (fromName && fromName.length <= 5) {
    return sanitizeFilePart(fromName).toLowerCase();
  }

  if (mimeType.includes("png")) {
    return "png";
  }

  if (mimeType.includes("webp")) {
    return "webp";
  }

  return "jpg";
}

function sanitizeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "evidence";
}

const styles = StyleSheet.create({
  preview: {
    backgroundColor: Colors.charcoal100,
    borderRadius: 8,
    height: 220,
    marginBottom: 10,
    width: "100%",
  },
});
