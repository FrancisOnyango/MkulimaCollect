import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Colors } from "@/constants/colors";
import {
  authenticateWithBiometrics,
  hasHardwareLock,
  hasPinLock,
  setPinLock,
  shouldLockSession,
  subscribeAppLock,
  verifyPinLock,
} from "./appLock";

export function AppLockGate({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [locked, setLocked] = useState(true);
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refreshLock();
    return subscribeAppLock(() => {
      void refreshLock();
    });
  }, []);

  async function refreshLock() {
    const shouldLock = await shouldLockSession();
    const pinExists = await hasPinLock();
    setNeedsPinSetup(!pinExists);
    setLocked(shouldLock || !pinExists);
    setChecking(false);
  }

  async function unlockWithBiometrics() {
    setBusy(true);
    setError(null);
    try {
      const ok = await authenticateWithBiometrics();
      if (ok) {
        setLocked(false);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Biometric unlock failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitPin() {
    setBusy(true);
    setError(null);
    try {
      if (needsPinSetup) {
        await setPinLock(pin);
        setNeedsPinSetup(false);
        setLocked(false);
        setPin("");
        return;
      }

      const ok = await verifyPinLock(pin);
      if (!ok) {
        setError("Incorrect PIN.");
        return;
      }
      setLocked(false);
      setPin("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "PIN unlock failed");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface }}>
        <ActivityIndicator color={Colors.brand} />
      </View>
    );
  }

  if (!locked) {
    return children;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: Colors.surface }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>{needsPinSetup ? "Set device PIN" : "Unlock device"}</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>
        {needsPinSetup
          ? "Create a 4-6 digit PIN. It stays on this device and unlocks farmer records after idle timeout."
          : "Unlock with biometrics or PIN before viewing farmer data."}
      </Text>
      <TextInput
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={setPin}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginTop: 18, backgroundColor: Colors.card, color: Colors.charcoal }}
        value={pin}
        placeholder="PIN"
      />
      {error ? <Text style={{ color: Colors.redField, marginTop: 10 }}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => {
          void submitPin();
        }}
        style={{ alignItems: "center", borderRadius: 999, backgroundColor: Colors.brand, paddingVertical: 14, marginTop: 16 }}
      >
        <Text style={{ color: Colors.brandInk, fontWeight: "700" }}>{needsPinSetup ? "Save PIN" : "Unlock with PIN"}</Text>
      </Pressable>
      <BiometricButton disabled={busy || needsPinSetup} onPress={unlockWithBiometrics} />
    </View>
  );
}

function BiometricButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    void hasHardwareLock().then(setAvailable);
  }, []);

  if (!available) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{ alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: Colors.charcoal100, paddingVertical: 14, marginTop: 12 }}
    >
      <Text style={{ color: Colors.charcoal700, fontWeight: "700" }}>Use biometrics</Text>
    </Pressable>
  );
}
