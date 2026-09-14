from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .models import PlatformEnterprise, PlatformFarm, PlatformFarmer, PlatformRecord


class PlatformGateway:
    """Pushes canonical Collect records into MkulimaScore RDS via the public API.

    Collect never receives database credentials. After staging + canonicalization,
    this client writes farmers, identity, geo, and score jobs through
    api.mkulimascore.com (or a configured staging host).
    """

    def __init__(self) -> None:
        self.base_url = settings.platform_api_url.rstrip("/")
        self._token = settings.platform_api_token.strip()

    @property
    def enabled(self) -> bool:
        return bool(self.base_url)

    def headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json", "X-Client-Id": "mkulimacollect"}
        token = self._ensure_token()
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if settings.platform_client_id:
            headers["X-Client-Id"] = settings.platform_client_id
        if settings.platform_client_secret:
            headers["X-Client-Secret"] = settings.platform_client_secret
        return headers

    def _ensure_token(self) -> str:
        if self._token:
            return self._token
        username = settings.platform_api_username.strip()
        password = settings.platform_api_password
        if not username or not password:
            return ""
        response = httpx.post(
            f"{self.base_url}/api/v1/auth/login/access-token",
            data={"username": username, "password": password},
            timeout=15.0,
        )
        response.raise_for_status()
        self._token = str(response.json().get("access_token") or "")
        return self._token

    def request(self, method: str, path: str, payload: dict | None = None) -> dict[str, Any]:
        response = httpx.request(
            method,
            f"{self.base_url}{path}",
            headers=self.headers(),
            json=payload,
            timeout=20.0,
        )
        body: Any
        try:
            body = response.json()
        except ValueError:
            body = {"raw": response.text[:500]}
        if not response.is_success:
            raise RuntimeError(f"platform {method} {path} -> {response.status_code}: {body}")
        return body if isinstance(body, dict) else {"data": body}

    def upsert_farmer(self, farmer: dict) -> dict[str, Any]:
        return self.request("POST", "/api/v1/farmers/", farmer)

    def create_identity(self, reference: dict) -> dict[str, Any]:
        return self.request("POST", "/api/v1/identity/references", reference)

    def create_geo(self, location: dict) -> dict[str, Any]:
        return self.request("POST", "/api/v1/geo/locations", location)

    def ingest_and_score(self, body: dict) -> dict[str, Any]:
        return self.request("POST", "/api/v1/pipeline/ingest-score", body)


def _as_float(value: object) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str) and value.strip():
        try:
            return float(value)
        except ValueError:
            return None
    return None


def farmer_body(row: PlatformFarmer) -> dict[str, Any]:
    payload = row.payload or {}
    identity = payload.get("identity") if isinstance(payload.get("identity"), dict) else {}
    county = payload.get("county") or identity.get("county")
    return {
        "farmer_id": row.msid,
        "msid": row.msid,
        "external_farmer_id": row.local_id,
        "national_id_hash": row.national_id_hash,
        "phone_hash": row.phone_hash,
        "name": row.display_name,
        "county": county,
        "subcounty": payload.get("subCounty") or payload.get("subcounty"),
        "ward": payload.get("ward"),
        "source_institution_id": str(row.institution_id),
        "onboarding_channel": "mkulimacollect",
        "profile_status": "profile_created",
        "identity_resolution_status": "identity_resolved" if row.national_id_hash else "pending",
        "score_readiness_status": "evidence_pending",
    }


def identity_bodies(row: PlatformFarmer) -> list[dict[str, Any]]:
    refs: list[dict[str, Any]] = []
    if row.national_id_hash:
        refs.append(
            {
                "farmer_id": row.msid,
                "reference_type": "national_id_hash",
                "value_hash": row.national_id_hash,
                "issuer": "mkulimacollect",
                "country": "KE",
                "source_type": "mkulimacollect",
                "source_reference": row.local_id,
                "is_primary": True,
                "confidence_score": 90,
            }
        )
    if row.phone_hash:
        refs.append(
            {
                "farmer_id": row.msid,
                "reference_type": "phone_hash",
                "value_hash": row.phone_hash,
                "issuer": "mkulimacollect",
                "country": "KE",
                "source_type": "mkulimacollect",
                "source_reference": row.local_id,
                "is_primary": not bool(row.national_id_hash),
                "confidence_score": 80,
            }
        )
    return refs


