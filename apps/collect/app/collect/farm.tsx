import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, DataRow, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { createFarm, getFarmsByFarmer } from "@/features/farms/farmRepository";
import { captureCurrentPosition, type DevicePosition } from "@/lib/deviceLocation";
import { assertGpsAccuracy, formatAccuracy, isGpsAccurate } from "@/lib/gpsAccuracy";
import { upsertCollectionSession } from "@/features/farmers/collectionSessionRepository";

const tenureOptions = ["OWNED", "LEASED", "FAMILY_LAND", "COMMUNAL", "OTHER"] as const;

export default function FarmStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const dependsOn = params.dependsOn ? [params.dependsOn] : [];
  const [existingCount, setExistingCount] = useState(0);
  const [name, setName] = useState("Main farm");
  const [village, setVillage] = useState("");
  const [ward, setWard] = useState("");
  const [subCounty, setSubCounty] = useState("");
  const [county, setCounty] = useState("");
  const [size, setSize] = useState("");
  const [tenure, setTenure] = useState<(typeof tenureOptions)[number]>("OWNED");
  const [irrigation, setIrrigation] = useState<"YES" | "NO">("NO");
  const [pin, setPin] = useState<DevicePosition | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmerId) {
      return;
    }

    void getFarmsByFarmer(db, farmerId).then((rows) => {
      setExistingCount(rows.length);
      setName((current) => current === "Main farm" && rows.length > 0 ? `Farm ${rows.length + 1}` : current);
    });
  }, [db, farmerId]);

  async function capturePin() {
    setCapturing(true);
    setError(null);

    try {
      const nextPin = await captureCurrentPosition();
      assertGpsAccuracy(nextPin.accuracyM);
      setPin(nextPin);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to capture farm GPS");
    } finally {
      setCapturing(false);
    }
  }

  async function handleContinue() {
    if (!farmerId) {
      setError("Missing farmer session.");
      return;
    }

    if (!name.trim() || !village.trim()) {
      setError("Farm name and village are required.");
      return;
    }

    if (!pin || !isGpsAccurate(pin.accuracyM)) {
      setError("Capture a farm GPS pin with 15 m accuracy or better before saving this farm.");
      return;
    }

    const parsedSize = Number(size);
    if (size.trim() && (!Number.isFinite(parsedSize) || parsedSize <= 0)) {
      setError("Reported acreage must be a positive number.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { farmId, operationUuid } = await createFarm(db, {
        farmerId,
        name: name.trim(),
        village: village.trim(),
        ward: ward.trim() || undefined,
        subCounty: subCounty.trim() || undefined,
        county: county.trim() || undefined,
        tenure,
        irrigation: irrigation === "YES",
        gpsLatitude: pin.latitude,
        gpsLongitude: pin.longitude,
        gpsAccuracyM: pin.accuracyM ?? undefined,
        ...(Number.isFinite(parsedSize) && size.trim() ? { sizeReportedAcres: parsedSize, sizeReportedSource: "FARMER_REPORTED" } : {}),
        dependsOn,
      });
      await upsertCollectionSession(db, { farmerId, farmId, currentStep: "plot" });

      router.replace({
        pathname: "/collect/plot",
        params: { farmerId, farmId, dependsOn: operationUuid },
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to save farm";
      setError(/failed to run query ['"]begin['"]/i.test(message) ? "Storage was busy. Tap save again." : message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label="Save farm and add a plot" loading={saving} onPress={handleContinue} />}>
      <StepHeader
        eyebrow="Farm profile"
        title={existingCount ? `Add farm ${existingCount + 1}` : "Land and GPS"}
        description="A farmer can have more than one farm. Save this holding with a GPS pin, then add its plots. Walk the boundary later from the holdings list if you need to keep moving."
        step={4}
        total={9}
      />

      <SectionCard title="Farm identity" description="Use names the farmer and local institution will recognize during later review.">
        <TextField label="Farm name" required value={name} onChangeText={setName} placeholder="Main farm" />
        <ChoiceGroup label="Tenure" value={tenure} options={tenureOptions} onChange={(value) => setTenure(value as (typeof tenureOptions)[number])} required />
        <ChoiceGroup label="Irrigation" value={irrigation} options={["YES", "NO"]} onChange={(value) => setIrrigation(value as "YES" | "NO")} required />
      </SectionCard>

      <SectionCard title="Location details" description="Human-readable location is stored with the GPS pin.">
        <TextField label="Village or estate" required value={village} onChangeText={setVillage} placeholder="Village" />
        <TextField label="Ward or sub-location" value={ward} onChangeText={setWard} placeholder="Optional" />
        <TextField label="Sub-county" value={subCounty} onChangeText={setSubCounty} placeholder="Optional" />
        <TextField label="County" value={county} onChangeText={setCounty} placeholder="Optional" />
        <TextField label="Reported size" value={size} onChangeText={setSize} keyboardType="decimal-pad" placeholder="Acres" helper="Farmer-reported acreage. GPS measured area is optional and can be walked later." />
      </SectionCard>

      <SectionCard title="Farm GPS pin" description="Stand at the farm centre or homestead and capture the current position.">
        {pin ? (
          <>
            <DataRow label="Latitude" value={pin.latitude.toFixed(6)} tone="success" />
            <DataRow label="Longitude" value={pin.longitude.toFixed(6)} tone="success" />
            <DataRow label="Accuracy" value={formatAccuracy(pin.accuracyM)} tone={isGpsAccurate(pin.accuracyM) ? "success" : "warning"} />
          </>
        ) : (
        <Notice title="Pin not captured" message="Stand at the farm and wait until accuracy is 15 m or better." tone="warning" />
        )}
        <PrimaryButton label={pin ? "Recapture pin" : capturing ? "Capturing…" : "Capture farm GPS"} loading={capturing} onPress={capturePin} />
      </SectionCard>

      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
