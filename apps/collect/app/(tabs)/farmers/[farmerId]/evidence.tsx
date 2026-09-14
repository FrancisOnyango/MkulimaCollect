import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEvidenceByFarmer } from "@/features/evidence/evidenceRepository";
import { type evidence } from "@/lib/db/schema";

type EvidenceRow = typeof evidence.$inferSelect;

export default function FarmerEvidenceScreen() {
  const db = useDatabase();
  const { farmerId } = useLocalSearchParams<{ farmerId: string }>();
  const [items, setItems] = useState<EvidenceRow[]>([]);

  useEffect(() => {
    if (farmerId) {
      void getEvidenceByFarmer(db, farmerId).then(setItems);
    }
  }, [db, farmerId]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700" }}>Evidence</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/evidence/capture", params: { farmerId } })} style={{ backgroundColor: Colors.brand, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: Colors.brandInk, fontWeight: "700" }}>Add</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: Colors.charcoal500 }}>No evidence recorded.</Text>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/evidence/[evidenceId]", params: { evidenceId: item.id } })} style={cardStyle}>
            <Text style={titleStyle}>{item.category}</Text>
            <Text style={metaStyle}>{item.mimeType} - {Math.round(item.fileSizeBytes / 1024)} KB</Text>
            <Text style={metaStyle}>{item.syncStatus} - {item.verificationStatus}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const cardStyle = { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginBottom: 10 };
const titleStyle = { color: Colors.charcoal, fontWeight: "700" as const, fontSize: 16 };
const metaStyle = { color: Colors.charcoal500, marginTop: 4 };
