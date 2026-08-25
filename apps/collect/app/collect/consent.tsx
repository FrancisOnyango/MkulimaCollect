import { useState } from "react";
import { router } from "expo-router";
import { FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, ToggleRow } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { saveConsent } from "@/features/farmers/consentRepository";
import { createFarmer } from "@/features/farmers/farmerRepository";

export default function ConsentStep() {
  const db = useDatabase();
  const { agent } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [evidenceAuthorized, setEvidenceAuthorized] = useState(true);
  const [mpesaAuthorized, setMpesaAuthorized] = useState(false);
  const [syncAuthorized, setSyncAuthorized] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!agent || !accepted || !syncAuthorized) {
      setError("Farmer consent and secure sync authorization are required before collection can continue.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { farmerId, operationUuid: farmerOperationUuid } = await createFarmer(db, {
        agentId: agent.id,
        orgId: agent.orgId,
        status: "IN_PROGRESS",
      });
      const { operationUuid: consentOperationUuid } = await saveConsent(db, {
        farmerId,
        version: "1.0.0",
        method: "DIGITAL",
        language: "en",
        agentId: agent.id,
        itemsAgreed: [
          "data_collection",
          evidenceAuthorized ? "evidence_capture" : "evidence_declined",
          "offline_storage",
          "sync_to_mkulimascore",
        ],
        mpesaAuthorized,
        dependsOn: [farmerOperationUuid],
      });

      router.push({ pathname: "/collect/identity", params: { farmerId, dependsOn: consentOperationUuid } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save consent");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label="Start farmer profile" loading={saving} onPress={handleContinue} />}>
      <StepHeader
        eyebrow="MkulimaCollect field intake"
        title="Consent and data rights"
        description="Confirm the farmer understands what will be collected, where it is stored, and how it will feed MkulimaScore after sync."
        step={1}
        total={8}
      />

      <SectionCard title="Required authorization" description="Read this section to the farmer before recording their response. The record is saved offline with a local audit trail.">
        <ToggleRow label="Farmer agrees to field data collection" description="Identity, farm, enterprise, production, and membership information." value={accepted} onValueChange={setAccepted} />
        <ToggleRow label="Secure sync to MkulimaScore" description="Data remains queued locally until the device syncs to the approved ingestion API." value={syncAuthorized} onValueChange={setSyncAuthorized} />
      </SectionCard>

      <SectionCard title="Optional authorization" description="These options improve scoring confidence but should only be enabled when the farmer explicitly agrees.">
        <ToggleRow label="Evidence capture" description="Photos, documents, farm records, delivery slips, and payment statements." value={evidenceAuthorized} onValueChange={setEvidenceAuthorized} />
        <ToggleRow label="M-PESA statement review" description="Used later for payment history verification where available." value={mpesaAuthorized} onValueChange={setMpesaAuthorized} />
      </SectionCard>

      <Notice title="Offline-first protection" message="This app does not write directly into scoring tables. It creates field records and sync operations for backend validation." tone="success" />
      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
