from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    institution_id: Mapped[int] = mapped_column(Integer, index=True)
    institution_name: Mapped[str] = mapped_column(String(255))
    role_name: Mapped[str] = mapped_column(String(64), default="FIELD_AGENT")


class MobileDevice(Base):
    __tablename__ = "ingestion_mobile_devices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), index=True)
    institution_id: Mapped[int] = mapped_column(Integer, index=True)
    app_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class MobileSession(Base):
    __tablename__ = "ingestion_mobile_sessions"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), index=True)
    device_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    refresh_token: Mapped[str] = mapped_column(String(512), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MobileTask(Base):
    __tablename__ = "ingestion_mobile_tasks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), index=True)
    farmer_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    type: Mapped[str] = mapped_column(String(64))
    priority: Mapped[str] = mapped_column(String(16), default="HIGH")
    title: Mapped[str] = mapped_column(String(255))
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="OPEN")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class MobileSyncBatch(Base):
    __tablename__ = "ingestion_mobile_sync_batches"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), index=True)
    institution_id: Mapped[int] = mapped_column(Integer, index=True)
    device_id: Mapped[str] = mapped_column(String(64), index=True)
    app_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    client_time: Mapped[str | None] = mapped_column(String(64), nullable=True)
    baseline_cursor: Mapped[str | None] = mapped_column(String(128), nullable=True)
    server_cursor: Mapped[str] = mapped_column(String(128))
    correlation_id: Mapped[str] = mapped_column(String(64), unique=True)
    status: Mapped[str] = mapped_column(String(32), default="accepted")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class MobileSyncItem(Base):
    __tablename__ = "ingestion_mobile_sync_items"
    __table_args__ = (UniqueConstraint("idempotency_key", name="uq_sync_item_idempotency"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    batch_id: Mapped[str] = mapped_column(ForeignKey("ingestion_mobile_sync_batches.id"), index=True)
    local_id: Mapped[str] = mapped_column(String(128), index=True)
    operation_id: Mapped[str] = mapped_column(String(128), index=True)
    idempotency_key: Mapped[str] = mapped_column(String(128), index=True)
    entity_type: Mapped[str] = mapped_column(String(64), index=True)
    operation: Mapped[str] = mapped_column(String(16))
    payload: Mapped[dict] = mapped_column(JSON)
    normalized_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="RECEIVED")
    server_entity_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    server_version: Mapped[int] = mapped_column(Integer, default=1)
    warnings: Mapped[list] = mapped_column(JSON, default=list)
    result_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class MobileSyncConflict(Base):
    __tablename__ = "ingestion_mobile_sync_conflicts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    batch_id: Mapped[str] = mapped_column(String(128), index=True)
    operation_id: Mapped[str] = mapped_column(String(128), index=True)
    code: Mapped[str] = mapped_column(String(64))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class StagingRecord(Base):
    """Logical staging row for one synced entity before platform promotion."""

    __tablename__ = "ingestion_staging_records"
    __table_args__ = (UniqueConstraint("institution_id", "local_id", "entity_type", name="uq_staging_local_entity"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(32), default="mkulimacollect")
    institution_id: Mapped[int] = mapped_column(Integer, index=True)
    field_officer_id: Mapped[int] = mapped_column(Integer, index=True)
    device_id: Mapped[str] = mapped_column(String(64), index=True)
    local_id: Mapped[str] = mapped_column(String(128), index=True)
    idempotency_key: Mapped[str] = mapped_column(String(128), index=True)
    entity_type: Mapped[str] = mapped_column(String(64), index=True)
    schema_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    payload_json: Mapped[dict] = mapped_column(JSON)
    validation_status: Mapped[str] = mapped_column(String(32), default="RECEIVED")
    review_status: Mapped[str] = mapped_column(String(32), default="pending")
    lifecycle_status: Mapped[str] = mapped_column(String(32), default="RECEIVED")
    farmer_local_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    captured_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class EvidenceUpload(Base):
    __tablename__ = "ingestion_mobile_evidence_uploads"

    evidence_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    institution_id: Mapped[int] = mapped_column(Integer, index=True)
    agent_id: Mapped[int] = mapped_column(Integer, index=True)
    local_entity_id: Mapped[str] = mapped_column(String(128), index=True)
    entity_type: Mapped[str] = mapped_column(String(64), default="evidence")
    evidence_type: Mapped[str] = mapped_column(String(64))
    mime_type: Mapped[str] = mapped_column(String(128))
    file_size_bytes: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str | None] = mapped_column(String(128), nullable=True)
    storage_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="authorized")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class IdentityCandidate(Base):
    __tablename__ = "ingestion_identity_candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    institution_id: Mapped[int] = mapped_column(Integer, index=True)
    local_id: Mapped[str] = mapped_column(String(128), index=True)
    match_signal: Mapped[str] = mapped_column(String(64))
    existing_msid: Mapped[str | None] = mapped_column(String(64), nullable=True)
    confidence: Mapped[str] = mapped_column(String(32), default="review")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class CanonicalizationResult(Base):
    __tablename__ = "ingestion_canonicalization_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    staging_id: Mapped[int] = mapped_column(Integer, index=True)
    entity_type: Mapped[str] = mapped_column(String(64))
    msid: Mapped[str | None] = mapped_column(String(64), nullable=True)
    platform_id: Mapped[str] = mapped_column(String(64), index=True)
    lineage: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditEvent(Base):
    __tablename__ = "ingestion_audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    action: Mapped[str] = mapped_column(String(64))
    entity_type: Mapped[str] = mapped_column(String(64))
    entity_id: Mapped[str] = mapped_column(String(128))
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class PlatformFarmer(Base):
    __tablename__ = "platform_farmers"

    msid: Mapped[str] = mapped_column(String(64), primary_key=True)
    institution_id: Mapped[int] = mapped_column(Integer, index=True)
    local_id: Mapped[str] = mapped_column(String(128), index=True)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    national_id_hash: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    phone_hash: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    source_staging_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class PlatformFarm(Base):
    __tablename__ = "platform_farms"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    msid: Mapped[str] = mapped_column(String(64), index=True)
    institution_id: Mapped[int] = mapped_column(Integer, index=True)
    local_id: Mapped[str] = mapped_column(String(128), index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class PlatformEnterprise(Base):
    __tablename__ = "platform_enterprises"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    msid: Mapped[str] = mapped_column(String(64), index=True)
    farm_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    sector_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class PlatformRecord(Base):
    __tablename__ = "platform_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    msid: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    kind: Mapped[str] = mapped_column(String(64), index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class PlatformScoreJob(Base):
    __tablename__ = "platform_score_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    msid: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), default="queued")
    forwarded: Mapped[bool] = mapped_column(default=False)
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
