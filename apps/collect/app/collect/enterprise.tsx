import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { SectorId, type SectorIdValue } from "@/constants/sectorIds";
import { useDatabase } from "@/components/providers/DBProvider";
import { createEnterprise } from "@/features/enterprises/enterpriseRepository";

const sectors: { id: SectorIdValue; label: string }[] = [
  { id: SectorId.DAIRY, label: "Dairy" },
  { id: SectorId.MAIZE, label: "Maize" },
  { id: SectorId.TEA, label: "Tea" },
  { id: SectorId.COFFEE, label: "Coffee" },
  { id: SectorId.AVOCADO, label: "Avocado" },
  { id: SectorId.RICE, label: "Rice" },
  { id: SectorId.IRISH_POTATO, label: "Irish potato" },
  { id: SectorId.POULTRY, label: "Poultry" },
  { id: SectorId.TOMATO, label: "Tomato" },
  { id: SectorId.MACADAMIA, label: "Macadamia" },
  { id: SectorId.AQUACULTURE, label: "Aquaculture" },
  { id: SectorId.LIVESTOCK_MEAT, label: "Livestock meat" },
  { id: SectorId.BEANS, label: "Beans" },
  { id: SectorId.HORTICULTURE, label: "Horticulture" },
];

export default function EnterpriseStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const farmId = params.farmId ?? "";
  const dependsOn = params.dependsOn ? [params.dependsOn] : [];
  const [sector, setSector] = useState<SectorIdValue>(SectorId.DAIRY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!farmerId || !farmId) {
      setError("Missing farmer or farm session.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { enterpriseId, operationUuid } = await createEnterprise(db, {
        farmerId,
        farmId,
        sector,
        dependsOn,
      });

      router.push({ pathname: "/collect/[sector]", params: { sector, farmerId, farmId, enterpriseId, dependsOn: operationUuid } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save enterprise");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Enterprise</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>Create an enterprise linked to this farm. Each sector uses a versioned local collection schema.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
        {sectors.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.id}
            onPress={() => setSector(item.id)}
            style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: sector === item.id ? Colors.brand : Colors.charcoal100, backgroundColor: sector === item.id ? Colors.brandLight : "white" }}
          >
            <Text style={{ color: sector === item.id ? Colors.brandDark : Colors.charcoal700, fontWeight: "700" }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={{ color: Colors.redField, marginTop: 14 }}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={handleContinue}
        style={{ alignItems: "center", borderRadius: 12, backgroundColor: saving ? Colors.charcoal300 : Colors.brand, paddingVertical: 14, marginTop: 24 }}
      >
        {saving ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "700" }}>Continue</Text>}
      </Pressable>
    </View>
  );
}
