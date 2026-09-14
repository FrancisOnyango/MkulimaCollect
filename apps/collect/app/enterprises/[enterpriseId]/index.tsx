import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterpriseById, getSectorResponsesByEnterprise } from "@/features/enterprises/enterpriseRepository";
import { getEvidenceByEnterprise } from "@/features/evidence/evidenceRepository";
import { getFarmById } from "@/features/farms/farmRepository";
import { type enterprises, type evidence, type farms, type sectorCollectionResponses } from "@/lib/db/schema";

type EnterpriseRow = typeof enterprises.$inferSelect;
type FarmRow = typeof farms.$inferSelect;
type ResponseRow = typeof sectorCollectionResponses.$inferSelect;
type EvidenceRow = typeof evidence.$inferSelect;

export default function EnterpriseDetailScreen() {
  const db = useDatabase();
  const { enterpriseId } = useLocalSearchParams<{ enterpriseId: string }>();
  const [enterprise, setEnterprise] = useState<EnterpriseRow | null>(null);
  const [farm, setFarm] = useState<FarmRow | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([]);

  useEffect(() => {
    if (!enterpriseId) {
      return;
    }

    void getEnterpriseById(db, enterpriseId).then(async (nextEnterprise) => {
      setEnterprise(nextEnterprise);

      if (!nextEnterprise) {
        return;
      }

      const [nextFarm, nextResponses, nextEvidence] = await Promise.all([
        getFarmById(db, nextEnterprise.farmId),
        getSectorResponsesByEnterprise(db, enterpriseId),
        getEvidenceByEnterprise(db, enterpriseId),
      ]);
      setFarm(nextFarm);
      setResponses(nextResponses);
      setEvidenceRows(nextEvidence);
    });
  }, [db, enterpriseId]);

  if (!enterprise) {
    return (
      <View style={screenStyle}>
        <Text style={titleStyle}>Enterprise not found</Text>
        <Text style={mutedStyle}>This enterprise is not available in local storage.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.surface }} contentContainerStyle={{ padding: 18 }}>
      <Text style={titleStyle}>{enterprise.sector}</Text>
      <Text style={mutedStyle}>{enterprise.status} on {farm?.name ?? "linked farm"}</Text>

      <View style={cardStyle}>
        <Text style={sectionTitleStyle}>Collection state</Text>
        <Text style={rowStyle}>Production responses: {responses.length}</Text>
        <Text style={rowStyle}>Evidence items: {evidenceRows.length}</Text>
        <Text style={rowStyle}>Local version: {enterprise.localVersion}</Text>
      </View>

      <View style={cardStyle}>
        <Text style={sectionTitleStyle}>Actions</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/enterprises/[enterpriseId]/production", params: { enterpriseId } })} style={buttonStyle}>
          <Text style={buttonTextStyle}>Production</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/enterprises/[enterpriseId]/evidence", params: { enterpriseId } })} style={buttonStyle}>
          <Text style={buttonTextStyle}>Evidence</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/enterprises/[enterpriseId]/costs", params: { enterpriseId } })} style={buttonStyle}>
          <Text style={buttonTextStyle}>Costs</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const screenStyle = { flex: 1, backgroundColor: Colors.surface, padding: 18 };
const titleStyle = { color: Colors.brand, fontSize: 26, fontWeight: "700" as const };
const sectionTitleStyle = { color: Colors.charcoal, fontSize: 17, fontWeight: "700" as const };
const mutedStyle = { color: Colors.charcoal500, marginTop: 6 };
const rowStyle = { color: Colors.charcoal700, marginTop: 8 };
const cardStyle = { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginTop: 14 };
const buttonStyle = { backgroundColor: Colors.brandLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginTop: 10 };
const buttonTextStyle = { color: Colors.brandDark, fontWeight: "700" as const };
