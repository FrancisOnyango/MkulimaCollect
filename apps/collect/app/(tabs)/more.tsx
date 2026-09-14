import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/features/auth/AuthProvider";
import { useApiClient } from "@/components/providers/APIProvider";
import { useSyncStatus } from "@/features/sync/useSyncStatus";
import { getAppVersion } from "@/lib/appVersion";

export default function MoreScreen() {
  const { agent, logout } = useAuth();
  const { environment } = useApiClient();
  const { counts } = useSyncStatus();
  const waiting = counts.PENDING_SYNC + counts.RETRY;

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>More</Text>
      <View style={{ marginTop: 18, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 22, padding: 16 }}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>{agent?.name ?? "Field agent"}</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{agent?.orgName ?? "Organization"}</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{agent?.clusterName ?? "Cluster"}</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{environment} · v{getAppVersion()}</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push("/sync")} style={{ marginTop: 14, backgroundColor: Colors.brandMuted, borderRadius: 22, padding: 16 }}>
        <Text style={{ color: Colors.brandDark, fontWeight: "700" }}>Sync Centre</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{waiting} records waiting</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={() => router.push("/sync/conflicts")} style={{ marginTop: 14, backgroundColor: Colors.brandMuted, borderRadius: 22, padding: 16 }}>
        <Text style={{ color: Colors.brandDark, fontWeight: "700" }}>Sync conflicts</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>Review server conflicts without silent merge</Text>
      </Pressable>

      <View style={{ marginTop: 14, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 22, padding: 16 }}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Privacy</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>
          National IDs and phone numbers are hashed on device. Evidence files stay in app-private storage. Screenshots of farmer records are blocked on Android. Scoring never runs on this device.
        </Text>
      </View>

      <Pressable accessibilityRole="button" onPress={handleLogout} style={{ alignItems: "center", borderRadius: 999, borderWidth: 1, borderColor: Colors.charcoal100, paddingVertical: 14, marginTop: 18 }}>
        <Text style={{ color: Colors.charcoal700, fontWeight: "700" }}>Sign out</Text>
      </Pressable>
    </View>
  );
}
