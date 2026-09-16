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

    def _ensure_token(self, *, force: bool = False) -> str:
        if self._token and not force:
            return self._token
        username = settings.platform_api_username.strip() or settings.platform_client_id.strip()
        password = settings.platform_api_password or settings.platform_client_secret
        if not username or not password:
            return self._token
        response = httpx.post(
            f"{self.base_url}/api/v1/auth/login/access-token",
            data={"username": username, "password": password},
            timeout=15.0,
        )
        response.raise_for_status()
        self._token = str(response.json().get("access_token") or "")
        return self._token

    def request(self, method: str, path: str, payload: dict | None = None, *, retry: bool = True) -> dict[str, Any]:
        response = httpx.request(
            method,
            f"{self.base_url}{path}",
            headers=self.headers(),
            json=payload,
            timeout=20.0,
        )
        if response.status_code == 401 and retry:
            self._token = ""
            if self._ensure_token(force=True):
                return self.request(method, path, payload, retry=False)
        body: Any
        try:
            body = response.json()
        except ValueError:
            body = {"raw": response.text[:500]}
        if not response.is_success:
            raise RuntimeError(f"platform {method} {path} -> {response.status_code}: {body}")
        return body if isinstance(body, dict) else {"data": body}

    def upsert_farmer(self, farmer: dict) -> dict[str, Any]:
        try:
            return self.request("POST", "/api/v1/farmers/", farmer)
        except RuntimeError as exc:
            if "422" not in str(exc):
                raise
            slim = {
                key: farmer[key]
                for key in (
                    "farmer_id",
                    "msid",
                    "name",
                    "county",
                    "national_id_hash",
                    "phone_hash",
                    "source_institution_id",
                    "onboarding_channel",
                )
                if farmer.get(key) not in (None, "")
            }
            return self.request("POST", "/api/v1/farmers/", slim)

    def create_identity(self, reference: dict) -> dict[str, Any]:
        return self.request("POST", "/api/v1/identity/references", reference)

    def create_geo(self, location: dict) -> dict[str, Any]:
        return self.request("POST", "/api/v1/geo/locations", location)

    def ingest_and_score(self, body: dict) -> dict[str, Any]:
        try:
            return self.request("POST", "/api/v1/pipeline/ingest-score", body)
        except RuntimeError as exc:
            if "422" not in str(exc):
                raise
            slim = {
                key: body[key]
                for key in ("source", "institution_id", "purpose", "farmer", "sector", "sector_payload")
                if key in body
            }
            return self.request("POST", "/api/v1/pipeline/ingest-score", slim)


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


def platform_hop_status() -> dict[str, Any]:
    url = settings.platform_api_url.strip().rstrip("/")
    return {
        "host": url,
        "auth_configured": bool(
            settings.platform_api_token.strip()
            or (settings.platform_api_username.strip() and settings.platform_api_password)
            or (settings.platform_client_id.strip() and settings.platform_client_secret)
        ),
    }


def farmer_body(row: PlatformFarmer) -> dict[str, Any]:
    payload = row.payload or {}
    identity = payload.get("identity") if isinstance(payload.get("identity"), dict) else {}
    county = payload.get("county") or identity.get("county")
    return {
        "farmer_id": row.msid,
        "msid": row.msid,
        "external_farmer_id": row.local_id,
        "national_id_hash": row.national_id_hash or identity.get("nationalIdHash") or identity.get("national_id_hash"),
        "phone_hash": row.phone_hash or identity.get("primaryPhoneHash") or identity.get("phone_hash"),
        "name": row.display_name or identity.get("fullLegalName"),
        "county": county,
        "subcounty": payload.get("subCounty") or payload.get("subcounty") or identity.get("subCounty"),
        "ward": payload.get("ward") or identity.get("ward"),
        "source_institution_id": str(row.institution_id),
        "onboarding_channel": "mkulimacollect",
        "profile_status": "profile_created",
        "identity_resolution_status": "identity_resolved" if row.national_id_hash else "pending",
        "score_readiness_status": "evidence_pending",
    }


def identity_bodies(row: PlatformFarmer) -> list[dict[str, Any]]:
    farmer = farmer_body(row)
    refs: list[dict[str, Any]] = []
    if farmer.get("national_id_hash"):
        refs.append(
            {
                "farmer_id": row.msid,
                "reference_type": "national_id_hash",
                "value_hash": farmer["national_id_hash"],
                "issuer": "mkulimacollect",
                "country": "KE",
                "source_type": "mkulimacollect",
                "source_reference": row.local_id,
                "is_primary": True,
                "confidence_score": 90,
            }
        )
    if farmer.get("phone_hash"):
        refs.append(
            {
                "farmer_id": row.msid,
                "reference_type": "phone_hash",
                "value_hash": farmer["phone_hash"],
                "issuer": "mkulimacollect",
                "country": "KE",
                "source_type": "mkulimacollect",
                "source_reference": row.local_id,
                "is_primary": not bool(farmer.get("national_id_hash")),
                "confidence_score": 80,
            }
        )
    return refs


