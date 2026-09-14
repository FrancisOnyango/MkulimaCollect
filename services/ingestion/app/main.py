from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import DATA_DIR, settings
from .database import Base, SessionLocal, engine, get_db
from .models import (
    Agent,
    AuditEvent,
    EvidenceUpload,
    MobileDevice,
    MobileSession,
    MobileSyncBatch,
    MobileTask,
    PlatformEnterprise,
    PlatformFarm,
    PlatformFarmer,
    PlatformRecord,
    PlatformScoreJob,
    StagingRecord,
    utcnow,
)
from .pipeline import ENABLED_SECTORS, ingest_evidence, new_id, process_change
from .security import current_principal, hash_password, issue_token, parse_token, Principal


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_pipeline()
    yield


app = FastAPI(title="MkulimaCollect ingestion pipeline", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SyncChange(BaseModel):
    local_id: str
    operation_id: str | None = None
    entity_type: str
    operation: str = "upsert"
    idempotency_key: str
    depends_on: list[str] = Field(default_factory=list)
    baseline_version: int | None = None
    schema_version: str | None = None
    payload: dict = Field(default_factory=dict)


class SyncRequest(BaseModel):
    device_id: str
    sync_batch_id: str
    app_version: str | None = None
    client_time: str
    baseline_cursor: str | None = None
    changes: list[SyncChange]


class BootstrapRequest(BaseModel):
    agent_id: str
    device_id: str
    app_version: str
    last_cursor: str | None = None


class EvidenceAuthRequest(BaseModel):
    evidence_id: str | None = None
    farmer_id: str | None = None
    entity_type: str = "evidence"
    local_entity_id: str | None = None
    evidence_type: str | None = None
    mime_type: str
    file_hash: str | None = None
    sha256: str | None = None
    file_size_bytes: int
    device_id: str | None = None


class EvidenceFinalizeRequest(BaseModel):
    upload_completed: bool | None = None
    server_ref: str | None = None
    etag: str | None = None
    device_id: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class RevokeRequest(BaseModel):
    device_id: str | None = None


def init_pipeline() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
        db.commit()
    finally:
        db.close()


def seed(db: Session) -> None:
    agent = db.scalar(select(Agent).where(Agent.email == settings.seed_agent_email))
    if agent is None:
        agent = Agent(
            email=settings.seed_agent_email,
            password=hash_password(settings.seed_agent_password),
            full_name=settings.seed_agent_name,
            institution_id=settings.seed_institution_id,
            institution_name=settings.seed_institution_name,
            role_name="FIELD_AGENT",
        )
        db.add(agent)
        db.flush()
    if db.get(MobileTask, "task-dev-001") is None:
        db.add(
            MobileTask(
                id="task-dev-001",
                agent_id=agent.id,
                type="GPS",
                priority="HIGH",
                title="Map farm boundary",
                detail="Capture GPS boundary for a dairy enterprise",
                due_date=datetime.now(timezone.utc).date().isoformat(),
            )
        )


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "mkulimacollect-ingestion"}


@app.post("/api/v1/auth/login/access-token")
async def login(request: Request, db: Session = Depends(get_db)) -> dict:
    form = await request.form()
    username = str(form.get("username") or "")
    password = str(form.get("password") or "")
    agent = db.scalar(select(Agent).where(Agent.email == username))
    if agent is None or agent.password != hash_password(password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access = issue_token(agent=agent, kind="access", ttl_seconds=12 * 60 * 60)
    refresh = issue_token(agent=agent, kind="refresh", ttl_seconds=30 * 24 * 60 * 60)
    db.add(
        MobileSession(
            id=new_id("SES"),
            agent_id=agent.id,
            refresh_token=refresh,
            expires_at=utcnow() + timedelta(days=30),
        )
    )
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": 12 * 60 * 60,
    }


@app.get("/api/v1/auth/me")
def me(principal: Principal = Depends(current_principal)) -> dict:
    return {
        "id": principal.agent_id,
        "email": principal.email,
        "full_name": principal.full_name,
        "institution_id": principal.institution_id,
        "role_name": principal.role_name,
        "dashboard_role": principal.role_name,
    }


