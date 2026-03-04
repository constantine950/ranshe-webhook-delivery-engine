# Ránṣẹ́ 🪝

> A reliable webhook delivery engine that queues, sends, retries, and guarantees event delivery between services.

---

## What is Ránṣẹ́?

**Ránṣẹ́** (Yoruba: *to send*) is a self-hostable webhook delivery platform. Register an endpoint, fire an event — Ránṣẹ́ handles delivery, retries, signatures, and logs.

If the receiving service is down, Ránṣẹ́ keeps trying. If it never recovers, the event lands in a dead-letter queue for manual review.

---

## Features

- 📬 **Reliable delivery** — events are queued and delivered even if the target is temporarily down
- 🔁 **Exponential backoff retries** — up to 5 attempts (1m → 5m → 30m → 2h → 8h)
- 🔐 **HMAC-SHA256 signatures** — every request is signed with your webhook secret
- 🧾 **Full delivery logs** — status codes, latency, response bodies, attempt counts
- 🪪 **Idempotency keys** — duplicate events are safely rejected
- ☠️ **Dead-letter queue** — permanently failed events are quarantined, not lost
- 📊 **Metrics dashboard** — success rate, failure rate, average latency
- 🐳 **Fully Dockerised** — one command to run everything

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | FastAPI (Python 3.11) |
| Queue | Redis |
| Database | PostgreSQL |
| Worker | ARQ (async Redis Queue) |
| Auth | JWT (python-jose) |
| Frontend | React + Vite + Tailwind CSS |
| Container | Docker + Docker Compose |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/yourname/ranshe.git
cd ranshe

# Copy env file
cp .env.example .env

# Start everything
docker compose up --build
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
FastAPI REST API ──── PostgreSQL
        │
        └──── Redis Queue
                    │
                    ▼
              ARQ Worker
                    │
                    ▼
          HTTP POST → Target Webhook
                    │
                    ▼
          Delivery Log → PostgreSQL
```

### Why Redis?
Fast, battle-tested for job queues, native support for delayed jobs (retries), and minimal ops overhead.

### Why PostgreSQL?
Relational model suits the delivery/retry audit trail. Complex queries for metrics. JSONB support for event payloads.

### Retry Strategy

| Attempt | Delay |
|---------|-------|
| 1 | 1 minute |
| 2 | 5 minutes |
| 3 | 30 minutes |
| 4 | 2 hours |
| 5 | 8 hours |

After attempt 5, the event is moved to the dead-letter queue.

---

## API Overview

```
POST   /auth/register
POST   /auth/login

POST   /webhooks
GET    /webhooks
GET    /webhooks/{id}
PUT    /webhooks/{id}
DELETE /webhooks/{id}

POST   /events
GET    /events
GET    /events/{id}

GET    /deliveries/{event_id}
POST   /retry/{delivery_id}

GET    /metrics
```

Full docs at http://localhost:8000/docs when running.

---

## Signature Verification

Every outgoing request includes an `X-Ranshe-Signature` header:

```
X-Ranshe-Signature: sha256=<hmac_hex>
```

Verify in your receiving service:

```python
import hmac, hashlib

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
│   │   ├── core/            # Config, security, dependencies
│   │   ├── db/              # Database connection, session
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── workers/         # ARQ background workers
│   ├── alembic/             # Database migrations
│   └── tests/               # Pytest test suite
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route-level pages
│       ├── hooks/           # Custom React hooks
│       └── lib/             # API client, utilities
├── docs/
│   ├── PRD.md
│   └── schema.sql
├── docker/                  # Dockerfiles
├── docker-compose.yml
└── .env.example
```

---

## Development

```bash
# Backend only
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Worker only
cd backend
arq app.workers.worker.WorkerSettings

# Frontend only
cd frontend
npm install
npm run dev
```

---

## Roadmap

- [ ] Webhook event type filtering
- [ ] Fan-out to multiple endpoints
- [ ] Slack/email alerts on failure
- [ ] Python + Node.js SDK
- [ ] Multi-region delivery

---

*"Send it. Trust it. Ránṣẹ́."*
