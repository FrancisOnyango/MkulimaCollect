import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterpriseById, getSectorResponsesByEnterprise } from "@/features/enterprises/enterpriseRepository";
import { type enterprises, type sectorCollectionResponses } from "@/lib/db/schema";

type EnterpriseRow = typeof enterprises.$inferSelect;
type ResponseRow = typeof sectorCollectionResponses.$inferSelect;

export default function EnterpriseProductionScreen() {
  const db = useDatabase();
  const { enterpriseId } = useLocalSearchParams<{ enterpriseId: string }>();
  const [enterprise, setEnterprise] = useState<EnterpriseRow | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);

  useEffect(() => {
    if (!enterpriseId) {
      return;
    }

    void Promise.all([getEnterpriseById(db, enterpriseId), getSectorResponsesByEnterprise(db, enterpriseId)]).then(([nextEnterprise, nextResponses]) => {
      setEnterprise(nextEnterprise);
      setResponses(nextResponses);
    });
  }, [db, enterpriseId]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700" }}>Production</Text>
        {enterprise ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/collect/[sector]", params: { sector: enterprise.sector, enterpriseId: enterprise.id, farmerId: enterprise.farmerId } })}
            style={{ backgroundColor: Colors.brand, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Add</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={responses}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: Colors.charcoal500 }}>No production responses recorded.</Text>}
        renderItem={({ item }) => (
          <View style={cardStyle}>
            <Text style={titleStyle}>{item.schemaId} v{item.schemaVersion}</Text>
            <Text style={metaStyle}>{summarizePayload(item.payload)}</Text>
            <Text style={metaStyle}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

function summarizePayload(payload: string) {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    return Object.entries(parsed)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" | ");
  } catch {
    return payload;
  }
}

const cardStyle = { backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginBottom: 10 };
const titleStyle = { color: Colors.charcoal, fontWeight: "700" as const, fontSize: 16 };
const metaStyle = { color: Colors.charcoal500, marginTop: 4 };
