import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField } from "@/components/ui/FormKit";
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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!farmerId || (!fullLegalName.trim() && !firstName.trim())) {
      setError("Enter at least a full legal name or first name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const operationUuid = await saveIdentity(db, {
        farmerId,
        fullLegalName: fullLegalName.trim(),
        firstName: firstName.trim(),
        surname: surname.trim(),
        primaryPhoneLast4: phoneNumber.trim().slice(-4) || undefined,
        nationalIdType: nationalId.trim() ? "NATIONAL_ID" : undefined,
        nationalIdLast3: nationalId.trim().slice(-3) || undefined,
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
    <FormScreen footer={<PrimaryButton label="Continue to membership" loading={saving} onPress={handleContinue} />}>
      <StepHeader
        eyebrow="Farmer profile"
        title="Identity details"
        description="Capture the name exactly as it should appear in institutional records. Optional identifiers help reconciliation during backend validation."
        step={2}
        total={8}
      />

      <SectionCard title="Legal name" description="Use the farmer's official names where available. These fields form the first matching signal for MkulimaScore ingestion.">
        <TextField label="Full legal name" required value={fullLegalName} onChangeText={setFullLegalName} placeholder="Example: Grace Wanjiku Mwangi" />
        <TextField label="First name" value={firstName} onChangeText={setFirstName} placeholder="Grace" />
        <TextField label="Surname" value={surname} onChangeText={setSurname} placeholder="Mwangi" />
      </SectionCard>

      <SectionCard title="Matching references" description="Optional today, but valuable for deduplication and later credit/payment verification.">
        <TextField label="Primary phone number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholder="07xx xxx xxx" />
        <TextField label="National ID or registration number" value={nationalId} onChangeText={setNationalId} keyboardType="number-pad" placeholder="Optional" />
      </SectionCard>

      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
