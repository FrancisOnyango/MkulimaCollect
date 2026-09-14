from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import (
    AuditEvent,
    CanonicalizationResult,
    IdentityCandidate,
    MobileSyncConflict,
    MobileSyncItem,
    PlatformEnterprise,
    PlatformFarm,
    PlatformFarmer,
    PlatformRecord,
    PlatformScoreJob,
    StagingRecord,
)
from .platform import forward_canonical
from .security import Principal as AuthPrincipal


STAGING_ENTITY = {
    "farmer": "farmer",
    "farmer_profile_draft": "farmer",
    "farmer_identity": "identity",
    "identity_record": "identity",
    "farm": "farm",
    "farm_record": "farm",
    "farm_geometry": "farm_geometry",
    "enterprise": "enterprise",
    "enterprise_record": "enterprise",
    "sector_response": "sector_response",
    "affiliation": "sacco",
    "sacco_membership": "sacco",
    "buyer_relationship": "buyer",
    "consent": "consent",
    "consent_record": "consent",
    "production_cycle": "production",
    "production_observation": "production",
    "expense": "expense",
    "expense_record": "expense",
    "monitoring_visit": "visit",
    "evidence": "evidence",
    "evidence_record": "evidence",
    "task": "task",
}

ENABLED_SECTORS = [
    "dairy",
    "maize",
    "tea",
    "coffee",
    "avocado",
    "macadamia",
    "rice",
    "irish-potato",
    "poultry",
    "tomato",
    "aquaculture",
    "livestock-meat",
    "beans",
    "horticulture",
]


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"


def payload_str(payload: dict, *keys: str) -> str | None:
    for key in keys:
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def farmer_local_id(payload: dict, local_id: str, entity_type: str) -> str | None:
    if STAGING_ENTITY.get(entity_type) == "farmer":
        return payload_str(payload, "localUuid", "farmerLocalUuid") or local_id
    return payload_str(
        payload,
        "farmerLocalUuid",
        "farmer_id",
        "farmerId",
        "localUuid",
    )


def validate_change(entity_type: str, payload: dict) -> tuple[str, list[str]]:
    warnings: list[str] = []
    if not isinstance(payload, dict) or not payload:
        return "needs_correction", ["payload_required"]

    kind = STAGING_ENTITY.get(entity_type)
    if kind == "farm_geometry":
        geojson = payload_str(payload, "polygonGeojson", "polygon_geojson")
        points = payload.get("points") or payload.get("boundaryPoints") or []
        boundary = payload.get("boundary")
        if isinstance(boundary, dict):
            points = boundary.get("points") or points
        if not geojson and (not isinstance(points, list) or len(points) < 3):
            return "needs_correction", ["farm_geometry_requires_three_points"]

    if kind is None:
        warnings.append(f"unmapped_entity_type:{entity_type}")
    return "accepted", warnings


def normalize_payload(payload: dict) -> dict:
    normalized = dict(payload)
    phone = payload_str(payload, "phone", "phoneNumber", "msisdn")
    if phone:
        digits = "".join(ch for ch in phone if ch.isdigit())
        if digits:
            normalized["phone_normalized"] = digits[-12:]
    return normalized


def identity_hashes(payload: dict) -> tuple[str | None, str | None]:
    national = payload_str(payload, "nationalIdHash", "national_id_hash", "idNumberHash")
    phone = payload_str(payload, "phoneHash", "phone_hash", "primaryPhoneHash", "phone_normalized")
    return national, phone


def resolve_msid(db: Session, institution_id: int, payload: dict, local_id: str) -> tuple[str, str]:
    national, phone = identity_hashes(payload)
    existing = None
    signal = "new"

    if national:
        existing = db.scalar(
            select(PlatformFarmer).where(
                PlatformFarmer.institution_id == institution_id,
                PlatformFarmer.national_id_hash == national,
            )
        )
        signal = "national_id_hash"
    if existing is None and phone:
        existing = db.scalar(
            select(PlatformFarmer).where(
                PlatformFarmer.institution_id == institution_id,
                PlatformFarmer.phone_hash == phone,
            )
        )
        signal = "phone_hash"
    if existing is None:
        existing = db.scalar(
            select(PlatformFarmer).where(
                PlatformFarmer.institution_id == institution_id,
                PlatformFarmer.local_id == local_id,
            )
        )
        signal = "local_id" if existing else "new"

    if existing:
        return existing.msid, signal
    return new_id("MS-FMR"), "new"


