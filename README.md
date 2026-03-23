# Ránṣẹ́ 🪝

> A reliable webhook delivery engine that queues, sends, retries, and guarantees event delivery between services.

---

## What is Ránṣẹ́?

**Ránṣẹ́** (Yoruba: _to send_) is a self-hostable webhook delivery platform. Instead of firing HTTP requests directly from your app and hoping they land, you hand events to Ránṣẹ́ — it takes responsibility for delivery, retries, signatures, and logs.

If the receiving service is down, Ránṣẹ́ keeps trying. If it never recovers, the event lands in a dead-letter queue for manual review. Nothing is silently dropped.

---

## Features

- 📬 **Reliable delivery** — events are queued in Redis and delivered even if the target is temporarily down
- 🔁 **Exponential backoff retries** — up to 5 attempts: 1m → 5m → 30m → 2h → 8h
- 🔐 **HMAC-SHA256 signatures** — every request is signed with your webhook secret
- 🧾 **Full delivery logs** — HTTP status, latency, response body, attempt count per event
- 🪪 **Idempotency keys** — duplicate events are safely rejected
- ☠️ **Dead-letter queue** — permanently failed events are quarantined, not lost
- 🔄 **Manual retry** — re-queue failed or dead events via API or dashboard
- 🚦 **Rate limiting** — 60 requests/minute per IP on event submission
- 📊 **Metrics dashboard** — success rate, failure rate, average latency
- 🐳 **Fully Dockerised** — one command to run everything

---

## Tech Stack

| Layer     | Technology                               |
| --------- | ---------------------------------------- |
| API       | FastAPI (Python 3.11)                    |
| Queue     | Redis                                    |
| Database  | PostgreSQL 15                            |
| Worker    | Custom async consumer                    |
| Auth      | JWT (python-jose + passlib)              |
| Frontend  | React + TypeScript + Vite + Tailwind CSS |
| Container | Docker + Docker Compose                  |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/constantine950/ranshe-webhook-delivery-engine.git
cd ranshe-webhook-delivery-engine

# Copy env file and configure
cp .env.example .env

# Start everything
docker compose up --build -d
```

Services:

- API: http://localhost:8000
- Dashboard: http://localhost:5173
- API Docs: http://localhost:8000/docs

---

## Architecture

```
Client
  │
  ▼
FastAPI REST API ──── PostgreSQL 15
        │                   │
        │              (webhooks, events,
        │               deliveries, retry_logs)
        │
        └──── Redis Queue
                    │
                    ▼
              Worker Process
                    │
                    ├── HTTP POST → Target Webhook URL
                    │         │
                    │    200 OK → event.status = sent
                    │    4xx/5xx → schedule retry
                    │    timeout → schedule retry
                    │
                    └── Delivery Log → PostgreSQL
```

### Why Redis?

Fast, battle-tested for job queues. Supports delayed jobs via sorted sets for retry scheduling. Zero schema overhead — just push and pop event IDs.

### Why PostgreSQL?

Relational model suits the delivery audit trail perfectly. JSONB for flexible event payloads. Complex aggregation queries for metrics. Enums for type-safe status fields.

### Retry Strategy

Ránṣẹ́ uses exponential backoff to avoid hammering a struggling service:

| Attempt | Delay      |
| ------- | ---------- |
| 1       | 1 minute   |
| 2       | 5 minutes  |
| 3       | 30 minutes |
| 4       | 2 hours    |
| 5       | 8 hours    |

After attempt 5, the event moves to the **dead-letter queue** (status: `dead`). It can be manually retried via `POST /deliveries/retry/{event_id}` or from the dashboard.

---

## API Reference

### Auth

```
POST /auth/register     Create account
POST /auth/login        Get JWT token
GET  /auth/me           Get current user
```

### Webhooks

```
POST   /webhooks              Register new webhook
GET    /webhooks              List all webhooks
GET    /webhooks/{id}         Get webhook + secret
PUT    /webhooks/{id}         Update webhook
DELETE /webhooks/{id}         Delete webhook
POST   /webhooks/{id}/rotate-secret   Rotate secret key
```

### Events

```
POST /events            Submit event for delivery
GET  /events            List events (filter by status)
GET  /events/{id}       Get event details
```

### Deliveries

```
GET  /deliveries/{event_id}       Get delivery history
POST /deliveries/retry/{event_id} Manually retry event
```

### Metrics

```
GET /metrics    Success rate, failure rate, avg latency
```

---

## Request Signatures

Every outgoing request includes an `X-Ranshe-Signature` header:

```
X-Ranshe-Signature: sha256=<hmac_hex>
X-Ranshe-Event-Id: <event-uuid>
X-Ranshe-Attempt: <attempt-number>
```

Verify in your receiving service:

```python
import hmac, hashlib, json

def verify_signature(payload: bytes, secret: str, signature: str) -> bool:
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

---

## Project Structure

```
ranshe/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # FastAPI route handlers
│   │   ├── core/            # Config, security, JWT, rate limiter
│   │   ├── db/              # Database engine and session
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Delivery engine + Redis queue
│   │   └── workers/         # Background delivery worker
│   ├── alembic/             # Database migrations
│   └── tests/               # Pytest test suite
├── frontend/
│   └── src/
│       ├── components/      # Dashboard layout + UI
│       ├── pages/           # Metrics, Webhooks, Events pages
│       ├── hooks/           # Auth context
│       ├── lib/             # Typed API client
│       └── types/           # TypeScript interfaces
├── docs/
│   ├── PRD.md               # Product requirements
│   └── schema.sql           # PostgreSQL schema
├── docker/                  # Dockerfiles
├── docker-compose.yml
└── .env.example
```

---

## Data Model

| Table        | Purpose                                      |
| ------------ | -------------------------------------------- |
| `users`      | Authentication                               |
| `webhooks`   | Registered endpoints + HMAC secrets          |
| `events`     | Queued payloads with status tracking         |
| `deliveries` | Per-attempt log (status, latency, response)  |
| `retry_logs` | Scheduled retry timestamps + failure reasons |

---

## Development

```bash
# Start DB + Redis in Docker
docker compose up db redis -d

# Backend
cd backend
python -m venv .venv
source .venv/Scripts/activate  # Windows
pip install -r requirements.txt
make dev       # API server
make worker    # Delivery worker

# Frontend
cd frontend
npm install
npm run dev
```

---

## Environment Variables

| Variable                   | Description                        |
| -------------------------- | ---------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection string       |
| `REDIS_URL`                | Redis connection string            |
| `SECRET_KEY`               | JWT signing key                    |
| `MAX_RETRY_ATTEMPTS`       | Max delivery attempts (default: 5) |
| `RETRY_DELAYS_SECONDS`     | Comma-separated delays per attempt |
| `DELIVERY_TIMEOUT_SECONDS` | HTTP request timeout (default: 30) |
| `CORS_ORIGINS`             | Allowed frontend origins           |

---

## Roadmap

- [ ] Webhook event type filtering
- [ ] Fan-out to multiple endpoints per event
- [ ] Slack/email alerts on delivery failure
- [ ] Python + Node.js SDK
- [ ] Multi-region delivery

---

_"Send it. Trust it. Ránṣẹ́."_
