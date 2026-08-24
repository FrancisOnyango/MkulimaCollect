# MkulimaCollect Mobile Ingestion Backend Handoff

Date: 2026-08-24
Status: Backend implementation request. Staging first. No production deployment approval.

## Purpose

MkulimaCollect is a separate offline-first field evidence capture product. It must connect to MkulimaScore through a strict mobile ingestion boundary, not direct canonical table writes.

This packet gives the MkulimaScore backend team the minimum access, contracts, migrations, staging resources, and operating rules required to unblock the mobile team.

## Backend Access Required

- Backend repository: `Mkulimascore/MkulimaScore360`
- Target branch: create or provide a branch for mobile ingestion work, for example `feature/mobile-ingestion`
- Staging API base URL: `https://staging.api.mkulimascore.com/api/v1`
- Production API base URL: `https://api.mkulimascore.com/api/v1`
- Auth method to confirm: JWT bearer token
- Field officer auth mode to confirm: password login, SSO, or device-issued session

Required staging credentials:

- platform admin
- institution admin
- field supervisor
- field officer
- reviewer/operations user

Do not provide production farmer data or production user credentials to the mobile team.

## Backend Locations To Confirm

Expected paths from the current backend convention:

- Alembic migrations: `backend/alembic`
- SQLAlchemy models: `backend/app/models`
- API routers: confirm actual FastAPI router location
- Pydantic schemas: confirm schema module location
- services/repositories: confirm domain service layout
- tests: confirm pytest location and fixture conventions

## Staging Environment Required

Create or confirm:

- `https://staging.app.mkulimascore.com`
- `https://staging.api.mkulimascore.com`
- staging PostgreSQL database
- staging S3 evidence bucket
- staging queue and dead-letter queue
- staging secrets
- staging demo institution
- staging field users
- CORS for staging mobile and web origins
- CloudWatch logs and alarms for mobile ingestion

MkulimaCollect must not default to live production.

## Database And Migrations

Current expectation:

- PostgreSQL for staging/production
- SQLite only as a local backend fallback if already supported
- Use existing Alembic standards
- Additive migrations only for staging implementation
- No destructive production migrations

