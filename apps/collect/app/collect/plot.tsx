import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { upsertCollectionSession } from "@/features/farmers/collectionSessionRepository";
import { getFarmById } from "@/features/farms/farmRepository";
import { createPlot, getPlotsByFarm, plotUnitTypes, type PlotUnitType } from "@/features/plots/plotRepository";

function labelForUnit(value: string) {
  return value.replace(/_/g, " ");
}

export default function PlotStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const farmId = params.farmId ?? "";
  const [farmName, setFarmName] = useState("This farm");
  const [existingCount, setExistingCount] = useState(0);
  const [name, setName] = useState("Main plot");
  const [unitType, setUnitType] = useState<PlotUnitType>("open_field");
  const [areaHa, setAreaHa] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmId) return;
    void Promise.all([getFarmById(db, farmId), getPlotsByFarm(db, farmId)]).then(([farm, rows]) => {
      if (farm?.name) setFarmName(farm.name);
      setExistingCount(rows.length);
      setName((current) => (current === "Main plot" && rows.length > 0 ? `Plot ${rows.length + 1}` : current));
    });
  }, [db, farmId]);

  async function handleSave() {
    if (!farmerId || !farmId || !name.trim()) {
      setError("Farm session and plot name are required.");
      return;
    }
    const parsedArea = Number(areaHa);
    if (areaHa.trim() && (!Number.isFinite(parsedArea) || parsedArea <= 0)) {
      setError("Area must be a positive number in hectares.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { plotId, operationUuid } = await createPlot(db, {
        farmerId,
        farmId,
        name: name.trim(),
        unitType,
        areaHa: areaHa.trim() ? parsedArea : undefined,
        notes: notes.trim() || undefined,
        dependsOn: params.dependsOn ? [params.dependsOn] : [],
      });
      await upsertCollectionSession(db, { farmerId, farmId, plotId, currentStep: "holdings" });
      router.replace({ pathname: "/collect/holdings", params: { farmerId, farmId, plotId, dependsOn: operationUuid } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save plot");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label="Save plot and return to holdings" loading={saving} onPress={() => void handleSave()} />}>
      <StepHeader
        eyebrow={`Plot on ${farmName}`}
        title={existingCount ? `Add plot ${existingCount + 1}` : "Add a production unit"}
        description="A farm can have several plots: fields, greenhouses, ponds, houses, cages, tanks, or apiaries. Enterprises attach to a plot, not to the farmer."
        step={6}
        total={10}
      />

      <SectionCard title="Production unit" description="Name the plot the way the farmer talks about it.">
        <TextField label="Plot name" required value={name} onChangeText={setName} placeholder="Lower shamba, Pond 1, Layer house" />
        <ChoiceGroup
          label="Unit type"
          value={unitType}
          options={plotUnitTypes.map((item) => ({ value: item, label: labelForUnit(item) }))}
          onChange={(value) => setUnitType(value as PlotUnitType)}
          required
        />
        <TextField label="Area (ha)" value={areaHa} onChangeText={setAreaHa} keyboardType="decimal-pad" placeholder="Optional" />
        <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="Irrigation, soil, access" />
      </SectionCard>

      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
