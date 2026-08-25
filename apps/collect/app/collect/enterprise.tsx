import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";
import { SectorId, type SectorIdValue } from "@/constants/sectorIds";
import { useDatabase } from "@/components/providers/DBProvider";
import { createEnterprise } from "@/features/enterprises/enterpriseRepository";

const sectors: { id: SectorIdValue; label: string; group: string }[] = [
  { id: SectorId.DAIRY, label: "Dairy", group: "Livestock" },
  { id: SectorId.POULTRY, label: "Poultry", group: "Livestock" },
  { id: SectorId.LIVESTOCK_MEAT, label: "Livestock meat", group: "Livestock" },
  { id: SectorId.AQUACULTURE, label: "Aquaculture", group: "Livestock" },
  { id: SectorId.MAIZE, label: "Maize", group: "Annual crops" },
  { id: SectorId.RICE, label: "Rice", group: "Annual crops" },
  { id: SectorId.IRISH_POTATO, label: "Irish potato", group: "Annual crops" },
  { id: SectorId.BEANS, label: "Beans", group: "Annual crops" },
  { id: SectorId.TOMATO, label: "Tomato", group: "Horticulture" },
  { id: SectorId.HORTICULTURE, label: "Horticulture", group: "Horticulture" },
  { id: SectorId.TEA, label: "Tea", group: "Perennial crops" },
  { id: SectorId.COFFEE, label: "Coffee", group: "Perennial crops" },
  { id: SectorId.AVOCADO, label: "Avocado", group: "Perennial crops" },
  { id: SectorId.MACADAMIA, label: "Macadamia", group: "Perennial crops" },
];

const groups = ["Livestock", "Annual crops", "Horticulture", "Perennial crops"] as const;

export default function EnterpriseStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const farmId = params.farmId ?? "";
  const dependsOn = params.dependsOn ? [params.dependsOn] : [];
  const [group, setGroup] = useState<(typeof groups)[number]>("Livestock");
  const [sector, setSector] = useState<SectorIdValue>(SectorId.DAIRY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visibleSectors = sectors.filter((item) => item.group === group);

  async function handleContinue() {
    if (!farmerId || !farmId) {
      setError("Missing farmer or farm session.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { enterpriseId, operationUuid } = await createEnterprise(db, {
        farmerId,
        farmId,
        sector,
        dependsOn,
      });

      router.push({ pathname: "/collect/[sector]", params: { sector, farmerId, farmId, enterpriseId, dependsOn: operationUuid } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save enterprise");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label="Open sector form" loading={saving} onPress={handleContinue} />}>
      <StepHeader
        eyebrow="Enterprise profile"
        title="Select production sector"
        description="MkulimaCollect supports multiple agricultural sectors. Choose the enterprise that should feed this farmer's MkulimaScore profile."
        step={5}
        total={8}
      />

      <SectionCard title="Sector family" description="Group sectors by business model so agents can find the right form quickly.">
        <ChoiceGroup label="Enterprise group" value={group} options={groups} onChange={(value) => {
          const nextGroup = value as (typeof groups)[number];
          setGroup(nextGroup);
          setSector(sectors.find((item) => item.group === nextGroup)?.id ?? SectorId.DAIRY);
        }} required />
      </SectionCard>

      <SectionCard title="Enterprise sector" description="The next screen loads a versioned schema with production, market, costs, and evidence prompts for the selected sector.">
        <ChoiceGroup label="Sector" value={sector} options={visibleSectors.map((item) => ({ label: item.label, value: item.id }))} onChange={(value) => setSector(value as SectorIdValue)} required />
      </SectionCard>

      <Notice title="Not dairy-only" message="Dairy is one supported sector. Crop, livestock, horticulture, aquaculture, and perennial crop forms are available from the same intake flow." tone="success" />
      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
