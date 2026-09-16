import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { AppHeader, ScreenShell } from "@/components/ui/ScreenShell";
import { useAuth } from "@/features/auth/AuthProvider";
import { useApiClient } from "@/components/providers/APIProvider";
import { useSyncStatus } from "@/features/sync/useSyncStatus";
import { getAppVersion } from "@/lib/appVersion";

export default function MoreScreen() {
  const { agent, logout } = useAuth();
  const { environment } = useApiClient();
  const { counts } = useSyncStatus();
  const waiting = counts.PENDING_SYNC + counts.RETRY;
  const apiHost = process.env.EXPO_PUBLIC_API_BASE_URL || "https://staging-api.mkulimascore.com";

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <ScreenShell padded={false}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}>
        <AppHeader title="More" subtitle="Device, sync, and privacy" />

        <View style={cardStyle}>
          <Text style={titleStyle}>{agent?.name ?? "Field agent"}</Text>
          <Text style={metaStyle}>{agent?.orgName ?? "Organization"}</Text>
          <Text style={metaStyle}>{agent?.clusterName ?? "Cluster"}</Text>
          <Text style={metaStyle}>{environment} · v{getAppVersion()}</Text>
          <Text style={[metaStyle, { fontSize: 12 }]} numberOfLines={2}>{apiHost}</Text>
        </View>

        <MenuRow title="Sync Centre" detail={`${waiting} records waiting`} onPress={() => router.push("/sync")} />
        <MenuRow title="Sync conflicts" detail="Review server conflicts without silent merge" onPress={() => router.push("/sync/conflicts")} />
        <MenuRow title="Farmers" detail="Open local farmer profiles" onPress={() => router.push("/(tabs)/farmers")} />
        <MenuRow title="Work" detail="Assigned visits, follow-ups, and returned records" onPress={() => router.push("/(tabs)/tasks")} />
        <MenuRow title="Start collection" detail="New farmer, farms, and enterprises" onPress={() => router.push("/collect/consent")} />

        <View style={cardStyle}>
          <Text style={titleStyle}>Privacy</Text>
          <Text style={[metaStyle, { lineHeight: 20 }]}>
            National IDs and phone numbers are hashed on device. Evidence files stay in app-private storage. Screenshots of farmer records are blocked on Android. Scoring never runs on this device.
          </Text>
        </View>

        <Pressable accessibilityRole="button" onPress={handleLogout} style={signOutStyle}>
          <Text style={{ color: Colors.charcoal700, fontWeight: "800" }}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </ScreenShell>
  );
}

function MenuRow({ title, detail, onPress }: { title: string; detail: string; onPress(): void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={rowStyle}>
      <Text style={titleStyle}>{title}</Text>
      <Text style={metaStyle}>{detail}</Text>
    </Pressable>
  );
}

const cardStyle = {
  backgroundColor: Colors.card,
  borderColor: Colors.charcoal100,
  borderRadius: 18,
  borderWidth: 1,
  marginTop: 12,
  padding: 16,
};
const rowStyle = {
  ...cardStyle,
  backgroundColor: Colors.brandMuted,
  borderWidth: 0,
};
const titleStyle = { color: Colors.charcoal, fontWeight: "800" as const, fontSize: 16 };
const metaStyle = { color: Colors.charcoal500, marginTop: 4 };
const signOutStyle = {
  alignItems: "center" as const,
  borderColor: Colors.charcoal100,
  borderRadius: 999,
  borderWidth: 1,
  justifyContent: "center" as const,
  marginTop: 18,
  minHeight: 50,
};
