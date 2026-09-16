import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { AppHeader, ScreenShell } from "@/components/ui/ScreenShell";
import { useDatabase } from "@/components/providers/DBProvider";
import { useApiClient } from "@/components/providers/APIProvider";
import { getRecentSyncAttempts } from "@/features/sync/syncAttemptRepository";
import { getOpenConflicts } from "@/features/sync/conflictRepository";
import { useSyncStatus } from "@/features/sync/useSyncStatus";
import { type syncAttempts } from "@/lib/db/schema";
import { MetadataKey, getMetadata } from "@/lib/db/metadataRepository";

type SyncAttemptRow = typeof syncAttempts.$inferSelect;

export default function SyncScreen() {
  const db = useDatabase();
  const { environment } = useApiClient();
  const { counts, isSyncing, lastRun, syncNow } = useSyncStatus();
  const [attempts, setAttempts] = useState<SyncAttemptRow[]>([]);
  const [openConflicts, setOpenConflicts] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const waiting = counts.PENDING_SYNC + counts.RETRY;

  useEffect(() => {
    void getRecentSyncAttempts(db).then(setAttempts);
    void getOpenConflicts(db).then((rows) => setOpenConflicts(rows.length));
    void getMetadata(db, MetadataKey.SYNC_CURSOR).then(setCursor);
  }, [db, lastRun]);

  return (
    <ScreenShell padded={false}>
    <ScrollView style={{ flex: 1, backgroundColor: Colors.surface }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 28 }}>
      <AppHeader title="Sync Centre" subtitle="Durable outbox status from local SQLite." onBack={() => router.back()} />
      <View style={{ backgroundColor: environment === "development" ? Colors.amberBg : Colors.brandMuted, borderRadius: 12, padding: 12, marginTop: 14 }}>
        <Text style={{ color: environment === "development" ? Colors.amberField : Colors.brandDark, fontWeight: "700" }}>
          {environment === "development" ? "Local mock adapter" : environment === "preview" ? "Staging API" : "Production API"}
        </Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>
          {environment === "development"
            ? "No network. Preview and production builds call the MkulimaScore HTTPS mobile API."
            : `Pull cursor: ${cursor ?? "none"}`}
        </Text>
      </View>

      <View style={{ marginTop: 22, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 16, gap: 8 }}>
        <Text style={{ color: Colors.charcoal }}>Waiting: {waiting}</Text>
        <Text style={{ color: Colors.charcoal }}>Syncing: {counts.SYNCING}</Text>
        <Text style={{ color: Colors.charcoal }}>Synced: {counts.SYNCED}</Text>
        <Text style={{ color: Colors.charcoal }}>Retry: {counts.RETRY}</Text>
        <Text style={{ color: Colors.charcoal }}>Failed: {counts.FAILED_PERMANENTLY}</Text>
        <Text style={{ color: Colors.charcoal }}>Conflicts: {counts.CONFLICT}</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push("/sync/conflicts")} style={{ marginTop: 14, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 16 }}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Open conflicts</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{openConflicts} waiting for agent review</Text>
      </Pressable>

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
        style={{ alignItems: "center", borderRadius: 999, backgroundColor: isSyncing || waiting === 0 ? Colors.charcoal100 : Colors.brand, paddingVertical: 14, marginTop: 24 }}
      >
        <Text style={{ color: isSyncing || waiting === 0 ? Colors.charcoal500 : Colors.brandInk, fontWeight: "700" }}>{isSyncing ? "Syncing..." : "Sync now"}</Text>
      </Pressable>

      <View style={{ marginTop: 22, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 16 }}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Recent attempts</Text>
        {attempts.length ? attempts.map((attempt) => (
          <View key={attempt.id} style={{ borderTopWidth: 1, borderTopColor: Colors.charcoal100, paddingTop: 10, marginTop: 10 }}>
            <Text style={{ color: Colors.charcoal }}>{attempt.state} attempt {attempt.attemptNumber}</Text>
            <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{attempt.errorMessage ?? "No error"}</Text>
          </View>
        )) : <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>No sync attempts yet.</Text>}
      </View>
    </ScrollView>
    </ScreenShell>
  );
}
