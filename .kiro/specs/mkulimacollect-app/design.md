# MkulimaCollect — Technical Design

## Overview

MkulimaCollect is an Android-first, offline-first React Native / Expo application that serves as the evidence acquisition layer for the MkulimaScore agricultural intelligence platform. It enables field agents to onboard farmers, capture farm boundaries, record enterprise production data across 14 agricultural sectors, collect evidence, and synchronize everything reliably to the MkulimaScore backend — including when operating with no internet connectivity.

The application deliberately contains no scoring logic. All transformation from collected evidence into agricultural intelligence is performed exclusively on the MkulimaScore server platform.

## Architecture

MkulimaCollect uses a four-layer architecture with strict inward dependency flow:

- **Presentation Layer** — Expo Router screens (`app/`), React Native components (`components/`), NativeWind v4 styles
- **Domain Layer** — Feature modules (`features/`) containing repository hooks, use cases, sector engine, sync engine, and business logic
- **Data Layer** — Drizzle ORM over expo-sqlite (`lib/db/`), local file store (`lib/storage/`)
- **Infrastructure Layer** — API adapter interface with three implementations (`lib/api/`), GPS via expo-location, camera via expo-camera, auth via expo-secure-store, hashing via expo-crypto

The sync architecture uses a durable SQLite outbox pattern. Every entity write is atomic with a corresponding sync_outbox entry. A background SyncEngine processes the outbox respecting dependency ordering, with exponential backoff retry and idempotent server operations.

Navigation is handled by Expo Router v4 with three route groups: `(auth)` for unauthenticated screens, `(tabs)` for the main five-tab interface, and `collect/` for the multi-step farmer onboarding wizard. Maps use @maplibre/maplibre-react-native with graceful degradation when tiles are unavailable.

## Components and Interfaces

### Core Component Groups

**`components/ui/`** — Atomic presentational components with no domain knowledge: Badge, Button, Card, CompletenessBar, ConnectivityIndicator, EmptyState, Field, TopBar, ProgressSteps, Skeleton

**`components/forms/`** — Domain-aware form primitives: CameraAction, ConsentCheckbox, GpsField, NumericStepper, ProvenanceSelect, SearchableSelect, SegmentedControl, SignaturePad, UnitField, DocumentUpload

**`components/domain/`** — Farmer/farm/enterprise display components: FarmerCard, FarmerHeader, FarmCard, EnterpriseCard, ProfileCompleteness, SyncBanner, TaskCard, EvidenceCard, ActivityTimeline, QaIssueCard

**`components/map/`** — MapLibre wrapper components: BoundaryMap, GpsAccuracyIndicator, PolygonOverlay

### API Interface

The `MkulimaScoreApi` interface (`lib/api/ApiClient.ts`) defines all server integration points. Three adapter implementations exist:
- `LocalDevelopmentAdapter` — hardcoded mock data, no network
- `MockRemoteAdapter` — configurable responses for testing, supports error injection
- `ProductionApiAdapter` — real HTTP client for MkulimaScore FastAPI backend (completed when backend is available)

Active adapter selected by `EXPO_PUBLIC_ENVIRONMENT` environment variable.

### Sector Schema Engine

`features/sector-engine/SchemaEngine.ts` loads versioned sector schemas, evaluates conditional field logic, validates values, and drives `FieldRenderer.tsx` to render any field type dynamically. All 14 sector schemas are defined as TypeScript files in `features/sector-engine/schemas/`. Schemas contain collection logic only — no scoring weights, thresholds, or model coefficients.

## Data Models

See Section B for full entity relationship model and Section C for the complete Drizzle SQLite schema.

**Core entities:** Farmer · FarmerIdentity · Consent · Membership · Farm · FarmGeometry · Enterprise · SectorCollectionResponse · ProductionCycle · Sale · Expense · FinancialRecord · Loan · LoanRepayment · Evidence · Task · QaReview · AuditEvent

**Infrastructure tables:** SyncOutbox · ServerMappings · CollectionSession · AppConfig

All entities use UUID v4 client-generated primary keys. MSID (canonical MkulimaScore farmer ID) is stored separately in `server_mappings` after sync and never replaces the local UUID.

## Correctness Properties

### Property 1: Atomic Entity-Outbox Writes
**Validates: Requirements 15.1**
Every entity write is atomic with its sync_outbox entry. No entity row exists in SQLite without a paired outbox record in the same transaction. Testable: insert a farmer and verify both rows exist; simulate mid-transaction failure and verify neither row exists.

### Property 2: Idempotent Sync Operations
**Validates: Requirements 15.5**
Sync operations are idempotent. The same `operation_uuid` submitted twice to the server produces exactly one server record. HTTP 409 with a known `operation_uuid` is treated as success. Testable: submit the same CREATE payload twice; server record count = 1.

### Property 3: Dependency Ordering Enforced
**Validates: Requirements 15.2**
Enterprise sync never precedes its farm sync; farm sync never precedes its farmer sync. The SyncEngine skips operations whose `depends_on` entries are not yet SYNCED. Testable: block farmer sync and verify farm outbox entry stays PENDING_SYNC.

### Property 4: Evidence File Integrity
**Validates: Requirements 12.4**
Evidence files are hash-verified. The SHA-256 computed on the client is sent with the upload confirmation; a server-side mismatch rejects the upload. Testable: corrupt a file byte after hashing and verify upload confirmation fails.

### Property 5: National ID Non-Persistence
**Validates: Requirements 5.2**
National ID numbers are never stored in raw form after capture. Only the SHA-256 hash and last 3 digits are persisted. Testable: call `saveIdentity()` with a known ID number; query SQLite and confirm the raw number is absent.

### Property 6: M-PESA Credential Non-Persistence
**Validates: Requirements 13.6**
M-PESA statement passwords are never persisted. The value is held in React component state only, transmitted to the server API, and cleared immediately after the API call completes. Testable: inspect component state after simulated API call; confirm null in both success and error paths.

### Property 7: Sync Queue Durability
**Validates: Requirements 15.6**
Sync queue entries survive app kill and device reboot. SQLite WAL mode and atomic transactions ensure no outbox entries are lost between writes and reads across process restarts. Testable: write outbox entry, simulate process kill, reopen database, confirm entry present.

### Property 8: UUID Stability
**Validates: Requirements 15.8**
Local UUIDs never change. MSID is stored separately in server_mappings after sync and does not replace the local UUID primary key. Testable: sync a farmer, confirm `farmers.id` unchanged, confirm `server_mappings` row exists with correct MSID.

