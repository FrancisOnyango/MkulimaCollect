import { sha256Text } from "./sha256";

const APP_PEPPER = "mkulimacollect-id-v1";

export function normalizeIdentifier(value: string): string {
  return value.replace(/\s+/g, "").trim().toUpperCase();
}

export function lastDigits(value: string, count: number): string {
  const compact = value.replace(/\s+/g, "").trim();
  return compact.slice(-count);
}

export function getPiiPepper(): string {
  const fromEnv = process.env.EXPO_PUBLIC_PII_PEPPER?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : APP_PEPPER;
}

export function hashIdentifier(value: string, kind: "national-id" | "phone", pepper = getPiiPepper()): string {
  const normalized = kind === "phone" ? value.replace(/\D+/g, "") : normalizeIdentifier(value);
  return sha256Text(`${pepper}:${kind}:${normalized}`);
}
