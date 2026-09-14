import type { MkulimaScoreApi } from "@/lib/api/ApiClient";
import type { AppDatabase } from "@/lib/db/database";
import { MetadataKey, getMetadata, setMetadata } from "@/lib/db/metadataRepository";
import { getLocalAgent } from "@/features/auth/localAgentRepository";
import { upsertTask } from "@/features/tasks/taskRepository";
import { getPendingEntries, markConflict, markRetry, markSynced, markSyncing } from "./SyncOutbox";
import { saveConflict } from "./conflictRepository";
import { saveMapping } from "./serverMappingRepository";
import { finishSyncAttempt, startSyncAttempt } from "./syncAttemptRepository";
import type { SyncOutboxEntry } from "./types";
import { acquireSyncLock, releaseSyncLock } from "./syncLockRepository";
import * as Sentry from "@sentry/react";

export type SyncRunResult = {
  attempted: number;
  synced: number;
  failed: number;
  conflicts: number;
};

export async function runSyncEngine(db: AppDatabase, api: MkulimaScoreApi): Promise<SyncRunResult> {
  const lockAcquired = await acquireSyncLock(db);

  if (!lockAcquired) {
    Sentry.addBreadcrumb({ category: "sync", message: "sync-lock-acquire-failed", level: "info" });
    return { attempted: 0, synced: 0, failed: 0, conflicts: 0 };
  }

  const result: SyncRunResult = { attempted: 0, synced: 0, failed: 0, conflicts: 0 };

  try {
    const entries = await getPendingEntries(db);

    for (const entry of entries) {
      result.attempted += 1;
      const attemptId = await startSyncAttempt(db, entry.entryUuid, entry.retryCount + 1);

      try {
        Sentry.addBreadcrumb({ category: "sync", message: `sync-start ${entry.entryUuid}`, data: { operationUuid: entry.operationUuid } });
        await markSyncing(db, entry.entryUuid);
        const outcome = await syncEntry(db, api, entry);
        if (outcome === "conflict") {
          await finishSyncAttempt(db, attemptId, "CONFLICT");
          result.conflicts += 1;
        } else {
          await markSynced(db, entry.entryUuid);
          await finishSyncAttempt(db, attemptId, "SYNCED");
          result.synced += 1;
        }
        Sentry.addBreadcrumb({ category: "sync", message: `sync-${outcome} ${entry.entryUuid}` });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Unknown sync error";
        Sentry.addBreadcrumb({ category: "sync", message: `sync-failed ${entry.entryUuid}`, data: { error: message } });
        Sentry.captureException(caught);
        await finishSyncAttempt(db, attemptId, "FAILED", message);
        await markRetry(db, entry.entryUuid, entry.retryCount + 1, message);
        result.failed += 1;
      }
    }

    await pullRemoteWork(db, api);
    return result;
  } catch {
    return result;
  } finally {
    try {
      const { exportMetrics } = await import("@/lib/metricsExporter");
      const { recordMetric } = await import("@/lib/metrics");
      recordMetric("sync.attempted", result.attempted);
      recordMetric("sync.synced", result.synced);
      recordMetric("sync.failed", result.failed);
      recordMetric("sync.conflicts", result.conflicts);
      await exportMetrics();
    } catch {
      // ignore exporter failures
    }

    await releaseSyncLock(db);
  }
}

async function syncEntry(db: AppDatabase, api: MkulimaScoreApi, entry: SyncOutboxEntry): Promise<"synced" | "conflict"> {
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
    return "synced";
  }

  const cursor = await getMetadata(db, MetadataKey.SYNC_CURSOR);
  const batchResult = await api.submitSyncBatch({
    baselineCursor: cursor,
    operations: [
      {
        operationUuid: entry.operationUuid,
        entityType: entry.entityType,
        mutationType: entry.mutationType,
        localEntityId: entry.entityId,
        dependsOn: entry.dependsOn,
        serverBaseline: entry.serverBaseline,
        payload: entry.payload,
      },
    ],
  });

  if (batchResult.serverCursor) {
    await setMetadata(db, MetadataKey.SYNC_CURSOR, batchResult.serverCursor);
  }

  const conflict = batchResult.conflicts?.find((item) => item.operationUuid === entry.operationUuid);
  if (conflict) {
    await saveConflict(db, {
      entityType: entry.entityType,
      entityId: entry.entityId,
      localPayload: entry.payload,
      remotePayload: { code: conflict.code, message: conflict.message },
      operationUuid: entry.operationUuid,
      code: conflict.code,
    });
    await markConflict(db, entry.entryUuid, `${conflict.code}: ${conflict.message}`);
    return "conflict";
  }

  const rejection = batchResult.rejected.find((item) => item.operationUuid === entry.operationUuid);
  if (rejection) {
    throw new Error(`${rejection.code}: ${rejection.message}`);
  }

  return "synced";
}

async function pullRemoteWork(db: AppDatabase, api: MkulimaScoreApi): Promise<void> {
  try {
    const agent = await getLocalAgent(db);
    if (!agent) {
      return;
    }

    const cursor = (await getMetadata(db, MetadataKey.SYNC_CURSOR)) ?? undefined;
    const tasks = await api.getTasks(agent.agentId, cursor);
    for (const task of tasks) {
      await upsertTask(db, {
        id: task.id,
        agentId: task.agentId || agent.agentId,
        farmerId: task.farmerId,
        type: task.type,
        priority: task.priority,
        title: task.title,
        detail: task.detail,
        dueDate: task.dueDate,
      });
    }
  } catch {
    // Pull failures must not roll back a successful outbox push.
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
