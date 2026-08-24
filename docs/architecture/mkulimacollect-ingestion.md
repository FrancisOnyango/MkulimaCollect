# MkulimaCollect to MkulimaScore Ingestion Architecture

Date: 2026-08-24
Status: Proposed for staging implementation. Not approved for production deployment.

## Decision

MkulimaCollect must feed MkulimaScore through a controlled mobile ingestion layer. The mobile app must not write directly to canonical MkulimaScore tables, must not receive PostgreSQL credentials, must not receive AWS IAM credentials, and must not contain scoring logic.

MkulimaCollect is a separate offline-first mobile product. Its responsibility is trusted field evidence capture: identity, consent, farm location, GPS boundaries, enterprises, SACCO/cooperative relationships, buyer relationships, production observations, farm assets, photos/documents, enumerator notes, and monitoring visits. It never decides credit outcomes and never receives scoring weights, parsing internals, model features, or institution risk policy.

The intended flow is:

```text
MkulimaCollect SQLite outbox
  -> MkulimaScore Mobile API
  -> ingestion schema and private evidence storage
  -> validation, normalization, identity resolution, QA
  -> canonicalization through existing domain services
  -> existing MkulimaScore platform and assessment services
```

## Current Backend Architecture

Backend source code is not present in this workspace. The live backend was audited through AWS Elastic Beanstalk metadata and the public OpenAPI surface exposed by the deployed API.

Observed backend:

- Application: `mkulimascore-backend`
- Environment: `mkulimascore-api-prod`
- Runtime: Elastic Beanstalk Python 3.11 on 64-bit Amazon Linux 2023
- Health: Green / Ready
- Public API: `http://mkulimascore-api-295552411264.us-east-1.elasticbeanstalk.com`
- Docs: `/docs`
- OpenAPI: `/api/v1/openapi.json`
- Auth: OAuth2 password bearer token at `/api/v1/auth/login/access-token`
- Current mobile namespace: not present in the observed OpenAPI contract

Source-level items still requiring backend repository access:

- FastAPI app module and router layout
- SQLAlchemy models and repositories
- Alembic migration conventions
- domain service boundaries
- background worker framework
- existing test fixtures and CI/CD deployment scripts

## Current AWS Architecture

Observed account: `295552411264`, region `us-east-1`.

Observed services:

- Frontend Elastic Beanstalk app: `mkulimascore-frontend`
- Frontend environment: `mkulimascore-web-live`
- Frontend runtime: Node.js 22 on Amazon Linux 2023
- Backend Elastic Beanstalk app: `mkulimascore-backend`
- Backend environment: `mkulimascore-api-prod`
- Backend runtime: Python 3.11 on Amazon Linux 2023
- RDS: PostgreSQL instance `mkulimascore-live-db`, database name `mkulimascore`
- S3:
  - `elasticbeanstalk-us-east-1-295552411264`
  - `mkulimascore-deploy-295552411264-us-east-1`
  - `mkulimascore-raw-artifacts-295552411264-us-east-1`
- API Gateway/Lambda: none observed in `us-east-1`
- CloudFormation: Elastic Beanstalk stacks only observed

AWS items still to confirm before staging implementation:

- staging environment availability
- SQS queues or existing worker infrastructure
- load balancer and DNS details
- CloudWatch log groups, metrics, alarms
- Secrets Manager/Elastic Beanstalk secret wiring
- RDS PostgreSQL version and PostGIS extension status
- IAM role permissions for S3 presigned uploads and worker processing

## Current Authentication

The live API uses OAuth2 password bearer semantics:

- Login endpoint: `POST /api/v1/auth/login/access-token`
- Current-user endpoint: `GET /api/v1/auth/me`
- Token schema: `access_token`, `token_type`

Observed user model includes:

- `id`
- `email`
- `full_name`
- `institution_id`
- `role_name`
- `dashboard_role`
- `product_entitlements`

Required backend work:

- add or confirm a field-agent role
- enforce tenant and assignment authorization server-side
- do not trust `orgId` supplied by mobile as an authorization source
- implement token revocation/refresh policy if not already present

