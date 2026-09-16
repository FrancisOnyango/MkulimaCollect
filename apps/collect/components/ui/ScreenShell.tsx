import type { ReactNode } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export function usePhoneLayout() {
  const { width, height } = useWindowDimensions();
  const compact = width < 380;
  return {
    width,
    height,
    compact,
    short: height < 720,
    pad: compact ? 14 : 18,
    titleSize: compact ? 24 : 28,
  };
}

export function ScreenShell({
  children,
  padded = true,
}: {
  children: ReactNode;
  padded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { pad } = usePhoneLayout();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.surface,
        paddingTop: Math.max(insets.top, 8),
        paddingHorizontal: padded ? pad : 0,
      }}
    >
      {children}
    </View>
  );
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  const { compact, titleSize } = usePhoneLayout();

  return (
    <View style={{ paddingBottom: 12, paddingTop: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.card,
                borderWidth: 1,
                borderColor: Colors.charcoal100,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: Colors.charcoal, fontSize: 18, fontWeight: "700" }}>‹</Text>
            </Pressable>
          ) : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: Colors.charcoal, fontSize: titleSize, fontWeight: "800", lineHeight: titleSize + 4 }} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={{ color: Colors.charcoal500, marginTop: 4, fontSize: compact ? 13 : 14 }} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {action}
      </View>
    </View>
  );
}

export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        backgroundColor: active ? Colors.brand : Colors.card,
        borderColor: active ? Colors.brand : Colors.charcoal100,
        borderRadius: 999,
        borderWidth: 1,
        minHeight: 34,
        justifyContent: "center",
        paddingHorizontal: 14,
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: active ? Colors.brandInk : Colors.charcoal500, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
