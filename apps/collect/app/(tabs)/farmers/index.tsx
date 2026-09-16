import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Colors } from "@/constants/colors";
import { AppHeader, FilterChip, ScreenShell } from "@/components/ui/ScreenShell";
import { useDatabase } from "@/components/providers/DBProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { getFarmersByAgent, type FarmerSummary } from "@/features/farmers/farmerRepository";

type Filter = "All" | "Needs work" | "Unsynced";

function farmerName(item: FarmerSummary) {
  return item.identity?.fullLegalName || [item.identity?.firstName, item.identity?.surname].filter(Boolean).join(" ") || "Unnamed farmer";
}

export default function FarmersScreen() {
  const db = useDatabase();
  const { agent } = useAuth();
  const [farmers, setFarmers] = useState<FarmerSummary[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!agent) {
      setFarmers([]);
      return;
    }
    setFarmers(await getFarmersByAgent(db, agent.id));
  }, [agent, db]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return farmers.filter((farmer) => {
      const name = farmerName(farmer).toLowerCase();
      const matchesSearch = !query || name.includes(query) || farmer.id.toLowerCase().includes(query) || farmer.status.toLowerCase().includes(query);
      const needsWork = farmer.status !== "SUBMITTED" && farmer.status !== "VERIFIED";
      const matchesFilter =
        filter === "All" ||
        (filter === "Needs work" && needsWork) ||
        (filter === "Unsynced" && !farmer.syncedAt);
      return matchesSearch && matchesFilter;
    });
  }, [farmers, filter, search]);

  return (
    <ScreenShell>
      <AppHeader
        title="Farmers"
        subtitle={`${farmers.length} local profile${farmers.length === 1 ? "" : "s"}`}
        action={
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/collect/consent")}
            style={{ backgroundColor: Colors.brand, borderRadius: 999, minHeight: 40, justifyContent: "center", paddingHorizontal: 14 }}
          >
            <Text style={{ color: Colors.brandInk, fontWeight: "800" }}>New</Text>
          </Pressable>
        }
      />

      <TextInput
        placeholder="Search name or ID"
        placeholderTextColor={Colors.charcoal500}
        value={search}
        onChangeText={setSearch}
        style={{
          backgroundColor: Colors.card,
          borderColor: Colors.charcoal100,
          borderRadius: 999,
          borderWidth: 1,
          color: Colors.charcoal,
          minHeight: 46,
          paddingHorizontal: 16,
        }}
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, marginBottom: 8 }}>
        {(["All", "Needs work", "Unsynced"] as Filter[]).map((item) => (
          <FilterChip key={item} label={item} active={filter === item} onPress={() => setFilter(item)} />
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={Colors.brand} />}
        contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ paddingVertical: 36, alignItems: "center" }}>
            <Text style={{ color: Colors.charcoal500, textAlign: "center" }}>
              {farmers.length ? "No farmers match this search." : "No farmers collected yet. Start a collection from Home or the + button."}
            </Text>
            {!farmers.length ? (
              <Pressable accessibilityRole="button" onPress={() => router.push("/collect/consent")} style={{ marginTop: 16, backgroundColor: Colors.brand, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ color: Colors.brandInk, fontWeight: "800" }}>Start collection</Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const name = farmerName(item);
          const needsWork = item.status !== "SUBMITTED" && item.status !== "VERIFIED";
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/(tabs)/farmers/[farmerId]", params: { farmerId: item.id } })}
              style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 16, padding: 14, marginBottom: 10 }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: Colors.charcoal, fontWeight: "800", fontSize: 16 }} numberOfLines={1}>{name}</Text>
                  <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{item.status} · {item.completenessPct}% complete</Text>
                </View>
                <Text style={{ color: item.syncedAt ? Colors.brand : Colors.amberField, fontWeight: "800", fontSize: 12 }}>
                  {item.syncedAt ? "Synced" : "Queued"}
                </Text>
              </View>
              {needsWork ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/collect/holdings", params: { farmerId: item.id } })}
                  style={{ alignSelf: "flex-start", marginTop: 10, backgroundColor: Colors.brandMuted, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  <Text style={{ color: Colors.brandDark, fontWeight: "800" }}>Continue</Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        }}
      />
    </ScreenShell>
  );
}
