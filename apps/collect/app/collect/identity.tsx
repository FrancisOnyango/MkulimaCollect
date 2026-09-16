import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { saveIdentity } from "@/features/farmers/identityRepository";
import { upsertCollectionSession } from "@/features/farmers/collectionSessionRepository";
import { hashIdentifier, lastDigits } from "@/lib/pii";

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
      const compactId = nationalId.trim();
      const compactPhone = phoneNumber.trim();
      const operationUuid = await saveIdentity(db, {
        farmerId,
        fullLegalName: fullLegalName.trim(),
        firstName: firstName.trim(),
        surname: surname.trim(),
        primaryPhoneHash: compactPhone ? hashIdentifier(compactPhone, "phone") : undefined,
        primaryPhoneLast4: compactPhone ? lastDigits(compactPhone, 4) : undefined,
        nationalIdType: compactId ? "NATIONAL_ID" : undefined,
        nationalIdHash: compactId ? hashIdentifier(compactId, "national-id") : undefined,
        nationalIdLast3: compactId ? lastDigits(compactId, 3) : undefined,
        dependsOn,
      });

      await upsertCollectionSession(db, { farmerId, currentStep: "household" });
      router.push({ pathname: "/collect/household", params: { farmerId, dependsOn: operationUuid } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save identity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label="Continue to household" loading={saving} onPress={handleContinue} />}>
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
        <TextField label="National ID or registration number" value={nationalId} onChangeText={setNationalId} keyboardType="number-pad" placeholder="Hashed on device. Only last 3 digits are stored." />
      </SectionCard>

      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
