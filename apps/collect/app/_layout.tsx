import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { APIProvider } from "@/components/providers/APIProvider";
import { DBProvider } from "@/components/providers/DBProvider";
import { Colors } from "@/constants/colors";
import { AppLockGate } from "@/features/auth/AppLockGate";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { getAppVersion } from "@/lib/appVersion";
import { initSentry } from "@/lib/sentry";
import "../global.css";

initSentry();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DBProvider>
          <APIProvider>
            <AuthProvider>
              <StatusBar style="dark" />
              <AppNavigator />
            </AuthProvider>
          </APIProvider>
        </DBProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, upgradeRequired, minSupportedVersion, logout } = useAuth();
  const inAuthGroup = segments[0] === "(auth)";

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [inAuthGroup, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface }}>
        <ActivityIndicator color={Colors.brand} />
        <Text style={{ color: Colors.charcoal500, marginTop: 12 }}>Restoring secure session</Text>
      </View>
    );
  }

  if (upgradeRequired) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: Colors.surface }}>
        <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Update required</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 10 }}>
          This device is on {getAppVersion()}. MkulimaScore now requires {minSupportedVersion ?? "a newer version"}.
        </Text>
        <Pressable accessibilityRole="button" onPress={() => { void logout(); }} style={{ alignItems: "center", borderRadius: 12, backgroundColor: Colors.brand, paddingVertical: 14, marginTop: 24 }}>
          <Text style={{ color: Colors.brandInk, fontWeight: "700" }}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  const stack = (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="collect" options={{ headerShown: false }} />
      <Stack.Screen name="farms" options={{ headerShown: false }} />
      <Stack.Screen name="enterprises" options={{ headerShown: false }} />
      <Stack.Screen name="evidence" options={{ headerShown: false }} />
      <Stack.Screen name="sync" options={{ headerShown: false }} />
      <Stack.Screen name="gps" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );

  return isAuthenticated ? <AppLockGate>{stack}</AppLockGate> : stack;
}
