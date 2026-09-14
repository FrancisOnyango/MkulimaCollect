import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { DataRow, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEvidenceByEnterprise, getEvidenceByFarmer } from "@/features/evidence/evidenceRepository";
import { getNextIncompleteEnterprise } from "@/features/farmers/incompleteHoldings";
import { upsertCollectionSession } from "@/features/farmers/collectionSessionRepository";
import { getSectorMeta } from "@/features/sectors/catalog";
import { type evidence } from "@/lib/db/schema";

type EvidenceRow = typeof evidence.$inferSelect;

export default function EvidenceReviewStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; enterpriseId?: string; sector?: string; dependsOn?: string }>();
  const [items, setItems] = useState<EvidenceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sectorMeta = getSectorMeta(params.sector ?? "");
  const required = sectorMeta.evidenceCategories;
  const attachedCategories = items.map((item) => item.category);
  const missing = required.filter((category) => !attachedCategories.includes(category));

  useFocusEffect(
    useCallback(() => {
      if (params.enterpriseId) {
        void getEvidenceByEnterprise(db, params.enterpriseId).then(setItems);
        return;
      }

      if (params.farmerId) {
        void getEvidenceByFarmer(db, params.farmerId).then(setItems);
      }
    }, [db, params.enterpriseId, params.farmerId]),
  );

  async function continueToReview() {
    if (missing.length) {
      setError(`Attach required evidence: ${missing.join(", ")}.`);
      return;
    }

    if (params.farmerId) {
      const next = await getNextIncompleteEnterprise(db, params.farmerId, params.enterpriseId);
      if (next) {
        await upsertCollectionSession(db, {
          farmerId: params.farmerId,
          farmId: next.enterprise.farmId,
          currentStep: "sector",
          stepStates: { currentEnterpriseId: next.enterprise.id, currentSector: next.enterprise.sector },
        });
        router.replace({
          pathname: "/collect/[sector]",
          params: {
            sector: next.enterprise.sector,
            farmerId: params.farmerId,
            farmId: next.enterprise.farmId,
            enterpriseId: next.enterprise.id,
            dependsOn: params.dependsOn,
          },
        });
        return;
      }

      await upsertCollectionSession(db, { farmerId: params.farmerId, currentStep: "holdings" });
    }

    router.replace({ pathname: "/collect/holdings", params: { farmerId: params.farmerId, dependsOn: params.dependsOn } });
  }

  return (
    <FormScreen footer={params.farmerId ? <PrimaryButton label={missing.length ? "Attach remaining evidence" : "Continue to next incomplete enterprise"} onPress={() => void continueToReview()} /> : undefined}>
      <StepHeader
        eyebrow="Evidence quality"
        title="Required attachments"
        description={`${sectorMeta.label} needs ${required.length} evidence types before this profile can be submitted.`}
        step={9}
        total={9}
      />

      <SectionCard title="Coverage" description="Each required category must have at least one saved photo or document.">
        <DataRow label="Attached" value={`${required.length - missing.length} / ${required.length}`} tone={missing.length ? "warning" : "success"} />
        <DataRow label="Sector" value={sectorMeta.label} />
        {missing.length ? <Notice title="Still required" message={missing.join(", ")} tone="warning" /> : <Notice title="All required evidence attached" tone="success" />}
      </SectionCard>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Required categories</Text>
      </View>

      {required.map((category) => {
        const attached = attachedCategories.includes(category);
        return (
          <Pressable
            accessibilityRole="button"
            key={category}
            onPress={() =>
              router.push({
                pathname: "/evidence/capture",
                params: { ...params, category, returnTo: "review" },
              })
            }
            style={styles.card}
          >
            <Text style={styles.title}>{category}</Text>
            <Text style={styles.meta}>{attached ? "Attached — tap to add another" : "Missing — tap to capture"}</Text>
          </Pressable>
        );
      })}

      <FlatList
        scrollEnabled={false}
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={[styles.listTitle, { marginTop: 18 }]}>Saved files</Text>}
        ListEmptyComponent={<Notice title="No files yet" message="Capture each required category above." tone="warning" />}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/evidence/[evidenceId]", params: { evidenceId: item.id } })} style={styles.card}>
            <Text style={styles.title}>{item.category}</Text>
            <Text style={styles.meta}>{item.syncStatus} | {item.verificationStatus}</Text>
          </Pressable>
        )}
      />
      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  listTitle: {
    color: Colors.charcoal,
    fontSize: 17,
    fontWeight: "800",
  },
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.charcoal100,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 14,
  },
  title: {
    color: Colors.charcoal,
    fontSize: 16,
    fontWeight: "800",
  },
  meta: {
    color: Colors.charcoal500,
    marginTop: 4,
  },
});
