import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { createFarm } from "@/features/farms/farmRepository";

export default function FarmStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const dependsOn = params.dependsOn ? [params.dependsOn] : [];
  const [name, setName] = useState("Main farm");
  const [village, setVillage] = useState("");
  const [size, setSize] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!farmerId) {
      setError("Missing farmer session.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const parsedSize = Number(size);
      const { farmId, operationUuid } = await createFarm(db, {
        farmerId,
        name,
        village,
        tenure: "OWNED",
        ...(Number.isFinite(parsedSize) && size ? { sizeReportedAcres: parsedSize, sizeReportedSource: "FARMER_REPORTED" } : {}),
        dependsOn,
      });

      router.push({ pathname: "/collect/enterprise", params: { farmerId, farmId, dependsOn: operationUuid } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save farm");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Farm</Text>
      <TextInput placeholder="Farm name" value={name} onChangeText={setName} style={inputStyle} />
      <TextInput placeholder="Village" value={village} onChangeText={setVillage} style={inputStyle} />
      <TextInput placeholder="Reported size in acres" value={size} onChangeText={setSize} keyboardType="decimal-pad" style={inputStyle} />
      {error ? <Text style={{ color: Colors.redField, marginTop: 14 }}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={saving} onPress={handleContinue} style={buttonStyle(saving)}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "700" }}>Continue</Text>}
      </Pressable>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: Colors.charcoal100,
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: Colors.charcoal,
  backgroundColor: "white",
  marginTop: 14,
};

function buttonStyle(disabled: boolean) {
  return {
    alignItems: "center" as const,
    borderRadius: 12,
    backgroundColor: disabled ? Colors.charcoal300 : Colors.brand,
    paddingVertical: 14,
    marginTop: 24,
  };
}
