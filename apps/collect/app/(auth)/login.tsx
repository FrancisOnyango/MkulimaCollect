import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { useApiClient } from "@/components/providers/APIProvider";
import { useAuth } from "@/features/auth/AuthProvider";

export default function LoginScreen() {
  const { environment } = useApiClient();
  const { login, isLoading } = useAuth();
  const [agentId, setAgentId] = useState("francis.o@mkulima");
  const [password, setPassword] = useState("dev-password");
  const [orgId, setOrgId] = useState("kiambu-sacco-network");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);

    try {
      await login({ agentId, password, orgId });
      router.replace("/(tabs)");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, justifyContent: "center", padding: 24 }}>
      <View style={{ marginBottom: 32 }}>
        <Text style={{ color: Colors.brand, fontSize: 30, fontWeight: "700" }}>MkulimaCollect</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 8, fontSize: 15 }}>Offline-first farmer evidence collection</Text>
        {environment !== "production" ? (
          <Text style={{ alignSelf: "flex-start", marginTop: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: "hidden", backgroundColor: Colors.amberBg, color: Colors.amberField, fontSize: 12, fontWeight: "700" }}>
            DEV MODE
          </Text>
        ) : null}
      </View>

      <View style={{ gap: 14 }}>
        <View>
          <Text style={{ color: Colors.charcoal700, fontWeight: "600", marginBottom: 6 }}>Agent ID</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoading}
            keyboardType="email-address"
            onChangeText={setAgentId}
            style={{ borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: Colors.charcoal, backgroundColor: "white" }}
            value={agentId}
          />
        </View>

        <View>
          <Text style={{ color: Colors.charcoal700, fontWeight: "600", marginBottom: 6 }}>Password or PIN</Text>
          <TextInput
            autoCapitalize="none"
            editable={!isLoading}
            onChangeText={setPassword}
            secureTextEntry
            style={{ borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: Colors.charcoal, backgroundColor: "white" }}
            value={password}
          />
        </View>

        <View>
          <Text style={{ color: Colors.charcoal700, fontWeight: "600", marginBottom: 6 }}>Organization</Text>
          <TextInput
            autoCapitalize="none"
            editable={!isLoading}
            onChangeText={setOrgId}
            style={{ borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: Colors.charcoal, backgroundColor: "white" }}
            value={orgId}
          />
        </View>

        {error ? <Text style={{ color: Colors.redField }}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={handleLogin}
          style={{ alignItems: "center", borderRadius: 12, backgroundColor: isLoading ? Colors.charcoal300 : Colors.brand, paddingVertical: 14, marginTop: 6 }}
        >
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Sign in</Text>}
        </Pressable>
      </View>

      <View style={{ marginTop: 28, borderRadius: 12, backgroundColor: Colors.brandMuted, padding: 16 }}>
        <Text style={{ color: Colors.brandDark, fontWeight: "700" }}>Secure device mode</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>Tokens are stored in SecureStore. Farmer data stays in the local SQLite store for offline work.</Text>
      </View>
    </View>
  );
}
