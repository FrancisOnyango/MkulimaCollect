import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterpriseById } from "@/features/enterprises/enterpriseRepository";
import { getExpensesByEnterprise } from "@/features/production/productionRepository";
import { type enterprises, type expenses } from "@/lib/db/schema";

type EnterpriseRow = typeof enterprises.$inferSelect;
type ExpenseRow = typeof expenses.$inferSelect;

export default function EnterpriseCostsScreen() {
  const db = useDatabase();
  const { enterpriseId } = useLocalSearchParams<{ enterpriseId: string }>();
  const [enterprise, setEnterprise] = useState<EnterpriseRow | null>(null);
  const [items, setItems] = useState<ExpenseRow[]>([]);

  useEffect(() => {
    if (!enterpriseId) {
      return;
    }

    void Promise.all([getEnterpriseById(db, enterpriseId), getExpensesByEnterprise(db, enterpriseId)]).then(([nextEnterprise, nextItems]) => {
      setEnterprise(nextEnterprise);
      setItems(nextItems);
    });
  }, [db, enterpriseId]);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.surface }} contentContainerStyle={{ padding: 18 }}>
      <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700" }}>Costs</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>{enterprise?.sector ?? "Enterprise"} expenses captured from the Dairy cost section.</Text>
      <View style={cardStyle}>
        <Text style={sectionTitleStyle}>Total</Text>
        <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700", marginTop: 8 }}>KES {total.toLocaleString()}</Text>
      </View>
      <View style={cardStyle}>
        <Text style={sectionTitleStyle}>Expense ledger</Text>
        {items.length ? items.map((item) => <Text key={item.id} style={rowStyle}>{item.category}: {item.currency} {item.amount.toLocaleString()}</Text>) : <Text style={rowStyle}>No expenses captured yet.</Text>}
      </View>
    </ScrollView>
  );
}

const cardStyle = { backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginTop: 14 };
const sectionTitleStyle = { color: Colors.charcoal, fontSize: 17, fontWeight: "700" as const };
const rowStyle = { color: Colors.charcoal700, marginTop: 8 };
