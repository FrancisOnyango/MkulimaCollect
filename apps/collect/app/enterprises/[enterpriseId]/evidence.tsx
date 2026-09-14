import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterpriseById } from "@/features/enterprises/enterpriseRepository";
import { getEvidenceByEnterprise } from "@/features/evidence/evidenceRepository";
import { type enterprises, type evidence } from "@/lib/db/schema";

type EvidenceRow = typeof evidence.$inferSelect;
type EnterpriseRow = typeof enterprises.$inferSelect;

export default function EnterpriseEvidenceScreen() {
  const db = useDatabase();
  const { enterpriseId } = useLocalSearchParams<{ enterpriseId: string }>();
  const [enterprise, setEnterprise] = useState<EnterpriseRow | null>(null);
  const [items, setItems] = useState<EvidenceRow[]>([]);

  useEffect(() => {
    if (!enterpriseId) {
      return;
    }

    void Promise.all([getEnterpriseById(db, enterpriseId), getEvidenceByEnterprise(db, enterpriseId)]).then(([nextEnterprise, nextItems]) => {
      setEnterprise(nextEnterprise);
      setItems(nextItems);
    });
  }, [db, enterpriseId]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700" }}>Evidence</Text>
        {enterprise ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/evidence/capture", params: { farmerId: enterprise.farmerId, farmId: enterprise.farmId, enterpriseId } })}
            style={{ backgroundColor: Colors.brand, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: Colors.brandInk, fontWeight: "700" }}>Add</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: Colors.charcoal500 }}>No evidence recorded for this enterprise.</Text>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/evidence/[evidenceId]", params: { evidenceId: item.id } })} style={cardStyle}>
            <Text style={titleStyle}>{item.category}</Text>
            <Text style={metaStyle}>{item.syncStatus} | {item.verificationStatus}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const cardStyle = { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginBottom: 10 };
const titleStyle = { color: Colors.charcoal, fontWeight: "700" as const, fontSize: 16 };
const metaStyle = { color: Colors.charcoal500, marginTop: 4 };
