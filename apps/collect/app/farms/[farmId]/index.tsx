import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterprisesByFarm } from "@/features/enterprises/enterpriseRepository";
import { getFarmById, getGeometriesByFarm } from "@/features/farms/farmRepository";
import { type enterprises, type farmGeometries, type farms } from "@/lib/db/schema";

type FarmRow = typeof farms.$inferSelect;
type GeometryRow = typeof farmGeometries.$inferSelect;
type EnterpriseRow = typeof enterprises.$inferSelect;

export default function FarmDetailScreen() {
  const db = useDatabase();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const [farm, setFarm] = useState<FarmRow | null>(null);
  const [geometries, setGeometries] = useState<GeometryRow[]>([]);
  const [enterpriseRows, setEnterpriseRows] = useState<EnterpriseRow[]>([]);

  useEffect(() => {
    if (!farmId) {
      return;
    }

    void Promise.all([getFarmById(db, farmId), getGeometriesByFarm(db, farmId), getEnterprisesByFarm(db, farmId)]).then(
      ([nextFarm, nextGeometries, nextEnterprises]) => {
        setFarm(nextFarm);
        setGeometries(nextGeometries);
        setEnterpriseRows(nextEnterprises);
      },
    );
  }, [db, farmId]);

  if (!farm) {
    return (
      <View style={screenStyle}>
        <Text style={titleStyle}>Farm not found</Text>
        <Text style={mutedStyle}>This farm is not available in local storage.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.surface }} contentContainerStyle={{ padding: 18 }}>
      <Text style={titleStyle}>{farm.name ?? "Unnamed farm"}</Text>
      <Text style={mutedStyle}>{[farm.village, farm.ward, farm.county].filter(Boolean).join(", ") || "Location not specified"}</Text>

      <View style={cardStyle}>
        <Text style={sectionTitleStyle}>Land profile</Text>
        <Text style={rowStyle}>Tenure: {farm.tenure ?? "Not set"}</Text>
        <Text style={rowStyle}>Reported size: {farm.sizeReportedAcres ?? "n/a"} acres</Text>
        <Text style={rowStyle}>GPS size: {farm.sizeGpsAcres ?? "n/a"} acres</Text>
        <Text style={rowStyle}>Irrigation: {farm.irrigation === null ? "Not set" : farm.irrigation ? "Yes" : "No"}</Text>
      </View>

      <View style={cardStyle}>
        <View style={headerRowStyle}>
          <Text style={sectionTitleStyle}>Boundary</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/farms/[farmId]/boundary", params: { farmId: farm.id } })} style={smallButtonStyle}>
            <Text style={smallButtonTextStyle}>Capture</Text>
          </Pressable>
        </View>
        {geometries.length ? (
          geometries.map((geometry) => (
            <Text key={geometry.id} style={rowStyle}>
              {geometry.areaCalculatedAcres} acres, {geometry.pointCount} points, {geometry.calculationMethod}
            </Text>
          ))
        ) : (
          <Text style={mutedStyle}>No boundary recorded for this farm.</Text>
        )}
      </View>

      <View style={cardStyle}>
        <Text style={sectionTitleStyle}>Enterprises</Text>
        {enterpriseRows.length ? (
          enterpriseRows.map((enterprise) => (
            <Pressable
              accessibilityRole="button"
              key={enterprise.id}
              onPress={() => router.push({ pathname: "/enterprises/[enterpriseId]", params: { enterpriseId: enterprise.id } })}
              style={{ paddingVertical: 10 }}
            >
              <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>{enterprise.sector}</Text>
              <Text style={mutedStyle}>{enterprise.status}</Text>
            </Pressable>
          ))
        ) : (
          <Text style={mutedStyle}>No enterprises attached to this farm.</Text>
        )}
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
const headerRowStyle = { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const };
const smallButtonStyle = { backgroundColor: Colors.brand, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 };
const smallButtonTextStyle = { color: Colors.brandInk, fontWeight: "700" as const };
