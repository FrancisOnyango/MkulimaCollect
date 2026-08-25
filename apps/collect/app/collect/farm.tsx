import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { createFarm } from "@/features/farms/farmRepository";

const tenureOptions = ["OWNED", "LEASED", "FAMILY_LAND", "COMMUNAL", "OTHER"] as const;

export default function FarmStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const dependsOn = params.dependsOn ? [params.dependsOn] : [];
  const [name, setName] = useState("Main farm");
  const [village, setVillage] = useState("");
  const [ward, setWard] = useState("");
  const [county, setCounty] = useState("");
  const [size, setSize] = useState("");
  const [tenure, setTenure] = useState<(typeof tenureOptions)[number]>("OWNED");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!farmerId) {
      setError("Missing farmer session.");
      return;
    }

    if (!name.trim() || !village.trim()) {
      setError("Farm name and village are required.");
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
        county: county.trim() || undefined,
        tenure,
        ...(Number.isFinite(parsedSize) && size.trim() ? { sizeReportedAcres: parsedSize, sizeReportedSource: "FARMER_REPORTED" } : {}),
        dependsOn,
      });

      router.push({ pathname: "/collect/enterprise", params: { farmerId, farmId, dependsOn: operationUuid } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save farm");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label="Continue to enterprise" loading={saving} onPress={handleContinue} />}>
      <StepHeader
        eyebrow="Farm profile"
        title="Land and location"
        description="Create the farm record that anchors sector enterprises, GPS boundary capture, evidence, and production history."
        step={4}
        total={8}
      />

      <SectionCard title="Farm identity" description="Use names the farmer and local institution will recognize during later review.">
        <TextField label="Farm name" required value={name} onChangeText={setName} placeholder="Main farm" />
        <ChoiceGroup label="Tenure" value={tenure} options={tenureOptions} onChange={(value) => setTenure(value as (typeof tenureOptions)[number])} required />
      </SectionCard>

      <SectionCard title="Location details" description="GPS boundary capture can be done later; this section records the human-readable location immediately.">
        <TextField label="Village or estate" required value={village} onChangeText={setVillage} placeholder="Village" />
        <TextField label="Ward or sub-location" value={ward} onChangeText={setWard} placeholder="Optional" />
        <TextField label="County" value={county} onChangeText={setCounty} placeholder="Optional" />
        <TextField label="Reported size" value={size} onChangeText={setSize} keyboardType="decimal-pad" placeholder="Acres" helper="Farmer-reported acreage is stored with its source. GPS measured area can be captured separately." />
      </SectionCard>

      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
