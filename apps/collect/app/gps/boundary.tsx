import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";

export default function GpsBoundaryScreen() {
  const { farmId } = useLocalSearchParams<{ farmId?: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>GPS boundary</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>
        Boundary data is saved through the farm boundary route so it can update farm acreage and enqueue sync dependencies atomically.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (farmId) {
            router.replace({ pathname: "/farms/[farmId]/boundary", params: { farmId } });
          } else {
            router.replace("/(tabs)/farmers");
          }
        }}
        style={buttonStyle}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>{farmId ? "Open farm boundary" : "Choose a farm"}</Text>
      </Pressable>
    </View>
  );
}

const buttonStyle = { alignItems: "center" as const, borderRadius: 12, backgroundColor: Colors.brand, paddingVertical: 14, marginTop: 24 };
