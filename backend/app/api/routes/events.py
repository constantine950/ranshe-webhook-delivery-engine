from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.db.session import get_db
from app.models.user import User
from app.models.webhook import Webhook
from app.models.event import Event, EventStatus
from app.schemas.schemas import EventCreate, EventOut
from app.core.dependencies import get_current_user
from app.core.security import compute_idempotency_key
from app.services.queue import enqueue_event

router = APIRouter()


@router.post("", response_model=EventOut, status_code=201)
async def create_event(
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify webhook belongs to user
    result = await db.execute(
        select(Webhook).where(
            Webhook.id == data.webhook_id,
            Webhook.user_id == current_user.id,
            Webhook.enabled == True,
        )
    )
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found or disabled")

    # Compute idempotency key
    idem_key = data.idempotency_key or compute_idempotency_key(
        str(data.webhook_id), data.payload
    )

    # Check for duplicate
    existing = await db.execute(
        select(Event).where(Event.idempotency_key == idem_key)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Duplicate event (idempotency key exists)")

    # Create event
    event = Event(
        webhook_id=data.webhook_id,
        payload=data.payload,
        event_type=data.event_type,
        idempotency_key=idem_key,
        status=EventStatus.pending,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)

    # Enqueue for delivery
    await enqueue_event(str(event.id))

    return event


@router.get("", response_model=list[EventOut])
async def list_events(
    status: str = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Event)
        .join(Webhook)
        .where(Webhook.user_id == current_user.id)
        .order_by(Event.created_at.desc())
        .limit(limit)
    )
    if status:
        query = query.where(Event.status == status)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{event_id}", response_model=EventOut)
async def get_event(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Event)
        .join(Webhook)
        .where(Event.id == event_id, Webhook.user_id == current_user.id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
