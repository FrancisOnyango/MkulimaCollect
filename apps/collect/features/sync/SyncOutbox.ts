import * as Crypto from "expo-crypto";
import { and, asc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { SyncState, type SyncStateValue } from "@/constants/syncStates";
import type { AppDatabase } from "@/lib/db/database";
import { syncOutbox } from "@/lib/db/schema";
import type { CreateOutboxEntryInput, SyncOutboxEntry } from "./types";
import { recordMetric } from "@/lib/metrics";

type OutboxWriter = {
  insert: AppDatabase["insert"];
};

const retryBackoffMs = [30_000, 120_000, 300_000, 900_000, 1_800_000, 3_600_000];

export function buildOutboxRow(input: CreateOutboxEntryInput) {
  const now = new Date().toISOString();
  const operationUuid = input.operationUuid ?? Crypto.randomUUID();

  return {
    entryUuid: Crypto.randomUUID(),
    operationUuid,
    entityType: input.entityType,
    entityId: input.entityId,
    mutationType: input.mutationType,
    payload: JSON.stringify(input.payload),
    dependsOn: JSON.stringify(input.dependsOn ?? []),
    localVersion: input.localVersion ?? 1,
    serverBaseline: input.serverBaseline ?? null,
    retryCount: 0,
    state: input.state ?? SyncState.PENDING_SYNC,
    lastError: null,
    nextRetryAt: null,
    createdAt: now,
    syncedAt: null,
  };
}

export async function enqueueOutboxEntry(writer: OutboxWriter, input: CreateOutboxEntryInput): Promise<string> {
  const row = buildOutboxRow(input);
  Sentry.addBreadcrumb({ category: 'sync', message: `enqueue ${row.entryUuid}`, data: { entityType: row.entityType, entityId: row.entityId } });
  recordMetric('outbox.enqueue', 1, { entity: row.entityType });
  await writer.insert(syncOutbox).values(row);
  return row.operationUuid;
}

export async function getPendingEntries(db: AppDatabase, now = new Date()): Promise<SyncOutboxEntry[]> {
  const rows = await db
    .select()
    .from(syncOutbox)
    .where(
      or(
        eq(syncOutbox.state, SyncState.PENDING_SYNC),
        and(eq(syncOutbox.state, SyncState.RETRY), or(isNull(syncOutbox.nextRetryAt), lte(syncOutbox.nextRetryAt, now.toISOString()))),
      ),
    )
    .orderBy(asc(syncOutbox.createdAt));

  const syncedRows = await db.select({ operationUuid: syncOutbox.operationUuid }).from(syncOutbox).where(eq(syncOutbox.state, SyncState.SYNCED));
  const syncedOperations = new Set(syncedRows.map((row) => row.operationUuid));

  return rows.map(parseOutboxRow).filter((entry) => entry.dependsOn.every((operationUuid) => syncedOperations.has(operationUuid)));
}

export async function markSyncing(db: AppDatabase, entryUuid: string): Promise<void> {
  await db.update(syncOutbox).set({ state: SyncState.SYNCING, lastError: null }).where(eq(syncOutbox.entryUuid, entryUuid));
}

export async function markSynced(db: AppDatabase, entryUuid: string, syncedAt = new Date().toISOString()): Promise<void> {
  await db.update(syncOutbox).set({ state: SyncState.SYNCED, syncedAt, lastError: null, nextRetryAt: null }).where(eq(syncOutbox.entryUuid, entryUuid));
}

import * as Sentry from "@sentry/react";

export async function markRetry(db: AppDatabase, entryUuid: string, nextRetryCount: number, error: string): Promise<void> {
  const fallbackDelayMs = retryBackoffMs[retryBackoffMs.length - 1] ?? 3_600_000;
  const delayMs = retryBackoffMs[Math.min(nextRetryCount - 1, retryBackoffMs.length - 1)] ?? fallbackDelayMs;
  const failed = nextRetryCount >= 10;

  Sentry.addBreadcrumb({ category: 'sync', message: `mark-retry ${entryUuid}`, data: { retryCount: nextRetryCount, error } });

  await db
    .update(syncOutbox)
    .set({
      state: failed ? SyncState.FAILED_PERMANENTLY : SyncState.RETRY,
      retryCount: nextRetryCount,
      lastError: error,
      nextRetryAt: failed ? null : new Date(Date.now() + delayMs).toISOString(),
    })
    .where(eq(syncOutbox.entryUuid, entryUuid));
}

export async function getOutboxCounts(db: AppDatabase): Promise<Record<SyncStateValue, number>> {
  const rows = await db.select({ state: syncOutbox.state }).from(syncOutbox);
  const counts: Record<SyncStateValue, number> = {
    LOCAL_DRAFT: 0,
    PENDING_SYNC: 0,
    SYNCING: 0,
    SYNCED: 0,
    RETRY: 0,
    CONFLICT: 0,
    FAILED_PERMANENTLY: 0,
  };

  for (const row of rows) {
    const state = row.state as SyncStateValue;
    counts[state] += 1;
  }

  return counts;
}

export async function getEntryByOperationUuid(db: AppDatabase, operationUuid: string): Promise<SyncOutboxEntry | null> {
  const rows = await db.select().from(syncOutbox).where(eq(syncOutbox.operationUuid, operationUuid)).limit(1);
  return rows[0] ? parseOutboxRow(rows[0]) : null;
}

export async function getEntriesByState(db: AppDatabase, states: SyncStateValue[]): Promise<SyncOutboxEntry[]> {
  if (states.length === 0) {
    return [];
  }

  const rows = await db.select().from(syncOutbox).where(inArray(syncOutbox.state, states)).orderBy(asc(syncOutbox.createdAt));
  return rows.map(parseOutboxRow);
}

function parseOutboxRow(row: typeof syncOutbox.$inferSelect): SyncOutboxEntry {
  return {
    ...row,
    entityType: row.entityType as SyncOutboxEntry["entityType"],
    mutationType: row.mutationType as SyncOutboxEntry["mutationType"],
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    dependsOn: JSON.parse(row.dependsOn) as string[],
    serverBaseline: row.serverBaseline ?? null,
    state: row.state as SyncStateValue,
  };
}
