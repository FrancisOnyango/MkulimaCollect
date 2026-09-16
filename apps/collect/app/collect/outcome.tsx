import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterpriseById } from "@/features/enterprises/enterpriseRepository";
import { saveProductionObservation } from "@/features/production/productionRepository";

const statuses = ["current", "delayed", "defaulted", "cleared", "restructured"] as const;

export default function LoanOutcomeStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; plotId?: string; enterpriseId?: string; sector?: string }>();
  const [facility, setFacility] = useState("");
  const [useOfFunds, setUseOfFunds] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("current");
  const [shock, setShock] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!params.enterpriseId || !facility.trim()) {
      setError("Open this from an enterprise and name the facility.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const enterprise = await getEnterpriseById(db, params.enterpriseId);
      const sector = enterprise?.sector ?? params.sector ?? "maize";
      await saveProductionObservation(db, {
        enterpriseId: params.enterpriseId,
        sector,
        schemaId: `${sector}-loan-outcome-v1`,
        schemaVersion: "1.0.0",
        section: "loan-outcome",
        payload: {
          [`${sector.replace(/-/g, "")}FacilityName`]: facility.trim(),
          [`${sector.replace(/-/g, "")}UseOfFunds`]: useOfFunds.trim(),
          [`${sector.replace(/-/g, "")}RepaymentStatus`]: status,
          [`${sector.replace(/-/g, "")}ShockOrException`]: shock.trim(),
        },
      });
      router.replace({ pathname: "/collect/holdings", params: { farmerId: params.farmerId, farmId: params.farmId, plotId: params.plotId } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save outcome");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label="Save loan outcome" loading={saving} onPress={() => void save()} />}>
      <StepHeader
        eyebrow="Institution record"
        title="Loan outcome follow-up"
        description="Credit outcomes stay on the evidence timeline. This is not a score label."
        step={8}
        total={10}
      />
      <SectionCard title="Facility">
        <TextField label="Facility or product" required value={facility} onChangeText={setFacility} placeholder="Input credit, SACCO loan" />
        <TextField label="Use of funds" value={useOfFunds} onChangeText={setUseOfFunds} />
        <ChoiceGroup label="Repayment status" value={status} options={[...statuses]} onChange={(value) => setStatus(value as (typeof statuses)[number])} />
        <TextField label="Shock or exception" value={shock} onChangeText={setShock} placeholder="Drought, illness, delayed payment" />
      </SectionCard>
      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
