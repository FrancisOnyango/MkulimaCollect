import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterpriseById } from "@/features/enterprises/enterpriseRepository";
import { upsertCollectionSession } from "@/features/farmers/collectionSessionRepository";
import { closeProductionCycle, createNamedProductionCycle, getProductionCyclesByEnterprise } from "@/features/production/productionRepository";
import { getSectorMeta } from "@/features/sectors/catalog";

const cycleTypes = ["season", "batch", "lactation", "crop_year", "grow_out", "harvest_window"] as const;
const stages = ["started", "vegetative", "flowering", "harvest", "lactating", "grow_out", "closed"] as const;

export default function CycleStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; plotId?: string; enterpriseId?: string; sector?: string; dependsOn?: string }>();
  const [label, setLabel] = useState("Enterprise");
  const [name, setName] = useState("");
  const [cycleType, setCycleType] = useState<(typeof cycleTypes)[number]>("season");
  const [stage, setStage] = useState<(typeof stages)[number]>("started");
  const [startedAt, setStartedAt] = useState(new Date().toISOString().slice(0, 10));
  const [cycles, setCycles] = useState<Awaited<ReturnType<typeof getProductionCyclesByEnterprise>>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.enterpriseId) return;
    void Promise.all([getEnterpriseById(db, params.enterpriseId), getProductionCyclesByEnterprise(db, params.enterpriseId)]).then(([enterprise, rows]) => {
      const sector = enterprise?.sector ?? params.sector ?? "";
      setLabel(getSectorMeta(sector).label);
      setCycles(rows);
      setName((current) => current || `${getSectorMeta(sector).label} ${new Date().getFullYear()}`);
    });
  }, [db, params.enterpriseId, params.sector]);

  async function saveCycle() {
    if (!params.enterpriseId || !params.farmerId || !name.trim()) {
      setError("Enterprise and cycle name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const enterprise = await getEnterpriseById(db, params.enterpriseId);
      const sector = enterprise?.sector ?? params.sector ?? "";
      const { cycleId, operationUuid } = await createNamedProductionCycle(db, {
        enterpriseId: params.enterpriseId,
        sector,
        name: name.trim(),
        cycleType,
        stage,
        startedAt: new Date(startedAt).toISOString(),
        dependsOn: params.dependsOn ? [params.dependsOn] : [],
      });
      await upsertCollectionSession(db, {
        farmerId: params.farmerId,
        farmId: params.farmId,
        plotId: params.plotId,
        currentStep: "holdings",
        stepStates: { currentEnterpriseId: params.enterpriseId, currentSector: sector, currentCycleId: cycleId },
      });
      router.replace({
        pathname: "/collect/holdings",
        params: { farmerId: params.farmerId, farmId: params.farmId, plotId: params.plotId, enterpriseId: params.enterpriseId, dependsOn: operationUuid },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save cycle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label="Save cycle" loading={saving} onPress={() => void saveCycle()} />}>
      <StepHeader
        eyebrow={label}
        title="Production cycle"
        description="One enterprise can have overlapping cycles. Name this season, batch, lactation, or grow-out so later harvests and events stay attached."
        step={8}
        total={10}
      />

      <SectionCard title="New cycle">
        <TextField label="Cycle name" required value={name} onChangeText={setName} placeholder="Long rains 2026" />
        <ChoiceGroup label="Cycle type" value={cycleType} options={[...cycleTypes]} onChange={(value) => setCycleType(value as (typeof cycleTypes)[number])} required />
        <ChoiceGroup label="Stage" value={stage} options={[...stages]} onChange={(value) => setStage(value as (typeof stages)[number])} />
        <TextField label="Started on" value={startedAt} onChangeText={setStartedAt} placeholder="YYYY-MM-DD" />
      </SectionCard>

      <SectionCard title="Existing cycles" description={`${cycles.length} recorded. Overlapping active cycles are allowed.`}>
        {cycles.length ? cycles.map((cycle) => (
          <PrimaryButton
            key={cycle.id}
            label={`${cycle.status === "ACTIVE" ? "Close" : "Closed"} · ${cycle.name}`}
            onPress={() => {
              if (cycle.status === "ACTIVE") {
                void closeProductionCycle(db, cycle.id).then(() => getProductionCyclesByEnterprise(db, params.enterpriseId as string).then(setCycles));
              }
            }}
          />
        )) : <Notice title="No cycles yet" message="Save the first cycle before recording harvests or livestock events." tone="warning" />}
      </SectionCard>

      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