Required ingestion tables:

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
```

Each staging record should include:

- `source`
- `institution_id`
- `ecosystem_id`
- `field_officer_id`
- `device_id`
- `local_id`
- `idempotency_key`
- `schema_version`
- `payload_json`
- `validation_status`
- `review_status`
- `created_at`
- `captured_at`
- `synced_at`
- `approved_at`
- `rejected_at`

## API Contract

Implement these endpoints:

```http
POST /api/v1/mobile/bootstrap
GET  /api/v1/mobile/assignments
GET  /api/v1/mobile/tasks
POST /api/v1/mobile/sync
POST /api/v1/mobile/evidence/upload-authorization
POST /api/v1/mobile/evidence/{evidence_id}/finalize
```

A machine-readable draft is included in:

```text
docs/backend-handoff/mobile-ingestion.openapi.yaml
```

Minimum response requirements:

- stable server IDs
- accepted/rejected item status
- validation errors
- conflict records
- next sync cursor
- schema versions
- idempotency acknowledgement
- correlation id

## Sync Contract Summary

Request:

```json
{
  "device_id": "device_abc",
  "sync_batch_id": "batch_20260824_001",
  "client_time": "2026-08-24T14:20:00+03:00",
  "baseline_cursor": "cursor_123",
  "changes": [
    {
      "local_id": "local_farmer_001",
      "operation_id": "op_001",
      "entity_type": "farmer_profile_draft",
      "operation": "upsert",
      "idempotency_key": "field-user-9-local_farmer_001-v1",
      "depends_on": [],
      "baseline_version": null,
      "schema_version": "dairy-field-v1",
      "payload": {
        "full_name": "Synthetic Farmer",
        "primary_enterprise": "dairy"
      }
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
  "correlation_id": "corr_001",
  "results": [
    {
      "local_id": "local_farmer_001",
      "operation_id": "op_001",
      "server_entity_id": "MS-FMR-000245",
      "status": "accepted",
      "warnings": []
    }
  ],
  "rejected": [],
  "conflicts": []
}
```

## Evidence Upload Contract

Do not upload large files in `/mobile/sync`.

Flow:

```text
mobile requests upload authorization
backend creates evidence id and DB receipt
backend returns short-lived private S3 signed URL
mobile uploads directly to S3
mobile finalizes evidence
backend validates and links evidence to staging record
```

Required evidence storage info:

- staging bucket name
- production bucket name
- max file size
- accepted MIME types
- retention policy
- encryption requirement
- access mode: private and signed URL only

Evidence categories:

- `national_id_photo`
- `farm_photo`
- `livestock_photo`
- `crop_photo`
- `sacco_document`
- `consent_form`
- `buyer_delivery_record`
- `other_supporting_evidence`

## Identity Matching Rules

Matching priority:

1. `national_id_hash`
2. phone number plus date of birth
3. SACCO/cooperative member number
4. institution farmer number
5. household/farm linkage
6. manual review

The mobile app may capture raw National ID under secure transport, but the backend must hash/store it according to the existing identity policy. Do not rely on name matching except as a weak manual-review signal.

## Profile Lifecycle Rules

Backend-owned statuses:

```text
draft
identity_created
profile_incomplete
evidence_pending
score_ready
score_generated
monitoring_active
requires_review
rejected
```

Key rule:

```text
profile can exist before score exists
```

Create a farmer profile shell once identity confidence is sufficient. Scoring waits until consent, enterprise, production, financial/evidence, and tenant-access rules are satisfied.

## Consent Rules Needed

Backend must define:

- required consent fields
- consent scope names
- expiry period
- who can collect consent
- whether verbal/digital/signature consent is valid
- consent evidence requirement
- SACCO/cooperative consent sharing rule
- direct farmer consent sharing rule

## SACCO And Cooperative Registry Rules Needed

Backend must define:

- cooperative ID format
- membership number format
- whether mobile can create pending SACCO records
- who approves new SACCOs
- whether SACCO membership can grant tenant/ecosystem access
- how shared intelligence is scoped across tenants

## Assignment And Task Model

Backend should support:

- assigned farmer
- assigned geography
- assigned SACCO/cooperative
- due date
- priority
- required form sections
- completion status
- supervisor review status

Example assignment types:

```text
new_farmer_onboarding
profile_completion
farm_verification
sacco_membership_verification
production_update
geo_refresh
loan_monitoring_visit
evidence_recheck
consent_refresh
```

## Sync Rules Needed

Backend must provide:

- max batch size
- idempotency key format
- conflict handling behavior
- retry rules
- whether deletes are allowed
- offline timestamp trust rules
- GPS accuracy thresholds
- dependency behavior for local IDs

## Operations Review

Platform/staging must expose:

- review dashboard
- failed sync items
- conflicting identity matches
- incomplete profiles
- evidence pending review
- SACCO membership review
- consent review
- rejected records
- dead-letter queue view

## Shortest Path To Unblock

Build these first in the MkulimaScore backend:

1. Mobile router and Pydantic schemas.
2. Staging tables and Alembic migration.
3. `POST /mobile/bootstrap`.
4. `POST /mobile/sync`.
5. Evidence upload authorization and finalize.
6. Basic operations review endpoint.
7. Staging deployment with test institution and test users.

That is enough for MkulimaCollect to finish against a real ingestion boundary without touching production tables directly.

## Acceptance Checklist

- Mobile can authenticate against staging.
- Mobile receives bootstrap config, schema versions, lookup lists, and cursor.
- Mobile receives assignments and tasks.
- Mobile submits a batch with idempotency keys and local dependencies.
- Backend persists raw sync batch and items.
- Retrying the same operation does not duplicate records.
- Backend returns accepted/rejected/conflict results per item.
- Evidence upload uses private S3 signed URLs.
- Evidence finalize creates a reviewable staging receipt.
- No mobile endpoint directly mutates canonical tables.
- No mobile endpoint exposes scoring internals.
- Operations user can inspect failed or review-required items.
