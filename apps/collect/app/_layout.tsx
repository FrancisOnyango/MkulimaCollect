import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { APIProvider } from "@/components/providers/APIProvider";
import { DBProvider } from "@/components/providers/DBProvider";
import { Colors } from "@/constants/colors";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import "../global.css";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DBProvider>
          <APIProvider>
            <AuthProvider>
              <StatusBar style="auto" />
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
  const { isAuthenticated, isLoading } = useAuth();
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

  return (
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
}
