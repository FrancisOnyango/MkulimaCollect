import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterpriseById } from "@/features/enterprises/enterpriseRepository";
import { getOrCreateActiveProductionCycle, saveProductionObservation } from "@/features/production/productionRepository";
import { getSectorMeta } from "@/features/sectors/catalog";

const eventTypes = ["birth", "purchase", "transfer_in", "sale", "death", "missing", "vaccination"] as const;

function camel(value: string) {
  return value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()).replace(/-/g, "");
}

export default function LivestockEventStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; plotId?: string; enterpriseId?: string; sector?: string; dependsOn?: string }>();
  const [label, setLabel] = useState("Livestock");
  const [eventType, setEventType] = useState<(typeof eventTypes)[number]>("birth");
  const [count, setCount] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.enterpriseId) return;
    void getEnterpriseById(db, params.enterpriseId).then((enterprise) => {
      setLabel(getSectorMeta(enterprise?.sector ?? params.sector ?? "dairy").label);
    });
  }, [db, params.enterpriseId, params.sector]);

  async function save() {
    if (!params.enterpriseId || !count.trim()) {
      setError("Event count is required so inventory can reconcile.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const enterprise = await getEnterpriseById(db, params.enterpriseId);
      const sector = enterprise?.sector ?? params.sector ?? "dairy";
      const prefix = camel(sector);
      await getOrCreateActiveProductionCycle(db, params.enterpriseId, sector);
      await saveProductionObservation(db, {
        enterpriseId: params.enterpriseId,
        sector,
        schemaId: `${sector}-livestock-event-v1`,
        schemaVersion: "1.0.0",
        section: "livestock-event",
        payload: {
          [`${prefix}EventType`]: eventType,
          [`${prefix}EventCount`]: Number(count),
          [`${prefix}EventOccurredAt`]: occurredAt,
          [`${prefix}EventNotes`]: notes.trim(),
        },
        dependsOn: params.dependsOn ? [params.dependsOn] : [],
      });
      router.replace({ pathname: "/collect/holdings", params: { farmerId: params.farmerId, farmId: params.farmId, plotId: params.plotId } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save livestock event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label="Save livestock event" loading={saving} onPress={() => void save()} />}>
      <StepHeader
        eyebrow={label}
        title="Livestock event"
        description="Births, purchases, transfers, sales, deaths, and missing animals stay as dated events. They do not overwrite earlier stock counts."
        step={8}
        total={10}
      />
      <SectionCard title="Event">
        <ChoiceGroup label="Event type" value={eventType} options={[...eventTypes]} onChange={(value) => setEventType(value as (typeof eventTypes)[number])} required />
        <TextField label="Count" required value={count} onChangeText={setCount} keyboardType="number-pad" />
        <TextField label="Date" value={occurredAt} onChangeText={setOccurredAt} placeholder="YYYY-MM-DD" />
        <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="Cause, buyer, permit" />
      </SectionCard>
      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