## Canonical Model Mapping

This mapping is based on observed OpenAPI endpoints, not source models.

| Required concept | Observed API/model equivalent | Gap | Required extension |
| --- | --- | --- | --- |
| Farmer / MSID | `/api/v1/farmers/`, `FarmerCreate` | identity resolution gate unclear | mobile ingestion resolves before canonical create |
| Farmer identity | `/api/v1/identity/references` | duplicate workflow unclear | identity candidate and review tables |
| Consent | not clearly exposed as first-class endpoint | consent provenance needed | ingestion validation and canonical provenance |
| Farm | farmer geo endpoints and canonical network graph | direct farm create path unclear | canonicalization service maps mobile farm payload |
| Farm geometry | `/api/v1/geo/*`, farmer geo-context | PostGIS status unknown | geometry validation and normalization |
| Enterprise | network production-cycle/evidence endpoints imply enterprise linkage | mobile enterprise create path unclear | canonicalization maps sector/farm relationship |
| Production cycle | `/api/v1/network/{institution_id}/production-cycles` | direct mobile writes not acceptable | ingestion operation then canonicalization |
| Production observation | score/feature/signal endpoints | raw observation staging missing | ingestion operation and validation result |
| Expense/sale | signals/features and network events | domain model unclear | normalize as evidence-backed production/financial signals |
| Affiliation | institution/ecosystem APIs | field affiliation mapping unclear | ingestion normalization and identity signals |
| Evidence | `/api/v1/network/{institution_id}/evidence`, `/api/v1/uploads/upload-file` | needs presigned flow and incoming status | mobile evidence authorization/finalize endpoints |
| Assessment | `/api/v1/scores/*`, `/api/v1/pipeline/ingest-score` | must remain server-side | triggered after canonicalization only |
| Audit event | governance/audit endpoints observed | ingestion audit model unclear | add ingestion audit events |
| QA/review | governance review queue endpoints observed | mobile-specific queue unclear | create review/correction states |

## Existing APIs

Observed relevant API groups:

- Authentication: `/api/v1/auth/*`
- Users/RBAC: `/api/v1/users/*`, `/api/v1/roles/*`
- Institutions/products: `/api/v1/institutions/*`, `/api/v1/institution-products/*`
- Farmers: `/api/v1/farmers/*`
- Identity: `/api/v1/identity/*`
- Canonical network: `/api/v1/network/{institution_id}/*`
- Scores and score engine: `/api/v1/scores/*`
- Pipeline ingest-score: `/api/v1/pipeline/ingest-score`
- Uploads: `/api/v1/uploads/*`
- Geo: `/api/v1/geo/*`
- Governance/review/audit: `/api/v1/governance/*`
- Platform health/status: `/health`, `/health/live`, `/health/ready`, `/api/v1/platform/status`

## APIs That Need Extension

Add a versioned mobile namespace in staging first:

```text
POST /api/v1/mobile/bootstrap
POST /api/v1/mobile/sync
GET  /api/v1/mobile/sync/{submission_id}
GET  /api/v1/mobile/assignments
GET  /api/v1/mobile/tasks
POST /api/v1/mobile/evidence/upload-authorization
POST /api/v1/mobile/evidence/{evidence_id}/finalize
```

These endpoints should persist raw submissions, enforce idempotency, and return receipt/canonicalization state. They should not directly expose canonical write endpoints to the phone.

Bootstrap should return the current user, institution/team, permissions, enabled sectors, form schema versions, validation rules, lookup lists, administrative geography, cooperative/SACCO registry references, supported evidence types, sync cursor, and minimum app version.

Assignments should support field workflows such as new farmer onboarding, profile completion, farm verification, SACCO membership verification, production update, geo refresh, loan monitoring visits, evidence recheck, and consent refresh.

## Proposed Ingestion Tables

Use the existing PostgreSQL/RDS instance, with a logically separated `ingestion` schema. Table names should follow backend conventions after source inspection.

Proposed additive tables:

