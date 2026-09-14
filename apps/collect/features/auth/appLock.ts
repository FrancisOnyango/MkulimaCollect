import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { AppState, type AppStateStatus } from "react-native";
import { sha256Text } from "@/lib/sha256";

const IDLE_LOCK_MS = 2 * 60 * 1000;
const PIN_KEY = "mkulima.lock.pin_hash";
let backgroundedAt: number | null = null;
let locked = true;

export async function shouldLockSession(): Promise<boolean> {
  if (!backgroundedAt) {
    return locked;
  }

  if (Date.now() - backgroundedAt >= IDLE_LOCK_MS) {
    locked = true;
  }

  return locked;
}

export function markSessionUnlocked(): void {
  locked = false;
  backgroundedAt = null;
}

export function handleAppStateChange(nextState: AppStateStatus): void {
  if (nextState === "background" || nextState === "inactive") {
    backgroundedAt = Date.now();
    return;
  }

  if (nextState === "active" && backgroundedAt && Date.now() - backgroundedAt >= IDLE_LOCK_MS) {
    locked = true;
  }
}

export function subscribeAppLock(onChange: () => void): () => void {
  const sub = AppState.addEventListener("change", (state) => {
    handleAppStateChange(state);
    onChange();
  });
  return () => sub.remove();
}

export async function hasHardwareLock(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
  return enrolled;
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock MkulimaCollect",
    cancelLabel: "Use PIN",
    disableDeviceFallback: false,
  });
  if (result.success) {
    markSessionUnlocked();
  }
  return result.success;
}

export async function hasPinLock(): Promise<boolean> {
  return Boolean(await SecureStore.getItemAsync(PIN_KEY));
}

export async function setPinLock(pin: string): Promise<void> {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error("PIN must be 4 to 6 digits.");
  }
  await SecureStore.setItemAsync(PIN_KEY, sha256Text(`mkulima-lock:${pin}`));
}

export async function verifyPinLock(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored) {
    return false;
  }
  const ok = stored === sha256Text(`mkulima-lock:${pin}`);
  if (ok) {
    markSessionUnlocked();
  }
  return ok;
}

export async function clearPinLock(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}
