# MkulimaCollect ingestion pipeline

Staging area for field data **before** it enters the MkulimaScore platform RDS.

```text
MkulimaCollect SQLite outbox
  -> POST /api/v1/mobile/sync
  -> ingestion staging tables
  -> identity match + canonicalization
  -> platform_* tables
  -> MkulimaScore API (farmers, identity, geo, ingest-score)
  -> staging / production PostgreSQL RDS
```

The phone never receives RDS credentials. Collect talks only to this mobile API.

## Run locally

```bash
cd services/ingestion
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8088
```

Default field agent: `francis.o@mkulima` / `dev-password`

Point Collect at the pipeline (`apps/collect/.env`):

```
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8088
```

Inspect staging vs platform:

- `GET /api/v1/pipeline/staging`
- `GET /api/v1/pipeline/platform/farmers`
- `GET /api/v1/pipeline/status`

## Live feed into staging / production RDS

`https://api.mkulimascore.com` is the canonical MkulimaScore API (farmers, geo, ingest-score, RDS).
It has **no** `/api/v1/mobile/*` routes.

`https://staging-api.mkulimascore.com` is Collect's mobile ingestion host (CloudFront → Elastic Beanstalk `mkulimacollect-ingest-stg`).
Collect preview and production builds must use that URL.

After canonicalization, this service forwards into the core API:

1. `POST /api/v1/farmers/`
2. `POST /api/v1/identity/references`
3. `POST /api/v1/geo/locations` when GPS exists
4. `POST /api/v1/pipeline/ingest-score` when a chain-specific sector payload exists

Set a platform service user on the ingestion host (never on the phone):

```
PLATFORM_API_URL=https://api.mkulimascore.com
PLATFORM_API_USERNAME=...
PLATFORM_API_PASSWORD=...
```

`GET /api/v1/pipeline/status` reports `platform_hop.auth_configured` and the last forward errors.

Optional: set `DATABASE_URL` to PostgreSQL if ingestion staging tables should also live on RDS. That is separate from canonical `farmers` tables.

## Live staging

`https://staging-api.mkulimascore.com` now fronts this service (CloudFront → Elastic Beanstalk `mkulimacollect-ingest-stg`).

Collect preview and production already use that URL. Sign in as `francis.o@mkulima` / `dev-password`.

RDS forward into `https://api.mkulimascore.com` needs `PLATFORM_API_USERNAME` / `PLATFORM_API_PASSWORD` (or `PLATFORM_API_TOKEN`) on the EB environment. Without those, canonical records stay in ingestion `platform_*` tables and `pipeline/status` shows `platform_api_auth_not_configured`.
