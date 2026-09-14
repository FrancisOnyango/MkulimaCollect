import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField, ToggleRow } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { getPrimaryAffiliationByFarmer, saveAffiliation, type SaveAffiliationInput } from "@/features/affiliations/affiliationRepository";
import { upsertCollectionSession } from "@/features/farmers/collectionSessionRepository";

const institutionTypes = ["COOPERATIVE", "SACCO", "AGGREGATOR", "BUYER", "FARMER_GROUP", "NONE"] as const;

export default function MembershipStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; dependsOn?: string }>();
  const [organizationName, setOrganizationName] = useState("");
  const [institutionType, setInstitutionType] = useState<(typeof institutionTypes)[number]>("COOPERATIVE");
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
      setInstitutionType(institutionTypes.includes(affiliation.institutionType as (typeof institutionTypes)[number]) ? (affiliation.institutionType as (typeof institutionTypes)[number]) : "COOPERATIVE");
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

    if (institutionType !== "NONE" && !organizationName.trim()) {
      setError("Enter the cooperative, SACCO, buyer, or institution name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const input: SaveAffiliationInput = {
        farmerId: params.farmerId,
        organizationName: institutionType === "NONE" ? "No formal affiliation" : organizationName.trim(),
        institutionType,
        active: institutionType === "NONE" ? false : active,
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
      await upsertCollectionSession(db, { farmerId: params.farmerId, currentStep: "farm" });
      router.push({ pathname: "/collect/farm", params: { farmerId: params.farmerId, dependsOn: operationUuid } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save membership");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label="Continue to farm profile" loading={saving} onPress={handleContinue} />}>
      <StepHeader
        eyebrow="Institutional link"
        title="Membership and market access"
        description="Capture the organization that can corroborate farmer activity, deliveries, statements, and payment history."
        step={3}
        total={8}
      />

      <SectionCard title="Affiliation type" description="Choose the strongest active relationship. If the farmer has none, select NONE and continue.">
        <ChoiceGroup label="Institution type" value={institutionType} options={institutionTypes} onChange={(value) => setInstitutionType(value as (typeof institutionTypes)[number])} required />
      </SectionCard>

      <SectionCard title="Organization details" description="These details support backend matching and evidence requests.">
        <TextField label="Organization name" required={institutionType !== "NONE"} value={organizationName} onChangeText={setOrganizationName} placeholder="Example: Githunguri Dairy Cooperative" />
        <TextField label="Member number" value={memberNumber} onChangeText={setMemberNumber} placeholder="Optional" />
        <TextField label="Branch or buying station" value={branch} onChangeText={setBranch} placeholder="Optional" />
        <TextField label="Collection centre" value={collectionCentre} onChangeText={setCollectionCentre} placeholder="Optional" />
        <TextField label="Membership start date" value={membershipStart} onChangeText={setMembershipStart} placeholder="YYYY-MM-DD" />
        <ToggleRow label="Active membership" description="Turn off only if the relationship is historical or inactive." value={active} onValueChange={setActive} />
      </SectionCard>

      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
