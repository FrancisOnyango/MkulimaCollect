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

  const fieldStyle = {
    borderWidth: 1,
    borderColor: Colors.charcoal100,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.charcoal,
    backgroundColor: Colors.card,
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, justifyContent: "center", padding: 24 }}>
      <View style={{ marginBottom: 32 }}>
        <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.brand, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Text style={{ color: Colors.brandInk, fontSize: 20, fontWeight: "800" }}>M</Text>
        </View>
        <Text style={{ color: Colors.brand, fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>MkulimaScore</Text>
        <Text style={{ color: Colors.charcoal, fontSize: 32, fontWeight: "700", marginTop: 8 }}>MkulimaCollect</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 8, fontSize: 15 }}>Offline-first farmer evidence collection</Text>
        {environment !== "production" ? (
          <Text style={{ alignSelf: "flex-start", marginTop: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: "hidden", backgroundColor: Colors.amberBg, color: Colors.amberField, fontSize: 12, fontWeight: "700" }}>
            {environment === "preview" ? "STAGING" : "DEV MODE"}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: 14 }}>
        <View>
          <Text style={{ color: Colors.charcoal500, fontWeight: "600", marginBottom: 6, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" }}>Agent ID</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoading}
            keyboardType="email-address"
            onChangeText={setAgentId}
            style={fieldStyle}
            value={agentId}
          />
        </View>

        <View>
          <Text style={{ color: Colors.charcoal500, fontWeight: "600", marginBottom: 6, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" }}>Password or PIN</Text>
          <TextInput
            autoCapitalize="none"
            editable={!isLoading}
            onChangeText={setPassword}
            secureTextEntry
            style={fieldStyle}
            value={password}
          />
        </View>

        <View>
          <Text style={{ color: Colors.charcoal500, fontWeight: "600", marginBottom: 6, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" }}>Organization</Text>
          <TextInput
            autoCapitalize="none"
            editable={!isLoading}
            onChangeText={setOrgId}
            style={fieldStyle}
            value={orgId}
          />
        </View>

        {error ? <Text style={{ color: Colors.redField }}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={handleLogin}
          style={{ alignItems: "center", borderRadius: 999, backgroundColor: isLoading ? Colors.charcoal300 : Colors.brand, paddingVertical: 14, marginTop: 6 }}
        >
          {isLoading ? <ActivityIndicator color={Colors.brandInk} /> : <Text style={{ color: Colors.brandInk, fontWeight: "700", fontSize: 16 }}>Sign in</Text>}
        </Pressable>
      </View>

      <View style={{ marginTop: 28, borderRadius: 22, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, padding: 16 }}>
        <Text style={{ color: Colors.brand, fontWeight: "700" }}>Secure device mode</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>Tokens are stored in SecureStore. Farmer data stays in the local SQLite store for offline work.</Text>
      </View>
    </View>
  );
}
