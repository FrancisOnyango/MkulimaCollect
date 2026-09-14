import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { FormScreen, Notice, PrimaryButton, SecondaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterprisesByFarmer } from "@/features/enterprises/enterpriseRepository";
import { calculateCompletenessDetails } from "@/features/farmers/farmerCompleteness";
import { getIncompleteEnterprises } from "@/features/farmers/incompleteHoldings";
import { getFarmsByFarmer } from "@/features/farms/farmRepository";
import { getSectorMeta } from "@/features/sectors/catalog";
import { type enterprises, type farms } from "@/lib/db/schema";

type FarmRow = typeof farms.$inferSelect;
type EnterpriseRow = typeof enterprises.$inferSelect;

export default function HoldingsHub() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const [farmRows, setFarmRows] = useState<FarmRow[]>([]);
  const [enterpriseRows, setEnterpriseRows] = useState<EnterpriseRow[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const [incompleteIds, setIncompleteIds] = useState<string[]>([]);
  const [canReview, setCanReview] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!farmerId) {
        return;
      }

      void Promise.all([
        getFarmsByFarmer(db, farmerId),
        getEnterprisesByFarmer(db, farmerId),
        getIncompleteEnterprises(db, farmerId),
        calculateCompletenessDetails(db, farmerId),
      ]).then(([nextFarms, nextEnterprises, incomplete, completeness]) => {
        setFarmRows(nextFarms);
        setEnterpriseRows(nextEnterprises);
        setIncompleteIds(incomplete.map((item) => item.enterprise.id));
        setCanReview(completeness.percent === 100 && completeness.missing.length === 0);
        setSelectedFarmId((current) => current && nextFarms.some((farm) => farm.id === current) ? current : nextFarms[0]?.id ?? "");
      });
    }, [db, farmerId]),
  );

  const selectedFarm = farmRows.find((farm) => farm.id === selectedFarmId);
  const enterprisesOnFarm = enterpriseRows.filter((enterprise) => enterprise.farmId === selectedFarmId);

  return (
    <FormScreen
      footer={
        <View style={styles.footer}>
          <SecondaryButton
            label="Add another farm"
            onPress={() => router.push({ pathname: "/collect/farm", params: { farmerId, dependsOn: params.dependsOn } })}
          />
          <PrimaryButton
            label={selectedFarm ? "Add enterprise on this farm" : "Add a farm first"}
            disabled={!selectedFarm}
            onPress={() => router.push({ pathname: "/collect/enterprise", params: { farmerId, farmId: selectedFarmId, dependsOn: params.dependsOn } })}
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
        title="Farms and enterprises"
        description="A farmer can have more than one farm. Each farm can run more than one enterprise. Add every holding before you submit."
        step={5}
        total={9}
      />

      <SectionCard title="Farms" description={`${farmRows.length} farm${farmRows.length === 1 ? "" : "s"} on this profile.`}>
        {farmRows.length ? farmRows.map((farm) => {
          const count = enterpriseRows.filter((enterprise) => enterprise.farmId === farm.id).length;
          const active = farm.id === selectedFarmId;
          return (
            <Pressable
              accessibilityRole="button"
              key={farm.id}
              onPress={() => setSelectedFarmId(farm.id)}
              style={[styles.card, active ? styles.cardActive : null]}
            >
              <Text style={styles.cardTitle}>{farm.name}</Text>
              <Text style={styles.cardMeta}>{farm.village}{farm.county ? ` · ${farm.county}` : ""} · {count} enterprise{count === 1 ? "" : "s"}</Text>
            </Pressable>
          );
        }) : <Notice title="No farms yet" message="Save the first farm and walk its boundary." tone="warning" />}
      </SectionCard>

      {!canReview && farmRows.length > 0 ? (
        <Notice title="Review is locked" message="Every farm needs a GPS pin and boundary. Every enterprise needs production, financial, and required evidence." tone="warning" />
      ) : null}

      {selectedFarm ? (
        <SectionCard title={`Enterprises on ${selectedFarm.name}`} description="Open a saved enterprise to continue its sector form, or add another.">
          {enterprisesOnFarm.length ? enterprisesOnFarm.map((enterprise) => {
            const meta = getSectorMeta(enterprise.sector);
            return (
              <Pressable
                accessibilityRole="button"
                key={enterprise.id}
                onPress={() =>
                  router.push({
                    pathname: "/collect/[sector]",
                    params: { sector: enterprise.sector, farmerId, farmId: enterprise.farmId, enterpriseId: enterprise.id, dependsOn: params.dependsOn },
                  })
                }
                style={styles.card}
              >
                <Text style={styles.cardTitle}>{meta.label}</Text>
                <Text style={styles.cardMeta}>
                  {incompleteIds.includes(enterprise.id) ? "Incomplete — tap to continue" : `${enterprise.status} · complete`}
                </Text>
              </Pressable>
            );
          }) : <Notice title="No enterprises on this farm" message="Add every value chain this farm operates." tone="warning" />}
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
});
