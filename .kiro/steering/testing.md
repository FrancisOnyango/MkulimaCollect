# MkulimaCollect — Testing Steering

## Test Philosophy

Every piece of logic that can be tested without a device must be tested without a device. Device-dependent tests (GPS, camera, maps) use mocks at the service boundary. End-to-end tests on an Android emulator validate the full user journey.

Tests are **first-class citizens** — they live beside the code they test and are updated in the same commit as any logic change.

## Test Stack

| Layer | Tool | Location |
|---|---|---|
| Unit + integration | Jest + `@testing-library/react-native` | `__tests__/` beside source |
| SQLite integration | Jest + expo-sqlite in-memory mode | `__tests__/db/` |
| E2E mobile | Maestro (Android emulator/device) | `e2e/` |
| Type safety | TypeScript strict compilation | CI gate |
| Lint | ESLint + expo config | CI gate |

## Unit Tests (Jest)

### Sector Schema Engine
- All 14 sector schemas parse without errors
- Conditional fields: when `conditionalOn.value` matches, field is included; when it does not, field is excluded
- Required field validation: missing required field returns appropriate error
- Type validation: number field rejects text, date field rejects invalid format
- `min`/`max` constraints enforced
- `provenanceOptions` correctly returned per field

### Sync Outbox Logic
- `PENDING_SYNC` → `SYNCING` transition on engine run
- `SYNCING` → `SYNCED` on server 2xx
- `SYNCING` → `RETRY` on network error
- `RETRY` → `PENDING_SYNC` after backoff expires
- `RETRY` → `FAILED_PERMANENTLY` after 10 retries
- Dependency ordering: operation with unresolved `depends_on` is skipped
- Idempotency: HTTP 409 with known `operation_uuid` treated as success
- Duplicate `operation_uuid` not submitted twice

### Domain Logic
- UUID v4 generated for every new entity (format validated)
- Completeness calculation: correct weighted average across sections
- National ID hashing: SHA-256 hash produced; raw value not retained in return value
- Farm area calculation: known polygon coordinates produce correct acreage (test against known values)
- Provenance enum values are all valid members of `ProvenanceSource`

### Auth / Session
- Access token expiry detection (expired, about-to-expire, valid)
- Refresh token rotation: old token invalidated after refresh
- Session cleared on logout (SecureStore keys deleted)
- M-PESA password: component state cleared after simulated API call completes

### API Adapter
- `LocalDevelopmentAdapter` returns typed mock responses for all interface methods
- `MockRemoteAdapter` returns configurable responses for testing error scenarios
- `ProductionApiAdapter` builds correct request headers including `X-Idempotency-Key`

## Integration Tests (Jest + expo-sqlite in-memory)

### Repository Layer
- `farmerRepository.createFarmer` → farmer row in SQLite + outbox entry in single transaction
- `farmerRepository.getFarmerById` → returns correct typed entity
- `farmRepository.createFarm` → farm row + outbox entry, farmer FK present
- `boundaryRepository.saveGeometry` → GeoJSON stored and retrievable
- `evidenceRepository.createEvidence` → evidence row with correct sync_status = 'LOCAL'

### Sync Engine Integration
- Full outbox cycle with mock adapter: PENDING → SYNCING → SYNCED
- After farmer SYNCED: `server_mappings` entry written with correct MSID
- Child farm outbox entry enriched with resolved MSID before send
- Interrupted sync (mock network drop mid-batch): remaining entries stay RETRY
- No duplicate entries created on retry of a completed operation
- Conflict detected when server_version > local_version AND local modified after sync

### Migration Tests
- Migration 0001 applied to empty database: all tables created with correct columns
- Each subsequent migration: applied to database in previous state, data preserved
- Downgrade protection: migrations are sequential and non-reversible; no data loss on upgrade

### Multi-Entity Scenarios
- One farmer → three farms → two enterprises per farm: all FK relationships intact
- Same sector (Dairy) on two different farms: both `SectorCollectionResponse` records stored independently
- Evidence linked to enterprise vs. evidence linked to farmer-level: both stored and queryable correctly

