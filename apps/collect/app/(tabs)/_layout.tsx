import { Tabs } from "expo-router";
import { CollectTabBar } from "@/components/ui/CollectTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CollectTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="farmers" options={{ title: "Farmers" }} />
      <Tabs.Screen name="tasks" options={{ title: "Work" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
