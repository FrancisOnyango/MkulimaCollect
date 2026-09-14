import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { appMetadata } from "@/lib/db/schema";

export const MetadataKey = {
  SYNC_CURSOR: "sync.cursor",
  MIN_SUPPORTED_VERSION: "bootstrap.min_supported_version",
  PII_PEPPER: "bootstrap.id_hash_pepper",
} as const;

export async function getMetadata(db: AppDatabase, key: string): Promise<string | null> {
  const rows = await db.select().from(appMetadata).where(eq(appMetadata.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function setMetadata(db: AppDatabase, key: string, value: string): Promise<void> {
  const now = new Date().toISOString();
  const existing = await getMetadata(db, key);

  if (existing === null) {
    await db.insert(appMetadata).values({ key, value, updatedAt: now });
    return;
  }

  await db.update(appMetadata).set({ value, updatedAt: now }).where(eq(appMetadata.key, key));
}
