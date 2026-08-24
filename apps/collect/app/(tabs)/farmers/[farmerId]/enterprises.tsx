import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterprisesByFarmer } from "@/features/enterprises/enterpriseRepository";
import { type enterprises } from "@/lib/db/schema";

type EnterpriseRow = typeof enterprises.$inferSelect;

export default function FarmerEnterprisesScreen() {
  const db = useDatabase();
  const { farmerId } = useLocalSearchParams<{ farmerId: string }>();
  const [items, setItems] = useState<EnterpriseRow[]>([]);

  useEffect(() => {
    if (farmerId) {
      void getEnterprisesByFarmer(db, farmerId).then(setItems);
    }
  }, [db, farmerId]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 18 }}>
      <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700", marginBottom: 14 }}>Enterprises</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: Colors.charcoal500 }}>No enterprises recorded.</Text>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/enterprises/[enterpriseId]", params: { enterpriseId: item.id } })} style={cardStyle}>
            <Text style={titleStyle}>{item.sector}</Text>
            <Text style={metaStyle}>{item.status} - farm {item.farmId.slice(0, 8)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const cardStyle = { backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginBottom: 10 };
const titleStyle = { color: Colors.charcoal, fontWeight: "700" as const, fontSize: 16 };
const metaStyle = { color: Colors.charcoal500, marginTop: 4 };