### Property 9: Independent Farm Size Columns
**Validates: Requirements 8.4**
Farm GPS-calculated area and farmer-reported area are stored in independent columns (`size_gps_acres`, `size_reported_acres`). Neither value overwrites the other under any code path. Testable: capture GPS boundary for a farm with existing reported size; confirm both columns non-null and original reported value unchanged.

### Property 10: Verified Evidence Protection
**Validates: Requirements 12.8**
Server-VERIFIED evidence requires explicit agent confirmation before a local re-upload can replace it. Testable: set an evidence record to verification_status=VERIFIED; attempt to replace it without confirmation; confirm original local_uri unchanged.

## Error Handling

- **Network errors during sync**: transition outbox entry to RETRY; apply exponential backoff; resume on reconnection
- **HTTP 409 with known operation_uuid**: treated as success (idempotent deduplication); entry marked SYNCED
- **10 sync retries exceeded**: entry transitions to FAILED_PERMANENTLY; surfaced in quality queue; data not deleted
- **GPS accuracy unacceptable**: warning shown inline; collection not blocked; quality flag stored
- **Evidence MIME/size validation failure**: rejected before SQLite write; clear agent-facing error message
- **Auth token expired offline**: resume with cached session via PIN/biometric; re-authenticate on next connectivity
- **Device revocation (401)**: session cleared, tokens deleted, redirected to login; SQLite farmer data preserved
- **SQLite migration failure**: app startup fails with clear error; migration is never destructive on upgrade
- **Conflict detected on sync**: entry set to CONFLICT state; surfaced for human review; never auto-merged for financial records

## Testing Strategy

See `.kiro/steering/testing.md` for the complete test specification.

- **Unit tests** (Jest): sector schema engine, sync state machine, completeness calculation, hash utilities, auth session lifecycle
- **Integration tests** (Jest + expo-sqlite in-memory): repository atomicity, full sync cycle, migration safety, multi-entity relationships
- **E2E tests** (Maestro, Android emulator): complete vertical slice, multi-farm/multi-enterprise, offline resilience, 500-farmer performance, sync retry, schema migration

---

## A. Architecture Overview

### Layered Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                          │
│  app/ (Expo Router screens)                                  │
│  components/ (React Native UI components)                    │
│  NativeWind v4 styling                                       │
├──────────────────────────────────────────────────────────────┤
│  DOMAIN LAYER                                                │
│  features/ (repositories, use-case hooks, services)         │
│  Business rules, completeness, provenance, validation        │
├──────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                  │
│  lib/db/ (Drizzle ORM + expo-sqlite)                        │
│  lib/storage/ (local file system for evidence)              │
├──────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                                        │
│  lib/api/ (adapter interface + three implementations)       │
│  GPS (expo-location), Camera (expo-camera)                  │
│  Auth (expo-secure-store), Crypto (expo-crypto)             │
└──────────────────────────────────────────────────────────────┘
```

Dependency rule: each layer may only import from the layer directly below it.
`app/` never imports from `lib/db/` directly — always through `features/`.

### Module Boundaries

| Module | Owns | Does NOT own |
|---|---|---|
| `app/` | Screen layout, navigation, user interaction | Business logic, data queries |
| `features/` | Repository calls, use cases, domain hooks | HTTP requests, direct SQLite |
| `lib/db/` | SQLite schema, migrations, typed queries | Business rules, API calls |
| `lib/api/` | HTTP interface contracts, adapter switching | SQLite, UI state |
| `lib/storage/` | Evidence file I/O, local URI management | Sync logic, metadata |
| `features/sync/` | Outbox processing, retry, ID reconciliation | UI rendering, HTTP directly |
| `features/sector-engine/` | Schema loading, conditional logic, rendering | Scoring, weights, thresholds |

---

## B. Domain Model

### Entity Relationship

```
Agent
└── Farmer [local_uuid PK, msid after sync]
    ├── FarmerIdentity [farmer_id FK]
    ├── Consent [farmer_id FK]
    ├── Membership [farmer_id FK] (many)
    ├── Farm [farmer_id FK] (many)
    │   ├── FarmGeometry [farm_id FK] (one)
    │   └── Enterprise [farm_id FK, farmer_id FK] (many)
    │       ├── ProductionCycle [enterprise_id FK] (many)
    │       │   ├── Sale [cycle_id FK] (many)
    │       │   └── Expense [cycle_id FK] (many)
    │       └── SectorCollectionResponse [enterprise_id FK] (many; versioned)
    ├── Evidence [farmer_id FK, nullable: farm_id, enterprise_id] (many)
    ├── FinancialRecord [farmer_id FK] (many)
    ├── Loan [farmer_id FK] (many)
    │   └── LoanRepayment [loan_id FK] (many)
    ├── Task [farmer_id FK] (many)
    ├── QaReview [farmer_id FK] (many)
    └── AuditEvent [entity_id, entity_type] (many; immutable)

SyncOutbox (global)
ServerMapping (global)
AppConfig (global, key/value)
CollectionSession (one per active wizard)
```

### Key Field Rules

- All primary keys: UUID v4 TEXT
- `national_id_hash`: SHA-256 hex of raw ID; `national_id_last3`: last 3 digits only
- `size_reported_acres` and `size_gps_acres` on Farm are independent columns; never overwrite each other
- `polygon_geojson` on FarmGeometry: GeoJSON FeatureCollection string; server may recompute with PostGIS
- `sector_response_payload`: JSON blob on SectorCollectionResponse; keyed to `schema_id` + `schema_version`
- `provenance`: TEXT enum column on any field representing a material factual claim

---

## C. Local Database Schema

### Full Drizzle Schema (`lib/db/schema.ts`)

```typescript
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// ── Farmers ───────────────────────────────────────────────────────────────
export const farmers = sqliteTable('farmers', {
  id:               text('id').primaryKey(),            // UUID v4
  agent_id:         text('agent_id').notNull(),
  org_id:           text('org_id').notNull(),
  status:           text('status').notNull().default('DRAFT'),
  // DRAFT | IN_PROGRESS | SUBMITTED | VERIFIED | NEEDS_CORRECTION
  completeness_pct: integer('completeness_pct').default(0),
  declined_consent: integer('declined_consent', { mode: 'boolean' }).default(false),
  local_version:    integer('local_version').default(1),
  server_version:   integer('server_version'),
  created_at:       text('created_at').notNull(),
  updated_at:       text('updated_at').notNull(),
  synced_at:        text('synced_at'),
  deleted_at:       text('deleted_at'),
}, (t) => ({
  idx_agent:   index('idx_farmers_agent').on(t.agent_id),
  idx_org:     index('idx_farmers_org').on(t.org_id),
  idx_status:  index('idx_farmers_status').on(t.status),
  idx_updated: index('idx_farmers_updated').on(t.updated_at),
}));

