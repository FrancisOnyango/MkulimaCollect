import { router, useLocalSearchParams } from "expo-router";
import { DataRow, FooterActions, FormScreen, Notice, PrimaryButton, SecondaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";

export default function LocationStep() {
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; dependsOn?: string }>();

  function handleBoundaryCapture() {
    if (params.farmId) {
      router.push({ pathname: "/farms/[farmId]/boundary", params: { farmId: params.farmId, farmerId: params.farmerId, dependsOn: params.dependsOn } });
      return;
    }

    router.push({ pathname: "/collect/farm", params });
  }

  function handleBack() {
    router.back();
  }

  return (
    <FormScreen
      footer={
        <FooterActions
          secondary={<SecondaryButton label="Back" onPress={handleBack} />}
          primary={<PrimaryButton label={params.farmId ? "Capture boundary" : "Complete farm profile"} onPress={handleBoundaryCapture} />}
        />
      }
    >
      <StepHeader
        eyebrow="Geospatial checkpoint"
        title="Farm location assurance"
        description="The farm GPS pin is captured on the farm step. This screen opens the walked-boundary tool."
        step={5}
        total={9}
      />

      <SectionCard title="Location workflow" description="The human-readable farm location is captured in the farm profile. This step controls measured boundary capture and evidence quality.">
        <DataRow label="Farm session" value={params.farmId ? "Linked" : "Missing"} tone={params.farmId ? "success" : "warning"} />
        <DataRow label="Boundary capture" value={params.farmId ? "Ready" : "Requires farm profile"} tone={params.farmId ? "success" : "warning"} />
        <DataRow label="Storage mode" value="Offline-first device record" tone="success" />
        <DataRow label="Sync behavior" value="Queued for validation" />
      </SectionCard>

      <SectionCard title="Field quality checks" description="Use this checkpoint before walking the boundary or confirming the location with the farmer.">
        <DataRow label="Farmer present" value="Recommended" />
        <DataRow label="Boundary confidence" value="GPS measured where possible" />
        <DataRow label="Scoring write access" value="Blocked in mobile app" tone="success" />
      </SectionCard>

      <Notice
        title="No direct scoring writes"
        message="MkulimaCollect prepares location data for MkulimaScore ingestion. Production scoring tables remain protected behind the backend validation layer."
        tone="success"
      />
    </FormScreen>
  );
}
