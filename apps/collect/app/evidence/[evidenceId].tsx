import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEvidenceById } from "@/features/evidence/evidenceRepository";
import { type evidence } from "@/lib/db/schema";

type EvidenceRow = typeof evidence.$inferSelect;

export default function EvidenceDetailScreen() {
  const db = useDatabase();
  const { evidenceId } = useLocalSearchParams<{ evidenceId: string }>();
  const [item, setItem] = useState<EvidenceRow | null>(null);

  useEffect(() => {
    if (evidenceId) {
      void getEvidenceById(db, evidenceId).then(setItem);
    }
  }, [db, evidenceId]);

  if (!item) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 18 }}>
        <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700" }}>Evidence not found</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>This record is not available in local storage.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.surface }} contentContainerStyle={{ padding: 18 }}>
      <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700" }}>{item.category}</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>{new Date(item.createdAt).toLocaleString()}</Text>
      <View style={cardStyle}>
        <Text style={sectionTitleStyle}>Storage</Text>
        <Text style={rowStyle}>URI: {item.localUri}</Text>
        <Text style={rowStyle}>MIME: {item.mimeType}</Text>
        <Text style={rowStyle}>Size: {item.fileSizeBytes} bytes</Text>
        <Text style={rowStyle}>SHA-256: {item.sha256}</Text>
      </View>
      <View style={cardStyle}>
        <Text style={sectionTitleStyle}>Workflow</Text>
        <Text style={rowStyle}>Sync: {item.syncStatus}</Text>
        <Text style={rowStyle}>Verification: {item.verificationStatus}</Text>
        <Text style={rowStyle}>Server reference: {item.serverRef ?? "Not synced"}</Text>
      </View>
    </ScrollView>
  );
}

const cardStyle = { backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginTop: 14 };
const sectionTitleStyle = { color: Colors.charcoal, fontSize: 17, fontWeight: "700" as const };
const rowStyle = { color: Colors.charcoal700, marginTop: 8 };
