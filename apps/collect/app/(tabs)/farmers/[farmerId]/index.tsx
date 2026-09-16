import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { AppHeader, ScreenShell } from "@/components/ui/ScreenShell";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEvidenceByFarmer } from "@/features/evidence/evidenceRepository";
import { getEnterprisesByFarmer } from "@/features/enterprises/enterpriseRepository";
import { getFarmerById, type FarmerSummary } from "@/features/farmers/farmerRepository";
import { getFarmsByFarmer, getGeometriesByFarmer } from "@/features/farms/farmRepository";
import { getSectorMeta } from "@/features/sectors/catalog";
import { type enterprises, type evidence, type farmGeometries, type farms } from "@/lib/db/schema";

type FarmRow = typeof farms.$inferSelect;
type EnterpriseRow = typeof enterprises.$inferSelect;
type EvidenceRow = typeof evidence.$inferSelect;
type GeometryRow = typeof farmGeometries.$inferSelect;

export default function FarmerOverviewScreen() {
  const db = useDatabase();
  const { farmerId } = useLocalSearchParams<{ farmerId: string }>();
  const [farmer, setFarmer] = useState<FarmerSummary | null>(null);
  const [farmRows, setFarmRows] = useState<FarmRow[]>([]);
  const [enterpriseRows, setEnterpriseRows] = useState<EnterpriseRow[]>([]);
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([]);
  const [geometries, setGeometries] = useState<GeometryRow[]>([]);

  const load = useCallback(async () => {
    if (!farmerId) {
      return;
    }
    const [nextFarmer, nextFarms, nextEnterprises, nextEvidence, nextGeometries] = await Promise.all([
      getFarmerById(db, farmerId),
      getFarmsByFarmer(db, farmerId),
      getEnterprisesByFarmer(db, farmerId),
      getEvidenceByFarmer(db, farmerId),
      getGeometriesByFarmer(db, farmerId),
    ]);
    setFarmer(nextFarmer);
    setFarmRows(nextFarms);
    setEnterpriseRows(nextEnterprises);
    setEvidenceRows(nextEvidence);
    setGeometries(nextGeometries);
  }, [db, farmerId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const name = farmer?.identity?.fullLegalName || [farmer?.identity?.firstName, farmer?.identity?.surname].filter(Boolean).join(" ") || "Unnamed farmer";

  return (
    <ScreenShell padded={false}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}>
        <AppHeader title={name} subtitle={`${farmer?.status ?? "Loading"} · ${farmer?.completenessPct ?? 0}% complete`} onBack={() => router.back()} />

        <View style={cardStyle}>
          <Text style={rowStyle}>Farms: {farmRows.length}</Text>
          <Text style={rowStyle}>Enterprises: {enterpriseRows.length}</Text>
          <Text style={rowStyle}>Evidence: {evidenceRows.length}</Text>
          <Text style={{ color: farmer?.syncedAt ? Colors.brand : Colors.amberField, marginTop: 8, fontWeight: "800" }}>
            {farmer?.syncedAt ? "Synced" : "Pending sync"}
          </Text>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/collect/holdings", params: { farmerId } })} style={primaryStyle}>
          <Text style={{ color: Colors.brandInk, fontWeight: "800" }}>Continue collection</Text>
        </Pressable>

        <Text style={sectionTitle}>Farms</Text>
        {farmRows.length ? farmRows.map((farm) => {
          const mapped = geometries.some((geometry) => geometry.farmId === farm.id && geometry.pointCount >= 3);
          return (
            <View key={farm.id} style={cardStyle}>
              <Text style={{ color: Colors.charcoal, fontWeight: "800" }}>{farm.name ?? "Unnamed farm"}</Text>
              <Text style={metaStyle}>{farm.village ?? "No village"} · {mapped ? "Boundary mapped" : "Boundary optional"}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/farms/[farmId]", params: { farmId: farm.id } })} style={chipStyle}>
                  <Text style={chipText}>Open farm</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/farms/[farmId]/boundary", params: { farmId: farm.id, farmerId } })} style={chipStyle}>
                  <Text style={chipText}>{mapped ? "Remap" : "Walk boundary"}</Text>
                </Pressable>
              </View>
            </View>
          );
        }) : <Text style={metaStyle}>No farms yet. Continue collection to add one.</Text>}

        <Text style={sectionTitle}>Enterprises</Text>
        {enterpriseRows.length ? enterpriseRows.map((enterprise) => (
          <Pressable
            key={enterprise.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/collect/[sector]", params: { sector: enterprise.sector, farmerId, farmId: enterprise.farmId, enterpriseId: enterprise.id } })}
            style={cardStyle}
          >
            <Text style={{ color: Colors.charcoal, fontWeight: "800" }}>{getSectorMeta(enterprise.sector).label}</Text>
            <Text style={metaStyle}>{enterprise.status}</Text>
          </Pressable>
        )) : <Text style={metaStyle}>No enterprises yet.</Text>}
      </ScrollView>
    </ScreenShell>
  );
}

const cardStyle = { backgroundColor: Colors.card, borderColor: Colors.charcoal100, borderRadius: 16, borderWidth: 1, marginTop: 12, padding: 14 };
const rowStyle = { color: Colors.charcoal, marginTop: 4 };
const metaStyle = { color: Colors.charcoal500, marginTop: 4 };
const sectionTitle = { color: Colors.charcoal, fontSize: 13, fontWeight: "800" as const, letterSpacing: 1, marginTop: 20, textTransform: "uppercase" as const };
const primaryStyle = { alignItems: "center" as const, backgroundColor: Colors.brand, borderRadius: 999, justifyContent: "center" as const, marginTop: 14, minHeight: 50 };
const chipStyle = { backgroundColor: Colors.brandMuted, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 };
const chipText = { color: Colors.brandDark, fontWeight: "800" as const };
