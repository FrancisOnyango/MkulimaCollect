from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
import uuid
from dataclasses import dataclass

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import Agent

bearer = HTTPBearer(auto_error=False)


@dataclass
class Principal:
    agent_id: int
    email: str
    institution_id: int
    institution_name: str
    full_name: str
    role_name: str


def hash_password(password: str) -> str:
    return hashlib.sha256(f"{settings.token_secret}:{password}".encode("utf-8")).hexdigest()


def issue_token(*, agent: Agent, kind: str, ttl_seconds: int) -> str:
    payload = {
        "sub": agent.id,
        "email": agent.email,
        "institution_id": agent.institution_id,
        "kind": kind,
        "jti": uuid.uuid4().hex,
        "exp": int(time.time()) + ttl_seconds,
    }
    body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(settings.token_secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return f"{body.decode('utf-8')}.{signature}"


def parse_token(token: str, expected_kind: str) -> dict:
    try:
        body, signature = token.split(".", 1)
        expected = hmac.new(settings.token_secret.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise ValueError("bad signature")
        payload = json.loads(base64.urlsafe_b64decode(body.encode("utf-8")))
        if payload.get("kind") != expected_kind:
            raise ValueError("wrong kind")
        if int(payload["exp"]) < int(time.time()):
            raise ValueError("expired")
        return payload
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


def current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Principal:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = parse_token(credentials.credentials, "access")
    agent = db.get(Agent, int(payload["sub"]))
    if agent is None:
        raise HTTPException(status_code=401, detail="Unknown agent")
    return Principal(
        agent_id=agent.id,
        email=agent.email,
        institution_id=agent.institution_id,
        institution_name=agent.institution_name,
        full_name=agent.full_name,
        role_name=agent.role_name,
    )
