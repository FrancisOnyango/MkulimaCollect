import type { MkulimaScoreApi } from "@/lib/api/ApiClient";
import type { AppDatabase } from "@/lib/db/database";
import { getPendingEntries, markRetry, markSynced, markSyncing } from "./SyncOutbox";
import { saveMapping } from "./serverMappingRepository";
import { finishSyncAttempt, startSyncAttempt } from "./syncAttemptRepository";
import type { SyncOutboxEntry } from "./types";

let running = false;

export type SyncRunResult = {
  attempted: number;
  synced: number;
  failed: number;
};

export async function runSyncEngine(db: AppDatabase, api: MkulimaScoreApi): Promise<SyncRunResult> {
  if (running) {
    return { attempted: 0, synced: 0, failed: 0 };
  }

  running = true;
  const result: SyncRunResult = { attempted: 0, synced: 0, failed: 0 };

  try {
    const entries = await getPendingEntries(db);

    for (const entry of entries) {
      result.attempted += 1;
      const attemptId = await startSyncAttempt(db, entry.entryUuid, entry.retryCount + 1);

      try {
        await markSyncing(db, entry.entryUuid);
        await syncEntry(db, api, entry);
        await markSynced(db, entry.entryUuid);
        await finishSyncAttempt(db, attemptId, "SYNCED");
        result.synced += 1;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Unknown sync error";
        await finishSyncAttempt(db, attemptId, "FAILED", message);
        await markRetry(db, entry.entryUuid, entry.retryCount + 1, message);
        result.failed += 1;
      }
    }

    return result;
  } finally {
    running = false;
  }
}

async function syncEntry(db: AppDatabase, api: MkulimaScoreApi, entry: SyncOutboxEntry): Promise<void> {
  if (entry.entityType === "farmer" && entry.mutationType === "CREATE") {
    const localUuid = getString(entry.payload, "localUuid") ?? entry.entityId;
    const agentId = getRequiredString(entry.payload, "agentId");
    const orgId = getRequiredString(entry.payload, "orgId");
    const response = await api.createFarmer({
      operationUuid: entry.operationUuid,
      localUuid,
      agentId,
      orgId,
      payload: entry.payload,
    });

    await saveMapping(db, {
      localUuid,
      entityType: "farmer",
      serverId: response.msid,
      operationUuid: response.operationUuid,
    });
    return;
  }

  const batchResult = await api.submitSyncBatch({
    operations: [
      {
        operationUuid: entry.operationUuid,
        entityType: entry.entityType,
        mutationType: entry.mutationType,
        payload: entry.payload,
      },
    ],
  });

  const rejection = batchResult.rejected.find((item) => item.operationUuid === entry.operationUuid);

  if (rejection) {
    throw new Error(`${rejection.code}: ${rejection.message}`);
  }
}

function getString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" ? value : null;
}

function getRequiredString(payload: Record<string, unknown>, key: string): string {
  const value = getString(payload, key);

  if (!value) {
    throw new Error(`Sync payload is missing required string: ${key}`);
  }

  return value;
}
