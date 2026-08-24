# Backend Handoff Packet

Send these files to the MkulimaScore backend team before backend implementation starts:

1. `mkulimacollect-mobile-ingestion-handoff.md`
   - access needs, staging requirements, migrations, rules, and acceptance checklist
2. `mobile-ingestion.openapi.yaml`
   - draft endpoint contract for `/api/v1/mobile/*`
3. `../architecture/mkulimacollect-ingestion.md`
   - architecture decision record and AWS/backend audit summary

Backend implementation must happen in `Mkulimascore/MkulimaScore360` against a staging branch/environment first. Production deployment requires explicit approval after E2E, security, and rollback review.
