import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Colors } from "@/constants/colors";

type FieldTone = "default" | "success" | "warning" | "danger";
type ChoiceOption<T extends string> = T | { label: string; value: T };

export function FormScreen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

export function StepHeader({
  eyebrow,
  title,
  description,
  step,
  total,
}: {
  eyebrow: string;
  title: string;
  description: string;
  step?: number;
  total?: number;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        {step && total ? <Text style={styles.stepPill}>Step {step}/{total}</Text> : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {step && total ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, (step / total) * 100))}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

export function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  helper,
  required,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText(value: string): void;
  placeholder?: string;
  helper?: string;
  required?: boolean;
  keyboardType?: "default" | "decimal-pad" | "number-pad" | "phone-pad" | "email-address";
}) {
  return (
    <View style={styles.field}>
      <Label label={label} required={required} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.charcoal300}
        keyboardType={keyboardType}
        style={styles.input}
      />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

export function ChoiceGroup<T extends string>({
  label,
  value,
  values,
  options,
  onChange,
  multiple,
  required,
}: {
  label: string;
  value?: T;
  values?: T[];
  options: readonly ChoiceOption<T>[];
  onChange(value: T | T[]): void;
  multiple?: boolean;
  required?: boolean;
}) {
  const selected = values ?? [];

  return (
    <View style={styles.field}>
      <Label label={label} required={required} />
      <View style={styles.choiceWrap}>
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;
          const active = multiple ? selected.includes(optionValue) : value === optionValue;
          return (
            <Pressable
              accessibilityRole={multiple ? "checkbox" : "button"}
              accessibilityState={{ checked: active }}
              key={optionValue}
              onPress={() => {
                if (multiple) {
                  onChange(active ? selected.filter((item) => item !== optionValue) : [...selected, optionValue]);
                } else {
                  onChange(optionValue);
                }
              }}
              style={[styles.choice, active ? styles.choiceActive : null]}
            >
              <Text style={[styles.choiceText, active ? styles.choiceTextActive : null]}>{optionLabel}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ToggleRow({ label, description, value, onValueChange }: { label: string; description?: string; value: boolean; onValueChange(value: boolean): void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDescription}>{description}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: Colors.charcoal100, true: Colors.brand }} thumbColor={Colors.brandInk} />
    </View>
  );
}

export function Notice({ title, message, tone = "default" }: { title: string; message?: string; tone?: FieldTone }) {
  return (
    <View style={[styles.notice, tone === "success" ? styles.noticeSuccess : tone === "warning" ? styles.noticeWarning : tone === "danger" ? styles.noticeDanger : null]}>
      <Text style={[styles.noticeTitle, tone === "danger" ? styles.noticeDangerText : null]}>{title}</Text>
      {message ? <Text style={styles.noticeMessage}>{message}</Text> : null}
    </View>
  );
}

export function PrimaryButton({ label, onPress, loading, disabled }: { label: string; onPress(): void; loading?: boolean; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} style={[styles.primaryButton, disabled || loading ? styles.buttonDisabled : null]}>
      {loading ? <ActivityIndicator color={Colors.brandInk} /> : <Text style={styles.primaryButtonText}>{label}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled }: { label: string; onPress(): void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.secondaryButton, disabled ? styles.secondaryDisabled : null]}>
      <Text style={[styles.secondaryButtonText, disabled ? styles.secondaryDisabledText : null]}>{label}</Text>
    </Pressable>
  );
}

export function FooterActions({ secondary, primary }: { secondary?: ReactNode; primary: ReactNode }) {
  return (
    <View style={styles.footerActions}>
      {secondary ? <View style={styles.footerSecondary}>{secondary}</View> : null}
      <View style={styles.footerPrimary}>{primary}</View>
    </View>
  );
}

export function DataRow({ label, value, tone = "default" }: { label: string; value: string; tone?: FieldTone }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={[styles.dataValue, tone === "success" ? styles.successText : tone === "warning" ? styles.warningText : tone === "danger" ? styles.dangerText : null]}>{value}</Text>
    </View>
  );
}

function Label({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  footer: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.charcoal100,
    borderTopWidth: 1,
    padding: 16,
  },
  header: {
    backgroundColor: Colors.ink,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: Colors.brandMid,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  stepPill: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    marginTop: 12,
  },
  description: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    height: 6,
    marginTop: 16,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: Colors.brand,
    borderRadius: 999,
    height: 6,
  },
  section: {
    backgroundColor: Colors.card,
    borderColor: Colors.charcoal100,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  sectionHeader: {
    borderBottomColor: Colors.charcoal100,
    borderBottomWidth: 1,
    marginBottom: 12,
    paddingBottom: 12,
  },
  sectionTitle: {
    color: Colors.charcoal,
    fontSize: 17,
    fontWeight: "700",
  },
  sectionDescription: {
    color: Colors.charcoal500,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  field: {
    marginTop: 12,
  },
  label: {
    color: Colors.charcoal700,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },
  required: {
    color: Colors.redField,
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.charcoal100,
    borderRadius: 16,
    borderWidth: 1,
    color: Colors.charcoal,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  helper: {
    color: Colors.charcoal500,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choice: {
    backgroundColor: Colors.surface,
    borderColor: Colors.charcoal100,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  choiceText: {
    color: Colors.charcoal700,
    fontSize: 13,
    fontWeight: "700",
  },
  choiceTextActive: {
    color: Colors.brandInk,
  },
  toggleRow: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.charcoal100,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 13,
  },
  toggleCopy: {
    flex: 1,
    paddingRight: 14,
  },
  toggleLabel: {
    color: Colors.charcoal,
    fontSize: 14,
    fontWeight: "700",
  },
  toggleDescription: {
    color: Colors.charcoal500,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  notice: {
    backgroundColor: Colors.brandMuted,
    borderColor: Colors.charcoal100,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 13,
  },
  noticeSuccess: {
    backgroundColor: Colors.brandLight,
    borderColor: Colors.brandMid,
  },
  noticeWarning: {
    backgroundColor: Colors.amberBg,
    borderColor: Colors.amberField,
  },
  noticeDanger: {
    backgroundColor: Colors.redBg,
    borderColor: Colors.redField,
  },
  noticeTitle: {
    color: Colors.charcoal,
    fontSize: 14,
    fontWeight: "700",
  },
  noticeDangerText: {
    color: Colors.redField,
  },
  noticeMessage: {
    color: Colors.charcoal700,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.brand,
    borderRadius: 999,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonDisabled: {
    backgroundColor: Colors.charcoal300,
  },
  primaryButtonText: {
    color: Colors.brandInk,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: Colors.card,
    borderColor: Colors.charcoal100,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  secondaryDisabled: {
    backgroundColor: Colors.charcoal50,
  },
  secondaryButtonText: {
    color: Colors.charcoal700,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryDisabledText: {
    color: Colors.charcoal300,
  },
  footerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  footerSecondary: {
    flex: 1,
  },
  footerPrimary: {
    flex: 1.4,
  },
  dataRow: {
    borderBottomColor: Colors.charcoal100,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  dataLabel: {
    color: Colors.charcoal500,
    flex: 1,
    fontSize: 13,
  },
  dataValue: {
    color: Colors.charcoal,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  successText: {
    color: Colors.brand,
  },
  warningText: {
    color: Colors.amberField,
  },
  dangerText: {
    color: Colors.redField,
  },
});
