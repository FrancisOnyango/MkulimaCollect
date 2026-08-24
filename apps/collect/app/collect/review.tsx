import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { calculateCompletenessDetails } from "@/features/farmers/farmerCompleteness";
import { updateCompleteness, updateFarmerStatus } from "@/features/farmers/farmerRepository";

export default function ReviewStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string }>();
  const farmerId = params.farmerId ?? "";
  const [completeness, setCompleteness] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmerId) {
      return;
    }

    void calculateCompletenessDetails(db, farmerId).then((details) => {
      setCompleteness(details.percent);
      setMissing(details.missing);
    });
  }, [db, farmerId]);

  async function handleSubmit() {
    if (!farmerId) {
      setError("Missing farmer session.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const details = await calculateCompletenessDetails(db, farmerId);
      await updateCompleteness(db, farmerId, details.percent);
      await updateFarmerStatus(db, farmerId, "SUBMITTED");
      setCompleteness(details.percent);
      setMissing(details.missing);
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit farmer profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Review</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>This farmer profile is saved locally and ready to submit to the sync queue.</Text>
      <View style={{ marginTop: 22, backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 16 }}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Profile completeness</Text>
        <Text style={{ color: Colors.brand, fontSize: 32, fontWeight: "700", marginTop: 8 }}>{completeness}%</Text>
        {missing.length ? missing.map((item) => <Text key={item} style={{ color: Colors.amberField, marginTop: 6 }}>Missing: {item}</Text>) : <Text style={{ color: Colors.brand, marginTop: 6 }}>All required local sections are present.</Text>}
      </View>
      {submitted ? (
        <View style={{ marginTop: 16, backgroundColor: Colors.brandLight, borderRadius: 12, padding: 14 }}>
          <Text style={{ color: Colors.brandDark, fontWeight: "700" }}>Saved - waiting to sync</Text>
          <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>Local transaction completed and outbox records are ready for Sync Centre.</Text>
        </View>
      ) : null}
      {error ? <Text style={{ color: Colors.redField, marginTop: 14 }}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={submitted ? () => router.replace("/(tabs)") : handleSubmit}
        style={{ alignItems: "center", borderRadius: 12, backgroundColor: saving ? Colors.charcoal300 : Colors.brand, paddingVertical: 14, marginTop: 24 }}
      >
        {saving ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "700" }}>{submitted ? "Back home" : "Submit locally"}</Text>}
      </Pressable>
    </View>
  );
}
