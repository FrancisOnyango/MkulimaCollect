import { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, DataRow, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";
import { type SectorIdValue } from "@/constants/sectorIds";
import { useDatabase } from "@/components/providers/DBProvider";
import { createEnterprise } from "@/features/enterprises/enterpriseRepository";
import { defaultSectorGroup, defaultSectorId, getSectorMeta, getSectorsByGroup, sectorGroups, type SectorGroupId } from "@/features/sectors/catalog";

export default function EnterpriseStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const farmId = params.farmId ?? "";
  const dependsOn = params.dependsOn ? [params.dependsOn] : [];
  const [group, setGroup] = useState<SectorGroupId>(defaultSectorGroup);
  const [sector, setSector] = useState<SectorIdValue>(defaultSectorId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visibleSectors = useMemo(() => getSectorsByGroup(group), [group]);
  const selectedSector = getSectorMeta(sector);

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
    <FormScreen footer={<PrimaryButton label="Open selected sector form" loading={saving} onPress={handleContinue} />}>
      <StepHeader
        eyebrow="Enterprise profile"
        title="Select the farmer's production sector"
        description="Choose the enterprise that should feed this farmer's MkulimaScore profile. The next screen loads a versioned form for that specific sector."
        step={5}
        total={8}
      />

      <SectionCard title="Sector family" description="Start with the business family, then choose the exact enterprise being assessed.">
        <ChoiceGroup
          label="Enterprise group"
          value={group}
          options={sectorGroups}
          onChange={(value) => {
            const nextGroup = value as SectorGroupId;
            const firstSector = getSectorsByGroup(nextGroup)[0]?.id ?? defaultSectorId;
            setGroup(nextGroup);
            setSector(firstSector);
          }}
          required
        />
      </SectionCard>

      <SectionCard title="Enterprise sector" description="Each selection controls the route, schema, evidence prompts, and scoring context.">
        <ChoiceGroup
          label="Sector"
          value={sector}
          options={visibleSectors.map((item) => ({ label: item.label, value: item.id }))}
          onChange={(value) => setSector(value as SectorIdValue)}
          required
        />
      </SectionCard>

      <SectionCard title="Selected route" description={selectedSector.description}>
        <DataRow label="Sector" value={selectedSector.label} />
        <DataRow label="Family" value={selectedSector.group} />
        <DataRow label="MkulimaScore path" value={selectedSector.scorePath} />
        <DataRow label="Collection route" value={`/collect/${selectedSector.id}`} tone="success" />
        <DataRow label="Evidence set" value={selectedSector.evidenceCategories.slice(0, 3).join(", ")} />
      </SectionCard>

      <Notice title="Multi-sector intake active" message="The collection workflow now routes by the selected sector. Dairy remains available under livestock, but it is no longer the default operating assumption." tone="success" />
      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
