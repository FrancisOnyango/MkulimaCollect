import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";

// Uses app_metadata table as a lightweight lock store.
const LOCK_KEY = "sync_engine_lock";
const LOCK_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes — consider longer on slow networks

export async function acquireSyncLock(db: AppDatabase): Promise<boolean> {
  const now = new Date();
  const rows = await db.select().from("app_metadata").where(eq("key", LOCK_KEY)).limit(1);

  if (rows.length === 0) {
    await db.insert("app_metadata").values({ key: LOCK_KEY, value: now.toISOString(), updated_at: now.toISOString() });
    return true;
  }

  const existing = rows[0];
  const existingTs = new Date(existing.value);
  if (Date.now() - existingTs.getTime() > LOCK_TIMEOUT_MS) {
    // stale lock: overwrite
    await db.update("app_metadata").set({ value: now.toISOString(), updated_at: now.toISOString() }).where(eq("key", LOCK_KEY));
    return true;
  }

  return false;
}

export async function releaseSyncLock(db: AppDatabase): Promise<void> {
  const now = new Date().toISOString();
  await db.update("app_metadata").set({ value: "", updated_at: now }).where(eq("key", LOCK_KEY));
}
