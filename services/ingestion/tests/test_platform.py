from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.platform import farmer_body, forward_canonical, geo_bodies, score_bodies


def _farmer(**kwargs):
    values = {
        "msid": "MS-FMR-1",
        "local_id": "farmer-1",
        "display_name": "Mary Wanjiku",
        "national_id_hash": "nid-hash",
        "phone_hash": "phone-hash",
        "institution_id": 1,
        "payload": {"county": "Kiambu"},
    }
    values.update(kwargs)
    return SimpleNamespace(**values)


def test_farmer_body_uses_msid_and_hashes():
    body = farmer_body(_farmer())
    assert body["farmer_id"] == "MS-FMR-1"
    assert body["external_farmer_id"] == "farmer-1"
    assert body["national_id_hash"] == "nid-hash"
    assert body["onboarding_channel"] == "mkulimacollect"


def test_geo_bodies_read_collect_gps_fields():
    farm = SimpleNamespace(
        payload={"gpsLatitude": -1.2, "gpsLongitude": 36.8, "gpsAccuracyM": 8},
    )
    locations = geo_bodies(_farmer(), [farm])
    assert locations[0]["latitude"] == -1.2
    assert locations[0]["longitude"] == 36.8


def test_score_bodies_keep_chain_specific_payload():
    enterprise = SimpleNamespace(id="ent-1", sector_id="dairy", payload={"sector": "dairy"})
    record = SimpleNamespace(
        kind="sector_response",
        payload={
            "enterpriseLocalUuid": "ent-1",
            "schemaId": "dairy-field-v1",
            "payload": {"greenLeafKgMonth": 80, "milkLitresYesterday": 12},
        },
    )
    bodies = score_bodies(_farmer(), [enterprise], [record])
    assert bodies[0]["sector"] == "dairy"
    assert bodies[0]["sector_payload"]["milkLitresYesterday"] == 12
    assert "expectedHarvest" not in bodies[0]["sector_payload"]


def test_forward_canonical_posts_farmer_identity_geo_and_score():
    farmer = _farmer()
    farm = SimpleNamespace(msid="MS-FMR-1", payload={"gpsLatitude": -1.1, "gpsLongitude": 36.9})
    enterprise = SimpleNamespace(id="ent-1", sector_id="dairy", payload={})
    record = SimpleNamespace(
        kind="sector_response",
        payload={"enterpriseLocalUuid": "ent-1", "payload": {"herdSizeMilking": 4}},
    )
    db = MagicMock()
    db.get.return_value = farmer
    db.scalars.side_effect = [
        MagicMock(__iter__=lambda self: iter([farm])),
        MagicMock(__iter__=lambda self: iter([enterprise])),
        MagicMock(__iter__=lambda self: iter([record])),
    ]

    with (
        patch("app.platform.settings") as settings,
        patch("app.platform.httpx.request") as request,
    ):
        settings.platform_api_url = "https://api.mkulimascore.com"
        settings.platform_api_token = "token"
        settings.platform_api_username = ""
        settings.platform_api_password = ""
        settings.platform_client_id = ""
        settings.platform_client_secret = ""
        response = MagicMock(is_success=True, status_code=200)
        response.json.return_value = {"farmer_id": "MS-FMR-1"}
        request.return_value = response
        detail = forward_canonical(db, "MS-FMR-1", score=True)

    assert detail["forwarded"] is True
    urls = [call.args[1] for call in request.call_args_list]
    assert any(url.endswith("/api/v1/farmers/") for url in urls)
    assert any(url.endswith("/api/v1/identity/references") for url in urls)
    assert any(url.endswith("/api/v1/geo/locations") for url in urls)
    assert any(url.endswith("/api/v1/pipeline/ingest-score") for url in urls)
