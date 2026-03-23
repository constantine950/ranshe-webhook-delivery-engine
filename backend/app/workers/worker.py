import asyncio
import logging
from arq import cron
from arq.connections import RedisSettings

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.services.delivery import deliver_event
from app.services.queue import promote_delayed_events

logger = logging.getLogger(__name__)


async def process_event(ctx, event_id: str):
    """ARQ task: deliver a single event."""
    async with AsyncSessionLocal() as db:
        await deliver_event(event_id, db)


async def promote_delayed(ctx):
    """Cron task: move due delayed events to the main queue every 30s."""
    await promote_delayed_events()


async def startup(ctx):
    logger.info("Ránṣẹ́ worker started")


async def shutdown(ctx):
    logger.info("Ránṣẹ́ worker shutting down")


class WorkerSettings:
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    functions = [process_event]
    cron_jobs = [cron(promote_delayed, second={0, 30})]
    on_startup = startup
    on_shutdown = shutdown
    max_jobs = 10
    job_timeout = 60
    keep_result = 3600


async def run_consumer():
    """Simple Redis BLPOP consumer loop (no ARQ dependency)."""
    from app.services.queue import dequeue_event

    logger.info("Worker consumer started (standalone mode)")
    while True:
        try:
            event_id = await dequeue_event(timeout=5)
            if event_id:
                logger.info(f"Processing event: {event_id}")
                async with AsyncSessionLocal() as db:
                    await deliver_event(event_id, db)
            else:
                # Also promote delayed events while idle
                await promote_delayed_events()
        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(1)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_consumer())
