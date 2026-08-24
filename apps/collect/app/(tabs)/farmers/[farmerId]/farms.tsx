import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getFarmsByFarmer } from "@/features/farms/farmRepository";
import { type farms } from "@/lib/db/schema";

type FarmRow = typeof farms.$inferSelect;

export default function FarmerFarmsScreen() {
  const db = useDatabase();
  const { farmerId } = useLocalSearchParams<{ farmerId: string }>();
  const [items, setItems] = useState<FarmRow[]>([]);

  useEffect(() => {
    if (farmerId) {
      void getFarmsByFarmer(db, farmerId).then(setItems);
    }
  }, [db, farmerId]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 18 }}>
      <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700", marginBottom: 14 }}>Farms</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: Colors.charcoal500 }}>No farms recorded.</Text>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/farms/[farmId]", params: { farmId: item.id } })} style={cardStyle}>
            <Text style={titleStyle}>{item.name ?? "Unnamed farm"}</Text>
            <Text style={metaStyle}>{item.village ?? "No village"} - {item.tenure ?? "Tenure not set"}</Text>
            <Text style={metaStyle}>Reported: {item.sizeReportedAcres ?? "n/a"} acres | GPS: {item.sizeGpsAcres ?? "n/a"} acres</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const cardStyle = { backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginBottom: 10 };
const titleStyle = { color: Colors.charcoal, fontWeight: "700" as const, fontSize: 16 };
const metaStyle = { color: Colors.charcoal500, marginTop: 4 };
