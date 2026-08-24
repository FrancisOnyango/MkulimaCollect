import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
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

    const missing = section.fields.filter((field) => field.required && isVisible(field, values) && !hasValue(values[field.id]));

    if (missing.length) {
      setError(`Missing required: ${missing.map((field) => field.label).join(", ")}`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = Object.fromEntries(section.fields.filter((field) => isVisible(field, values)).map((field) => [field.id, values[field.id] ?? null]));

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
      <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 24 }}>
        <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>No schema</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.surface }} contentContainerStyle={{ padding: 18 }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>{schema.title}</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>Schema {schema.id} v{schema.version}</Text>
      <View style={progressStyle}>
        <Text style={{ color: Colors.brandDark, fontWeight: "700" }}>{section.title}</Text>
        <Text style={{ color: Colors.charcoal500 }}>{sectionIndex + 1} of {schema.sections.length}</Text>
      </View>
      {section.fields.filter((field) => isVisible(field, values)).map((field) => (
        <FieldInput key={field.id} field={field} value={values[field.id]} onChange={(value) => setValues((existing) => ({ ...existing, [field.id]: value }))} />
      ))}
      {error ? <Text style={{ color: Colors.redField, marginTop: 14 }}>{error}</Text> : null}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
        <Pressable
          accessibilityRole="button"
          disabled={saving || sectionIndex === 0}
          onPress={() => setSectionIndex((current) => Math.max(0, current - 1))}
          style={{ ...navButtonStyle, backgroundColor: sectionIndex === 0 ? Colors.charcoal300 : Colors.charcoal700 }}
        >
          <Text style={buttonTextStyle}>Back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => saveCurrentSection(isLast ? undefined : sectionIndex + 1)}
          style={{ ...navButtonStyle, backgroundColor: saving ? Colors.charcoal300 : Colors.brand }}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text style={buttonTextStyle}>{isLast ? "Finish production" : "Save and next"}</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function FieldInput({ field, value, onChange }: { field: SectorField; value: FormValue | undefined; onChange(value: FormValue): void }) {
  if (field.type === "yes_no") {
    return (
      <View style={switchRowStyle}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>{field.label}{field.required ? " *" : ""}</Text>
        <Switch value={value === true} onValueChange={onChange} />
      </View>
    );
  }

  if (field.type === "single_choice" || field.type === "multiple_choice") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <View style={fieldBlockStyle}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>{field.label}{field.required ? " *" : ""}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {field.options?.map((option) => {
            const active = field.type === "single_choice" ? value === option : selected.includes(option);
            return (
              <Pressable
                accessibilityRole="button"
                key={option}
                onPress={() => {
                  if (field.type === "single_choice") {
                    onChange(option);
                  } else {
                    onChange(active ? selected.filter((item) => item !== option) : [...selected, option]);
                  }
                }}
                style={{ borderRadius: 10, borderWidth: 1, borderColor: active ? Colors.brand : Colors.charcoal100, backgroundColor: active ? Colors.brandLight : "white", paddingHorizontal: 12, paddingVertical: 10 }}
              >
                <Text style={{ color: active ? Colors.brandDark : Colors.charcoal700, fontWeight: "700" }}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (field.type === "evidence") {
    return (
      <Pressable accessibilityRole="button" onPress={() => onChange("requested")} style={fieldBlockStyle}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>{field.label}</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>Evidence prompt recorded. Add images from the Evidence step.</Text>
      </Pressable>
    );
  }

  return (
    <TextInput
      keyboardType={["integer", "decimal", "currency", "quantity"].includes(field.type) ? "decimal-pad" : "default"}
      placeholder={`${field.label}${field.unit ? ` (${field.unit})` : ""}${field.required ? " *" : ""}`}
      value={typeof value === "string" ? value : ""}
      onChangeText={onChange}
      style={inputStyle}
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

const progressStyle = { backgroundColor: Colors.brandLight, borderRadius: 12, padding: 14, marginTop: 16, flexDirection: "row" as const, justifyContent: "space-between" as const };
const fieldBlockStyle = { backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginTop: 14 };
const switchRowStyle = { ...fieldBlockStyle, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const };
const inputStyle = { borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: Colors.charcoal, backgroundColor: "white", marginTop: 14 };
const navButtonStyle = { flex: 1, alignItems: "center" as const, borderRadius: 12, paddingVertical: 14 };
const buttonTextStyle = { color: "white", fontWeight: "700" as const };
