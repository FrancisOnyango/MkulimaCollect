import { router, useLocalSearchParams } from "expo-router";
import { DataRow, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";

export default function FinancialStep() {
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; enterpriseId?: string; dependsOn?: string }>();

  return (
    <FormScreen footer={<PrimaryButton label="Review evidence" onPress={() => router.push({ pathname: "/collect/evidence-review", params })} />}>
      <StepHeader
        eyebrow="Readiness checkpoint"
        title="Financial profile signals"
        description="MkulimaCollect captures the evidence and operating signals that MkulimaScore can validate later. Scoring decisions remain server-side."
        step={7}
        total={8}
      />

      <SectionCard title="Local readiness" description="These items should be present before a profile is submitted from the field device.">
        <DataRow label="Consent and identity" value="Captured in intake" tone="success" />
        <DataRow label="Farm and sector enterprise" value="Linked locally" tone="success" />
        <DataRow label="Production and market signals" value="Captured per schema" tone="success" />
        <DataRow label="Evidence attachments" value="Review next" tone="warning" />
        <DataRow label="Credit decision" value="Backend only" />
      </SectionCard>

      <SectionCard title="Important boundary" description="This app prepares data for ingestion. It does not calculate credit limits, write scoring tables, or connect to production AWS merely to launch the APK.">
        <DataRow label="Offline mode" value="Enabled" tone="success" />
        <DataRow label="Sync target" value="Mobile ingestion API" />
        <DataRow label="Direct scoring writes" value="Blocked" tone="success" />
      </SectionCard>

      <Notice title="Field testing mode" message="The preview APK should open directly and remain usable without Metro or a PC. Backend sync requires an explicit staging API configuration." tone="success" />
    </FormScreen>
  );
}