def find_farmer_msid(db: Session, institution_id: int, payload: dict, local_id: str | None) -> str | None:
    if local_id:
        farmer = db.scalar(
            select(PlatformFarmer).where(
                PlatformFarmer.institution_id == institution_id,
                PlatformFarmer.local_id == local_id,
            )
        )
        if farmer:
            return farmer.msid
    national, _phone = identity_hashes(payload)
    if national:
        farmer = db.scalar(
            select(PlatformFarmer).where(
                PlatformFarmer.institution_id == institution_id,
                PlatformFarmer.national_id_hash == national,
            )
        )
        if farmer:
            return farmer.msid
    return None


def canonicalize(db: Session, principal: AuthPrincipal, staging: StagingRecord) -> tuple[str, str, list[str]]:
    payload = staging.payload_json
    kind = STAGING_ENTITY.get(staging.entity_type, staging.entity_type)
    warnings: list[str] = []
    local_farmer = staging.farmer_local_id or farmer_local_id(payload, staging.local_id, staging.entity_type)

    if kind == "farmer":
        msid, signal = resolve_msid(db, principal.institution_id, payload, staging.local_id)
        farmer = db.get(PlatformFarmer, msid)
        display = payload_str(payload, "fullLegalName", "full_name", "name") or staging.local_id
        if farmer is None:
            farmer = PlatformFarmer(
                msid=msid,
                institution_id=principal.institution_id,
                local_id=staging.local_id,
                display_name=display,
                national_id_hash=identity_hashes(payload)[0],
                phone_hash=identity_hashes(payload)[1],
                payload=payload,
                source_staging_id=staging.id,
            )
            db.add(farmer)
        else:
            farmer.payload = payload
            farmer.display_name = display
            farmer.updated_at = datetime.now(timezone.utc)
        if signal != "new":
            db.add(
                IdentityCandidate(
                    institution_id=principal.institution_id,
                    local_id=staging.local_id,
                    match_signal=signal,
                    existing_msid=msid,
                    confidence="high",
                )
            )
        queue_score_job(db, msid, staging.id, score=False)
        platform_id = msid
    elif kind in {"identity"}:
        msid = find_farmer_msid(db, principal.institution_id, payload, local_farmer)
        if not msid:
            return "needs_review", staging.local_id, ["identity_without_farmer"]
        farmer = db.get(PlatformFarmer, msid)
        if farmer:
            national, phone = identity_hashes(payload)
            farmer.national_id_hash = national or farmer.national_id_hash
            farmer.phone_hash = phone or farmer.phone_hash
            display = payload_str(payload, "fullLegalName", "full_name", "name")
            if display:
                farmer.display_name = display
            merged = dict(farmer.payload or {})
            merged["identity"] = payload
            farmer.payload = merged
            farmer.updated_at = datetime.now(timezone.utc)
        queue_score_job(db, msid, staging.id, score=False)
        platform_id = msid
    elif kind in {"farm", "farm_geometry"}:
        msid = find_farmer_msid(db, principal.institution_id, payload, local_farmer)
        if not msid:
            return "needs_review", staging.local_id, ["farm_without_farmer"]
        farm_id = payload_str(payload, "farmLocalUuid", "farmId", "farm_id", "id") or staging.local_id
        existing = db.get(PlatformFarm, farm_id)
        if existing is None:
            db.add(
                PlatformFarm(
                    id=farm_id,
                    msid=msid,
                    institution_id=principal.institution_id,
                    local_id=staging.local_id,
                    payload=payload,
                )
            )
        else:
            merged = dict(existing.payload)
            merged.update(payload)
            existing.payload = merged
        platform_id = farm_id
        if msid:
            queue_score_job(db, msid, staging.id, score=False)
    elif kind == "enterprise":
        msid = find_farmer_msid(db, principal.institution_id, payload, local_farmer)
        if not msid:
            return "needs_review", staging.local_id, ["enterprise_without_farmer"]
        enterprise_id = payload_str(payload, "enterpriseLocalUuid", "id", "enterpriseId") or staging.local_id
        existing = db.get(PlatformEnterprise, enterprise_id)
        if existing is None:
            db.add(
                PlatformEnterprise(
                    id=enterprise_id,
                    msid=msid,
                    farm_id=payload_str(payload, "farmLocalUuid", "farmId", "farm_id"),
                    sector_id=payload_str(payload, "sector", "sectorId", "sector_id"),
                    payload=payload,
                )
            )
        else:
            existing.payload = payload
        platform_id = enterprise_id
        queue_score_job(db, msid, staging.id, score=True)
    elif kind == "sector_response":
        msid = find_farmer_msid(db, principal.institution_id, payload, local_farmer)
        platform_id = payload_str(payload, "responseLocalUuid", "id") or staging.local_id
        upsert_platform_record(db, platform_id, msid, "sector_response", payload)
        if msid:
            queue_score_job(db, msid, staging.id, score=True)
    else:
        msid = find_farmer_msid(db, principal.institution_id, payload, local_farmer)
        platform_id = payload_str(payload, "evidenceLocalUuid", "evidence_id", "id") or staging.local_id
        upsert_platform_record(db, platform_id, msid, kind, payload)

    db.add(
        CanonicalizationResult(
            staging_id=staging.id,
            entity_type=staging.entity_type,
            msid=msid if kind == "farmer" else find_farmer_msid(db, principal.institution_id, payload, local_farmer),
            platform_id=platform_id,
            lineage={
                "canonical_id": platform_id,
                "raw_local_id": staging.local_id,
                "agent_id": principal.agent_id,
                "device_id": staging.device_id,
                "synced_at": staging.synced_at.isoformat(),
            },
        )
    )
    staging.lifecycle_status = "CANONICALIZED"
    staging.validation_status = "ACCEPTED"
    staging.review_status = "approved"
    staging.approved_at = datetime.now(timezone.utc)
    return "canonicalized", platform_id, warnings


