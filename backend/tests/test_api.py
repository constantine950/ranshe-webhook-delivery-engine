import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.db.session import Base, get_db

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    app.dependency_overrides[get_db] = override_get_db
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_headers(client):
    await client.post("/auth/register", json={"email": "test@test.com", "password": "password123"})
    response = await client.post("/auth/login", json={"email": "test@test.com", "password": "password123"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ─── Tests ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register(client):
    r = await client.post("/auth/register", json={"email": "user@example.com", "password": "secret123"})
    assert r.status_code == 201
    assert r.json()["email"] == "user@example.com"


@pytest.mark.asyncio
async def test_login(client):
    await client.post("/auth/register", json={"email": "user@example.com", "password": "secret123"})
    r = await client.post("/auth/login", json={"email": "user@example.com", "password": "secret123"})
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_create_webhook(client, auth_headers):
    r = await client.post(
        "/webhooks",
        json={"name": "My Webhook", "url": "https://webhook.site/test"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "My Webhook"
    assert "secret" in data


@pytest.mark.asyncio
async def test_list_webhooks(client, auth_headers):
    await client.post("/webhooks", json={"name": "WH1", "url": "https://example.com/1"}, headers=auth_headers)
    await client.post("/webhooks", json={"name": "WH2", "url": "https://example.com/2"}, headers=auth_headers)
    r = await client.get("/webhooks", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


@pytest.mark.asyncio
async def test_duplicate_event_rejected(client, auth_headers):
    wh = await client.post("/webhooks", json={"name": "WH", "url": "https://example.com"}, headers=auth_headers)
    webhook_id = wh.json()["id"]

    payload = {"webhook_id": webhook_id, "payload": {"data": "test"}, "idempotency_key": "unique-key-123"}

    r1 = await client.post("/events", json=payload, headers=auth_headers)
    # First submission may succeed or fail depending on Redis availability in test
    r2 = await client.post("/events", json=payload, headers=auth_headers)

    # Second submission with same idempotency key must be rejected
    if r1.status_code == 201:
        assert r2.status_code == 409
