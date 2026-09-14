import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField, ToggleRow } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { saveProductionObservation } from "@/features/production/productionRepository";

export default function FinancialStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; enterpriseId?: string; sector?: string; dependsOn?: string }>();
  const [incomeFrequency, setIncomeFrequency] = useState("Monthly");
  const [nonFarmIncome, setNonFarmIncome] = useState("");
  const [hasLoan, setHasLoan] = useState(false);
  const [lender, setLender] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [instalment, setInstalment] = useState("");
  const [mpesa, setMpesa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (hasLoan && (!lender.trim() || !loanAmount.trim())) {
      setError("Enter the lender and loan amount.");
      return;
    }

    if (params.enterpriseId && params.sector) {
      setSaving(true);
      setError(null);

      try {
        await saveProductionObservation(db, {
          enterpriseId: params.enterpriseId,
          sector: params.sector,
          schemaId: `${params.sector}-field-v2`,
          schemaVersion: "2.1.0",
          section: "financial",
          payload: {
            incomeFrequency,
            nonFarmIncome,
            hasLoan,
            lender,
            loanAmount,
            instalment,
            mpesaAuthorized: mpesa,
          },
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to save financial signals");
        setSaving(false);
        return;
      }

      setSaving(false);
    }

    router.push({ pathname: "/collect/evidence-review", params });
  }

  return (
    <FormScreen footer={<PrimaryButton label="Continue to required evidence" loading={saving} onPress={handleContinue} />}>
      <StepHeader
        eyebrow="Financial signals"
        title="Income and existing credit"
        description="Capture income frequency, non-farm income, and any current loans. Credit decisions stay on the server."
        step={8}
        total={9}
      />

      <SectionCard title="Income" description="Use the strongest available farmer-reported figures.">
        <ChoiceGroup
          label="Income frequency"
          value={incomeFrequency}
          options={["Daily", "Weekly", "Monthly", "Per season", "Annual"]}
          onChange={(value) => setIncomeFrequency(value as string)}
          required
        />
        <TextField label="Non-farm income (KES / month)" value={nonFarmIncome} onChangeText={setNonFarmIncome} keyboardType="decimal-pad" placeholder="Optional" />
      </SectionCard>

      <SectionCard title="Existing loans">
        <ToggleRow label="Farmer has an active loan" value={hasLoan} onValueChange={setHasLoan} />
        {hasLoan ? (
          <>
            <TextField label="Lender" required value={lender} onChangeText={setLender} placeholder="SACCO, bank, or buyer" />
            <TextField label="Outstanding amount (KES)" required value={loanAmount} onChangeText={setLoanAmount} keyboardType="decimal-pad" />
            <TextField label="Monthly instalment (KES)" value={instalment} onChangeText={setInstalment} keyboardType="decimal-pad" />
          </>
        ) : null}
      </SectionCard>

      <SectionCard title="M-PESA">
        <ToggleRow
          label="Farmer authorizes M-PESA statement review"
          description="The statement is uploaded later. It is not parsed on this device."
          value={mpesa}
          onValueChange={setMpesa}
        />
      </SectionCard>

      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
