import * as Crypto from "expo-crypto";
import { desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { syncAttempts } from "@/lib/db/schema";

export async function startSyncAttempt(db: AppDatabase, entryUuid: string, attemptNumber: number): Promise<string> {
  const id = Crypto.randomUUID();
  await db.insert(syncAttempts).values({
    id,
    entryUuid,
    attemptNumber,
    state: "STARTED",
    errorCode: null,
    errorMessage: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
  });
  return id;
}

export async function finishSyncAttempt(db: AppDatabase, id: string, state: "SYNCED" | "FAILED", errorMessage?: string): Promise<void> {
  await db
    .update(syncAttempts)
    .set({
      state,
      errorCode: errorMessage ? errorMessage.split(":")[0] : null,
      errorMessage: errorMessage ?? null,
      finishedAt: new Date().toISOString(),
    })
    .where(eq(syncAttempts.id, id));
}

export async function getRecentSyncAttempts(db: AppDatabase): Promise<(typeof syncAttempts.$inferSelect)[]> {
  return db.select().from(syncAttempts).orderBy(desc(syncAttempts.startedAt)).limit(20);
}
