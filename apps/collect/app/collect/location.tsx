import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";

export default function LocationStep() {
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; dependsOn?: string }>();

  function handleContinue() {
    if (params.farmId) {
      router.push({ pathname: "/farms/[farmId]/boundary", params: { farmId: params.farmId } });
      return;
    }

    router.push({ pathname: "/collect/farm", params });
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Location</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>
        Farm location is stored on the farm record. Boundary capture adds the measured geometry and sync queue entry.
      </Text>
      <Pressable accessibilityRole="button" onPress={handleContinue} style={buttonStyle}>
        <Text style={{ color: "white", fontWeight: "700" }}>Continue to boundary</Text>
      </Pressable>
    </View>
  );
}

const buttonStyle = { alignItems: "center" as const, borderRadius: 12, backgroundColor: Colors.brand, paddingVertical: 14, marginTop: 24 };
