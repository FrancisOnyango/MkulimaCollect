import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getAuditEventsForEntity } from "@/features/audit/auditRepository";
import { type auditEvents } from "@/lib/db/schema";

type AuditRow = typeof auditEvents.$inferSelect;

export default function FarmerActivityScreen() {
  const db = useDatabase();
  const { farmerId } = useLocalSearchParams<{ farmerId: string }>();
  const [items, setItems] = useState<AuditRow[]>([]);

  useEffect(() => {
    if (farmerId) {
      void getAuditEventsForEntity(db, "farmer", farmerId).then(setItems);
    }
  }, [db, farmerId]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 18 }}>
      <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700", marginBottom: 14 }}>Activity</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: Colors.charcoal500 }}>No audit events yet.</Text>}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>{item.action}</Text>
            <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{item.createdAt}</Text>
          </View>
        )}
      />
    </View>
  );
}