export const farmer_identities = sqliteTable('farmer_identities', {
  id:                  text('id').primaryKey(),
  farmer_id:           text('farmer_id').notNull().references(() => farmers.id),
  full_legal_name:     text('full_legal_name'),
  first_name:          text('first_name'),
  middle_name:         text('middle_name'),
  surname:             text('surname'),
  preferred_name:      text('preferred_name'),
  national_id_type:    text('national_id_type'),  // NATIONAL_ID | PASSPORT | ALIEN_ID
  national_id_hash:    text('national_id_hash'),  // SHA-256
  national_id_last3:   text('national_id_last3'), // last 3 digits only
  date_of_birth:       text('date_of_birth'),
  gender:              text('gender'),
  primary_phone_hash:  text('primary_phone_hash'),
  primary_phone_last4: text('primary_phone_last4'),
  alt_phone_hash:      text('alt_phone_hash'),
  preferred_language:  text('preferred_language'),
  local_version:       integer('local_version').default(1),
  updated_at:          text('updated_at').notNull(),
  synced_at:           text('synced_at'),
}, (t) => ({
  idx_farmer: index('idx_identity_farmer').on(t.farmer_id),
}));

export const consents = sqliteTable('consents', {
  id:                 text('id').primaryKey(),
  farmer_id:          text('farmer_id').notNull().references(() => farmers.id),
  version:            text('version').notNull(),
  declined:           integer('declined', { mode: 'boolean' }).default(false),
  consent_date:       text('consent_date').notNull(),
  consent_time:       text('consent_time').notNull(),
  method:             text('method').notNull(), // WRITTEN | VERBAL | DIGITAL
  language:           text('language').notNull(),
  agent_id:           text('agent_id').notNull(),
  gps_latitude:       real('gps_latitude'),
  gps_longitude:      real('gps_longitude'),
  gps_accuracy_m:     real('gps_accuracy_m'),
  signature_local_uri: text('signature_local_uri'),
  photo_local_uri:    text('photo_local_uri'),
  items_agreed:       text('items_agreed').notNull(), // JSON array of agreed item IDs
  mpesa_authorized:   integer('mpesa_authorized', { mode: 'boolean' }).default(false),
  local_version:      integer('local_version').default(1),
  created_at:         text('created_at').notNull(),
  synced_at:          text('synced_at'),
}, (t) => ({
  idx_farmer: index('idx_consents_farmer').on(t.farmer_id),
}));

export const memberships = sqliteTable('memberships', {
  id:              text('id').primaryKey(),
  farmer_id:       text('farmer_id').notNull().references(() => farmers.id),
  org_name:        text('org_name').notNull(),
  org_type:        text('org_type').notNull(), // SACCO | COOPERATIVE | GROUP | FACTORY
  member_number:   text('member_number'),
  branch:          text('branch'),
  collection_centre: text('collection_centre'),
  member_since_yr: integer('member_since_yr'),
  active:          integer('active', { mode: 'boolean' }).default(true),
  matched_registry: integer('matched_registry', { mode: 'boolean' }).default(false),
  local_version:   integer('local_version').default(1),
  updated_at:      text('updated_at').notNull(),
  synced_at:       text('synced_at'),
}, (t) => ({
  idx_farmer: index('idx_memberships_farmer').on(t.farmer_id),
}));

// ── Farms ──────────────────────────────────────────────────────────────────
export const farms = sqliteTable('farms', {
  id:                     text('id').primaryKey(),
  farmer_id:              text('farmer_id').notNull().references(() => farmers.id),
  name:                   text('name'),
  tenure:                 text('tenure'), // OWNED | LEASED | FAMILY | COMMUNAL
  size_reported_acres:    real('size_reported_acres'),
  size_reported_source:   text('size_reported_source'), // provenance
  size_gps_acres:         real('size_gps_acres'),
  irrigation:             integer('irrigation', { mode: 'boolean' }),
  irrigation_type:        text('irrigation_type'),
  water_source:           text('water_source'),
  county:                 text('county'),
  sub_county:             text('sub_county'),
  ward:                   text('ward'),
  village:                text('village'),
  gps_latitude:           real('gps_latitude'),
  gps_longitude:          real('gps_longitude'),
  gps_accuracy_m:         real('gps_accuracy_m'),
  local_version:          integer('local_version').default(1),
  server_version:         integer('server_version'),
  created_at:             text('created_at').notNull(),
  updated_at:             text('updated_at').notNull(),
  synced_at:              text('synced_at'),
}, (t) => ({
  idx_farmer: index('idx_farms_farmer').on(t.farmer_id),
}));

export const farm_geometries = sqliteTable('farm_geometries', {
  id:                    text('id').primaryKey(),
  farm_id:               text('farm_id').notNull().references(() => farms.id),
  polygon_geojson:       text('polygon_geojson').notNull(), // GeoJSON string
  calculation_method:    text('calculation_method').notNull(),
  // WALK_BOUNDARY | DRAW_ON_MAP | SINGLE_POINT
  point_count:           integer('point_count').default(0),
  distance_m:            real('distance_m'),
  accuracy_meters:       real('accuracy_meters'), // worst fix during capture
  area_calculated_acres: real('area_calculated_acres'),
  captured_at:           text('captured_at').notNull(),
  agent_id:              text('agent_id').notNull(),
  device_id:             text('device_id'),
  synced_at:             text('synced_at'),
}, (t) => ({
  idx_farm: index('idx_geometry_farm').on(t.farm_id),
}));

