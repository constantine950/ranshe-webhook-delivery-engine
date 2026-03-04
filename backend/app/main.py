from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import engine
from app.api.routes import auth, webhooks, events, deliveries, metrics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 {settings.APP_NAME} starting up...")
    yield
    # Shutdown
    await engine.dispose()
    print("👋 Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description="A reliable webhook delivery engine",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(deliveries.router, prefix="/deliveries", tags=["Deliveries"])
app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": settings.APP_NAME}
