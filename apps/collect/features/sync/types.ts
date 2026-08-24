import type { SyncStateValue } from "@/constants/syncStates";

export type EntityType =
  | "farmer"
  | "farmer_identity"
  | "consent"
  | "affiliation"
  | "farm"
  | "farm_geometry"
  | "enterprise"
  | "production_cycle"
  | "production_observation"
  | "expense"
  | "sector_response"
  | "evidence"
  | "task";

export type MutationType = "CREATE" | "UPDATE" | "DELETE";

export type CreateOutboxEntryInput = {
  operationUuid?: string;
  entityType: EntityType;
  entityId: string;
  mutationType: MutationType;
  payload: Record<string, unknown>;
  dependsOn?: string[];
  localVersion?: number;
  serverBaseline?: number | null;
  state?: SyncStateValue;
};

export type SyncOutboxEntry = {
  entryUuid: string;
  operationUuid: string;
  entityType: EntityType;
  entityId: string;
  mutationType: MutationType;
  payload: Record<string, unknown>;
  dependsOn: string[];
  localVersion: number;
  serverBaseline: number | null;
  retryCount: number;
  state: SyncStateValue;
  lastError: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  syncedAt: string | null;
};
