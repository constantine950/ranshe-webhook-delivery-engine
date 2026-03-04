from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, Any, Dict
from datetime import datetime
from uuid import UUID

from app.models.event import EventStatus, DeliveryStatus


# ─── Auth ───────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: UUID
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Webhooks ───────────────────────────────────────────────────

class WebhookCreate(BaseModel):
    name: str
    url: str  # HttpUrl causes issues with some test URLs


class WebhookUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    enabled: Optional[bool] = None


class WebhookOut(BaseModel):
    id: UUID
    name: str
    url: str
    enabled: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class WebhookWithSecret(WebhookOut):
    secret: str


# ─── Events ─────────────────────────────────────────────────────

class EventCreate(BaseModel):
    webhook_id: UUID
    payload: Dict[str, Any]
    event_type: str = "generic"
    idempotency_key: Optional[str] = None  # auto-generated if not provided


class EventOut(BaseModel):
    id: UUID
    webhook_id: UUID
    event_type: str
    payload: Dict[str, Any]
    status: EventStatus
    attempt_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Deliveries ─────────────────────────────────────────────────

class DeliveryOut(BaseModel):
    id: UUID
    event_id: UUID
    attempt_number: int
    status: DeliveryStatus
    status_code: Optional[int]
    response_body: Optional[str]
    latency_ms: Optional[int]
    error_message: Optional[str]
    delivered_at: datetime

    model_config = {"from_attributes": True}


# ─── Metrics ────────────────────────────────────────────────────

class MetricsOut(BaseModel):
    total_events: int
    total_sent: int
    total_failed: int
    total_dead: int
    success_rate: float
    avg_latency_ms: Optional[float]
    total_deliveries: int
