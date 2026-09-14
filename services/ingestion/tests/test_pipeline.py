from fastapi.testclient import TestClient

from app.main import app, init_pipeline

init_pipeline()
client = TestClient(app)


def login() -> str:
    response = client.post(
        "/api/v1/auth/login/access-token",
        data={"username": "francis.o@mkulima", "password": "dev-password"},
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    assert token
    return token


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_collect_outbox_lands_in_staging_then_platform():
    token = login()
    farmer_id = "farmer-local-flow-001"
    farm_id = "farm-local-001"
    enterprise_id = "ent-local-001"
    sync = client.post(
        "/api/v1/mobile/sync",
        headers=auth(token),
        json={
            "device_id": "device-test-1",
            "sync_batch_id": "batch-flow-001",
            "app_version": "0.1.0",
            "client_time": "2026-09-14T12:00:00Z",
            "changes": [
                {
                    "local_id": farmer_id,
                    "operation_id": "op-farmer-001",
                    "entity_type": "farmer",
                    "operation": "upsert",
                    "idempotency_key": "op-farmer-001",
                    "depends_on": [],
                    "payload": {
                        "localUuid": farmer_id,
                        "agentId": "1",
                        "orgId": "1",
                        "status": "IN_PROGRESS",
                    },
                },
                {
                    "local_id": farmer_id,
                    "operation_id": "op-identity-001",
                    "entity_type": "farmer_identity",
                    "operation": "upsert",
                    "idempotency_key": "op-identity-001",
                    "depends_on": ["op-farmer-001"],
                    "payload": {
                        "farmerLocalUuid": farmer_id,
                        "fullLegalName": "Mary Wanjiku",
                        "nationalIdHash": "hash-id-mary",
                        "primaryPhoneHash": "hash-phone-mary",
                    },
                },
                {
                    "local_id": farm_id,
                    "operation_id": "op-farm-001",
                    "entity_type": "farm",
                    "operation": "upsert",
                    "idempotency_key": "op-farm-001",
                    "depends_on": ["op-farmer-001"],
                    "payload": {
                        "farmLocalUuid": farm_id,
                        "farmerLocalUuid": farmer_id,
                        "name": "Main holding",
                        "sizeReportedAcres": 2.4,
                    },
                },
                {
                    "local_id": enterprise_id,
                    "operation_id": "op-ent-001",
                    "entity_type": "enterprise",
                    "operation": "upsert",
                    "idempotency_key": "op-ent-001",
                    "depends_on": ["op-farm-001"],
                    "payload": {
                        "enterpriseLocalUuid": enterprise_id,
                        "farmerLocalUuid": farmer_id,
                        "farmLocalUuid": farm_id,
                        "sector": "dairy",
                    },
                },
                {
                    "local_id": "resp-local-001",
                    "operation_id": "op-resp-001",
                    "entity_type": "sector_response",
                    "operation": "upsert",
                    "idempotency_key": "op-resp-001",
                    "depends_on": ["op-ent-001"],
                    "schema_version": "dairy-field-v1",
                    "payload": {
                        "responseLocalUuid": "resp-local-001",
                        "enterpriseLocalUuid": enterprise_id,
                        "farmerLocalUuid": farmer_id,
                        "schemaId": "dairy-field-v1",
                        "payload": {"greenLeafKgMonth": 120},
                    },
                },
            ],
        },
    )
    assert sync.status_code == 200, sync.text
    body = sync.json()
    assert body["status"] in {"accepted", "partial"}
    farmer_result = next(item for item in body["results"] if item["local_id"] == farmer_id and item["operation_id"] == "op-farmer-001")
    assert farmer_result["status"] == "canonicalized"
    assert str(farmer_result["server_entity_id"]).startswith("MS-FMR-")
    identity_result = next(item for item in body["results"] if item["operation_id"] == "op-identity-001")
    assert identity_result["status"] == "canonicalized"

    staging = client.get("/api/v1/pipeline/staging", headers=auth(token))
    assert staging.status_code == 200
    rows = staging.json()
    assert any(row["local_id"] == farmer_id and row["lifecycle_status"] == "CANONICALIZED" for row in rows)
    assert any(row["entity_type"] == "sector_response" and row["lifecycle_status"] == "CANONICALIZED" for row in rows)

    platform = client.get("/api/v1/pipeline/platform/farmers", headers=auth(token))
    assert platform.status_code == 200
    mary = next(row for row in platform.json() if row["local_id"] == farmer_id)
    assert mary["display_name"] == "Mary Wanjiku"
    assert farm_id in mary["farms"]
    assert enterprise_id in mary["enterprises"]
    assert mary["score_jobs"]

    status = client.get("/api/v1/pipeline/status", headers=auth(token))
    assert status.status_code == 200
    counts = status.json()
    assert counts["staging_records"] >= 5
    assert counts["platform_farmers"] >= 1
    assert counts["platform_farms"] >= 1
    assert counts["platform_enterprises"] >= 1
    assert counts["score_jobs"] >= 1


def test_idempotent_retry_does_not_duplicate_platform_farmer():
    token = login()
    payload = {
        "device_id": "device-test-2",
        "sync_batch_id": "batch-idem-001",
        "client_time": "2026-09-14T12:00:00Z",
        "changes": [
            {
                "local_id": "farmer-idem-1",
                "operation_id": "op-idem-1",
                "entity_type": "farmer",
                "operation": "upsert",
                "idempotency_key": "idem-farmer-1",
                "depends_on": [],
                "payload": {"localUuid": "farmer-idem-1", "fullLegalName": "Peter Mwangi"},
            }
        ],
    }
    first = client.post("/api/v1/mobile/sync", headers=auth(token), json=payload)
    second = payload | {"sync_batch_id": "batch-idem-002"}
    retry = client.post("/api/v1/mobile/sync", headers=auth(token), json=second)
    assert first.status_code == 200
    assert retry.status_code == 200
    first_id = first.json()["results"][0]["server_entity_id"]
    retry_id = retry.json()["results"][0]["server_entity_id"]
    assert first_id == retry_id


def test_identity_match_reuses_msid():
    token = login()
    first = client.post(
        "/api/v1/mobile/sync",
        headers=auth(token),
        json={
            "device_id": "device-match-1",
            "sync_batch_id": "batch-match-001",
            "client_time": "2026-09-14T12:00:00Z",
            "changes": [
                {
                    "local_id": "farmer-match-a",
                    "operation_id": "op-match-a",
                    "entity_type": "farmer",
                    "operation": "upsert",
                    "idempotency_key": "op-match-a",
                    "payload": {
                        "localUuid": "farmer-match-a",
                        "fullLegalName": "Jane Njeri",
                        "nationalIdHash": "shared-national-hash",
                    },
                }
            ],
        },
    )
    second = client.post(
        "/api/v1/mobile/sync",
        headers=auth(token),
        json={
            "device_id": "device-match-2",
            "sync_batch_id": "batch-match-002",
            "client_time": "2026-09-14T12:00:00Z",
            "changes": [
                {
                    "local_id": "farmer-match-b",
                    "operation_id": "op-match-b",
                    "entity_type": "farmer",
                    "operation": "upsert",
                    "idempotency_key": "op-match-b",
                    "payload": {
                        "localUuid": "farmer-match-b",
                        "fullLegalName": "Jane N.",
                        "nationalIdHash": "shared-national-hash",
                    },
                }
            ],
        },
    )
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["results"][0]["server_entity_id"] == second.json()["results"][0]["server_entity_id"]


def test_geometry_requires_three_points():
    token = login()
    response = client.post(
        "/api/v1/mobile/sync",
        headers=auth(token),
        json={
            "device_id": "device-test-3",
            "sync_batch_id": "batch-geo-001",
            "client_time": "2026-09-14T12:00:00Z",
            "changes": [
                {
                    "local_id": "geo-bad",
                    "operation_id": "op-geo-bad",
                    "entity_type": "farm_geometry",
                    "operation": "upsert",
                    "idempotency_key": "geo-bad-1",
                    "depends_on": [],
                    "payload": {"points": [{"latitude": 1, "longitude": 2}]},
                }
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["results"][0]["status"] == "needs_correction"


def test_evidence_upload_reaches_staging_and_platform():
    token = login()
    farmer_id = "farmer-evd-1"
    client.post(
        "/api/v1/mobile/sync",
        headers=auth(token),
        json={
            "device_id": "device-evd-1",
            "sync_batch_id": "batch-evd-farmer",
            "client_time": "2026-09-14T12:00:00Z",
            "changes": [
                {
                    "local_id": farmer_id,
                    "operation_id": "op-evd-farmer",
                    "entity_type": "farmer",
                    "operation": "upsert",
                    "idempotency_key": "op-evd-farmer",
                    "payload": {"localUuid": farmer_id, "fullLegalName": "Evidence Farmer"},
                }
            ],
        },
    )
    evidence_id = "evd-flow-001"
    authz = client.post(
        "/api/v1/mobile/evidence/upload-authorization",
        headers=auth(token),
        json={
            "evidence_id": evidence_id,
            "farmer_id": farmer_id,
            "evidence_type": "milk-delivery-slip",
            "mime_type": "image/jpeg",
            "sha256": "abc123",
            "file_size_bytes": 12,
            "device_id": "device-evd-1",
        },
    )
    assert authz.status_code == 200, authz.text
    upload_url = authz.json()["upload_url"]
    path = upload_url.split("/api/v1", 1)[-1]
    uploaded = client.put(f"/api/v1{path}", content=b"fake-jpeg-bytes")
    assert uploaded.status_code == 200, uploaded.text
    finalized = client.post(
        f"/api/v1/mobile/evidence/{evidence_id}/finalize",
        headers=auth(token),
        json={"etag": "etag-1", "device_id": "device-evd-1", "upload_completed": True},
    )
    assert finalized.status_code == 200, finalized.text
    assert finalized.json()["status"] == "canonicalized"

    staging = client.get("/api/v1/pipeline/staging", headers=auth(token))
    assert any(row["local_id"] == evidence_id and row["lifecycle_status"] == "CANONICALIZED" for row in staging.json())
