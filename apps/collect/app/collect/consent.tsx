import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { saveConsent } from "@/features/farmers/consentRepository";
import { createFarmer } from "@/features/farmers/farmerRepository";

export default function ConsentStep() {
  const db = useDatabase();
  const { agent } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [mpesaAuthorized, setMpesaAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!agent || !accepted) {
      setError("Consent is required before collection can continue.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { farmerId, operationUuid: farmerOperationUuid } = await createFarmer(db, {
        agentId: agent.id,
        orgId: agent.orgId,
        status: "IN_PROGRESS",
      });
      const { operationUuid: consentOperationUuid } = await saveConsent(db, {
        farmerId,
        version: "1.0.0",
        method: "DIGITAL",
        language: "en",
        agentId: agent.id,
        itemsAgreed: ["data_collection", "evidence_capture", "offline_storage", "sync_to_mkulimascore"],
        mpesaAuthorized,
        dependsOn: [farmerOperationUuid],
      });

      router.push({ pathname: "/collect/identity", params: { farmerId, dependsOn: consentOperationUuid } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save consent");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Consent</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>Confirm the farmer agrees to data collection, local storage, evidence capture, and secure sync.</Text>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        onPress={() => setAccepted((value) => !value)}
        style={{ marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: accepted ? Colors.brand : Colors.charcoal100, backgroundColor: accepted ? Colors.brandLight : "white" }}
      >
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>{accepted ? "Checked" : "Unchecked"} - Farmer consent captured</Text>
      </Pressable>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: mpesaAuthorized }}
        onPress={() => setMpesaAuthorized((value) => !value)}
        style={{ marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: mpesaAuthorized ? Colors.brand : Colors.charcoal100, backgroundColor: "white" }}
      >
        <Text style={{ color: Colors.charcoal700 }}>{mpesaAuthorized ? "Checked" : "Unchecked"} - M-PESA statement authorization</Text>
      </Pressable>

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
