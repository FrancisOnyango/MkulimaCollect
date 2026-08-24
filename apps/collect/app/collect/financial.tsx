import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";

export default function FinancialStep() {
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; enterpriseId?: string; dependsOn?: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Financial profile</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>
        Credit and payment eligibility should be calculated server-side after identity, consent, farm, enterprise, and evidence records sync.
      </Text>
      <View style={cardStyle}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Local readiness</Text>
        <Text style={rowStyle}>Consent and identity: captured in the farmer flow</Text>
        <Text style={rowStyle}>Production signals: captured per enterprise</Text>
        <Text style={rowStyle}>Evidence: stored with checksums before sync</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/collect/evidence-review", params })} style={buttonStyle}>
        <Text style={{ color: "white", fontWeight: "700" }}>Review evidence</Text>
      </Pressable>
    </View>
  );
}

const cardStyle = { backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginTop: 18 };
const rowStyle = { color: Colors.charcoal700, marginTop: 8 };
const buttonStyle = { alignItems: "center" as const, borderRadius: 12, backgroundColor: Colors.brand, paddingVertical: 14, marginTop: 24 };
