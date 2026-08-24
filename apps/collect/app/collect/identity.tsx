import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { saveIdentity } from "@/features/farmers/identityRepository";

export default function IdentityStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const dependsOn = params.dependsOn ? [params.dependsOn] : [];
  const [fullLegalName, setFullLegalName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!farmerId || (!fullLegalName && !firstName)) {
      setError("Enter at least a full name or first name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const operationUuid = await saveIdentity(db, {
        farmerId,
        fullLegalName,
        firstName,
        surname,
        dependsOn,
      });

      router.push({ pathname: "/collect/membership", params: { farmerId, dependsOn: operationUuid } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save identity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Identity</Text>
      <TextInput placeholder="Full legal name" value={fullLegalName} onChangeText={setFullLegalName} style={inputStyle} />
      <TextInput placeholder="First name" value={firstName} onChangeText={setFirstName} style={inputStyle} />
      <TextInput placeholder="Surname" value={surname} onChangeText={setSurname} style={inputStyle} />
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
