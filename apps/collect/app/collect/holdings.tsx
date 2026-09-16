import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { FormScreen, Notice, PrimaryButton, SecondaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterprisesByFarmer } from "@/features/enterprises/enterpriseRepository";
import { calculateCompletenessDetails } from "@/features/farmers/farmerCompleteness";
import { getIncompleteEnterprises } from "@/features/farmers/incompleteHoldings";
import { getFarmsByFarmer, getGeometriesByFarmer } from "@/features/farms/farmRepository";
import { getPlotsByFarmer } from "@/features/plots/plotRepository";
import { getProductionCyclesByEnterprise } from "@/features/production/productionRepository";
import { getSectorMeta } from "@/features/sectors/catalog";
import { type enterprises, type farmGeometries, type farms, type plots, type productionCycles } from "@/lib/db/schema";

type FarmRow = typeof farms.$inferSelect;
type PlotRow = typeof plots.$inferSelect;
type EnterpriseRow = typeof enterprises.$inferSelect;
type GeometryRow = typeof farmGeometries.$inferSelect;
type CycleRow = typeof productionCycles.$inferSelect;

export default function HoldingsHub() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; plotId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const [farmRows, setFarmRows] = useState<FarmRow[]>([]);
  const [plotRows, setPlotRows] = useState<PlotRow[]>([]);
  const [enterpriseRows, setEnterpriseRows] = useState<EnterpriseRow[]>([]);
  const [geometryRows, setGeometryRows] = useState<GeometryRow[]>([]);
  const [cyclesByEnterprise, setCyclesByEnterprise] = useState<Record<string, CycleRow[]>>({});
  const [selectedFarmId, setSelectedFarmId] = useState<string>(params.farmId ?? "");
  const [selectedPlotId, setSelectedPlotId] = useState<string>(params.plotId ?? "");
  const [incompleteIds, setIncompleteIds] = useState<string[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [boundaryWarnings, setBoundaryWarnings] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!farmerId) {
        return;
      }

      void Promise.all([
        getFarmsByFarmer(db, farmerId),
        getPlotsByFarmer(db, farmerId),
        getEnterprisesByFarmer(db, farmerId),
        getIncompleteEnterprises(db, farmerId),
        calculateCompletenessDetails(db, farmerId),
        getGeometriesByFarmer(db, farmerId),
      ]).then(async ([nextFarms, nextPlots, nextEnterprises, incomplete, completeness, nextGeometries]) => {
        const cycleEntries = await Promise.all(nextEnterprises.map(async (enterprise) => [enterprise.id, await getProductionCyclesByEnterprise(db, enterprise.id)] as const));
        setFarmRows(nextFarms);
        setPlotRows(nextPlots);
        setEnterpriseRows(nextEnterprises);
        setGeometryRows(nextGeometries);
        setCyclesByEnterprise(Object.fromEntries(cycleEntries));
        setIncompleteIds(incomplete.map((item) => item.enterprise.id));
        setCanReview(completeness.missing.length === 0 && nextFarms.length > 0 && nextEnterprises.length > 0);
        setBoundaryWarnings(completeness.warnings);
        setSelectedFarmId((current) => current && nextFarms.some((farm) => farm.id === current) ? current : params.farmId && nextFarms.some((farm) => farm.id === params.farmId) ? params.farmId : nextFarms[0]?.id ?? "");
        setSelectedPlotId((current) => {
          const farmId = current && nextPlots.some((plot) => plot.id === current)
            ? nextPlots.find((plot) => plot.id === current)?.farmId
            : undefined;
          if (current && farmId) {
            return current;
          }
          const preferredFarm = params.farmId && nextFarms.some((farm) => farm.id === params.farmId) ? params.farmId : nextFarms[0]?.id;
          const onFarm = nextPlots.filter((plot) => plot.farmId === preferredFarm);
          return params.plotId && onFarm.some((plot) => plot.id === params.plotId) ? params.plotId : onFarm[0]?.id ?? "";
        });
      });
    }, [db, farmerId, params.farmId, params.plotId]),
  );

  const selectedFarm = farmRows.find((farm) => farm.id === selectedFarmId);
  const plotsOnFarm = plotRows.filter((plot) => plot.farmId === selectedFarmId);
  const selectedPlot = plotsOnFarm.find((plot) => plot.id === selectedPlotId) ?? plotsOnFarm[0];
  const enterprisesOnPlot = enterpriseRows.filter((enterprise) => {
    if (selectedPlot && enterprise.plotId === selectedPlot.id) {
      return true;
    }
    return Boolean(selectedFarm && !enterprise.plotId && enterprise.farmId === selectedFarm.id && selectedPlot?.id === plotsOnFarm[0]?.id);
  });

  return (
    <FormScreen
      footer={
        <View style={styles.footer}>
          <SecondaryButton
            label="Add another farm"
            onPress={() => router.push({ pathname: "/collect/farm", params: { farmerId, dependsOn: params.dependsOn } })}
          />
          <SecondaryButton
            label={selectedFarm ? "Add plot on this farm" : "Add a farm first"}
            disabled={!selectedFarm}
            onPress={() => router.push({ pathname: "/collect/plot", params: { farmerId, farmId: selectedFarmId, dependsOn: params.dependsOn } })}
          />
          <PrimaryButton
            label={selectedPlot ? "Add enterprise on this plot" : "Add a plot first"}
            disabled={!selectedPlot}
            onPress={() => router.push({ pathname: "/collect/enterprise", params: { farmerId, farmId: selectedFarmId, plotId: selectedPlot?.id, dependsOn: params.dependsOn } })}
          />
          <PrimaryButton
            label="Review farmer profile"
            disabled={!canReview}
            onPress={() => router.push({ pathname: "/collect/review", params: { farmerId } })}
          />
        </View>
      }
    >
      <StepHeader
        eyebrow="Farmer holdings"
        title="Farms, plots, and enterprises"
        description="A farmer can have several farms. Each farm has plots. Each plot can run several enterprises and overlapping production cycles. Walked boundaries are optional."
        step={5}
        total={10}
      />

      <SectionCard title="Farms" description={`${farmRows.length} farm${farmRows.length === 1 ? "" : "s"} on this profile.`}>
        {farmRows.length ? farmRows.map((farm) => {
          const count = plotRows.filter((plot) => plot.farmId === farm.id).length;
          const active = farm.id === selectedFarmId;
          const mapped = geometryRows.some((geometry) => geometry.farmId === farm.id && geometry.pointCount >= 3);
          return (
            <Pressable
              accessibilityRole="button"
              key={farm.id}
              onPress={() => {
                setSelectedFarmId(farm.id);
                const firstPlot = plotRows.find((plot) => plot.farmId === farm.id);
                setSelectedPlotId(firstPlot?.id ?? "");
              }}
              style={[styles.card, active ? styles.cardActive : null]}
            >
              <Text style={styles.cardTitle}>{farm.name}</Text>
              <Text style={styles.cardMeta}>{farm.village}{farm.county ? ` · ${farm.county}` : ""} · {count} plot{count === 1 ? "" : "s"}</Text>
              <Text style={styles.cardMeta}>{mapped ? "Boundary mapped" : "Boundary optional — walk later"}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/farms/[farmId]/boundary", params: { farmId: farm.id, farmerId, dependsOn: params.dependsOn } })}
                style={styles.boundaryButton}
              >
                <Text style={styles.boundaryButtonText}>{mapped ? "Remap boundary" : "Walk boundary"}</Text>
              </Pressable>
            </Pressable>
          );
        }) : <Notice title="No farms yet" message="Save the first farm with a GPS pin. You can walk its boundary later." tone="warning" />}
      </SectionCard>

      {selectedFarm ? (
        <SectionCard title={`Plots on ${selectedFarm.name}`} description="A plot can be a field, greenhouse, pond, house, cage, tank, or apiary.">
          {plotsOnFarm.length ? plotsOnFarm.map((plot) => {
            const count = enterpriseRows.filter((enterprise) => enterprise.plotId === plot.id).length;
            const active = plot.id === selectedPlot?.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={plot.id}
                onPress={() => setSelectedPlotId(plot.id)}
                style={[styles.card, active ? styles.cardActive : null]}
              >
                <Text style={styles.cardTitle}>{plot.name}</Text>
                <Text style={styles.cardMeta}>{plot.unitType.replace(/_/g, " ")} · {count} enterprise{count === 1 ? "" : "s"}</Text>
              </Pressable>
            );
          }) : <Notice title="No plots yet" message="Add a production unit before attaching enterprises." tone="warning" />}
        </SectionCard>
      ) : null}

      {!canReview && farmRows.length > 0 ? (
        <Notice title="Review is locked" message="Every farm needs a GPS pin. Every enterprise needs production, financial, and required evidence. Plots are required before new enterprises. Walked boundaries can wait." tone="warning" />
      ) : null}

      {canReview && boundaryWarnings.length ? (
        <Notice title="Can wait" message={boundaryWarnings.join(" ")} tone="warning" />
      ) : null}

      {selectedPlot ? (
        <SectionCard title={`Enterprises on ${selectedPlot.name}`} description="Open a form, add a cycle, record harvest, or log a livestock event.">
          {enterprisesOnPlot.length ? enterprisesOnPlot.map((enterprise) => {
            const meta = getSectorMeta(enterprise.sector);
            const cycles = cyclesByEnterprise[enterprise.id] ?? [];
            const activeCycles = cycles.filter((cycle) => cycle.status === "ACTIVE");
            return (
              <View key={enterprise.id} style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/collect/[sector]",
                      params: { sector: enterprise.sector, farmerId, farmId: enterprise.farmId, plotId: enterprise.plotId ?? selectedPlot.id, enterpriseId: enterprise.id, dependsOn: params.dependsOn },
                    })
                  }
                >
                  <Text style={styles.cardTitle}>{meta.label}</Text>
                  <Text style={styles.cardMeta}>
                    {incompleteIds.includes(enterprise.id) ? "Incomplete — tap to continue" : `${enterprise.status} · complete`}
                    {activeCycles.length ? ` · ${activeCycles.length} active cycle${activeCycles.length === 1 ? "" : "s"}` : ""}
                  </Text>
                </Pressable>
                <View style={styles.actionRow}>
                  <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/collect/cycle", params: { farmerId, farmId: enterprise.farmId, plotId: selectedPlot.id, enterpriseId: enterprise.id, sector: enterprise.sector } })} style={styles.boundaryButton}>
                    <Text style={styles.boundaryButtonText}>Cycle</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/collect/harvest", params: { farmerId, farmId: enterprise.farmId, plotId: selectedPlot.id, enterpriseId: enterprise.id, sector: enterprise.sector } })} style={styles.boundaryButton}>
                    <Text style={styles.boundaryButtonText}>Harvest</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/collect/outcome", params: { farmerId, farmId: enterprise.farmId, plotId: selectedPlot.id, enterpriseId: enterprise.id, sector: enterprise.sector } })} style={styles.boundaryButton}>
                    <Text style={styles.boundaryButtonText}>Outcome</Text>
                  </Pressable>
                  {meta.group === "Livestock" || meta.group === "Aquaculture" ? (
                    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/collect/livestock-event", params: { farmerId, farmId: enterprise.farmId, plotId: selectedPlot.id, enterpriseId: enterprise.id, sector: enterprise.sector } })} style={styles.boundaryButton}>
                      <Text style={styles.boundaryButtonText}>Stock event</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          }) : <Notice title="No enterprises on this plot" message="Add every value chain this production unit operates." tone="warning" />}
        </SectionCard>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 10,
  },
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.charcoal100,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 14,
  },
  cardActive: {
    borderColor: Colors.brand,
  },
  cardTitle: {
    color: Colors.charcoal,
    fontSize: 16,
    fontWeight: "800",
  },
  cardMeta: {
    color: Colors.charcoal500,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  boundaryButton: {
    alignSelf: "flex-start",
    backgroundColor: Colors.brandMuted,
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  boundaryButtonText: {
    color: Colors.brand,
    fontWeight: "800",
  },
});