@app.post("/api/v1/auth/refresh")
def refresh(body: RefreshRequest, db: Session = Depends(get_db)) -> dict:
    payload = parse_token(body.refresh_token, "refresh")
    agent = db.get(Agent, int(payload["sub"]))
    if agent is None:
        raise HTTPException(status_code=401, detail="Unknown agent")
    session = db.scalar(select(MobileSession).where(MobileSession.refresh_token == body.refresh_token))
    if session is None or session.revoked_at is not None:
        raise HTTPException(status_code=401, detail="Refresh token is not active")
    access = issue_token(agent=agent, kind="access", ttl_seconds=12 * 60 * 60)
    return {"access_token": access, "refresh_token": body.refresh_token, "token_type": "bearer", "expires_in": 12 * 60 * 60}


@app.post("/api/v1/auth/logout")
def logout(principal: Principal = Depends(current_principal), db: Session = Depends(get_db)) -> dict:
    sessions = db.scalars(select(MobileSession).where(MobileSession.agent_id == principal.agent_id)).all()
    for session in sessions:
        session.revoked_at = utcnow()
    return {"ok": True}


@app.post("/api/v1/mobile/devices/revoke")
def revoke_device(
    body: RevokeRequest,
    principal: Principal = Depends(current_principal),
    db: Session = Depends(get_db),
) -> dict:
    if body.device_id:
        device = db.get(MobileDevice, body.device_id)
        if device and device.agent_id == principal.agent_id:
            device.revoked_at = utcnow()
    return {"ok": True}


@app.post("/api/v1/mobile/bootstrap")
def bootstrap(
    body: BootstrapRequest,
    principal: Principal = Depends(current_principal),
    db: Session = Depends(get_db),
) -> dict:
    device = db.get(MobileDevice, body.device_id)
    if device is None:
        db.add(
            MobileDevice(
                id=body.device_id,
                agent_id=principal.agent_id,
                institution_id=principal.institution_id,
                app_version=body.app_version,
            )
        )
    else:
        device.last_seen_at = utcnow()
        device.app_version = body.app_version
    return {
        "server_time": utcnow().isoformat(),
        "min_supported_version": settings.min_supported_version,
        "consent_version": settings.consent_version,
        "sync_cursor": body.last_cursor or "0",
        "current_user": {"id": str(principal.agent_id), "email": principal.email, "name": principal.full_name, "role": principal.role_name},
        "institution": {"id": str(principal.institution_id), "name": principal.institution_name},
        "permissions": ["collect", "sync"],
        "enabled_sectors": ENABLED_SECTORS,
        "schema_versions": {"dairy-field-v1": "2.1.0"},
        "supported_evidence_types": [
            "national_id_photo",
            "farm_photo",
            "livestock_photo",
            "crop_photo",
            "sacco_document",
            "consent_form",
            "buyer_delivery_record",
            "other_supporting_evidence",
        ],
    }


@app.get("/api/v1/mobile/assignments")
def assignments(principal: Principal = Depends(current_principal), db: Session = Depends(get_db)) -> list[dict]:
    farmers = db.scalars(
        select(PlatformFarmer).where(PlatformFarmer.institution_id == principal.institution_id)
    ).all()
    return [
        {
            "id": farmer.msid,
            "name": farmer.display_name or farmer.msid,
            "village": "",
            "status": "canonicalized",
            "updated_at": farmer.updated_at.isoformat(),
        }
        for farmer in farmers
    ]