// ── Enterprises ────────────────────────────────────────────────────────────
export const enterprises = sqliteTable('enterprises', {
  id:                 text('id').primaryKey(),
  farm_id:            text('farm_id').notNull().references(() => farms.id),
  farmer_id:          text('farmer_id').notNull().references(() => farmers.id),
  sector:             text('sector').notNull(),
  // dairy|maize|tea|coffee|avocado|rice|irish-potato|poultry|tomato|
  // macadamia|aquaculture|livestock-meat|beans|horticulture
  variety_breed:      text('variety_breed'),
  start_year:         integer('start_year'),
  primary_enterprise: integer('primary_enterprise', { mode: 'boolean' }).default(false),
  active:             integer('active', { mode: 'boolean' }).default(true),
  local_version:      integer('local_version').default(1),
  server_version:     integer('server_version'),
  created_at:         text('created_at').notNull(),
  updated_at:         text('updated_at').notNull(),
  synced_at:          text('synced_at'),
}, (t) => ({
  idx_farm:    index('idx_enterprises_farm').on(t.farm_id),
  idx_farmer:  index('idx_enterprises_farmer').on(t.farmer_id),
  idx_sector:  index('idx_enterprises_sector').on(t.sector),
}));

export const sector_collection_responses = sqliteTable('sector_collection_responses', {
  id:              text('id').primaryKey(),
  enterprise_id:   text('enterprise_id').notNull().references(() => enterprises.id),
  schema_id:       text('schema_id').notNull(),    // e.g. "dairy"
  schema_version:  text('schema_version').notNull(), // semver e.g. "1.0.0"
  payload:         text('payload').notNull(),       // JSON of field_id → value
  provenance_map:  text('provenance_map'),          // JSON of field_id → ProvenanceSource
  collected_at:    text('collected_at').notNull(),
  local_version:   integer('local_version').default(1),
  synced_at:       text('synced_at'),
}, (t) => ({
  idx_enterprise: index('idx_responses_enterprise').on(t.enterprise_id),
  idx_schema:     index('idx_responses_schema').on(t.schema_id, t.schema_version),
}));

export const production_cycles = sqliteTable('production_cycles', {
  id:            text('id').primaryKey(),
  enterprise_id: text('enterprise_id').notNull().references(() => enterprises.id),
  cycle_label:   text('cycle_label'), // e.g. "2025 Long Rains"
  period_start:  text('period_start'),
  period_end:    text('period_end'),
  cycle_type:    text('cycle_type'), // CURRENT | PREVIOUS | HISTORICAL
  notes:         text('notes'),
  local_version: integer('local_version').default(1),
  created_at:    text('created_at').notNull(),
  updated_at:    text('updated_at').notNull(),
  synced_at:     text('synced_at'),
}, (t) => ({
  idx_enterprise: index('idx_cycles_enterprise').on(t.enterprise_id),
}));

export const sales = sqliteTable('sales', {
  id:              text('id').primaryKey(),
  enterprise_id:   text('enterprise_id').notNull().references(() => enterprises.id),
  cycle_id:        text('cycle_id').references(() => production_cycles.id),
  buyer:           text('buyer'),
  channel:         text('channel'),
  volume:          real('volume'),
  unit:            text('unit'),
  price_per_unit:  real('price_per_unit'),
  currency:        text('currency').default('KES'),
  payment_method:  text('payment_method'),
  period:          text('period'),
  provenance:      text('provenance').notNull().default('FARMER_REPORTED'),
  local_version:   integer('local_version').default(1),
  created_at:      text('created_at').notNull(),
  synced_at:       text('synced_at'),
}, (t) => ({
  idx_enterprise: index('idx_sales_enterprise').on(t.enterprise_id),
}));

export const expenses = sqliteTable('expenses', {
  id:            text('id').primaryKey(),
  enterprise_id: text('enterprise_id').notNull().references(() => enterprises.id),
  cycle_id:      text('cycle_id').references(() => production_cycles.id),
  category:      text('category').notNull(),
  amount:        real('amount'),
  currency:      text('currency').default('KES'),
  frequency:     text('frequency'),
  period:        text('period'),
  provenance:    text('provenance').notNull().default('FARMER_REPORTED'),
  notes:         text('notes'),
  local_version: integer('local_version').default(1),
  created_at:    text('created_at').notNull(),
  synced_at:     text('synced_at'),
}, (t) => ({
  idx_enterprise: index('idx_expenses_enterprise').on(t.enterprise_id),
}));

// ── Financial ──────────────────────────────────────────────────────────────
export const financial_records = sqliteTable('financial_records', {
  id:           text('id').primaryKey(),
  farmer_id:    text('farmer_id').notNull().references(() => farmers.id),
  record_type:  text('record_type').notNull(),
  // SACCO_SAVINGS | BANK_SAVINGS | GROUP_SAVINGS | INCOME_SUMMARY
  institution:  text('institution'),
  amount:       real('amount'),
  currency:     text('currency').default('KES'),
  period:       text('period'),
  frequency:    text('frequency'),
  provenance:   text('provenance').notNull(),
  notes:        text('notes'),
  local_version: integer('local_version').default(1),
  created_at:   text('created_at').notNull(),
  updated_at:   text('updated_at').notNull(),
  synced_at:    text('synced_at'),
}, (t) => ({
  idx_farmer: index('idx_financial_farmer').on(t.farmer_id),
}));

export const loans = sqliteTable('loans', {
  id:               text('id').primaryKey(),
  farmer_id:        text('farmer_id').notNull().references(() => farmers.id),
  lender:           text('lender'),
  loan_type:        text('loan_type'),
  purpose:          text('purpose'),
  original_amount:  real('original_amount'),
  outstanding:      real('outstanding'),
  currency:         text('currency').default('KES'),
  instalment:       real('instalment'),
  frequency:        text('frequency'),
  status:           text('status'),
  // CURRENT | LATE | DEFAULTED | COMPLETED | RESTRUCTURED
  provenance:       text('provenance').notNull().default('FARMER_REPORTED'),
  local_version:    integer('local_version').default(1),
  created_at:       text('created_at').notNull(),
  updated_at:       text('updated_at').notNull(),
  synced_at:        text('synced_at'),
}, (t) => ({
  idx_farmer: index('idx_loans_farmer').on(t.farmer_id),
}));

export const loan_repayments = sqliteTable('loan_repayments', {
  id:           text('id').primaryKey(),
  loan_id:      text('loan_id').notNull().references(() => loans.id),
  amount:       real('amount'),
  currency:     text('currency').default('KES'),
  paid_date:    text('paid_date'),
  method:       text('method'),
  status:       text('status'),
  provenance:   text('provenance').notNull().default('FARMER_REPORTED'),
  created_at:   text('created_at').notNull(),
  synced_at:    text('synced_at'),
}, (t) => ({
  idx_loan: index('idx_repayments_loan').on(t.loan_id),
}));