```text
ingestion.mobile_devices
ingestion.mobile_sessions
ingestion.mobile_assignments
ingestion.mobile_tasks
ingestion.mobile_sync_batches
ingestion.mobile_sync_items
ingestion.mobile_sync_conflicts
ingestion.mobile_evidence_uploads
ingestion.staging_farmer_records
ingestion.staging_identity_records
ingestion.staging_farm_records
ingestion.staging_enterprise_records
ingestion.staging_sacco_memberships
ingestion.staging_buyer_relationships
ingestion.staging_consent_records
ingestion.staging_monitoring_visits
ingestion.staging_data_quality_flags
ingestion.validation_results
ingestion.identity_candidates
ingestion.processing_errors
ingestion.canonicalization_results
ingestion.audit_events
```

Minimum data:

- submission UUID
- operation UUID
- idempotency key
- agent id
- device id
- institution id from authenticated user
- app version
- schema version
- client-created timestamp
- server-received timestamp
- raw payload
- normalized payload
- lifecycle status
- correlation id
- dependency links
- canonical mapping results
- review status and lifecycle state

## Data Lifecycle

Backend lifecycle states:

```text
RECEIVED
VALIDATING
NORMALIZING
IDENTITY_RESOLUTION
NEEDS_CORRECTION
NEEDS_REVIEW
REJECTED
ACCEPTED
INGESTED
CANONICALIZED
```

Mobile user-facing states can remain simpler:

```text
Saved locally
Waiting to sync
Synced
Processing
Complete
Needs attention
```

## Evidence Flow

The phone must not send large files in JSON and must not receive AWS credentials.

Staging target flow:

```text
POST /mobile/evidence/upload-authorization
  -> server validates auth and metadata
  -> server creates ingestion.evidence_receipts row
  -> server returns short-lived private S3 presigned PUT URL

MkulimaCollect uploads file to private S3 incoming path

POST /mobile/evidence/{evidence_id}/finalize
  -> server verifies object metadata/hash when practical
  -> evidence state becomes RECEIVED
  -> evidence processing/canonicalization happens asynchronously
```

Suggested S3 key shape:

```text
incoming/mobile/yyyy/mm/{submission_id}/{evidence_id}/{safe_filename}
```

## Sync Contract

Request:

```json
{
  "device_id": "uuid",
  "sync_batch_id": "batch_20260824_001",
  "app_version": "0.1.0",
  "client_time": "2026-08-24T00:00:00.000Z",
  "baseline_cursor": "cursor_123",
  "changes": [
    {
      "local_id": "uuid",
      "operation_id": "uuid",
      "idempotency_key": "uuid",
      "entity_type": "farmer_profile_draft",
      "operation": "upsert",
      "depends_on": [],
      "baseline_version": null,
      "schema_version": "dairy-field-v1",
      "payload": {}
    }
  ]
}
```

Response:

```json
{
  "sync_batch_id": "batch_20260824_001",
  "status": "accepted",
  "server_cursor": "cursor_124",
  "correlation_id": "uuid",
  "results": [
    {
      "local_id": "uuid",
      "operation_id": "uuid",
      "server_entity_id": "MS-FMR-000245",
      "status": "accepted",
      "server_version": 1,
      "warnings": []
    }
  ],
  "rejected": [],
  "conflicts": []
}
```

The mobile app treats `received`, `accepted`, `processing`, `ingested`, and `canonicalized` as server acknowledgements. `needs_correction`, `needs_review`, `conflict`, and `rejected` remain attention states.

## Idempotency

Each operation uses `operation_id` as the idempotency key. The backend must persist the request hash and outcome. Repeated keys must return the original result and must not create duplicate canonical records.

Required tests:

- response loss followed by retry
- duplicate operation in same batch
- duplicate operation across submissions
- child operation before parent canonicalization

## Validation And Normalization

Validation must cover:

- JSON/schema structure
- supported sector schema version
- consent presence and scope
- coordinate and polygon validity
- domain ranges such as negative production, impossible farm sizes, invalid dates
- evidence metadata and file constraints
- tenant/assignment authorization

Normalization should preserve raw values and create separate normalized values for:

- phone numbers
- units and areas
- currency
- dates
- sector codes
- administrative geography
- source/provenance classifications