## Mobile E2E Tests (Maestro, Android Emulator)

### Complete Vertical Slice (must pass before Phase 1 is considered done)

```yaml
# e2e/flows/new-farmer-dairy.yaml
- Launch app
- Login with dev credentials
- Tap "Collect" FAB
- Complete Consent step (all checkboxes, capture GPS)
- Complete Identity step (fill name, ID number, capture ID photo mock)
- Complete Location step (capture GPS location)
- Complete Membership step (select co-op, enter member number)
- Complete Farm step (name, size, tenure = Owned)
- Open GPS Boundary screen, simulate walk (tap "Walk Boundary", tap "Stop Recording", tap "Save")
- Return to wizard, continue to Enterprise step
- Select "Dairy"
- Complete Dairy sector form (herd numbers, milk production, buyer, costs)
- Complete Financial step (income, loan)
- Complete Evidence Review step
- Complete Review step (acknowledge warnings)
- Submit offline → success screen shows "Saved"
- Kill app
- Reopen app
- Verify farmer appears in Farmers list with status "Draft" / sync pending indicator
- Navigate to Sync Centre → verify farmer record in queue
- (Mock network available) Tap "Sync now"
- Verify farmer record transitions to "Synced"
- Verify farmer profile shows MSID after sync
```

### Specific Scenario Tests

```yaml
# e2e/flows/multi-farm-multi-enterprise.yaml
- Create farmer, add Farm 1 (Dairy + Maize), add Farm 2 (Avocado)
- Verify Farms tab shows 2 farms
- Verify Enterprises tab shows 3 enterprises across 2 farms
- Verify sector form for Avocado loads Avocado schema (not Dairy)
```

```yaml
# e2e/flows/offline-resilience.yaml
- Disable network on emulator
- Create new farmer through all steps
- Submit farmer
- Kill app immediately (within 2 seconds of submission)
- Reopen app — verify farmer draft preserved
- Enable network
- Verify sync completes without duplicate
```

```yaml
# e2e/flows/500-farmer-performance.yaml
- Bootstrap device with 500 seeded farmer records
- Open Farmers list
- Measure time to first meaningful render (must be < 300ms)
- Scroll to bottom of list (no blank frames, no ANR)
- Search for a farmer by name (results appear < 200ms)
```

```yaml
# e2e/flows/sync-retry.yaml
- Create farmer offline
- Enable network with mock server returning 503 on first attempt
- Verify entry transitions to RETRY
- Mock server returns 200 on second attempt
- Verify entry transitions to SYNCED
- Verify no duplicate farmer on server (mock confirms single creation)
```

```yaml
# e2e/flows/schema-migration.yaml
- Install previous app version with existing draft farmer in SQLite
- Upgrade to new version with schema migration
- Verify draft farmer record intact
- Verify new schema tables exist
- Verify app opens and farmer is visible
```

## Coverage Requirements

| Area | Minimum coverage |
|---|---|
| `features/sector-engine/` | 90% |
| `features/sync/` | 85% |
| `lib/db/` (repositories) | 80% |
| `features/farmers/farmerCompleteness.ts` | 95% |
| `lib/crypto/HashUtil.ts` | 100% |
| `lib/api/adapters/` | 80% |

## CI Gates

Every pull request must pass:
1. TypeScript strict compilation (`tsc --noEmit`)
2. ESLint with zero errors
3. All Jest unit and integration tests pass
4. Coverage thresholds met
5. No new `any` types introduced without justification comment
6. `npx expo-doctor` reports no critical issues

E2E tests run on a dedicated Android emulator job. They are not required to pass on every PR but must pass before merging to `main`.

## Test Data Rules

- Test data uses fictional farmers with obviously fake names (e.g. "Test Farmer Alpha")
- No real National ID numbers in test fixtures — use format `TEST-XXX-000`
- No real phone numbers — use `+254700000001` series
- No real GPS coordinates for sensitive locations — use publicly known coordinates (e.g. Nairobi city center)
- Seed data files live in `apps/collect/lib/db/seed/` and are excluded from production builds
