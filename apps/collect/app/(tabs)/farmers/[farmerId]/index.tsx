import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEvidenceByFarmer } from "@/features/evidence/evidenceRepository";
import { getEnterprisesByFarmer } from "@/features/enterprises/enterpriseRepository";
import { getFarmerById, type FarmerSummary } from "@/features/farmers/farmerRepository";
import { getFarmsByFarmer } from "@/features/farms/farmRepository";
import { type enterprises, type evidence, type farms } from "@/lib/db/schema";

type FarmRow = typeof farms.$inferSelect;
type EnterpriseRow = typeof enterprises.$inferSelect;
type EvidenceRow = typeof evidence.$inferSelect;

export default function FarmerOverviewScreen() {
  const db = useDatabase();
  const { farmerId } = useLocalSearchParams<{ farmerId: string }>();
  const [farmer, setFarmer] = useState<FarmerSummary | null>(null);
  const [farmRows, setFarmRows] = useState<FarmRow[]>([]);
  const [enterpriseRows, setEnterpriseRows] = useState<EnterpriseRow[]>([]);
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([]);

  useEffect(() => {
    if (!farmerId) {
      return;
    }

    void Promise.all([
      getFarmerById(db, farmerId),
      getFarmsByFarmer(db, farmerId),
      getEnterprisesByFarmer(db, farmerId),
      getEvidenceByFarmer(db, farmerId),
    ]).then(([nextFarmer, nextFarms, nextEnterprises, nextEvidence]) => {
      setFarmer(nextFarmer);
      setFarmRows(nextFarms);
      setEnterpriseRows(nextEnterprises);
      setEvidenceRows(nextEvidence);
    });
  }, [db, farmerId]);

  const name = farmer?.identity?.fullLegalName || [farmer?.identity?.firstName, farmer?.identity?.surname].filter(Boolean).join(" ") || "Unnamed farmer";

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>{name}</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>{farmer?.status ?? "Loading"} - {farmer?.completenessPct ?? 0}% complete</Text>

      <View style={{ marginTop: 22, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 16, gap: 8 }}>
        <Text style={{ color: Colors.charcoal }}>Farms: {farmRows.length}</Text>
        <Text style={{ color: Colors.charcoal }}>Enterprises: {enterpriseRows.length}</Text>
        <Text style={{ color: Colors.charcoal }}>Evidence: {evidenceRows.length}</Text>
        <Text style={{ color: farmer?.syncedAt ? Colors.brand : Colors.amberField }}>{farmer?.syncedAt ? "Synced" : "Pending sync"}</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push("/collect")} style={{ alignItems: "center", borderRadius: 12, backgroundColor: Colors.brand, paddingVertical: 14, marginTop: 20 }}>
        <Text style={{ color: Colors.brandInk, fontWeight: "700" }}>Start another collection</Text>
      </Pressable>
    </View>
  );
}
