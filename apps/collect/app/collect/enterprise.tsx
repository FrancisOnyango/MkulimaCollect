import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { type SectorIdValue } from "@/constants/sectorIds";
import { DataRow, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { createEnterprise, getEnterprisesByFarm } from "@/features/enterprises/enterpriseRepository";
import { upsertCollectionSession } from "@/features/farmers/collectionSessionRepository";
import { getFarmById } from "@/features/farms/farmRepository";
import { getSectorMeta, sectorCatalog } from "@/features/sectors/catalog";

export default function EnterpriseStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const farmId = params.farmId ?? "";
  const dependsOn = params.dependsOn ? [params.dependsOn] : [];
  const [farmName, setFarmName] = useState("This farm");
  const [existingSectors, setExistingSectors] = useState<string[]>([]);
  const [selected, setSelected] = useState<SectorIdValue[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmId) {
      return;
    }

    void Promise.all([getFarmById(db, farmId), getEnterprisesByFarm(db, farmId)]).then(([farm, enterprises]) => {
      if (farm?.name) {
        setFarmName(farm.name);
      }
      setExistingSectors(enterprises.map((enterprise) => enterprise.sector));
    });
  }, [db, farmId]);

  function toggle(sector: SectorIdValue) {
    setSelected((current) => current.includes(sector) ? current.filter((item) => item !== sector) : [...current, sector]);
  }

  async function handleContinue() {
    if (!farmerId || !farmId) {
      setError("Missing farmer or farm session.");
      return;
    }

    const toCreate = selected.filter((sector) => !existingSectors.includes(sector));
    if (!toCreate.length) {
      setError("Select at least one new enterprise for this farm.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const createdIds: string[] = [];
      let firstEnterpriseId = "";
      let firstSector: SectorIdValue | undefined;
      let lastDepends = params.dependsOn;

      for (const sector of toCreate) {
        const { enterpriseId, operationUuid } = await createEnterprise(db, {
          farmerId,
          farmId,
          sector,
          dependsOn: lastDepends ? [lastDepends] : dependsOn,
        });
        lastDepends = operationUuid;
        createdIds.push(enterpriseId);
        if (!firstEnterpriseId) {
          firstEnterpriseId = enterpriseId;
          firstSector = sector;
        }
      }

      if (!firstSector || !firstEnterpriseId) {
        throw new Error("Failed to create enterprises.");
      }

      await upsertCollectionSession(db, {
        farmerId,
        farmId,
        currentStep: "sector",
        stepStates: { pendingEnterpriseIds: createdIds, currentEnterpriseId: firstEnterpriseId, currentSector: firstSector },
      });

      router.push({
        pathname: "/collect/[sector]",
        params: { sector: firstSector, farmerId, farmId, enterpriseId: firstEnterpriseId, dependsOn: lastDepends },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save enterprises");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label={selected.length > 1 ? `Save ${selected.length} enterprises` : "Save enterprise and open form"} loading={saving} onPress={handleContinue} />}>
      <StepHeader
        eyebrow="Enterprises"
        title={`What does ${farmName} produce?`}
        description="A farm can run more than one enterprise. Select every value chain on this holding. Each one gets its own unique form."
        step={6}
        total={9}
      />

      <SectionCard title="This farm" description="Enterprises are stored against the selected farm, not the farmer as a whole.">
        <DataRow label="Farm" value={farmName} />
        <DataRow label="Already captured" value={existingSectors.length ? existingSectors.map((id) => getSectorMeta(id).label).join(", ") : "None yet"} />
      </SectionCard>

      <SectionCard title="Add enterprises" description="Select one or many. You can return here from the holdings list to add more later.">
        {sectorCatalog.map((sector) => {
          const active = selected.includes(sector.id);
          const already = existingSectors.includes(sector.id);
          return (
            <Pressable
              accessibilityRole="button"
              disabled={already}
              key={sector.id}
              onPress={() => toggle(sector.id)}
              style={[styles.chip, active ? styles.chipActive : null, already ? styles.chipUsed : null]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{sector.label}</Text>
              <Text style={styles.chipMeta}>{already ? "Already on this farm" : sector.group}</Text>
            </Pressable>
          );
        })}
      </SectionCard>

      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.card,
    borderColor: Colors.charcoal100,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  chipActive: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandLight,
  },
  chipUsed: {
    opacity: 0.55,
  },
  chipText: {
    color: Colors.charcoal,
    fontSize: 16,
    fontWeight: "800",
  },
  chipTextActive: {
    color: Colors.brand,
  },
  chipMeta: {
    color: Colors.charcoal500,
    marginTop: 4,
  },
});
