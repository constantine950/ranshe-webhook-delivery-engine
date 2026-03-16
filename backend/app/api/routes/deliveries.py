from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.db.session import get_db
from app.models.user import User
from app.models.webhook import Webhook
from app.models.event import Event, Delivery, EventStatus
from app.schemas.schemas import DeliveryOut
from app.core.dependencies import get_current_user
from app.services.queue import enqueue_event

router = APIRouter()


@router.get("/{event_id}", response_model=list[DeliveryOut])
async def get_deliveries(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify ownership
    result = await db.execute(
        select(Event)
        .join(Webhook)
        .where(Event.id == event_id, Webhook.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Event not found")

    result = await db.execute(
        select(Delivery)
        .where(Delivery.event_id == event_id)
        .order_by(Delivery.delivered_at.asc())
    )
    return result.scalars().all()


@router.post("/retry/{event_id}", status_code=202)
async def manual_retry(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Event)
        .join(Webhook)
        .where(
            Event.id == event_id,
            Webhook.user_id == current_user.id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status == EventStatus.sent:
        raise HTTPException(
            status_code=400, detail="Event already delivered successfully")

    # Reset to pending and re-enqueue
    event.status = EventStatus.pending
    event.attempt_count = 0
    await db.flush()

    await enqueue_event(str(event.id))
    return {"message": "Event re-queued for delivery", "event_id": str(event_id)}
