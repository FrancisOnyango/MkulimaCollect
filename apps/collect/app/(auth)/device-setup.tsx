import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import * as SessionManager from "@/features/auth/SessionManager";

export default function DeviceSetupScreen() {
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    void SessionManager.getDeviceId().then(setDeviceId);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Device setup</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>
        This device has a stable local identifier for login, audit attribution, and offline sync registration.
      </Text>
      <View style={cardStyle}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Device ID</Text>
        <Text style={{ color: Colors.charcoal700, marginTop: 8 }}>{deviceId || "Preparing device identifier"}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.replace("/(auth)/login")} style={buttonStyle}>
        <Text style={{ color: "white", fontWeight: "700" }}>Continue to login</Text>
      </Pressable>
    </View>
  );
}

const cardStyle = { backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginTop: 18 };
const buttonStyle = { alignItems: "center" as const, borderRadius: 12, backgroundColor: Colors.brand, paddingVertical: 14, marginTop: 24 };
