import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterprisesByFarmer } from "@/features/enterprises/enterpriseRepository";

export default function FarmerFinancialScreen() {
  const db = useDatabase();
  const { farmerId } = useLocalSearchParams<{ farmerId: string }>();
  const [enterpriseCount, setEnterpriseCount] = useState(0);

  useEffect(() => {
    if (farmerId) {
      void getEnterprisesByFarmer(db, farmerId).then((rows) => setEnterpriseCount(rows.length));
    }
  }, [db, farmerId]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700" }}>Financial</Text>
      <View style={{ marginTop: 18, backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 16 }}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Financial collection status</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>{enterpriseCount} enterprise records available for income/cost capture.</Text>
        <Text style={{ color: Colors.amberField, marginTop: 8 }}>Detailed loan and M-PESA statement storage requires the financial schema expansion.</Text>
      </View>
    </View>
  );
}