// ── Evidence ───────────────────────────────────────────────────────────────
export const evidence = sqliteTable('evidence', {
  id:                  text('id').primaryKey(),
  farmer_id:           text('farmer_id').notNull().references(() => farmers.id),
  farm_id:             text('farm_id').references(() => farms.id),
  enterprise_id:       text('enterprise_id').references(() => enterprises.id),
  production_cycle_id: text('production_cycle_id').references(() => production_cycles.id),
  category:            text('category').notNull(),
  acquisition_method:  text('acquisition_method').notNull(),
  // CAMERA | FILE_PICKER | SCAN
  local_uri:           text('local_uri'),
  server_ref:          text('server_ref'),
  file_hash:           text('file_hash'),  // SHA-256 hex
  mime_type:           text('mime_type'),
  file_size_bytes:     integer('file_size_bytes'),
  source:              text('source'),     // provenance of the document itself
  document_date:       text('document_date'),
  capture_timestamp:   text('capture_timestamp').notNull(),
  agent_id:            text('agent_id').notNull(),
  gps_latitude:        real('gps_latitude'),
  gps_longitude:       real('gps_longitude'),
  verification_status: text('verification_status').default('LOCAL'),
  // LOCAL|UPLOADED|PROCESSING|VERIFIED|NEEDS_REVIEW|REJECTED
  sync_status:         text('sync_status').default('LOCAL'),
  // LOCAL|METADATA_SYNCED|UPLOADING|SYNCED|RETRY|FAILED
  notes:               text('notes'),
  local_version:       integer('local_version').default(1),
  created_at:          text('created_at').notNull(),
  synced_at:           text('synced_at'),
}, (t) => ({
  idx_farmer:     index('idx_evidence_farmer').on(t.farmer_id),
  idx_enterprise: index('idx_evidence_enterprise').on(t.enterprise_id),
  idx_sync:       index('idx_evidence_sync').on(t.sync_status),
}));

// ── Tasks & QA ─────────────────────────────────────────────────────────────
export const tasks = sqliteTable('tasks', {
  id:              text('id').primaryKey(),
  server_task_id:  text('server_task_id'),
  farmer_id:       text('farmer_id').references(() => farmers.id),
  type:            text('type').notNull(),
  priority:        text('priority').notNull(), // HIGH | MEDIUM | LOW
  due_date:        text('due_date'),
  status:          text('status').default('PENDING'),
  detail:          text('detail'),
  offline_capable: integer('offline_capable', { mode: 'boolean' }).default(true),
  completed_at:    text('completed_at'),
  created_at:      text('created_at').notNull(),
  synced_at:       text('synced_at'),
}, (t) => ({
  idx_farmer:   index('idx_tasks_farmer').on(t.farmer_id),
  idx_status:   index('idx_tasks_status').on(t.status),
  idx_priority: index('idx_tasks_priority').on(t.priority),
}));

export const qa_reviews = sqliteTable('qa_reviews', {
  id:            text('id').primaryKey(),
  farmer_id:     text('farmer_id').notNull().references(() => farmers.id),
  server_qa_id:  text('server_qa_id'),
  issue_count:   integer('issue_count').default(0),
  issues:        text('issues').notNull(), // JSON array of issue objects
  status:        text('status').default('OPEN'), // OPEN | IN_PROGRESS | RESOLVED
  created_at:    text('created_at').notNull(),
  resolved_at:   text('resolved_at'),
  synced_at:     text('synced_at'),
}, (t) => ({
  idx_farmer: index('idx_qa_farmer').on(t.farmer_id),
  idx_status: index('idx_qa_status').on(t.status),
}));

export const audit_events = sqliteTable('audit_events', {
  id:          text('id').primaryKey(),
  entity_type: text('entity_type').notNull(),
  entity_id:   text('entity_id').notNull(),
  event_type:  text('event_type').notNull(),
  agent_id:    text('agent_id').notNull(),
  device_id:   text('device_id').notNull(),
  timestamp:   text('timestamp').notNull(),
  detail:      text('detail'), // JSON
  // Immutable — no update/delete
}, (t) => ({
  idx_entity:    index('idx_audit_entity').on(t.entity_type, t.entity_id),
  idx_timestamp: index('idx_audit_timestamp').on(t.timestamp),
}));

// ── Sync Infrastructure ────────────────────────────────────────────────────
export const sync_outbox = sqliteTable('sync_outbox', {
  entry_uuid:       text('entry_uuid').primaryKey(),
  operation_uuid:   text('operation_uuid').notNull().unique(),
  entity_type:      text('entity_type').notNull(),
  entity_id:        text('entity_id').notNull(),
  mutation_type:    text('mutation_type').notNull(), // CREATE | UPDATE | DELETE
  payload:          text('payload').notNull(),       // JSON
  depends_on:       text('depends_on').default('[]'), // JSON array of operation_uuids
  local_version:    integer('local_version').default(1),
  server_baseline:  integer('server_baseline'),
  created_at:       text('created_at').notNull(),
  retry_count:      integer('retry_count').default(0),
  state:            text('state').notNull().default('PENDING_SYNC'),
  last_error:       text('last_error'),
  synced_at:        text('synced_at'),
  next_retry_at:    text('next_retry_at'),
}, (t) => ({
  idx_state:   index('idx_outbox_state').on(t.state),
  idx_entity:  index('idx_outbox_entity').on(t.entity_type, t.entity_id),
  idx_op_uuid: index('idx_outbox_op_uuid').on(t.operation_uuid),
}));

export const server_mappings = sqliteTable('server_mappings', {
  local_uuid:   text('local_uuid').notNull(),
  entity_type:  text('entity_type').notNull(),
  server_id:    text('server_id').notNull(),
  synced_at:    text('synced_at').notNull(),
}, (t) => ({
  pk:          index('idx_mappings_pk').on(t.local_uuid, t.entity_type),
  idx_server:  index('idx_mappings_server').on(t.server_id),
}));

export const collection_sessions = sqliteTable('collection_sessions', {
  id:            text('id').primaryKey(),
  farmer_id:     text('farmer_id').references(() => farmers.id),
  current_step:  text('current_step').notNull().default('consent'),
  step_states:   text('step_states').default('{}'), // JSON step completion map
  started_at:    text('started_at').notNull(),
  updated_at:    text('updated_at').notNull(),
}, (t) => ({
  idx_farmer: index('idx_sessions_farmer').on(t.farmer_id),
}));

