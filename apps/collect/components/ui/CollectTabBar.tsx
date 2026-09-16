import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

const tabs: { name: string; label: string; icon: string }[] = [
  { name: "index", label: "Home", icon: "⌂" },
  { name: "farmers", label: "Farmers", icon: "☺" },
  { name: "tasks", label: "Work", icon: "✓" },
  { name: "more", label: "More", icon: "⋯" },
];

export function CollectTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const left = tabs.slice(0, 2);
  const right = tabs.slice(2);

  function open(routeName: string, index: number) {
    const route = state.routes[index];
    if (!route) {
      return;
    }
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  }

  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 10),
      }}
    >
      <View
        style={{
          alignItems: "center",
          backgroundColor: Colors.card,
          borderColor: Colors.charcoal100,
          borderRadius: 999,
          borderWidth: 1,
          flexDirection: "row",
          minHeight: 64,
          paddingHorizontal: 6,
          paddingVertical: 6,
        }}
      >
        {left.map((tab) => {
          const index = state.routes.findIndex((route) => route.name === tab.name);
          return (
            <TabButton
              key={tab.name}
              icon={tab.icon}
              label={tab.label}
              active={state.index === index}
              onPress={() => open(tab.name, index)}
            />
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start collection"
          onPress={() => router.push("/collect")}
          style={{
            alignItems: "center",
            backgroundColor: Colors.brand,
            borderRadius: 999,
            height: 52,
            justifyContent: "center",
            marginHorizontal: 4,
            width: 52,
          }}
        >
          <Text style={{ color: Colors.brandInk, fontSize: 28, fontWeight: "400", lineHeight: 30 }}>+</Text>
        </Pressable>

        {right.map((tab) => {
          const index = state.routes.findIndex((route) => route.name === tab.name);
          return (
            <TabButton
              key={tab.name}
              icon={tab.icon}
              label={tab.label}
              active={state.index === index}
              onPress={() => open(tab.name, index)}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ alignItems: "center", flex: 1, justifyContent: "center", minHeight: 48, paddingVertical: 4 }}
    >
      <Text style={{ color: active ? Colors.brand : Colors.charcoal500, fontSize: 18, lineHeight: 20 }}>{icon}</Text>
      <Text
        style={{
          color: active ? Colors.brand : Colors.charcoal500,
          fontSize: 11,
          fontWeight: active ? "800" : "700",
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
