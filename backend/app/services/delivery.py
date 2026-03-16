import httpx
import time
import logging
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.event import Event, Delivery, RetryLog, EventStatus, DeliveryStatus
from app.models.webhook import Webhook
from app.core.config import settings
from app.core.security import sign_payload
from app.services.queue import enqueue_event

logger = logging.getLogger(__name__)


async def deliver_event(event_id: str, db: AsyncSession):
    """
    Attempt HTTP delivery of an event.
    On failure, schedule retry or mark dead.
    """
    # Fetch event + webhook
    result = await db.execute(
        select(Event).where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        logger.warning(f"Event {event_id} not found, skipping")
        return

    result = await db.execute(
        select(Webhook).where(Webhook.id == event.webhook_id)
    )
    webhook = result.scalar_one_or_none()
    if not webhook or not webhook.enabled:
        logger.warning(f"Webhook for event {event_id} missing or disabled")
        event.status = EventStatus.failed
        await db.commit()
        return

    attempt_number = event.attempt_count + 1
    signature = sign_payload(webhook.secret, event.payload)

    headers = {
        "Content-Type": "application/json",
        "User-Agent": settings.DELIVERY_USER_AGENT,
        "X-Ranshe-Signature": signature,
        "X-Ranshe-Event-Id": str(event.id),
        "X-Ranshe-Attempt": str(attempt_number),
    }

    start = time.monotonic()
    delivery_status = DeliveryStatus.failed
    status_code = None
    response_body = None
    error_message = None

    try:
        async with httpx.AsyncClient(timeout=settings.DELIVERY_TIMEOUT_SECONDS) as client:
            response = await client.post(
                webhook.url,
                json=event.payload,
                headers=headers,
            )
            latency_ms = int((time.monotonic() - start) * 1000)
            status_code = response.status_code
            response_body = response.text[:1000]  # truncate

            if 200 <= status_code < 300:
                delivery_status = DeliveryStatus.success
            else:
                error_message = f"Non-2xx response: {status_code}"

    except httpx.TimeoutException:
        latency_ms = int((time.monotonic() - start) * 1000)
        delivery_status = DeliveryStatus.timeout
        error_message = "Request timed out"

    except Exception as e:
        latency_ms = int((time.monotonic() - start) * 1000)
        error_message = str(e)
        logger.error(f"Delivery error for event {event_id}: {e}")

    # Record delivery attempt
    delivery = Delivery(
        event_id=event.id,
        attempt_number=attempt_number,
        status=delivery_status,
        status_code=status_code,
        response_body=response_body,
        latency_ms=latency_ms,
        error_message=error_message,
    )
    db.add(delivery)
    event.attempt_count = attempt_number

    if delivery_status == DeliveryStatus.success:
        event.status = EventStatus.sent
        logger.info(f"✅ Event {event_id} delivered (attempt {attempt_number})")
    else:
        await _handle_failure(event, attempt_number, error_message, db)

    await db.commit()


async def _handle_failure(event: Event, attempt_number: int, reason: str, db: AsyncSession):
    delays = settings.retry_delays

    if attempt_number >= settings.MAX_RETRY_ATTEMPTS:
        event.status = EventStatus.dead
        logger.warning(
            f"☠️  Event {event.id} moved to dead-letter queue after {attempt_number} attempts")
        return

    delay = delays[attempt_number - 1] if attempt_number - \
        1 < len(delays) else delays[-1]
    next_retry_at = datetime.utcnow() + timedelta(seconds=delay)

    retry_log = RetryLog(
        event_id=event.id,
        attempt=attempt_number,
        next_retry_at=next_retry_at,
        reason=reason,
    )
    db.add(retry_log)
    event.status = EventStatus.pending

    await enqueue_event(str(event.id), delay_seconds=delay)
    logger.info(
        f"🔁 Event {event.id} retry #{attempt_number + 1} scheduled in {delay}s")
