export const SyncState = {
  LOCAL_DRAFT: "LOCAL_DRAFT",
  PENDING_SYNC: "PENDING_SYNC",
  SYNCING: "SYNCING",
  SYNCED: "SYNCED",
  RETRY: "RETRY",
  CONFLICT: "CONFLICT",
  FAILED_PERMANENTLY: "FAILED_PERMANENTLY",
} as const;

export type SyncStateValue = (typeof SyncState)[keyof typeof SyncState];