## Identity Resolution

Mobile local farmer UUIDs are temporary. The server controls MSID assignment.

Resolution signals may include:

1. existing MSID
2. national identity hash
3. phone plus date of birth where available
4. cooperative/SACCO membership number
5. institutional farmer number
6. household/farm linkage
7. manual review

Uncertain matches create review candidates. Never silently merge uncertain farmers.

Name matching is only a weak review signal and should not auto-create or auto-merge canonical identity on its own.

## SACCO And Cooperative Logic

MkulimaCollect should capture SACCO/cooperative name, id, branch/location, membership number, status, join date, role, and consent to share.

Backend behavior:

- link to an existing SACCO/cooperative when a trusted registry match exists
- create a pending cooperative record when the organization is new or uncertain
- reconcile existing membership numbers under the appropriate institution/ecosystem
- enforce consent and access policy before sharing intelligence across institutions

Directly onboarded farmers without institutional affiliation can sit in a neutral/default ecosystem and become available to approved institutions only through consent and access policy.

## Canonicalization

Canonicalization must be an explicit service step after validation, normalization, and identity resolution. It should call existing MkulimaScore domain services where available.

The canonical record should retain lineage:

```text
canonical value
  -> normalized value
  -> raw submission
  -> agent/device/source/evidence/timestamp
```

The ingestion layer does not calculate credit scores. Canonicalization may emit events that existing assessment services consume.

## Security Boundary

Mobile is untrusted input. Server must enforce:

- authenticated agent
- tenant and assignment authorization from server-side identity
- no mobile AWS credentials
- no mobile DB credentials
- no public evidence URLs
- idempotency and replay protection
- rate limits
- file MIME/size/extension checks
- correlation ids without sensitive logs
- no raw national IDs, tokens, passwords, or financial statements in logs

## Migration Plan

No production migration is approved by this document.

Staging migration plan after backend source inspection:

1. Add `ingestion` schema.
2. Add additive ingestion tables only.
3. Add indexes for idempotency keys, submission status, agent/institution, created timestamps.
4. Add reversible Alembic migrations according to existing repo standards.
5. Add staging seed data with synthetic farmers only.
6. Run migrations in staging.
7. Run E2E and retry tests.
8. Prepare production migration review package.

## Expected AWS Resources

Prefer existing resources:

- Elastic Beanstalk backend for FastAPI routes
- existing PostgreSQL RDS for `ingestion` schema
- existing raw artifacts S3 bucket for incoming mobile evidence
- SQS only if no existing worker queue is available and async processing is required
- CloudWatch logs/metrics/alarms for ingestion health
- Secrets Manager/Elastic Beanstalk secrets for runtime config

Do not create Kafka, Kinesis, Snowflake, Databricks, graph databases, or a second production RDS for this stage.

## Risks

- Backend source repo is not available in this workspace, so source-level migration and service implementation cannot be safely completed here.
- No staging API hostname was observed yet.
- The existing production API exposes canonical endpoints; mobile must not call them for writes.
- Current mobile app can build an ingestion contract, but E2E cannot pass until the backend mobile namespace exists.
- Full ESLint has previously hung in this workspace; TypeScript is the reliable local check at present.

## Implementation Sequence

1. Obtain or connect the MkulimaScore backend repository.
2. Confirm staging environment and deployment workflow.
3. Inspect models, migrations, services, and worker infrastructure.
4. Add the `ingestion` schema and additive migrations in staging.
5. Implement `/api/v1/mobile/bootstrap`.
6. Implement `/api/v1/mobile/sync` with raw submission persistence and idempotency.
7. Implement validation, normalization, identity resolution, and QA states.
8. Implement evidence upload authorization/finalize with private S3.
9. Implement canonicalization through existing services.
10. Add audit events, metrics, and correlation ids.
11. Point MkulimaCollect preview/staging builds at the staging mobile API.
12. Run E2E cases: new dairy farmer, existing farmer, response loss, duplicate farmer, GPS conflict, invalid evidence, two-device conflict.
13. Perform security and load tests.
14. Produce production rollout plan.
15. Stop for explicit production deployment approval.