def upsert_platform_record(db: Session, platform_id: str, msid: str | None, kind: str, payload: dict) -> None:
    existing = db.get(PlatformRecord, platform_id)
    if existing is None:
        db.add(PlatformRecord(id=platform_id, msid=msid, kind=kind, payload=payload))
        return
    existing.msid = msid or existing.msid
    existing.kind = kind
    existing.payload = payload


def upsert_staging(
    db: Session,
    principal: AuthPrincipal,
    *,
    device_id: str,
    local_id: str,
    entity_type: str,
    idempotency_key: str,
    payload: dict,
    schema_version: str | None = None,
) -> StagingRecord:
    staging = db.scalar(
        select(StagingRecord).where(
            StagingRecord.institution_id == principal.institution_id,
            StagingRecord.local_id == local_id,
            StagingRecord.entity_type == entity_type,
        )
    )
    if staging is None:
        staging = StagingRecord(
            institution_id=principal.institution_id,
            field_officer_id=principal.agent_id,
            device_id=device_id,
            local_id=local_id,
            idempotency_key=idempotency_key,
            entity_type=entity_type,
            schema_version=schema_version,
            payload_json=payload,
            farmer_local_id=farmer_local_id(payload, local_id, entity_type),
            captured_at=payload_str(payload, "capturedAt", "captured_at"),
        )
        db.add(staging)
        db.flush()
        return staging
    staging.payload_json = payload
    staging.idempotency_key = idempotency_key
    staging.lifecycle_status = "RECEIVED"
    staging.farmer_local_id = farmer_local_id(payload, local_id, entity_type) or staging.farmer_local_id
    return staging


