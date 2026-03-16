from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.user import User
from app.models.webhook import Webhook
from app.models.event import Event, Delivery, EventStatus, DeliveryStatus
from app.schemas.schemas import MetricsOut
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=MetricsOut)
async def get_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Total events by status
    events_result = await db.execute(
        select(Event.status, func.count(Event.id))
        .join(Webhook)
        .where(Webhook.user_id == current_user.id)
        .group_by(Event.status)
    )
    status_counts = dict(events_result.all())

    total_sent = status_counts.get(EventStatus.sent, 0)
    total_failed = status_counts.get(EventStatus.failed, 0)
    total_dead = status_counts.get(EventStatus.dead, 0)
    total_pending = status_counts.get(EventStatus.pending, 0)
    total_events = total_sent + total_failed + total_dead + total_pending

    success_rate = (total_sent / total_events *
                    100) if total_events > 0 else 0.0

    # Avg latency from successful deliveries
    latency_result = await db.execute(
        select(func.avg(Delivery.latency_ms))
        .join(Event)
        .join(Webhook)
        .where(
            Webhook.user_id == current_user.id,
            Delivery.status == DeliveryStatus.success,
        )
    )
    avg_latency = latency_result.scalar()

    # Total delivery attempts
    total_deliveries_result = await db.execute(
        select(func.count(Delivery.id))
        .join(Event)
        .join(Webhook)
        .where(Webhook.user_id == current_user.id)
    )
    total_deliveries = total_deliveries_result.scalar() or 0

    return MetricsOut(
        total_events=total_events,
        total_sent=total_sent,
        total_failed=total_failed,
        total_dead=total_dead,
        success_rate=round(success_rate, 2),
        avg_latency_ms=round(avg_latency, 2) if avg_latency else None,
        total_deliveries=total_deliveries,
    )
