import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { appMetadata } from "@/lib/db/schema";

// Uses app_metadata table as a lightweight lock store.
const LOCK_KEY = "sync_engine_lock";
const LOCK_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes — consider longer on slow networks

export async function acquireSyncLock(db: AppDatabase): Promise<boolean> {
  const now = new Date();
  const rows = await db.select().from(appMetadata).where(eq(appMetadata.key, LOCK_KEY)).limit(1);
  const existing = rows[0];

  if (!existing) {
    await db.insert(appMetadata).values({ key: LOCK_KEY, value: now.toISOString(), updatedAt: now.toISOString() });
    return true;
  }

  const existingTs = new Date(existing.value);
  if (Date.now() - existingTs.getTime() > LOCK_TIMEOUT_MS) {
    // stale lock: overwrite
    await db.update(appMetadata).set({ value: now.toISOString(), updatedAt: now.toISOString() }).where(eq(appMetadata.key, LOCK_KEY));
    return true;
  }

  return false;
}

export async function releaseSyncLock(db: AppDatabase): Promise<void> {
  const now = new Date().toISOString();
  await db.update(appMetadata).set({ value: "", updatedAt: now }).where(eq(appMetadata.key, LOCK_KEY));
}
