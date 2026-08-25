import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { DataRow, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEvidenceByFarmer } from "@/features/evidence/evidenceRepository";
import { type evidence } from "@/lib/db/schema";

type EvidenceRow = typeof evidence.$inferSelect;

export default function EvidenceReviewStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; enterpriseId?: string }>();
  const [items, setItems] = useState<EvidenceRow[]>([]);

  useEffect(() => {
    if (params.farmerId) {
      void getEvidenceByFarmer(db, params.farmerId).then(setItems);
    }
  }, [db, params.farmerId]);

  return (
    <FormScreen footer={params.farmerId ? <PrimaryButton label="Continue to profile review" onPress={() => router.push({ pathname: "/collect/review", params })} /> : undefined}>
      <StepHeader
        eyebrow="Evidence quality"
        title="Attachment review"
        description="Review photos and documents before submission. Evidence is stored with checksum metadata and queued for safe upload during sync."
        step={8}
        total={8}
      />

      <SectionCard title="Evidence summary" description="Profiles can be submitted without every optional attachment, but evidence improves backend verification confidence.">
        <DataRow label="Attached items" value={`${items.length}`} tone={items.length ? "success" : "warning"} />
        <DataRow label="Storage mode" value="Local encrypted device storage" />
        <DataRow label="Upload mode" value="Pre-signed evidence flow" />
      </SectionCard>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Attachments</Text>
        {params.farmerId ? (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/evidence/capture", params })} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add evidence</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        scrollEnabled={false}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Notice title="No evidence attached yet" message="Add farmer ID, farm photos, delivery records, payment statements, or input receipts when available." tone="warning" />}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/evidence/[evidenceId]", params: { evidenceId: item.id } })} style={styles.card}>
            <Text style={styles.title}>{item.category}</Text>
            <Text style={styles.meta}>{item.syncStatus} | {item.verificationStatus}</Text>
          </Pressable>
        )}
      />
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
  addButton: {
    backgroundColor: Colors.brand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addButtonText: {
    color: "white",
    fontWeight: "800",
  },
  card: {
    backgroundColor: "white",
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
