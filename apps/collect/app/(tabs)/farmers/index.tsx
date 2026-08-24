import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { getFarmersByAgent, type FarmerSummary } from "@/features/farmers/farmerRepository";

export default function FarmersScreen() {
  const db = useDatabase();
  const { agent } = useAuth();
  const [farmers, setFarmers] = useState<FarmerSummary[]>([]);

  const refresh = useCallback(async () => {
    if (!agent) {
      setFarmers([]);
      return;
    }

    setFarmers(await getFarmersByAgent(db, agent.id));
  }, [agent, db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <View>
          <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700" }}>Farmers</Text>
          <Text style={{ color: Colors.charcoal500 }}>{farmers.length} local profiles</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push("/collect")} style={{ backgroundColor: Colors.brand, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
          <Text style={{ color: "white", fontWeight: "700" }}>New</Text>
        </Pressable>
      </View>

      <FlatList
        data={farmers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: Colors.charcoal500, marginTop: 24 }}>No farmers collected yet.</Text>}
        renderItem={({ item }) => {
          const name = item.identity?.fullLegalName || [item.identity?.firstName, item.identity?.surname].filter(Boolean).join(" ") || "Unnamed farmer";

          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/(tabs)/farmers/[farmerId]", params: { farmerId: item.id } })}
              style={{ backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginBottom: 10 }}
            >
              <Text style={{ color: Colors.charcoal, fontWeight: "700", fontSize: 16 }}>{name}</Text>
              <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{item.status} - {item.completenessPct}% complete</Text>
              <Text style={{ color: item.syncedAt ? Colors.brand : Colors.amberField, marginTop: 6 }}>{item.syncedAt ? "Synced" : "Pending sync"}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
