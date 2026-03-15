import redis.asyncio as aioredis
from app.core.config import settings

DELIVERY_QUEUE = "ranshe:delivery_queue"


async def get_redis():
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)


async def enqueue_event(event_id: str, delay_seconds: int = 0):
    """Push an event ID onto the delivery queue."""
    r = await get_redis()
    try:
        if delay_seconds > 0:
            import time
            score = time.time() + delay_seconds
            await r.zadd("ranshe:delayed_queue", {event_id: score})
        else:
            await r.rpush(DELIVERY_QUEUE, event_id)
    finally:
        await r.aclose()


async def dequeue_event(timeout: int = 5) -> str | None:
    """Block-pop next event ID from the queue."""
    r = await get_redis()
    try:
        result = await r.blpop(DELIVERY_QUEUE, timeout=timeout)
        if result:
            _, event_id = result
            return event_id
        return None
    finally:
        await r.aclose()


async def promote_delayed_events():
    """Move due delayed events into the main delivery queue."""
    import time
    r = await get_redis()
    try:
        now = time.time()
        due = await r.zrangebyscore("ranshe:delayed_queue", 0, now)
        if due:
            await r.zremrangebyscore("ranshe:delayed_queue", 0, now)
            for event_id in due:
                await r.rpush(DELIVERY_QUEUE, event_id)
    finally:
        await r.aclose()
