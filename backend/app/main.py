from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.limiter import limiter
from app.db.session import engine
from app.api.routes import auth, webhooks, events, deliveries, metrics

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"{settings.APP_NAME} starting up...")
    yield
    await engine.dispose()
    print("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description="A reliable webhook delivery engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(deliveries.router, prefix="/deliveries",
                   tags=["Deliveries"])
app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": settings.APP_NAME}
