import uuid
from sqlalchemy import String, Integer, DateTime, ForeignKey, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.db.session import Base


class EventStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"
    dead = "dead"


class DeliveryStatus(str, enum.Enum):
    success = "success"
    failed = "failed"
    timeout = "timeout"


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    webhook_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False
    )
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    event_type: Mapped[str] = mapped_column(
        String, nullable=False, default="generic")
    idempotency_key: Mapped[str] = mapped_column(
        String, unique=True, nullable=False)
    status: Mapped[EventStatus] = mapped_column(
        SAEnum(EventStatus, name="event_status", create_type=False),
        nullable=False,
        default=EventStatus.pending
    )
    attempt_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    webhook = relationship("Webhook", back_populates="events")
    deliveries = relationship(
        "Delivery", back_populates="event", cascade="all, delete-orphan")
    retry_logs = relationship(
        "RetryLog", back_populates="event", cascade="all, delete-orphan")


class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[DeliveryStatus] = mapped_column(
        SAEnum(DeliveryStatus, name="delivery_status", create_type=False),
        nullable=False
    )
    status_code: Mapped[int] = mapped_column(Integer, nullable=True)
    response_body: Mapped[str] = mapped_column(String, nullable=True)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str] = mapped_column(String, nullable=True)
    delivered_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    event = relationship("Event", back_populates="deliveries")


class RetryLog(Base):
    __tablename__ = "retry_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    attempt: Mapped[int] = mapped_column(Integer, nullable=False)
    next_retry_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    event = relationship("Event", back_populates="retry_logs")