export const app_config = sqliteTable('app_config', {
  key:        text('key').primaryKey(),
  value:      text('value').notNull(),
  updated_at: text('updated_at').notNull(),
});
```

### Migration Strategy

Migrations live in `lib/db/migrations/` as sequential numbered SQL files:
- `0001_initial.sql` — creates all tables above
- `0002_*.sql` — each future schema change is additive (new columns, new tables)
- Never DROP or rename existing columns in production migrations — add new columns with defaults instead
- On app start, `database.ts` runs `drizzle-kit migrate` against the current database
- Draft farmer records are never deleted by a migration; all schema changes are backward-compatible

---

## D. Sync Protocol

### Outbox Write Pattern

```typescript
// Every repository mutation follows this pattern:
async function createFarmer(data: NewFarmer): Promise<string> {
  const farmerId = uuid();
  const operationUuid = uuid();

  await db.transaction(async (tx) => {
    await tx.insert(farmers).values({ id: farmerId, ...data });
    await tx.insert(sync_outbox).values({
      entry_uuid:     uuid(),
      operation_uuid: operationUuid,
      entity_type:    'farmer',
      entity_id:      farmerId,
      mutation_type:  'CREATE',
      payload:        JSON.stringify({ id: farmerId, ...data }),
      depends_on:     '[]',
      state:          'PENDING_SYNC',
      created_at:     new Date().toISOString(),
    });
  });

  return farmerId;
}
```

### Dependency Chain (depends_on)

```
farmer_op_uuid = createFarmer()        depends_on: []
farm_op_uuid   = createFarm()          depends_on: [farmer_op_uuid]
ent_op_uuid    = createEnterprise()    depends_on: [farm_op_uuid]
resp_op_uuid   = saveSectorResponse()  depends_on: [ent_op_uuid]
evid_op_uuid   = createEvidence()      depends_on: [ent_op_uuid]
```

### State Machine Transitions

```
LOCAL_DRAFT     → PENDING_SYNC   when wizard step submitted
PENDING_SYNC    → SYNCING        when SyncEngine picks up entry and begins HTTP request
SYNCING         → SYNCED         on HTTP 2xx; server_mappings written
SYNCING         → RETRY          on network error / HTTP 5xx / timeout
SYNCING         → CONFLICT       on HTTP 409 where server_version differs from expected
RETRY           → PENDING_SYNC   after exponential backoff expires AND connectivity available
PENDING_SYNC    → FAILED_PERMANENTLY after retry_count >= 10
```

### MSID Reconciliation Flow

```
1. SyncEngine picks up farmer CREATE from outbox
2. HTTP POST /farmers { operation_uuid, local_uuid, ...payload }
3. Server responds { msid: "MS-KE-004829", operation_uuid }
4. SyncEngine writes to server_mappings:
   { local_uuid: farmerId, entity_type: 'farmer', server_id: 'MS-KE-004829' }
5. Marks outbox entry as SYNCED
6. On next outbox pass, farm CREATE entries are found
7. SyncEngine looks up server_mappings for farmer FK → gets "MS-KE-004829"
8. Enriches farm payload with resolved farmer_msid before sending
```

### Evidence Binary Upload

```
Phase 1 — Metadata sync:
  SyncEngine picks up evidence CREATE outbox entry
  POST /evidence/request-upload { evidence_id, farmer_id, category, mime_type, file_hash, file_size }
  Server returns { presigned_url, evidence_server_id, expires_at }  ← held in memory only

Phase 2 — Binary upload:
  PUT <presigned_url> (binary file bytes)
  On success: POST /evidence/confirm { evidence_server_id, etag }
  Update evidence row: server_ref = evidence_server_id, sync_status = 'SYNCED'
  Clear presigned_url from memory immediately

On failure at either phase:
  Mark evidence sync_status = 'RETRY'
  On retry: request fresh presigned_url from Phase 1 (never reuse expired URL)
```

---

## E. Sector Engine

### Schema Type System

```typescript
export type FieldType =
  | 'text' | 'number' | 'boolean' | 'select' | 'multi_select'
  | 'date' | 'currency' | 'unit_number' | 'stepper' | 'gps_point'
  | 'camera' | 'signature' | 'document' | 'season' | 'repeatable_group';

export interface ConditionalRule {
  fieldId: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'includes';
  value: unknown;
}

export interface SchemaField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  unit?: string;
  unitOptions?: string[];
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  provenanceOptions?: ProvenanceSource[];
  evidencePrompt?: string;
  conditionalOn?: ConditionalRule;
  hint?: string;
  subFields?: SchemaField[];  // for repeatable_group
}

export interface SectorSection {
  id: string;
  label: string;
  fields: SchemaField[];
}

