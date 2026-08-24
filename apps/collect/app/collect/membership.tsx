import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getPrimaryAffiliationByFarmer, saveAffiliation, type SaveAffiliationInput } from "@/features/affiliations/affiliationRepository";

export default function MembershipStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; dependsOn?: string }>();
  const [organizationName, setOrganizationName] = useState("");
  const [institutionType, setInstitutionType] = useState("COOPERATIVE");
  const [memberNumber, setMemberNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [membershipStart, setMembershipStart] = useState("");
  const [active, setActive] = useState(true);
  const [collectionCentre, setCollectionCentre] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.farmerId) {
      return;
    }

    void getPrimaryAffiliationByFarmer(db, params.farmerId).then((affiliation) => {
      if (!affiliation) {
        return;
      }

      setOrganizationName(affiliation.organizationName);
      setInstitutionType(affiliation.institutionType);
      setMemberNumber(affiliation.memberNumber ?? "");
      setBranch(affiliation.branch ?? "");
      setMembershipStart(affiliation.membershipStart ?? "");
      setActive(affiliation.active);
      setCollectionCentre(affiliation.collectionCentre ?? "");
    });
  }, [db, params.farmerId]);

  async function handleContinue() {
    if (!params.farmerId) {
      setError("Missing farmer session.");
      return;
    }

    if (!organizationName.trim()) {
      setError("Enter the cooperative, SACCO, or institution name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const input: SaveAffiliationInput = {
        farmerId: params.farmerId,
        organizationName: organizationName.trim(),
        institutionType,
        active,
        dependsOn: params.dependsOn ? [params.dependsOn] : [],
      };

      if (memberNumber.trim()) {
        input.memberNumber = memberNumber.trim();
      }

      if (branch.trim()) {
        input.branch = branch.trim();
      }

      if (membershipStart.trim()) {
        input.membershipStart = membershipStart.trim();
      }

      if (collectionCentre.trim()) {
        input.collectionCentre = collectionCentre.trim();
      }

      const { operationUuid } = await saveAffiliation(db, input);

      router.push({ pathname: "/collect/farm", params: { farmerId: params.farmerId, dependsOn: operationUuid } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save membership");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.surface }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Membership</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>Record cooperative, SACCO, or institutional affiliation for this farmer.</Text>
      <TextInput placeholder="Organization name" value={organizationName} onChangeText={setOrganizationName} style={inputStyle} />
      <TextInput placeholder="Institution type" value={institutionType} onChangeText={setInstitutionType} style={inputStyle} />
      <TextInput placeholder="Member number" value={memberNumber} onChangeText={setMemberNumber} style={inputStyle} />
      <TextInput placeholder="Branch" value={branch} onChangeText={setBranch} style={inputStyle} />
      <TextInput placeholder="Membership start date" value={membershipStart} onChangeText={setMembershipStart} style={inputStyle} />
      <TextInput placeholder="Collection centre" value={collectionCentre} onChangeText={setCollectionCentre} style={inputStyle} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Active membership</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>
      {error ? <Text style={{ color: Colors.redField, marginTop: 14 }}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={saving} onPress={handleContinue} style={buttonStyle(saving)}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "700" }}>Continue</Text>}
      </Pressable>
    </ScrollView>
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
