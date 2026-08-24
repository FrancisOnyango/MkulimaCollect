import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSyncStatus } from "@/features/sync/useSyncStatus";

export default function HomeScreen() {
  const { agent, logout } = useAuth();
  const { counts, isSyncing, lastRun, syncNow } = useSyncStatus();
  const waitingCount = counts.PENDING_SYNC + counts.RETRY;

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Home</Text>
      <Text style={{ color: Colors.charcoal700, marginTop: 10, fontSize: 16 }}>Signed in as {agent?.name ?? "field agent"}</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>
        {agent?.orgName ?? "Organization"} {agent?.clusterName ? `- ${agent.clusterName}` : ""}
      </Text>
      <View style={{ marginTop: 28, borderRadius: 12, backgroundColor: Colors.brandMuted, padding: 16 }}>
        <Text style={{ color: Colors.brandDark, fontWeight: "700" }}>Production spine is active</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>SQLite, API adapter selection, SecureStore session, and navigation providers are now running.</Text>
      </View>
      <View style={{ marginTop: 16, borderRadius: 12, backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, padding: 16 }}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Sync queue</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>
          {waitingCount} waiting, {counts.SYNCING} syncing, {counts.SYNCED} synced, {counts.FAILED_PERMANENTLY} failed
        </Text>
        {lastRun ? (
          <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>
            Last run: {lastRun.synced} synced, {lastRun.failed} failed
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={isSyncing || waitingCount === 0}
          onPress={() => {
            void syncNow();
          }}
          style={{ alignItems: "center", borderRadius: 12, backgroundColor: isSyncing || waitingCount === 0 ? Colors.charcoal100 : Colors.brand, paddingVertical: 12, marginTop: 12 }}
        >
          <Text style={{ color: isSyncing || waitingCount === 0 ? Colors.charcoal500 : "white", fontWeight: "700" }}>{isSyncing ? "Syncing..." : "Sync now"}</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={handleLogout}
        style={{ alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: Colors.charcoal100, paddingVertical: 14, marginTop: 18 }}
      >
        <Text style={{ color: Colors.charcoal700, fontWeight: "700" }}>Sign out</Text>
      </Pressable>
    </View>
  );
}
