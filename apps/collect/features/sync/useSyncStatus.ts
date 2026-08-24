import { useCallback, useEffect, useState } from "react";
import type { SyncStateValue } from "@/constants/syncStates";
import { useApiClient } from "@/components/providers/APIProvider";
import { useDatabase } from "@/components/providers/DBProvider";
import { getOutboxCounts } from "./SyncOutbox";
import { runSyncEngine, type SyncRunResult } from "./SyncEngine";

export type SyncStatus = {
  counts: Record<SyncStateValue, number>;
  isSyncing: boolean;
  lastRun: SyncRunResult | null;
  refresh(): Promise<void>;
  syncNow(): Promise<SyncRunResult>;
};

const emptyCounts: Record<SyncStateValue, number> = {
  LOCAL_DRAFT: 0,
  PENDING_SYNC: 0,
  SYNCING: 0,
  SYNCED: 0,
  RETRY: 0,
  CONFLICT: 0,
  FAILED_PERMANENTLY: 0,
};

export function useSyncStatus(): SyncStatus {
  const db = useDatabase();
  const { api } = useApiClient();
  const [counts, setCounts] = useState(emptyCounts);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastRun, setLastRun] = useState<SyncRunResult | null>(null);

  const refresh = useCallback(async () => {
    setCounts(await getOutboxCounts(db));
  }, [db]);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);

    try {
      const result = await runSyncEngine(db, api);
      setLastRun(result);
      await refresh();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [api, db, refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    counts,
    isSyncing,
    lastRun,
    refresh,
    syncNow,
  };
}