def _points(payload: dict) -> list[dict[str, Any]]:
    raw = payload.get("points") or payload.get("boundaryPoints")
    boundary = payload.get("boundary")
    if isinstance(boundary, dict):
        raw = boundary.get("points") or raw
    if not isinstance(raw, list):
        return []
    points: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        lat = _as_float(item.get("latitude") or item.get("lat"))
        lng = _as_float(item.get("longitude") or item.get("lng"))
        if lat is None or lng is None:
            continue
        points.append({"latitude": lat, "longitude": lng, "accuracy_m": _as_float(item.get("accuracyM") or item.get("accuracy"))})
    return points


def farm_geo(payload: dict) -> tuple[float | None, float | None, float | None, list[dict[str, Any]]]:
    pin = payload.get("pin") if isinstance(payload.get("pin"), dict) else {}
    lat = _as_float(payload.get("gpsLatitude") or payload.get("latitude") or payload.get("lat") or pin.get("lat") or pin.get("latitude"))
    lng = _as_float(payload.get("gpsLongitude") or payload.get("longitude") or payload.get("lng") or pin.get("lng") or pin.get("longitude"))
    acc = _as_float(payload.get("gpsAccuracyM") or payload.get("accuracyMeters") or payload.get("accuracyM") or pin.get("accuracy"))
    points = _points(payload)
    if (lat is None or lng is None) and points:
        lat = points[0]["latitude"]
        lng = points[0]["longitude"]
        acc = acc or points[0].get("accuracy_m")
    return lat, lng, acc, points


def geo_bodies(farmer: PlatformFarmer, farms: list[PlatformFarm], records: list[PlatformRecord] | None = None) -> list[dict[str, Any]]:
    locations: list[dict[str, Any]] = []
    payloads = [farm.payload or {} for farm in farms]
    for record in records or []:
        if record.kind in {"farm_geometry", "farm"}:
            payloads.append(record.payload or {})
    seen: set[tuple[float, float]] = set()
    for payload in payloads:
        lat, lng, acc, _points = farm_geo(payload)
        if lat is None or lng is None or (lat, lng) in seen:
            continue
        seen.add((lat, lng))
        locations.append(
            {
                "farmer_id": farmer.msid,
                "latitude": lat,
                "longitude": lng,
                "accuracy_m": acc,
                "capture_source": "mkulimacollect",
                "enterprise_type": payload.get("sector") or payload.get("sectorId"),
            }
        )
    return locations


def farm_summaries(farms: list[PlatformFarm]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for farm in farms:
        payload = farm.payload or {}
        lat, lng, acc, points = farm_geo(payload)
        rows.append(
            {
                "farm_id": farm.id,
                "name": payload.get("name") or payload.get("farmName"),
                "tenure": payload.get("tenure"),
                "size_acres": _as_float(payload.get("sizeReportedAcres") or payload.get("size") or payload.get("areaCalculatedAcres")),
                "latitude": lat,
                "longitude": lng,
                "accuracy_m": acc,
                "boundary_points": points,
            }
        )
    return rows


def enterprise_summaries(enterprises: list[PlatformEnterprise]) -> list[dict[str, Any]]:
    return [
        {
            "enterprise_id": item.id,
            "farm_id": getattr(item, "farm_id", None),
            "sector": item.sector_id,
            "payload": item.payload or {},
        }
        for item in enterprises
        if item.sector_id
    ]


def score_bodies(
    farmer: PlatformFarmer,
    enterprises: list[PlatformEnterprise],
    records: list[PlatformRecord],
    farms: list[PlatformFarm] | None = None,
) -> list[dict[str, Any]]:
    responses = [row for row in records if row.kind == "sector_response"]
    farm_rows = farm_summaries(farms or [])
    enterprise_rows = enterprise_summaries(enterprises)
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
                "farms": farm_rows,
                "enterprises": enterprise_rows,
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
                "farms": farm_rows,
                "enterprises": enterprise_rows,
            }
        )
    return bodies


def forward_canonical(db: Session, msid: str, *, score: bool) -> dict[str, Any]:
    gateway = PlatformGateway()
    hop = platform_hop_status()
    detail: dict[str, Any] = {"pipeline": "mkulimascore-rds", "score": score, "host": hop["host"]}
    if not gateway.enabled:
        detail["skipped"] = "platform_api_url_not_set"
        return detail
    if not hop["auth_configured"]:
        detail["forwarded"] = False
        detail["error"] = "platform_api_auth_not_configured"
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
        for location in geo_bodies(farmer, farms, records):
            gateway.create_geo(location)
            geo_ok += 1
        detail["geo_locations"] = geo_ok

        if score:
            scored = 0
            for body in score_bodies(farmer, enterprises, records, farms):
                gateway.ingest_and_score(body)
                scored += 1
            detail["ingest_score"] = scored
        detail["forwarded"] = True
    except Exception as exc:  # noqa: BLE001 - persist the failure, keep staging rows
        detail["forwarded"] = False
        detail["error"] = str(exc)
    return detail