export interface SectorSchema {
  id: string;          // 'dairy' | 'maize' | etc.
  version: string;     // semver '1.0.0'
  label: string;
  icon: string;
  sections: SectorSection[];
}
```

### All 14 Sector Schema Outlines

**1. Dairy** — sections: Herd (total cattle, dairy cattle, lactating, dry, heifers, calves, breeds), Milk Production (litres/day morning/evening, seasonal high/low), Milk Sales (buyer, litres delivered, price/litre, payment cycle), Costs (feed, veterinary, AI/breeding, labour, water, transport), Animal Health (vaccinations, vet access, disease history), Assets (cowshed, chaff cutter, milking equipment, cooling), Evidence (delivery statement, payment record, livestock photo)

**2. Maize** — sections: Crop (acreage planted/harvested, variety, seed source, irrigation), Production (planting date, harvest date, bags/kg harvested, yield/acre, losses, storage), Sales (quantity sold, buyer, channel, price, timing), Costs (seed, fertilizer, pesticides, labour, mechanization, transport), Risk (drought history, pest/disease incidence, post-harvest loss)

**3. Tea** — sections: Plantation (acreage productive, factory, buying centre, co-op), Production (green leaf kg/month, delivery frequency, seasonal variation), Sales (price/kg, monthly payment, bonus cycle, bonus history), Costs (fertilizer, plucking, labour, transport), Evidence (factory statement, buying-centre receipts)

**4. Coffee** — sections: Plantation (acreage, tree count, productive trees, variety, age), Season (flowering period, harvest cycle, cherry production), Cooperative (factory, cooperative, processor, buyer), Sales (kg delivered, cherry price, payment timing, advances, bonuses), Costs (fertilizer, pesticides, pruning, labour, transport), Evidence (factory delivery records, payment statements)

**5. Avocado** — sections: Orchard (acreage, tree count, productive trees, variety, planting year), Production (harvest season, cycles, kg/fruits per cycle, export-grade %), Buyer (buyer/exporter, contracted, price, payment cycle), Costs (fertilizer, pest management, pruning, labour, transport, certification), Evidence (buyer delivery records, certification docs)

**6. Rice** — sections: Paddy (acreage, variety, scheme, irrigated/rain-fed, water source), Production (planting method, planting/harvest dates, kg/bags, yield, milling arrangement), Sales (quantity sold, buyer, price, storage, household consumption), Costs (seed, fertilizer, pesticides, labour, irrigation charges, machinery, transport), Risk (flood/drought exposure)

**7. Irish Potato** — sections: Crop (acreage, variety, seed source), Cycle (planting date, harvest date, cycle length), Production (bags/kg harvested, yield/acre, historical cycles, losses), Sales (buyer, broker/market, price, sales timing, storage), Costs (seed, fertilizer, fungicide/pesticide, labour, transport), Risk (blight history, post-harvest losses)

**8. Poultry** — sections: Production Type (layers/broilers/indigenous/dual-purpose), Flock (current birds, batch size, age, breed, mortality), Output — conditional on type: Layers (eggs/day, trays/day, laying rate, eggs sold, price) OR Broilers (birds/cycle, live weight, price, cycle length), Costs (chicks, feed, vaccination, veterinary, labour, electricity, housing, transport), Health (vaccination schedule, disease history, biosecurity), Evidence (feed receipts, vet records, buyer receipts)

**9. Tomato** — sections: Crop (acreage, variety, greenhouse/open, plants, irrigation), Production (planting date, harvest period, cycle, kg/crates, frequency, rejected/spoiled), Buyer (buyer, market, price, price variation, perishability losses), Costs (seed/seedlings, fertilizer, pesticide/fungicide, labour, packaging, transport), Access (cold-chain, market access, certification)

**10. Macadamia** — sections: Orchard (acreage, tree count, productive trees, variety, age), Harvest (season, kg/cycle, historical, quality/grade, rejected), Buyer (buyer/processor, price, payment cycle, certification), Costs (fertilizer, pruning, pest management, labour, transport), Evidence (buyer delivery records)

**11. Aquaculture** — sections: System (species, system type pond/cage/tank, count, pond size, stocking capacity), Cycle (fingerlings stocked, stocking date, survival/mortality, cycle length, harvest date, kg/fish harvested, average weight), Sales (buyer, price/kg), Costs (feed, fingerlings, water/electricity, veterinary, labour, transport), Environment (water source, water reliability, disease history, cold-chain access), Evidence (pond photos, stocking receipts, sales records)

**12. Livestock Meat** — sections: Herd (species cattle/goat/sheep/pig, breed, numbers, age classes, breeding stock), Turnover (animals purchased, animals sold, mortality, production cycle), Sales (buyer, market, price, sale frequency, average weight), Costs (feed, grazing, veterinary, vaccination, water, transport), Health (disease history, vaccination, pasture availability, insurance), Evidence (livestock photos, vet records, market records)

**13. Beans** — sections: Crop (acreage, variety, seed source, planting/harvest dates, cycle), Production (kg/bags harvested, yield, historical cycles, household consumption, storage, post-harvest loss), Sales (quantity sold, buyer, price, market channel), Costs (seed, fertilizer, pesticides, labour, irrigation), Risk (rainfall dependence, disease/pest incidence)

**14. Horticulture (Configurable)** — sections: Crop Setup (crop type — free text, variety, acreage, greenhouse/open, irrigation), Production (planting date, harvest cycle, frequency, kg/crates/pieces, quality/grade, rejected), Buyer (buyer, contract/offtake, market, price, perishability, post-harvest losses), Costs (seed/seedlings, fertilizer, crop protection, labour, packaging, transport, certification, irrigation costs), Access (cold-chain, certification, market access)

---

## F. API Contracts

### Adapter Interface (`lib/api/ApiClient.ts`)

```typescript
export interface MkulimaScoreApi {
  // Auth
  authenticate(c: AgentCredentials): Promise<AuthResult>;
  refreshSession(refreshToken: string): Promise<AuthResult>;
  revokeDevice(deviceId: string): Promise<void>;

  // Bootstrap
  getBootstrapConfig(agentId: string): Promise<BootstrapConfig>;
  getAssignedFarmers(agentId: string, since?: string): Promise<FarmerAssignment[]>;
  getSectorSchemas(since?: string): Promise<SectorSchemaBundle>;
  getTasks(agentId: string, since?: string): Promise<TaskAssignment[]>;

  // Farmer
  createFarmer(payload: CreateFarmerPayload): Promise<FarmerSyncResult>;
  updateFarmer(msid: string, payload: UpdateFarmerPayload): Promise<FarmerSyncResult>;
  checkDuplicates(signals: DuplicateSignals): Promise<DuplicateCandidate[]>;

  // Farm
  createFarm(payload: CreateFarmPayload): Promise<FarmSyncResult>;
  updateFarmGeometry(farmId: string, geo: GeoPolygon): Promise<void>;

  // Enterprise
  createEnterprise(payload: CreateEnterprisePayload): Promise<EnterpriseSyncResult>;
  submitSectorResponse(payload: SectorResponsePayload): Promise<SectorResponseResult>;

  // Evidence
  requestEvidenceUploadUrl(meta: EvidenceMetadata): Promise<PresignedUploadResult>;
  confirmEvidenceUpload(evidenceId: string, serverRef: string, etag: string): Promise<void>;

  // Sync batch
  submitSyncBatch(batch: SyncBatch): Promise<SyncBatchResult>;