@app.get("/api/v1/mobile/tasks")
def tasks(principal: Principal = Depends(current_principal), db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(select(MobileTask).where(MobileTask.agent_id == principal.agent_id)).all()
    return [
        {
            "id": row.id,
            "task_id": row.id,
            "agent_id": str(principal.agent_id),
            "farmer_id": row.farmer_id,
            "type": row.type,
            "priority": row.priority,
            "title": row.title,
            "detail": row.detail,
            "due_date": row.due_date,
            "status": row.status,
            "updated_at": row.updated_at.isoformat(),
        }
        for row in rows
    ]


@app.post("/api/v1/mobile/sync")
def sync(
    body: SyncRequest,
    principal: Principal = Depends(current_principal),
    db: Session = Depends(get_db),
) -> dict:
    correlation_id = str(uuid.uuid4())
    server_cursor = f"cursor_{int(utcnow().timestamp())}_{uuid.uuid4().hex[:8]}"
    batch = MobileSyncBatch(
        id=body.sync_batch_id,
        agent_id=principal.agent_id,
        institution_id=principal.institution_id,
        device_id=body.device_id,
        app_version=body.app_version,
        client_time=body.client_time,
        baseline_cursor=body.baseline_cursor,
        server_cursor=server_cursor,
        correlation_id=correlation_id,
        status="accepted",
    )
    existing = db.get(MobileSyncBatch, body.sync_batch_id)
    if existing is None:
        db.add(batch)
        db.flush()
    else:
        batch = existing
        server_cursor = existing.server_cursor
        correlation_id = existing.correlation_id

    results = []
    rejected = []
    conflicts = []
    for change in body.changes:
        result = process_change(
            db,
            principal,
            batch_id=batch.id,
            device_id=body.device_id,
            change=change.model_dump(),
        )
        results.append(result)
        if result["status"] in {"needs_correction", "rejected"}:
            rejected.append(
                {
                    "local_id": result["local_id"],
                    "operation_id": result["operation_id"],
                    "code": result["status"],
                    "message": "; ".join(result.get("warnings") or [result["status"]]),
                }
            )
        if result["status"] == "conflict":
            conflicts.append(
                {
                    "local_id": result["local_id"],
                    "operation_id": result["operation_id"],
                    "code": "conflict",
                    "message": "; ".join(result.get("warnings") or ["conflict"]),
                }
            )

    if rejected and len(rejected) == len(results):
        batch.status = "rejected"
    elif rejected or conflicts:
        batch.status = "partial"
    else:
        batch.status = "accepted"

    db.add(
        AuditEvent(
            actor_id=principal.agent_id,
            action="sync_batch",
            entity_type="sync_batch",
            entity_id=batch.id,
            detail={"status": batch.status, "count": len(results)},
        )
    )
    db.commit()
    return {
        "sync_batch_id": batch.id,
        "status": batch.status,
        "server_cursor": server_cursor,
        "correlation_id": correlation_id,
        "results": results,
        "rejected": rejected,
        "conflicts": conflicts,
    }


@app.post("/api/v1/mobile/evidence/upload-authorization")
def authorize_evidence(
    body: EvidenceAuthRequest,
    principal: Principal = Depends(current_principal),
    db: Session = Depends(get_db),
) -> dict:
    if body.file_size_bytes > settings.max_evidence_bytes:
        raise HTTPException(status_code=400, detail="Evidence file is too large")
    evidence_id = body.evidence_id or new_id("EVD")
    local_id = body.local_entity_id or body.farmer_id or evidence_id
    db.merge(
        EvidenceUpload(
            evidence_id=evidence_id,
            institution_id=principal.institution_id,
            agent_id=principal.agent_id,
            local_entity_id=local_id,
            entity_type=body.entity_type,
            evidence_type=body.evidence_type or "other_supporting_evidence",
            mime_type=body.mime_type,
            file_size_bytes=body.file_size_bytes,
            sha256=body.sha256 or body.file_hash,
            status="authorized",
        )
    )
    db.commit()
    expires = utcnow() + timedelta(minutes=20)
    return {
        "evidence_id": evidence_id,
        "upload_url": f"{settings.public_base_url}/api/v1/mobile/evidence/{evidence_id}/bytes",
        "expires_at": expires.isoformat(),
        "required_headers": {"Content-Type": body.mime_type},
    }


@app.put("/api/v1/mobile/evidence/{evidence_id}/bytes")
async def upload_evidence_bytes(
    evidence_id: str,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    row = db.get(EvidenceUpload, evidence_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Unknown evidence id")
    data = await request.body()
    if len(data) > settings.max_evidence_bytes:
        raise HTTPException(status_code=400, detail="Evidence file is too large")
    path = DATA_DIR / "incoming" / evidence_id
    path.write_bytes(data)
    row.storage_path = str(path)
    row.status = "uploaded"
    db.commit()
    return {"evidence_id": evidence_id, "status": "uploaded", "bytes": len(data)}


@app.post("/api/v1/mobile/evidence/{evidence_id}/finalize")
def finalize_evidence(
    evidence_id: str,
    body: EvidenceFinalizeRequest,
    principal: Principal = Depends(current_principal),
    db: Session = Depends(get_db),
) -> dict:
    row = db.get(EvidenceUpload, evidence_id)
    if row is None or row.agent_id != principal.agent_id:
        raise HTTPException(status_code=404, detail="Unknown evidence id")
    row.status = "received"
    row.finalized_at = utcnow()
    payload = {
        "evidence_id": evidence_id,
        "evidenceLocalUuid": evidence_id,
        "farmerLocalUuid": row.local_entity_id,
        "farmer_id": row.local_entity_id,
        "path": row.storage_path,
        "etag": body.etag,
        "sha256": row.sha256,
        "mime_type": row.mime_type,
        "evidence_type": row.evidence_type,
    }
    status, platform_id = ingest_evidence(
        db,
        principal,
        evidence_id=evidence_id,
        device_id=body.device_id or "unknown",
        payload=payload,
    )
    db.commit()
    return {"evidence_id": evidence_id, "status": status, "server_entity_id": platform_id}


@app.get("/api/v1/pipeline/staging")
def list_staging(principal: Principal = Depends(current_principal), db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(
        select(StagingRecord).where(StagingRecord.institution_id == principal.institution_id).order_by(StagingRecord.id.desc())
    ).all()
    return [
        {
            "id": row.id,
            "entity_type": row.entity_type,
            "local_id": row.local_id,
            "lifecycle_status": row.lifecycle_status,
            "validation_status": row.validation_status,
            "farmer_local_id": row.farmer_local_id,
            "synced_at": row.synced_at.isoformat(),
        }
        for row in rows
    ]


@app.get("/api/v1/pipeline/platform/farmers")
def list_platform_farmers(principal: Principal = Depends(current_principal), db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(
        select(PlatformFarmer).where(PlatformFarmer.institution_id == principal.institution_id)
    ).all()
    farms = db.scalars(select(PlatformFarm)).all()
    enterprises = db.scalars(select(PlatformEnterprise)).all()
    jobs = db.scalars(select(PlatformScoreJob)).all()
    return [
        {
            "msid": row.msid,
            "display_name": row.display_name,
            "local_id": row.local_id,
            "farms": [farm.id for farm in farms if farm.msid == row.msid],
            "enterprises": [item.id for item in enterprises if item.msid == row.msid],
            "score_jobs": [job.id for job in jobs if job.msid == row.msid],
        }
        for row in rows
    ]


@app.get("/api/v1/pipeline/status")
def pipeline_status(principal: Principal = Depends(current_principal), db: Session = Depends(get_db)) -> dict:
    def count(model) -> int:
        return int(db.scalar(select(func.count()).select_from(model)) or 0)

    return {
        "staging_records": count(StagingRecord),
        "platform_farmers": count(PlatformFarmer),
        "platform_farms": count(PlatformFarm),
        "platform_enterprises": count(PlatformEnterprise),
        "platform_records": count(PlatformRecord),
        "score_jobs": count(PlatformScoreJob),
        "forwards_enabled": bool(settings.platform_api_url),
    }


class ScoreIngestRequest(BaseModel):
    msid: str
    source: str = "mkulimacollect"
    staging_id: int | None = None


@app.post("/api/v1/pipeline/ingest-score")
def ingest_score(
    body: ScoreIngestRequest,
    principal: Principal = Depends(current_principal),
    db: Session = Depends(get_db),
) -> dict:
    farmer = db.get(PlatformFarmer, body.msid)
    if farmer is None or farmer.institution_id != principal.institution_id:
        raise HTTPException(status_code=404, detail="Unknown canonical farmer")
    job = PlatformScoreJob(
        id=new_id("SCORE"),
        msid=body.msid,
        status="accepted",
        forwarded=False,
        detail={"source": body.source, "staging_id": body.staging_id, "pipeline": "ingest-score"},
    )
    db.add(job)
    return {"msid": body.msid, "score_job_id": job.id, "status": "accepted"}