def ingest_evidence(
    db: Session,
    principal: AuthPrincipal,
    *,
    evidence_id: str,
    device_id: str,
    payload: dict,
) -> tuple[str, str]:
    staging = upsert_staging(
        db,
        principal,
        device_id=device_id,
        local_id=evidence_id,
        entity_type="evidence",
        idempotency_key=f"evidence:{evidence_id}",
        payload=payload,
    )
    status, platform_id, _warnings = canonicalize(db, principal, staging)
    return status, platform_id


def queue_score_job(db: Session, msid: str, staging_id: int, *, score: bool) -> None:
    detail = forward_canonical(db, msid, score=score)
    detail["staging_id"] = staging_id
    forwarded = bool(detail.get("forwarded"))
    status = "forwarded" if forwarded else ("accepted" if not detail.get("error") else "forward_failed")
    db.add(
        PlatformScoreJob(
            id=new_id("SCORE"),
            msid=msid,
            status=status,
            forwarded=forwarded,
            detail=detail,
        )
    )


def process_change(
    db: Session,
    principal: AuthPrincipal,
    *,
    batch_id: str,
    device_id: str,
    change: dict,
) -> dict:
    local_id = str(change.get("local_id") or "")
    operation_id = str(change.get("operation_id") or local_id)
    idempotency_key = str(change.get("idempotency_key") or operation_id)
    entity_type = str(change.get("entity_type") or "unknown")
    operation = str(change.get("operation") or "upsert")
    payload = change.get("payload") if isinstance(change.get("payload"), dict) else {}
    schema_version = change.get("schema_version")

    existing = db.scalar(select(MobileSyncItem).where(MobileSyncItem.idempotency_key == idempotency_key))
    if existing and existing.result_json:
        return existing.result_json

    item = MobileSyncItem(
        batch_id=batch_id,
        local_id=local_id,
        operation_id=operation_id,
        idempotency_key=idempotency_key,
        entity_type=entity_type,
        operation=operation,
        payload=payload,
        normalized_payload=normalize_payload(payload),
        status="RECEIVED",
        warnings=[],
    )
    db.add(item)
    db.flush()

    status, warnings = validate_change(entity_type, payload)
    item.warnings = warnings
    if status == "needs_correction":
        item.status = "NEEDS_CORRECTION"
        result = {
            "local_id": local_id,
            "operation_id": operation_id,
            "server_entity_id": None,
            "status": "needs_correction",
            "server_version": 1,
            "warnings": warnings,
        }
        item.result_json = result
        return result

    staging = upsert_staging(
        db,
        principal,
        device_id=device_id,
        local_id=local_id,
        entity_type=entity_type,
        idempotency_key=idempotency_key,
        payload=payload,
        schema_version=str(schema_version) if schema_version else None,
    )

    db.add(
        AuditEvent(
            actor_id=principal.agent_id,
            action="staging_upsert",
            entity_type=entity_type,
            entity_id=local_id,
            detail={"batch_id": batch_id, "staging_id": staging.id},
        )
    )

    try:
        canon_status, platform_id, canon_warnings = canonicalize(db, principal, staging)
    except Exception as exc:  # noqa: BLE001 - persist as review, never drop the staging row
        db.add(
            MobileSyncConflict(
                batch_id=batch_id,
                operation_id=operation_id,
                code="canonicalization_failed",
                message=str(exc),
            )
        )
        staging.lifecycle_status = "NEEDS_REVIEW"
        item.status = "NEEDS_REVIEW"
        result = {
            "local_id": local_id,
            "operation_id": operation_id,
            "server_entity_id": None,
            "status": "needs_review",
            "server_version": 1,
            "warnings": [str(exc)],
        }
        item.result_json = result
        return result

    warnings.extend(canon_warnings)
    item.warnings = warnings
    item.server_entity_id = platform_id
    item.status = "CANONICALIZED" if canon_status == "canonicalized" else "NEEDS_REVIEW"
    result = {
        "local_id": local_id,
        "operation_id": operation_id,
        "server_entity_id": platform_id,
        "status": canon_status,
        "server_version": item.server_version,
        "warnings": warnings,
    }
    item.result_json = result
    return result
