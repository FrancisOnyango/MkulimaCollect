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

`https://api.mkulimascore.com` is the canonical API that writes MkulimaScore RDS.
`https://staging-api.mkulimascore.com` currently exposes login only — it does **not** implement `/api/v1/mobile/sync` or `/api/v1/pipeline/ingest-score`.

Copy `.env.example` to `.env` and set a platform service user:

```
PLATFORM_API_URL=https://api.mkulimascore.com
PLATFORM_API_USERNAME=...
PLATFORM_API_PASSWORD=...
```

After each canonical farmer, farm, enterprise, or sector form, the pipeline:

1. `POST /api/v1/farmers/`
2. `POST /api/v1/identity/references`
3. `POST /api/v1/geo/locations` when GPS exists
4. `POST /api/v1/pipeline/ingest-score` when a chain-specific sector payload exists

Optional: set `DATABASE_URL` to a PostgreSQL URL if ingestion staging tables should also live on RDS. That is separate from canonical `farmers` tables.

## Live staging

`https://staging-api.mkulimascore.com` now fronts this service (CloudFront → Elastic Beanstalk `mkulimacollect-ingest-stg`).

Collect preview already uses that URL. Sign in as `francis.o@mkulima` / `dev-password`.

RDS forward into `https://api.mkulimascore.com` is configured as the next hop and still needs a MkulimaScore API user (`PLATFORM_API_USERNAME` / `PLATFORM_API_PASSWORD` on the EB environment).

`https://staging-api.mkulimascore.com` is a separate `farmer-api` with login only.
`https://api.mkulimascore.com` is the scoring platform and does write RDS, but it has no `/api/v1/mobile/*` routes.

Collect was pointed at those hosts in `eas.json`. Neither one implements the mobile sync contract, so field data never reaches RDS.

Fix: deploy **this** service (the mobile contract) and keep Collect pointed at it. After canonicalization it forwards into `api.mkulimascore.com`, which writes RDS.

```bash
cd services/ingestion
docker build -t mkulimacollect-ingestion .
docker run --rm -p 8088:8088 --env-file .env mkulimacollect-ingestion
```

Then set Collect `EXPO_PUBLIC_API_BASE_URL` to that public HTTPS URL, not to `staging-api.mkulimascore.com`.
