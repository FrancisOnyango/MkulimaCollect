import * as Crypto from "expo-crypto";
import { desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { syncAttempts } from "@/lib/db/schema";
import * as Sentry from "@sentry/react";
import { recordMetric } from "@/metrics";

export async function startSyncAttempt(db: AppDatabase, entryUuid: string, attemptNumber: number): Promise<string> {
  const id = Crypto.randomUUID();
  Sentry.addBreadcrumb({ category: 'sync', message: `start-attempt ${id}`, data: { entryUuid, attemptNumber } });
  recordMetric('sync.attempt.start', 1);

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
  Sentry.addBreadcrumb({ category: 'sync', message: `finish-attempt ${id}`, data: { state, errorMessage } });
  recordMetric(state === 'SYNCED' ? 'sync.attempt.succeed' : 'sync.attempt.fail', 1);

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
