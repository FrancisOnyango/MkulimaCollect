# MkulimaCollect — Domain Model Steering

## Hierarchy

```
Agent
└── Farmers (assigned)
    ├── Consent (one active per farmer)
    ├── FarmerIdentity (one per farmer)
    ├── Memberships (many: SACCOs, co-ops, groups)
    ├── Farms (many)
    │   ├── FarmGeometry (one per farm)
    │   └── Enterprises (many; a farm can have multiple)
    │       ├── ProductionCycles (many per enterprise)
    │       │   ├── Observations (many: yield, sales, losses)
    │       │   ├── Sales (many)
    │       │   └── Expenses (many)
    │       ├── SectorCollectionResponses (many; versioned schema answers)
    │       └── Evidence (many; linked to enterprise)
    ├── FinancialRecords (many: savings, income summaries)
    ├── Loans (many)
    │   └── LoanRepayments (many per loan)
    ├── Evidence (many; farmer-level)
    ├── Tasks (many; assigned to agent for this farmer)
    ├── QaReviews (many; correction requests)
    └── AuditEvents (many; immutable activity log)

SyncOutbox (global; one row per pending mutation)
ServerMappings (global; local_uuid → server_id)
AppConfig (key/value; bootstrap, schema versions)
```

## Identity and IDs

- Every entity uses a **UUID v4** generated on the client as its primary key
- The UUID is permanent and never changes, even after server sync
- The canonical MkulimaScore ID (`msid`, e.g. `MS-KE-004829`) is stored separately in `server_mappings` after sync
- **National ID number is never a primary key** — it is an attribute stored as a hash (SHA-256) with only last 3 digits displayable
- Phone number and name are matching signals, not identifiers

## Provenance (Data Source Tagging)

Every field that represents a material claim must carry a `provenance` tag:

```typescript
type ProvenanceSource =
  | 'FARMER_REPORTED'
  | 'AGENT_OBSERVED'
  | 'GPS_MEASURED'
  | 'DOCUMENT'
  | 'COOPERATIVE'
  | 'SACCO'
  | 'BUYER'
  | 'PROCESSOR'
  | 'AUTHORIZED_FINANCIAL_RECORD'
  | 'INSTITUTIONAL_REGISTRY'
  | 'OTHER_APPROVED_SOURCE';
```

Provenance is **collection metadata** — it describes the chain of custody of the data point. It is NOT a scoring confidence value and must NOT be presented as one.

## Entity Rules

### Farmer
- Created offline with `local_uuid`; `msid` arrives after sync
- `status` reflects collection state: `DRAFT | IN_PROGRESS | SUBMITTED | VERIFIED | NEEDS_CORRECTION`
- `completeness_pct` is computed from section completion, never manually set
- Duplicate matching is a server-side concern; client shows candidates but never silently merges

### Farm
- One farmer may have many farms; the same farmer may grow the same crop on different farms
- `size_reported_acres` and `size_gps_acres` are stored separately and never overwrite each other
- A farm without a captured geometry is valid and completable

### FarmGeometry
- Stores raw polygon as GeoJSON `coordinates` array (JSON string)
- `calculation_method`: 'WALK_BOUNDARY' | 'DRAW_ON_MAP' | 'SINGLE_POINT'
- `accuracy_meters` is the worst GPS fix accuracy during capture
- `area_calculated_acres` is computed client-side from polygon; server may recompute with PostGIS

### Enterprise
- An enterprise belongs to one farm (where it is operated) and one farmer (for reporting)
- `sector` is the value-chain identifier: 'dairy' | 'maize' | 'tea' | ... (see sectorIds.ts)
- One farm CAN have multiple enterprises (Dairy + Maize on the same 2.4 acre farm is valid)
- `primary_enterprise: boolean` — farmer's most important income enterprise

### SectorCollectionResponse
- Stores the answers to a sector schema as a JSON blob keyed by `schema_id` + `schema_version`
- If the schema version changes, old responses are preserved with their original version tag
- New responses are created for the new version; old ones remain for audit

### Evidence
- An evidence item is a first-class entity, not a field attachment
- Categories: NATIONAL_ID | CONSENT | FARM_PHOTO | LIVESTOCK | CROP | COOPERATIVE_RECORD | SACCO_RECORD | BUYER_RECORD | DELIVERY_RECORD | PAYMENT_STATEMENT | MPESA_STATEMENT | BANK_DOCUMENT | SALES_RECEIPT | INPUT_RECEIPT | VETERINARY_RECORD | PRODUCTION_RECORD | LOAN_RECORD | REPAYMENT_RECORD | CERTIFICATION | TITLE_LEASE | OTHER
- `verification_status`: LOCAL | UPLOADED | PROCESSING | VERIFIED | NEEDS_REVIEW | REJECTED
- `sync_status`: LOCAL | METADATA_SYNCED | UPLOADING | SYNCED | RETRY | FAILED
- Server-VERIFIED evidence cannot be overwritten by a local re-upload without explicit agent confirmation

### Consent
- The single most critical entity; no scoring-related collection proceeds without consent
- `version` must match the current active consent schema version from server bootstrap
- `declined: boolean` — if true, only administrative metadata is stored; no collection proceeds
- Consent GPS coordinates record WHERE consent was given (provenance of the consent act itself)

### Loan
- `provenance` distinguishes FARMER_REPORTED from SACCO / AUTHORIZED_FINANCIAL_RECORD
- Outstanding balance and repayment status from farmer-reported sources are explicitly flagged as unverified
- Never display farmer-reported loan data as verified without an evidence link

### AuditEvent
- Immutable; once written, never updated or deleted
- Covers: entity created, entity updated, evidence added, consent recorded, sync attempted, sync completed, QA issue raised, QA resolved, session started, session ended
- Agent ID and device ID are always recorded

## Completeness Calculation

Profile completeness is computed as a weighted average across sections:

| Section | Weight |
|---|---|
| Identity + Consent | 20% |
| Location + Membership | 10% |
| Farm (at least one) | 15% |
| Enterprise (at least one) | 20% |
| Production (current cycle) | 20% |
| Financial | 10% |
| Evidence (minimum required) | 5% |

Completeness is recalculated on every save. It is a **collection quality metric** — not a creditworthiness indicator. Never label it as a score or rating.

## Version Tracking

Every entity table includes:
- `local_version: INTEGER` — incremented on every local mutation
- `server_version: INTEGER | NULL` — last known server version (null until first sync)
- `updated_at: TEXT` — ISO 8601 timestamp of last local change
- `synced_at: TEXT | NULL` — ISO 8601 timestamp of last successful sync

These fields drive conflict detection in the sync engine.
