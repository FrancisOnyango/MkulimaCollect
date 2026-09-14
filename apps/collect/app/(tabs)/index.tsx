import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/features/auth/AuthProvider";
import { getActiveSession, resumePathForSession } from "@/features/farmers/collectionSessionRepository";
import { sectorCatalog, sectorGroups } from "@/features/sectors/catalog";
import { useSyncStatus } from "@/features/sync/useSyncStatus";
import { useDatabase } from "@/components/providers/DBProvider";

const workflow = ["Consent", "Farmer", "Farm", "Sector", "Evidence", "Review"];

export default function HomeScreen() {
  const db = useDatabase();
  const { agent, logout } = useAuth();
  const { counts, isSyncing, lastRun, syncNow } = useSyncStatus();
  const waitingCount = counts.PENDING_SYNC + counts.RETRY;
  const hasWorkToSync = waitingCount > 0;
  const [resumeFarmerId, setResumeFarmerId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void getActiveSession(db).then((session) => {
        setResumeFarmerId(session?.farmerId ?? null);
      });
    }, [db]),
  );

  async function handleResume() {
    const session = await getActiveSession(db);
    if (!session) {
      router.push("/collect");
      return;
    }
    const target = resumePathForSession(session);
    router.push({ pathname: target.pathname, params: target.params } as never);
  }

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>MkulimaCollect field console</Text>
          <Text style={styles.title}>Production data ready for MkulimaScore.</Text>
          <Text style={styles.subtitle}>
            {agent?.name ?? "Field agent"} · {agent?.orgName ?? "Organization"}{agent?.clusterName ? ` · ${agent.clusterName}` : ""}
          </Text>
          <View style={styles.heroActions}>
            <Pressable accessibilityRole="button" onPress={() => router.push("/collect/consent")} style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>{resumeFarmerId ? "New collection" : "Start collection"}</Text>
            </Pressable>
            {resumeFarmerId ? (
              <Pressable accessibilityRole="button" onPress={() => { void handleResume(); }} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Resume draft</Text>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => router.push("/sync")} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Sync centre</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <Metric label="Waiting" value={`${waitingCount}`} tone={hasWorkToSync ? "warning" : "success"} />
          <Metric label="Synced" value={`${counts.SYNCED}`} tone="success" />
          <Metric label="Failed" value={`${counts.FAILED_PERMANENTLY}`} tone={counts.FAILED_PERMANENTLY ? "danger" : "default"} />
          <Metric label="Sectors" value={`${sectorCatalog.length}`} tone="default" />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's operating flow</Text>
            <Text style={styles.sectionText}>The route is sector-aware from enterprise selection through evidence review.</Text>
          </View>
          <View style={styles.flow}>
            {workflow.map((item, index) => (
              <View key={item} style={styles.flowItem}>
                <Text style={styles.flowNumber}>{index + 1}</Text>
                <Text style={styles.flowLabel}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sector coverage</Text>
            <Text style={styles.sectionText}>Dairy is supported, but the intake is designed for crops, horticulture, livestock, aquaculture, and perennial enterprises.</Text>
          </View>
          {sectorGroups.map((group) => (
            <View key={group} style={styles.groupBlock}>
              <Text style={styles.groupTitle}>{group}</Text>
              <View style={styles.chipWrap}>
                {sectorCatalog.filter((sector) => sector.group === group).map((sector) => (
                  <View key={sector.id} style={styles.chip}>
                    <Text style={styles.chipText}>{sector.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.syncHeader}>
            <View style={styles.syncCopy}>
              <Text style={styles.sectionTitle}>Offline sync queue</Text>
              <Text style={styles.sectionText}>
                {counts.PENDING_SYNC} pending, {counts.RETRY} retrying, {counts.SYNCING} syncing
              </Text>
              {lastRun ? <Text style={styles.lastRun}>Last run: {lastRun.synced} synced, {lastRun.failed} failed</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isSyncing || !hasWorkToSync}
              onPress={() => {
                void syncNow();
              }}
              style={[styles.syncButton, isSyncing || !hasWorkToSync ? styles.syncButtonDisabled : null]}
            >
              <Text style={[styles.syncButtonText, isSyncing || !hasWorkToSync ? styles.syncButtonTextDisabled : null]}>{isSyncing ? "Syncing" : "Sync"}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "default" | "success" | "warning" | "danger" }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, tone === "success" ? styles.successText : tone === "warning" ? styles.warningText : tone === "danger" ? styles.dangerText : null]}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.surface,
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 34,
  },
  hero: {
    backgroundColor: Colors.ink,
    borderRadius: 24,
    padding: 18,
  },
  eyebrow: {
    color: Colors.brandMid,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "700",
    lineHeight: 33,
    marginTop: 10,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: Colors.brand,
    borderRadius: 999,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  primaryActionText: {
    color: Colors.brandInk,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  metric: {
    backgroundColor: Colors.card,
    borderColor: Colors.charcoal100,
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 92,
    justifyContent: "center",
    padding: 14,
  },
  metricValue: {
    color: Colors.charcoal,
    fontSize: 28,
    fontWeight: "800",
  },
  metricLabel: {
    color: Colors.charcoal500,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  successText: {
    color: Colors.brand,
  },
  warningText: {
    color: Colors.amberField,
  },
  dangerText: {
    color: Colors.redField,
  },
  section: {
    backgroundColor: Colors.card,
    borderColor: Colors.charcoal100,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  sectionHeader: {
    borderBottomColor: Colors.charcoal100,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  sectionTitle: {
    color: Colors.charcoal,
    fontSize: 17,
    fontWeight: "800",
  },
  sectionText: {
    color: Colors.charcoal500,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  flow: {
    gap: 8,
    marginTop: 12,
  },
  flowItem: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.charcoal100,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  flowNumber: {
    backgroundColor: Colors.brand,
    borderRadius: 999,
    color: Colors.brandInk,
    fontSize: 12,
    fontWeight: "900",
    height: 24,
    lineHeight: 24,
    textAlign: "center",
    width: 24,
  },
  flowLabel: {
    color: Colors.charcoal700,
    fontSize: 14,
    fontWeight: "800",
  },
  groupBlock: {
    marginTop: 13,
  },
  groupTitle: {
    color: Colors.charcoal700,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.charcoal100,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipText: {
    color: Colors.charcoal700,
    fontSize: 12,
    fontWeight: "800",
  },
  syncHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  syncCopy: {
    flex: 1,
  },
  lastRun: {
    color: Colors.charcoal500,
    fontSize: 12,
    marginTop: 4,
  },
  syncButton: {
    alignItems: "center",
    backgroundColor: Colors.brand,
    borderRadius: 999,
    minHeight: 48,
    justifyContent: "center",
    minWidth: 86,
    paddingHorizontal: 14,
  },
  syncButtonDisabled: {
    backgroundColor: Colors.charcoal100,
  },
  syncButtonText: {
    color: Colors.brandInk,
    fontSize: 14,
    fontWeight: "700",
  },
  syncButtonTextDisabled: {
    color: Colors.charcoal500,
  },
  logoutButton: {
    alignItems: "center",
    borderColor: Colors.charcoal100,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 14,
    minHeight: 50,
    justifyContent: "center",
  },
  logoutText: {
    color: Colors.charcoal700,
    fontSize: 15,
    fontWeight: "800",
  },
});
