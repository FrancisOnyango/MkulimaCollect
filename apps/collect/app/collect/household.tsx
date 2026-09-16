import { useCallback, useState } from "react";
import { Pressable, Text } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField } from "@/components/ui/FormKit";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { upsertCollectionSession } from "@/features/farmers/collectionSessionRepository";
import { createHouseholdMember, getHouseholdMembersByFarmer, householdRoles, type HouseholdRole } from "@/features/household/householdRepository";

export default function HouseholdStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; dependsOn?: string }>();
  const farmerId = params.farmerId ?? "";
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<HouseholdRole>("spouse");
  const [labour, setLabour] = useState("");
  const [members, setMembers] = useState<Awaited<ReturnType<typeof getHouseholdMembersByFarmer>>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!farmerId) return;
    void getHouseholdMembersByFarmer(db, farmerId).then(setMembers);
  }, [db, farmerId]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  async function addMember() {
    if (!farmerId || !fullName.trim()) {
      setError("Enter the household member name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createHouseholdMember(db, {
        farmerId,
        fullName: fullName.trim(),
        role,
        labourContribution: labour.trim() || undefined,
        dependsOn: params.dependsOn ? [params.dependsOn] : [],
      });
      setFullName("");
      setLabour("");
      refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save household member");
    } finally {
      setSaving(false);
    }
  }

  async function continueNext() {
    await upsertCollectionSession(db, { farmerId, currentStep: "membership" });
    router.push({ pathname: "/collect/membership", params: { farmerId, dependsOn: params.dependsOn } });
  }

  return (
    <FormScreen footer={<PrimaryButton label="Continue to membership" onPress={() => void continueNext()} />}>
      <StepHeader
        eyebrow="Household"
        title="Who lives and works here?"
        description="Capture household members, roles, and labour. You can continue with only the farmer if the rest of the household is not present."
        step={3}
        total={10}
      />

      <SectionCard title="Add member" description="Roles stay on the household, not on a single farm.">
        <TextField label="Full name" required value={fullName} onChangeText={setFullName} placeholder="Spouse, child, or worker" />
        <ChoiceGroup label="Role" value={role} options={[...householdRoles]} onChange={(value) => setRole(value as HouseholdRole)} required />
        <TextField label="Labour contribution" value={labour} onChangeText={setLabour} placeholder="Full-time, seasonal, none" />
        <PrimaryButton label={saving ? "Saving…" : "Save member"} loading={saving} onPress={() => void addMember()} />
      </SectionCard>

      <SectionCard title="Saved members" description={`${members.length} recorded.`}>
        {members.length ? members.map((member) => (
          <Pressable key={member.id} style={{ marginTop: 10, padding: 12, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 8, backgroundColor: Colors.card }}>
            <Text style={{ color: Colors.charcoal, fontWeight: "800" }}>{member.fullName}</Text>
            <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{member.role}{member.labourContribution ? ` · ${member.labourContribution}` : ""}</Text>
          </Pressable>
        )) : <Notice title="No extra members yet" message="The farmer can be the only recorded household member." tone="warning" />}
      </SectionCard>

      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
