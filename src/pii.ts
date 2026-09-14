function normalizeIdentifier(value: string, kind: "national-id" | "phone"): string {
  return kind === "phone" ? value.replace(/\D+/g, "") : value.replace(/\s+/g, "").trim().toUpperCase()
}

export function lastDigits(value: string, count: number): string {
  return value.replace(/\s+/g, "").trim().slice(-count)
}

export async function hashIdentifier(value: string, kind: "national-id" | "phone"): Promise<string> {
  const pepper = "mkulimacollect-id-v1"
  const data = new TextEncoder().encode(`${pepper}:${kind}:${normalizeIdentifier(value, kind)}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}