def geo_bodies(farmer: PlatformFarmer, farms: list[PlatformFarm]) -> list[dict[str, Any]]:
    locations: list[dict[str, Any]] = []
    for farm in farms:
        payload = farm.payload or {}
        lat = _as_float(payload.get("gpsLatitude") or payload.get("latitude"))
        lng = _as_float(payload.get("gpsLongitude") or payload.get("longitude"))
        points = payload.get("points")
        if (lat is None or lng is None) and isinstance(points, list) and points:
            first = points[0] if isinstance(points[0], dict) else {}
            lat = _as_float(first.get("latitude") or first.get("lat"))
            lng = _as_float(first.get("longitude") or first.get("lng"))
        if lat is None or lng is None:
            continue
        locations.append(
            {
                "farmer_id": farmer.msid,
                "latitude": lat,
                "longitude": lng,
                "accuracy_m": _as_float(payload.get("gpsAccuracyM") or payload.get("accuracyMeters")),
                "capture_source": "mkulimacollect",
                "enterprise_type": payload.get("sector") or payload.get("sectorId"),
            }
        )
    return locations


def score_bodies(farmer: PlatformFarmer, enterprises: list[PlatformEnterprise], records: list[PlatformRecord]) -> list[dict[str, Any]]:
    responses = [row for row in records if row.kind == "sector_response"]
    bodies: list[dict[str, Any]] = []
    for response in responses:
        payload = response.payload or {}
        nested = payload.get("payload") if isinstance(payload.get("payload"), dict) else payload
        sector = payload.get("schemaId") or payload.get("sector")
        enterprise_id = payload.get("enterpriseLocalUuid") or payload.get("enterpriseId")
        matching = next((item for item in enterprises if item.id == enterprise_id), None)
        if matching and matching.sector_id:
            sector = matching.sector_id
        if not sector or not isinstance(nested, dict) or not nested:
            continue
        bodies.append(
            {
                "source": "mkulimacollect",
                "institution_id": farmer.institution_id,
                "purpose": "loan_assessment",
                "farmer": farmer_body(farmer),
                "sector": str(sector),
                "sector_payload": nested,
            }
        )
    if bodies:
        return bodies
    for enterprise in enterprises:
        if not enterprise.sector_id:
            continue
        bodies.append(
            {
                "source": "mkulimacollect",
                "institution_id": farmer.institution_id,
                "purpose": "loan_assessment",
                "farmer": farmer_body(farmer),
                "sector": enterprise.sector_id,
                "sector_payload": enterprise.payload or {"enterpriseLocalUuid": enterprise.id},
            }
        )
    return bodies


def forward_canonical(db: Session, msid: str, *, score: bool) -> dict[str, Any]:
    gateway = PlatformGateway()
    detail: dict[str, Any] = {"pipeline": "mkulimascore-rds", "score": score}
    if not gateway.enabled:
        detail["skipped"] = "platform_api_url_not_set"
        return detail

    farmer = db.get(PlatformFarmer, msid)
    if farmer is None:
        detail["error"] = "missing_platform_farmer"
        return detail

    farms = list(db.scalars(select(PlatformFarm).where(PlatformFarm.msid == msid)))
    enterprises = list(db.scalars(select(PlatformEnterprise).where(PlatformEnterprise.msid == msid)))
    records = list(db.scalars(select(PlatformRecord).where(PlatformRecord.msid == msid)))

    try:
        created = gateway.upsert_farmer(farmer_body(farmer))
        detail["farmer_status"] = "ok"
        detail["remote_farmer_id"] = created.get("farmer_id") or created.get("msid") or msid
        remote = dict(farmer.payload or {})
        remote["remote"] = {"farmer_id": detail["remote_farmer_id"], "msid": created.get("msid")}
        farmer.payload = remote

        identity_ok = 0
        for reference in identity_bodies(farmer):
            gateway.create_identity(reference)
            identity_ok += 1
        detail["identity_references"] = identity_ok

        geo_ok = 0
        for location in geo_bodies(farmer, farms):
            gateway.create_geo(location)
            geo_ok += 1
        detail["geo_locations"] = geo_ok

        if score:
            scored = 0
            for body in score_bodies(farmer, enterprises, records):
                gateway.ingest_and_score(body)
                scored += 1
            detail["ingest_score"] = scored
        detail["forwarded"] = True
    except Exception as exc:  # noqa: BLE001 - persist the failure, keep staging rows
        detail["forwarded"] = False
        detail["error"] = str(exc)
    return detail
