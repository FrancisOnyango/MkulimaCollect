import * as Crypto from "expo-crypto";
import type { MkulimaScoreApi } from "@/lib/api/ApiClient";
import type { AuthResult } from "@/lib/api/types";
import { SecureTokenStore } from "./SecureTokenStore";

export type Session = AuthResult;

export async function getDeviceId(): Promise<string> {
  const existing = await SecureTokenStore.getDeviceId();

  if (existing) {
    return existing;
  }

  const next = Crypto.randomUUID();
  await SecureTokenStore.setDeviceId(next);
  return next;
}

export async function getStoredSession(): Promise<Session | null> {
  const sessionJson = await SecureTokenStore.getSessionJson();

  if (!sessionJson) {
    return null;
  }

  try {
    return JSON.parse(sessionJson) as Session;
  } catch {
    await clearSession();
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const session = await getStoredSession();

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now() && !session.refreshToken) {
    await clearSession();
    return null;
  }

  return session;
}

export async function setSession(session: Session): Promise<void> {
  await Promise.all([
    SecureTokenStore.setAccessToken(session.accessToken),
    session.refreshToken ? SecureTokenStore.setRefreshToken(session.refreshToken) : Promise.resolve(),
    SecureTokenStore.setSessionJson(JSON.stringify(session)),
  ]);
}

export async function clearSession(): Promise<void> {
  await SecureTokenStore.clear();
}

export function isExpired(session: Session): boolean {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

export function isExpiringSoon(session: Session): boolean {
  return new Date(session.expiresAt).getTime() - Date.now() < 5 * 60 * 1000;
}

export async function refreshIfNeeded(api: MkulimaScoreApi, session: Session): Promise<Session> {
  if (!isExpired(session) && !isExpiringSoon(session)) {
    return session;
  }

  const refreshed = await api.refreshSession(session.refreshToken);
  await setSession(refreshed);
  return refreshed;
}