  // QA
  submitQaResolution(qaId: string, payload: QaResolutionPayload): Promise<void>;
}
```

Three adapter implementations exist:
- `LocalDevelopmentAdapter` — returns hardcoded dev data; no network calls
- `MockRemoteAdapter` — returns configurable responses; supports error injection for testing
- `ProductionApiAdapter` — real HTTP client mapping to MkulimaScore FastAPI; implemented when backend endpoints are provided

Active adapter is selected by `EXPO_PUBLIC_ENVIRONMENT` env var.

---

## G. Security Model

See `.kiro/steering/security.md` for the full threat model. Summary of architectural decisions:

| Concern | Decision |
|---|---|
| Auth tokens | expo-secure-store only (Android Keystore backed) |
| M-PESA password | In-memory useState only; cleared on API call completion |
| National ID | SHA-256 hash stored; last 3 digits displayed; raw value not persisted |
| Evidence URLs | In-memory during upload only; presigned URL TTL ≤ 15 minutes |
| SQLite data | App-private directory; `android.allowBackup: false` |
| Session timeout | 8 hours idle; biometric or PIN to resume |
| Device revocation | Next API call returns 401; client clears session and redirects to login |
| Idempotency | operation_uuid on every CREATE prevents duplicate records on retry |

---

## H. Offline Behavior Specification

### Always Available Offline

| Action | How |
|---|---|
| Create new farmer (all wizard steps) | Writes to SQLite; sync_outbox entry created |
| Edit existing farmer (cached locally) | SQLite read/write; outbox updated |
| Capture GPS point | expo-location; stored in SQLite |
| Capture GPS boundary (walk/draw) | expo-location subscription; polygon stored in SQLite |
| Capture photos, scan documents | expo-camera + expo-file-system; local_uri stored |
| Complete any sector form | Drizzle write; sector_collection_responses row |
| Record consent with signature | SQLite; signature image stored locally |
| Complete financial module | SQLite writes |
| Add/edit farms and enterprises | SQLite writes |
| Mark tasks done | SQLite update |
| View all assigned farmers | Reads from SQLite; FlashList |
| View sync status | Reads sync_outbox counts from SQLite |
| View quality queue | Reads qa_reviews from SQLite |

### Requires Connectivity

| Action | Graceful degradation |
|---|---|
| Initial device registration | Cannot proceed; shown on device-setup screen |
| First-time login | Cannot proceed; clear offline message shown |
| Fetch new task assignments | Show stale cached tasks with "last updated" timestamp |
| Duplicate farmer check | Skip silently; server checks on sync |
| Upload sync queue | Queue grows; shown in Sync Centre |

### Autosave Rules

- Every form field change writes a debounced save (300ms) to the `collection_sessions` step_states JSON
- On wizard step completion (tapping "Continue"), full entity is written to its SQLite table + outbox
- On "Save & exit", current step state is persisted to collection_sessions; farmer status stays IN_PROGRESS
- App kill between field changes loses at most 300ms of typing — not a full step

---

## I. Test Strategy

See `.kiro/steering/testing.md` for the full test specification.

Key correctness properties validated by tests:

1. **Atomicity**: farmer row + outbox entry always created together, never one without the other
2. **Idempotency**: same operation_uuid submitted twice produces exactly one server record
3. **ID stability**: local_uuid never changes; server_id stored separately in server_mappings
4. **Evidence integrity**: SHA-256 hash validated on upload; mismatch rejects the upload
5. **Dependency order**: sync engine never sends enterprise before its farm is SYNCED
6. **Conflict safety**: financial records are never auto-merged; always flagged for human review
7. **Schema versioning**: old sector_collection_responses preserved when schema version changes
8. **Completeness accuracy**: known entity states produce expected completeness percentages
9. **Migration safety**: existing draft records survive any schema migration

---

## Self-Review: 20 Validation Questions

1. **Can a farmer be created with no internet?** Yes — all wizard steps write to SQLite; outbox queues for later sync.

2. **Can the app be killed immediately afterward without losing the farmer?** Yes — SQLite writes are synchronous and committed before the success screen renders; autosave writes step state every 300ms.

3. **Can multiple farms be added?** Yes — farms table has farmer_id FK with no uniqueness constraint; UI in Farms tab supports "+ Add farm".

4. **Can one farm have Dairy and Maize?** Yes — enterprises table has farm_id FK; multiple enterprises per farm is a valid and tested state.

5. **Can another farm have Avocado?** Yes — enterprises table supports any sector value; Avocado schema loaded from sector engine by sector ID.

6. **Can GPS boundaries be captured with no map tiles?** Yes — GPS polygon capture uses expo-location subscription and SVG overlay; MapLibre basemap is optional (graceful degradation when tiles unavailable).

7. **Can media remain safely queued for later upload?** Yes — evidence records stored in SQLite with sync_status='LOCAL'; file stored in app-private document directory; FileUploadQueue processes on connectivity.

8. **Can sync retry without duplicating records?** Yes — operation_uuid idempotency key sent on every request; server deduplicates; client checks server_mappings before re-submitting a CREATE.

9. **Can a locally created farmer later receive an MSID?** Yes — server_mappings table stores {local_uuid, entity_type, server_id}; SyncEngine populates this after first successful farmer sync; all child records resolved accordingly.

10. **Can a new sector be added without rewriting the form engine?** Yes — add a new schema file in features/sector-engine/schemas/, register it in SectorSchemaRegistry; FieldRenderer handles all field types generically.

11. **Is every important datum attributable to a source?** Yes — provenance column on sales, expenses, loans, financial_records, and farm size; provenanceOptions on schema fields; ProvenanceSelect form component.

12. **Is proprietary scoring information absent from the app?** Yes — sector schemas contain collection fields only; no weights, thresholds, or score formulas exist anywhere in apps/collect/; enforced by IP protection steering.

13. **Can verified central evidence avoid silent overwrite?** Yes — evidence with verification_status='VERIFIED' requires explicit agent confirmation before a new local upload replaces it; ConflictResolver checks this.

14. **Can a lost agent device be revoked?** Yes — revokeDevice() API call from admin; next sync attempt receives 401; client clears session, deletes tokens, redirects to login.

15. **Can the system migrate the SQLite schema without deleting drafts?** Yes — all migrations are additive (new columns with defaults, new tables); no DROP or destructive ALTER; tested in migration integration tests.

16. **Can the app operate with 500 assigned farmers?** Yes — FlashList with recycled item views; SQLite indexed by agent_id and status; completeness_pct cached in farmers table; tested in 500-farmer E2E scenario.

17. **Can an agent tell what is synced and what is not?** Yes — amber dot on farmer card when unsynced; Sync Centre shows per-record state; ConnectivityIndicator always visible; SyncBanner on home screen.

18. **Are M-PESA processing credentials non-persistent by default?** Yes — password held only in useState; transmitted to server over HTTPS; cleared immediately on API call completion; never written to SQLite, SecureStore, or logs.

19. **Is every production dependency justified?** Yes — see tech.md for full dependency table with rationale; no duplicate-purpose packages; all Expo SDK packages preferred.

20. **Is the first vertical slice small enough to build and prove properly?** Yes — Phase 0 (foundation) + Phase 1 (vertical slice) defined as T001–T030 in tasks.md; scope is one complete farmer with Dairy sector, GPS boundary, evidence capture, offline submission, and sync.



