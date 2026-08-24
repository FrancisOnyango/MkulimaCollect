import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getRecentSyncAttempts } from "@/features/sync/syncAttemptRepository";
import { useSyncStatus } from "@/features/sync/useSyncStatus";
import { type syncAttempts } from "@/lib/db/schema";

type SyncAttemptRow = typeof syncAttempts.$inferSelect;

export default function SyncScreen() {
  const db = useDatabase();
  const { counts, isSyncing, lastRun, syncNow } = useSyncStatus();
  const [attempts, setAttempts] = useState<SyncAttemptRow[]>([]);
  const waiting = counts.PENDING_SYNC + counts.RETRY;

  useEffect(() => {
    void getRecentSyncAttempts(db).then(setAttempts);
  }, [db, lastRun]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.surface }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Sync Centre</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>Durable outbox status from local SQLite.</Text>
      <View style={{ backgroundColor: Colors.amberBg, borderRadius: 12, padding: 12, marginTop: 14 }}>
        <Text style={{ color: Colors.amberField, fontWeight: "700" }}>Development MockRemoteAdapter</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>Latency and failure simulation are configurable with EXPO_PUBLIC_MOCK_SYNC_* environment variables.</Text>
      </View>

      <View style={{ marginTop: 22, backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 16, gap: 8 }}>
        <Text style={{ color: Colors.charcoal }}>Waiting: {waiting}</Text>
        <Text style={{ color: Colors.charcoal }}>Syncing: {counts.SYNCING}</Text>
        <Text style={{ color: Colors.charcoal }}>Synced: {counts.SYNCED}</Text>
        <Text style={{ color: Colors.charcoal }}>Retry: {counts.RETRY}</Text>
        <Text style={{ color: Colors.charcoal }}>Failed: {counts.FAILED_PERMANENTLY}</Text>
      </View>

      {lastRun ? (
        <Text style={{ color: Colors.charcoal500, marginTop: 14 }}>
          Last run attempted {lastRun.attempted}, synced {lastRun.synced}, failed {lastRun.failed}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={isSyncing || waiting === 0}
        onPress={() => {
          void syncNow();
        }}
        style={{ alignItems: "center", borderRadius: 12, backgroundColor: isSyncing || waiting === 0 ? Colors.charcoal100 : Colors.brand, paddingVertical: 14, marginTop: 24 }}
      >
        <Text style={{ color: isSyncing || waiting === 0 ? Colors.charcoal500 : "white", fontWeight: "700" }}>{isSyncing ? "Syncing..." : "Sync now"}</Text>
      </Pressable>

      <View style={{ marginTop: 22, backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 16 }}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Recent attempts</Text>
        {attempts.length ? attempts.map((attempt) => (
          <View key={attempt.id} style={{ borderTopWidth: 1, borderTopColor: Colors.charcoal100, paddingTop: 10, marginTop: 10 }}>
            <Text style={{ color: Colors.charcoal }}>{attempt.state} attempt {attempt.attemptNumber}</Text>
            <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{attempt.errorMessage ?? "No error"}</Text>
          </View>
        )) : <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>No sync attempts yet.</Text>}
      </View>
    </ScrollView>
  );
}
