# MkulimaCollect — Offline Sync Steering

## Core Principle

SQLite is the **authoritative source of truth** for all operational data while in the field. The server is the authoritative source after synchronization. The app must reconcile these two truths without data loss.

## Outbox Pattern

Every mutation that must eventually reach the server:
1. Writes to the entity table AND the `sync_outbox` table in **one atomic SQLite transaction**
2. Never performs a direct API call from a repository write
3. Lets the `SyncEngine` process the outbox independently

```
Repository.createFarmer(data)
  └── db.transaction(() => {
        INSERT INTO farmers ...
        INSERT INTO sync_outbox (entity_type='farmer', mutation='CREATE', ...)
      })
  └── SyncEngine picks up PENDING_SYNC entries on next run
```

## Sync Outbox Entry Fields

```typescript
interface SyncOutboxEntry {
  entry_uuid: string;          // UUID v4, client-generated
  operation_uuid: string;      // UUID v4, idempotency key sent to server
  entity_type: EntityType;     // 'farmer' | 'farm' | 'enterprise' | 'evidence' | ...
  entity_id: string;           // local UUID of the entity
  mutation_type: MutationType; // 'CREATE' | 'UPDATE' | 'DELETE'
  payload: string;             // JSON serialized mutation payload
  depends_on: string[];        // operation_uuids that must sync first (JSON array)
  local_version: number;       // local entity version counter
  server_baseline: number | null; // last known server version (null for new)
  created_at: string;          // ISO 8601
  retry_count: number;         // default 0
  state: SyncState;
  last_error: string | null;
  synced_at: string | null;
}
```

## Sync State Machine

```
                 app restart / connectivity
                       │
              ┌────────▼────────┐
              │  LOCAL_DRAFT    │  (wizard in progress, not yet submitted)
              └────────┬────────┘
                 agent submits step
                       │
              ┌────────▼────────┐
              │  PENDING_SYNC   │◄──────────────────────┐
              └────────┬────────┘                       │
             SyncEngine picks up                   backoff expires
                       │                               │
              ┌────────▼────────┐              ┌───────┴────────┐
              │    SYNCING      │──── error ──►│     RETRY      │
              └────────┬────────┘              └────────────────┘
            server 2xx │                              │
                       │                    10 retries exceeded
              ┌────────▼────────┐              ┌─────▼──────────┐
              │     SYNCED      │              │FAILED_PERMANENTLY│
              └─────────────────┘              └─────────────────┘
                                                       │
                                          ┌────────────▼──────────┐
                                          │      CONFLICT         │
                                          │ (server version ahead)│
                                          └───────────────────────┘
```

## Dependency Ordering

Operations must be sent to the server in dependency order:

```
Farmer CREATE  →  Farm CREATE  →  Enterprise CREATE  →  ProductionCycle CREATE
                                                     →  SectorResponse CREATE
                                                     →  Evidence metadata CREATE
                                                            → Evidence binary upload
```

The `depends_on` array on each outbox entry contains the `operation_uuid` values that must reach `SYNCED` state before this entry is attempted.

**Rule:** SyncEngine MUST NOT attempt an operation whose `depends_on` entries are not yet SYNCED. It must skip and try on the next cycle.

## Idempotency

- Each outbox entry has a stable `operation_uuid` (UUID v4, generated once on entity creation)
- This UUID is sent as a header `X-Idempotency-Key` on every request
- If the server returns HTTP 409 with the same `operation_uuid`, the client treats this as success and marks the entry SYNCED
- If the server returns HTTP 200/201 with a `server_id` for an operation the client has already marked SYNCED, ignore the new server_id (use the one already stored in `server_mappings`)

## Canonical ID Reconciliation

Farmers (and other entities) are created offline with a `local_uuid`. After sync:

```
1. Client sends CREATE farmer with operation_uuid=abc123, local_uuid=local-xyz
2. Server creates record, returns { msid: "MS-KE-004829", operation_uuid: "abc123" }
3. Client writes to server_mappings: { local_uuid: "local-xyz", entity_type: "farmer", server_id: "MS-KE-004829" }
4. All pending child outbox entries for farmer "local-xyz" are now enriched with resolved msid before sending
5. Local SQLite records continue using local_uuid as PK forever
```

Child records (farms, enterprises, etc.) use `farmer_local_uuid` as their FK. When syncing child records, the SyncEngine resolves the FK to MSID from `server_mappings` and includes it in the server payload.

## Evidence Upload Lifecycle

```
1. Photo captured → saved to app document directory → local_uri recorded
2. EvidenceRecord created in SQLite (sync_status = 'LOCAL')
3. SyncOutbox entry created for evidence metadata (mutation = 'CREATE')
4. SyncEngine processes metadata entry:
   a. POST /evidence/request-upload → server returns { evidence_server_id, presigned_url, expires_at }
   b. Store presigned_url temporarily in memory only
   c. PUT binary file to presigned_url (S3 or equivalent)
   d. POST /evidence/confirm-upload { evidence_server_id, etag }
   e. Update EvidenceRecord: server_ref = evidence_server_id, sync_status = 'SYNCED'
5. If upload fails at step c or d: retry from step 4a (get fresh presigned URL)
6. Local file retained until sync confirmed AND retention period expires
```

## Retry Policy

| Retry # | Wait before next attempt |
|---|---|
| 1 | 30 seconds |
| 2 | 2 minutes |
| 3 | 5 minutes |
| 4 | 15 minutes |
| 5 | 30 minutes |
| 6+ | 1 hour |
| 10 | FAILED_PERMANENTLY |

Retry only occurs when connectivity is available. The retry timer is paused during offline periods.

## Conflict Resolution Rules

1. **Agent-only records** (new farmer created offline, no server version exists): no conflict possible, always accepted
2. **Field-level last-write-wins**: if server version > local baseline AND local was not modified since last sync, accept server version silently
3. **Concurrent modification conflict**: if server version > local baseline AND local was modified after last sync, flag as CONFLICT — surface to agent in QA queue
4. **Evidence**: never overwrite a server-VERIFIED evidence record with a local draft. Flag for review.
5. **Financial records**: always flag conflicts for human review — never auto-merge

## What Must Never Happen

- A duplicate farmer record created because a sync response was lost
- An evidence record deleted because upload failed
- A sync queue entry discarded on app kill or crash
- Auth token stored in SQLite or AsyncStorage
- M-PESA password written to any persistent storage
- A network request that blocks the UI during offline operation
- Sync progress that resets to zero after partial upload

## Sync Centre UI Obligations

The Sync Centre screen must show at all times:
- Connection status (Online/Offline with signal type if available)
- Count of records in each sync state (queued, uploading, synced, retry, failed)
- Estimated upload size
- Last successful sync timestamp
- Per-record status with farmer name, record type, file size
- Manual "Sync now" trigger (disabled when offline or already syncing)
