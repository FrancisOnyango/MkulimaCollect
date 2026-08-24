import { useState } from "react";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterpriseById } from "@/features/enterprises/enterpriseRepository";
import { createEvidence, type CreateEvidenceInput } from "@/features/evidence/evidenceRepository";

type SelectedAsset = {
  uri: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  source: "CAMERA" | "PICKER";
};

export default function EvidenceCaptureScreen() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; enterpriseId?: string; category?: string }>();
  const [category, setCategory] = useState(params.category ?? "farm-photo");
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
      const next = result.assets[0];
      setAsset(buildSelectedAsset(next, "CAMERA"));
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
      const next = result.assets[0];
      setAsset(buildSelectedAsset(next, "PICKER"));
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

      const fileInfo = await FileSystem.getInfoAsync(asset.uri, { md5: true });
      const fileSizeBytes = asset.fileSize ?? (fileInfo.exists ? fileInfo.size ?? 0 : 0);
      const fingerprint = fileInfo.exists && "md5" in fileInfo && fileInfo.md5 ? fileInfo.md5 : `${asset.uri}:${fileSizeBytes}`;
      const sha256 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, fingerprint);
      const farmId = params.farmId ?? enterprise?.farmId;
      const evidenceInput: CreateEvidenceInput = {
        farmerId,
        category,
        localUri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileSizeBytes,
        sha256,
        source: asset.source,
      };

      if (asset.fileName) {
        evidenceInput.filename = asset.fileName;
      }

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
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Evidence capture</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>Capture an image or attach one from the device. Metadata is saved locally for sync.</Text>
      <TextInput placeholder="Category" value={category} onChangeText={setCategory} style={inputStyle} />
      {asset ? <Image source={{ uri: asset.uri }} style={{ width: "100%", height: 180, borderRadius: 12, marginTop: 14, backgroundColor: Colors.charcoal100 }} /> : null}
      <Pressable accessibilityRole="button" disabled={saving} onPress={captureFromCamera} style={secondaryButtonStyle}>
        <Text style={{ color: Colors.brandDark, fontWeight: "700" }}>Capture photo</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={saving} onPress={pickDocumentImage} style={secondaryButtonStyle}>
        <Text style={{ color: Colors.brandDark, fontWeight: "700" }}>Select image</Text>
      </Pressable>
      {error ? <Text style={{ color: Colors.redField, marginTop: 14 }}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={saving} onPress={handleSave} style={buttonStyle(saving)}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "700" }}>Save evidence</Text>}
      </Pressable>
    </View>
  );
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

const inputStyle = {
  borderWidth: 1,
  borderColor: Colors.charcoal100,
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: Colors.charcoal,
  backgroundColor: "white",
  marginTop: 14,
};
const secondaryButtonStyle = { alignItems: "center" as const, borderRadius: 12, backgroundColor: Colors.brandLight, paddingVertical: 14, marginTop: 12 };

function buttonStyle(disabled: boolean) {
  return {
    alignItems: "center" as const,
    borderRadius: 12,
    backgroundColor: disabled ? Colors.charcoal300 : Colors.brand,
    paddingVertical: 14,
    marginTop: 14,
  };
}
