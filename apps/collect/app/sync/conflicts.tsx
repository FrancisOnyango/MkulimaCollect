import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getOpenConflicts, resolveConflict, type ConflictRecord } from "@/features/sync/conflictRepository";
import { useFocusEffect } from "expo-router";

export default function ConflictsScreen() {
  const db = useDatabase();
  const [items, setItems] = useState<ConflictRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void getOpenConflicts(db).then(setItems);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function resolve(id: string, resolution: "KEEP_LOCAL" | "ACCEPT_REMOTE") {
    setError(null);
    try {
      await resolveConflict(db, id, resolution);
      refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to resolve conflict");
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.surface }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Sync conflicts</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>
        Do not merge farmer records silently. Keep the local draft or accept the server version after review.
      </Text>
      {error ? <Text style={{ color: Colors.redField, marginTop: 12 }}>{error}</Text> : null}
      {items.length ? items.map((item) => (
        <View key={item.id} style={{ marginTop: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 16 }}>
          <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>{item.entityType} · {item.code ?? "conflict"}</Text>
          <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>{item.entityId}</Text>
          <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>{item.remotePayload}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <Pressable accessibilityRole="button" onPress={() => void resolve(item.id, "KEEP_LOCAL")} style={{ flex: 1, alignItems: "center", backgroundColor: Colors.brand, borderRadius: 10, paddingVertical: 12 }}>
              <Text style={{ color: Colors.brandInk, fontWeight: "700" }}>Keep local</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => void resolve(item.id, "ACCEPT_REMOTE")} style={{ flex: 1, alignItems: "center", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 10, paddingVertical: 12 }}>
              <Text style={{ color: Colors.charcoal700, fontWeight: "700" }}>Accept server</Text>
            </Pressable>
          </View>
        </View>
      )) : <Text style={{ color: Colors.charcoal500, marginTop: 18 }}>No open conflicts.</Text>}
    </ScrollView>
  );
}
