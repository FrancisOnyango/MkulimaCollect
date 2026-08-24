import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
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
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700" }}>Evidence review</Text>
        {params.farmerId ? (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/evidence/capture", params })} style={{ backgroundColor: Colors.brand, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: "white", fontWeight: "700" }}>Add</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: Colors.charcoal500 }}>No evidence attached to this farmer.</Text>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/evidence/[evidenceId]", params: { evidenceId: item.id } })} style={cardStyle}>
            <Text style={titleStyle}>{item.category}</Text>
            <Text style={metaStyle}>{item.syncStatus} | {item.verificationStatus}</Text>
          </Pressable>
        )}
        ListFooterComponent={
          params.farmerId ? (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/collect/review", params })} style={footerButtonStyle}>
              <Text style={{ color: "white", fontWeight: "700" }}>Continue to profile review</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

const cardStyle = { backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginBottom: 10 };
const titleStyle = { color: Colors.charcoal, fontWeight: "700" as const, fontSize: 16 };
const metaStyle = { color: Colors.charcoal500, marginTop: 4 };
const footerButtonStyle = { alignItems: "center" as const, borderRadius: 12, backgroundColor: Colors.brand, paddingVertical: 14, marginTop: 14 };
