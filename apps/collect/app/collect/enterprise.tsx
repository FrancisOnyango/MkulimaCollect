import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { type SectorIdValue } from "@/constants/sectorIds";
import { DataRow, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { createEnterprise, getEnterprisesByFarm, getEnterprisesByPlot } from "@/features/enterprises/enterpriseRepository";
import { upsertCollectionSession } from "@/features/farmers/collectionSessionRepository";
import { getFarmById } from "@/features/farms/farmRepository";
import { getPlotById } from "@/features/plots/plotRepository";
import { getOrCreateActiveProductionCycle } from "@/features/production/productionRepository";
import { getSectorMeta, getSectorsByGroup, sectorGroups } from "@/features/sectors/catalog";

export default function EnterpriseStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; plotId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const farmId = params.farmId ?? "";
  const plotId = params.plotId ?? "";
  const dependsOn = params.dependsOn ? [params.dependsOn] : [];
  const [farmName, setFarmName] = useState("This farm");
  const [plotName, setPlotName] = useState("this plot");
  const [existingSectors, setExistingSectors] = useState<string[]>([]);
  const [selected, setSelected] = useState<SectorIdValue[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmId) {
      return;
    }

    void Promise.all([
      getFarmById(db, farmId),
      plotId ? getPlotById(db, plotId) : Promise.resolve(null),
      plotId ? getEnterprisesByPlot(db, plotId) : getEnterprisesByFarm(db, farmId),
    ]).then(([farm, plot, enterprises]) => {
      if (farm?.name) {
        setFarmName(farm.name);
      }
      if (plot?.name) {
        setPlotName(plot.name);
      }
      setExistingSectors(enterprises.map((enterprise) => enterprise.sector));
    });
  }, [db, farmId, plotId]);

  function toggle(sector: SectorIdValue) {
    setSelected((current) => current.includes(sector) ? current.filter((item) => item !== sector) : [...current, sector]);
  }

  async function handleContinue() {
    if (!farmerId || !farmId) {
      setError("Missing farmer or farm session.");
      return;
    }
    if (!plotId) {
      setError("Add a plot on this farm before attaching an enterprise.");
      return;
    }

    const toCreate = selected.filter((sector) => !existingSectors.includes(sector));
    if (!toCreate.length) {
      setError("Select at least one new enterprise for this plot.");
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
          plotId,
          sector,
          dependsOn: lastDepends ? [lastDepends] : dependsOn,
        });
        lastDepends = operationUuid;
        await getOrCreateActiveProductionCycle(db, enterpriseId, sector);
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
        plotId,
        currentStep: "sector",
        stepStates: { pendingEnterpriseIds: createdIds, currentEnterpriseId: firstEnterpriseId, currentSector: firstSector, currentPlotId: plotId },
      });

      router.push({
        pathname: "/collect/[sector]",
        params: { sector: firstSector, farmerId, farmId, plotId, enterpriseId: firstEnterpriseId, dependsOn: lastDepends },
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
        title={`What does ${plotName} produce?`}
        description="A plot can run more than one enterprise. Select every value chain on this production unit. Each one gets its own unique form and production cycle."
        step={6}
        total={9}
      />

      <SectionCard title="This plot" description="Enterprises are stored against the selected plot on this farm, not the farmer as a whole.">
        <DataRow label="Farm" value={farmName} />
        <DataRow label="Plot" value={plotName} />
        <DataRow label="Already captured" value={existingSectors.length ? existingSectors.map((id) => getSectorMeta(id).label).join(", ") : "None yet"} />
      </SectionCard>

      {sectorGroups.map((group) => (
        <SectionCard
          key={group}
          title={group}
          description={group === "Livestock" ? "Priority engines first, then standard chains." : "Priority engines are listed first in each group."}
        >
          {getSectorsByGroup(group).map((sector) => {
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
                <Text style={styles.chipMeta}>
                  {already ? "Already on this farm" : sector.status === "priority" ? `${sector.code ?? "VC"} \u00b7 Priority engine` : sector.code ? `${sector.code} \u00b7 Standard` : "Standard"}
                </Text>
              </Pressable>
            );
          })}
        </SectionCard>
      ))}

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
