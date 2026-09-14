import { useEffect, useState } from "react";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DataRow, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { calculateCompletenessDetails } from "@/features/farmers/farmerCompleteness";
import { completeCollectionSession } from "@/features/farmers/collectionSessionRepository";
import { updateCompleteness, updateFarmerStatus } from "@/features/farmers/farmerRepository";

export default function ReviewStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string }>();
  const farmerId = params.farmerId ?? "";
  const [completeness, setCompleteness] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmerId) {
      return;
    }

    void calculateCompletenessDetails(db, farmerId).then((details) => {
      setCompleteness(details.percent);
      setMissing(details.missing);
    });
  }, [db, farmerId]);

  async function handleSubmit() {
    if (!farmerId) {
      setError("Missing farmer session.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const details = await calculateCompletenessDetails(db, farmerId);
      if (details.missing.length) {
        setCompleteness(details.percent);
        setMissing(details.missing);
        setError("Resolve missing holdings before submitting. Every farm and enterprise must be complete.");
        return;
      }
      await updateCompleteness(db, farmerId, details.percent);
      await updateFarmerStatus(db, farmerId, "SUBMITTED");
      await completeCollectionSession(db, farmerId);
      setCompleteness(details.percent);
      setMissing(details.missing);
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit farmer profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label={submitted ? "Back home" : "Submit locally"} loading={saving} onPress={submitted ? () => router.replace("/(tabs)") : handleSubmit} />}>
      <StepHeader
        eyebrow="Submission control"
        title="Profile review"
        description="Confirm the local profile is complete enough for sync. Submission marks the farmer profile as ready in the offline queue."
      />

      <SectionCard title="Completeness score" description="This score reflects required local sections, not the final MkulimaScore credit outcome.">
        <Text style={{ color: Colors.brand, fontSize: 44, fontWeight: "800", marginBottom: 8 }}>{completeness}%</Text>
        <DataRow label="Profile status" value={submitted ? "Submitted locally" : "In progress"} tone={submitted ? "success" : "warning"} />
        <DataRow label="Sync readiness" value="Outbox controlled" tone="success" />
        <DataRow label="Backend validation" value="Pending sync" />
      </SectionCard>

      <SectionCard title="Missing or weak items" description="Resolve these where possible before syncing. Some profiles may still be submitted for supervisor review.">
        {missing.length ? missing.map((item) => <DataRow key={item} label={item} value="Missing" tone="warning" />) : <DataRow label="Required sections" value="Complete" tone="success" />}
      </SectionCard>

      {submitted ? <Notice title="Saved and waiting to sync" message="The farmer profile is submitted locally. Use Sync Centre when a staging or production ingestion API is configured." tone="success" /> : null}
      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
