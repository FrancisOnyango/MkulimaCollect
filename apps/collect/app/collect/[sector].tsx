import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, FormScreen, Notice, PrimaryButton, SecondaryButton, SectionCard, StepHeader, TextField, ToggleRow } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { saveExpense, saveProductionObservation } from "@/features/production/productionRepository";
import { getSectorSchema } from "@/features/sectors/dairySchema";
import type { SectorField } from "@/features/sectors/types";

type FormValue = string | boolean | string[];

export default function SectorCollectionScreen() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ sector?: string; enterpriseId?: string; farmerId?: string }>();
  const sector = params.sector ?? "dairy";
  const schema = useMemo(() => getSectorSchema(sector), [sector]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [values, setValues] = useState<Record<string, FormValue>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const section = schema.sections[sectionIndex];
  const isLast = sectionIndex === schema.sections.length - 1;

  async function saveCurrentSection(nextSectionIndex?: number) {
    if (!params.enterpriseId || !section) {
      setError("Sector collection needs an enterprise link.");
      return;
    }

    const visibleFields = section.fields.filter((field) => isVisible(field, values));
    const missing = visibleFields.filter((field) => field.required && !hasValue(values[field.id]));

    if (missing.length) {
      setError(`Complete required fields: ${missing.map((field) => field.label).join(", ")}.`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = Object.fromEntries(visibleFields.map((field) => [field.id, values[field.id] ?? null]));

      await saveProductionObservation(db, {
        enterpriseId: params.enterpriseId,
        sector: schema.sector,
        schemaId: schema.id,
        schemaVersion: schema.version,
        section: section.id,
        payload,
      });

      if (section.id === "costs") {
        for (const field of section.fields) {
          const amount = Number(values[field.id]);

          if (Number.isFinite(amount) && amount > 0) {
            await saveExpense(db, {
              enterpriseId: params.enterpriseId,
              sector: schema.sector,
              category: field.id,
              amount,
              notes: field.label,
            });
          }
        }
      }

      if (typeof nextSectionIndex === "number") {
        setSectionIndex(nextSectionIndex);
      } else {
        router.replace({ pathname: "/collect/evidence-review", params: { farmerId: params.farmerId, enterpriseId: params.enterpriseId } });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save production response");
    } finally {
      setSaving(false);
    }
  }

  if (!section) {
    return (
      <FormScreen>
        <StepHeader eyebrow="Sector schema" title="No schema available" description="This sector does not have an active collection schema on this device." />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      footer={
        <View style={styles.footerRow}>
          <SecondaryButton label="Back" disabled={saving || sectionIndex === 0} onPress={() => setSectionIndex((current) => Math.max(0, current - 1))} />
          <View style={styles.footerButton}>
            <PrimaryButton label={isLast ? "Finish production" : "Save and next"} loading={saving} onPress={() => saveCurrentSection(isLast ? undefined : sectionIndex + 1)} />
          </View>
        </View>
      }
    >
      <StepHeader
        eyebrow={`Schema ${schema.id} v${schema.version}`}
        title={schema.title}
        description="Capture production, market, cost, health, asset, and evidence signals for this enterprise. Required fields are validated before each section is saved offline."
        step={sectionIndex + 1}
        total={schema.sections.length}
      />

      <SectionCard title={section.title} description={sectionDescription(section.id)}>
        {section.fields.filter((field) => isVisible(field, values)).map((field) => (
          <FieldInput key={field.id} field={field} value={values[field.id]} onChange={(value) => setValues((existing) => ({ ...existing, [field.id]: value }))} />
        ))}
      </SectionCard>

      {section.id === "evidence" ? <Notice title="Evidence prompts" message="This section records what evidence is expected. Actual photos and documents are attached in the evidence step after production capture." tone="warning" /> : null}
      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}

function FieldInput({ field, value, onChange }: { field: SectorField; value: FormValue | undefined; onChange(value: FormValue): void }) {
  if (field.type === "yes_no") {
    return <ToggleRow label={`${field.label}${field.required ? " *" : ""}`} value={value === true} onValueChange={onChange} />;
  }

  if (field.type === "single_choice") {
    return <ChoiceGroup label={field.label} required={field.required} value={typeof value === "string" ? value : undefined} options={field.options ?? []} onChange={(next) => onChange(next as string)} />;
  }

  if (field.type === "multiple_choice") {
    return <ChoiceGroup label={field.label} required={field.required} values={Array.isArray(value) ? value : []} options={field.options ?? []} multiple onChange={(next) => onChange(next as string[])} />;
  }

  if (field.type === "evidence") {
    return (
      <ToggleRow
        label={field.label}
        description="Mark this prompt when the farmer has this evidence available for capture or later upload."
        value={value === "available"}
        onValueChange={(available) => onChange(available ? "available" : "")}
      />
    );
  }

  return (
    <TextField
      label={field.label}
      required={field.required}
      helper={field.unit ? `Unit: ${field.unit}` : helperFor(field)}
      placeholder={placeholderFor(field)}
      value={typeof value === "string" ? value : ""}
      onChangeText={onChange}
      keyboardType={["integer", "decimal", "currency", "quantity"].includes(field.type) ? "decimal-pad" : "default"}
    />
  );
}

function isVisible(field: SectorField, values: Record<string, FormValue>) {
  if (!field.condition) {
    return true;
  }

  return values[field.condition.fieldId] === field.condition.equals;
}

function hasValue(value: FormValue | undefined) {
  return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "";
}

function placeholderFor(field: SectorField) {
  if (field.type === "currency") {
    return "KES";
  }

  if (field.type === "date") {
    return "YYYY-MM-DD";
  }

  return field.unit ? `Enter ${field.unit}` : "Enter response";
}

function helperFor(field: SectorField) {
  if (field.type === "text") {
    return "Use concise notes that an operations reviewer can verify later.";
  }

  return undefined;
}

function sectionDescription(sectionId: string) {
  switch (sectionId) {
    case "costs":
      return "Capture typical monthly or cycle costs. Positive values are also stored as expense records.";
    case "market":
    case "sales":
      return "Record buyer, price, delivery, and payment signals used for verification and scoring confidence.";
    case "evidence":
      return "Identify documents and photos that should be attached before profile submission.";
    default:
      return "Complete the strongest available production signals for this enterprise.";
  }
}

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
});
