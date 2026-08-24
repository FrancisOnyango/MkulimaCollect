import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSyncStatus } from "@/features/sync/useSyncStatus";

export default function MoreScreen() {
  const { agent, logout } = useAuth();
  const { counts } = useSyncStatus();
  const waiting = counts.PENDING_SYNC + counts.RETRY;

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>More</Text>
      <View style={{ marginTop: 18, backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 16 }}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>{agent?.name ?? "Field agent"}</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{agent?.orgName ?? "Organization"}</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{agent?.clusterName ?? "Cluster"}</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push("/sync")} style={{ marginTop: 14, backgroundColor: Colors.brandMuted, borderRadius: 12, padding: 16 }}>
        <Text style={{ color: Colors.brandDark, fontWeight: "700" }}>Sync Centre</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{waiting} records waiting</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={handleLogout} style={{ alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: Colors.charcoal100, paddingVertical: 14, marginTop: 18 }}>
        <Text style={{ color: Colors.charcoal700, fontWeight: "700" }}>Sign out</Text>
      </Pressable>
    </View>
  );
}
