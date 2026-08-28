import { router, useLocalSearchParams } from "expo-router";
import { DataRow, FooterActions, FormScreen, Notice, PrimaryButton, SecondaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";

export default function GpsBoundaryScreen() {
  const { farmId } = useLocalSearchParams<{ farmId?: string }>();

  function openBoundaryWorkflow() {
    if (farmId) {
      router.replace({ pathname: "/farms/[farmId]/boundary", params: { farmId } });
      return;
    }

    router.replace("/(tabs)/farmers");
  }

  return (
    <FormScreen
      footer={
        <FooterActions
          secondary={<SecondaryButton label="Back" onPress={() => router.back()} />}
          primary={<PrimaryButton label={farmId ? "Open boundary tool" : "Choose a farm"} onPress={openBoundaryWorkflow} />}
        />
      }
    >
      <StepHeader
        eyebrow="GPS operations"
        title="Boundary capture"
        description="Start a measured farm boundary workflow. The app stores walked polygon points locally and queues the geometry for backend validation."
      />

      <SectionCard title="Capture readiness" description="Boundary capture works without map tiles. The saved geometry updates farm acreage and sync dependencies atomically.">
        <DataRow label="Farm link" value={farmId ? "Available" : "Select a farm first"} tone={farmId ? "success" : "warning"} />
        <DataRow label="Minimum points" value="3 GPS points" />
        <DataRow label="Area method" value="Walked polygon" />
        <DataRow label="Offline support" value="Enabled" tone="success" />
      </SectionCard>

      <Notice
        title="Field instruction"
        message="Walk the farm perimeter with the farmer where possible. Capture points at corners or major turns, then complete the boundary when the polygon is valid."
        tone="success"
      />
    </FormScreen>
  );
}
