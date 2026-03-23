# Product Requirements Document

## Ránṣẹ́ — Webhook Delivery Engine

**Tagline:** A reliable webhook delivery engine that queues, sends, retries, and guarantees event delivery between services.

**Version:** 1.0 | **Date:** March 2026 | **Status:** Active

---

## 1. Problem Statement

Modern service architectures depend on webhooks to push data between systems. But HTTP delivery is fragile — receiving services go down, networks drop packets, and failed events are often lost silently. Most teams solve this ad hoc, per project. Ránṣẹ́ solves it once, reliably.

---

## 2. MVP Features

- Register webhook endpoints with auto-generated secrets
- Accept event payloads and queue them via Redis
- Background workers deliver events via HTTP POST
- HMAC-SHA256 signed requests
- Exponential backoff retry (1m → 5m → 30m → 2h → 8h, max 5 attempts)
- Idempotency keys to prevent duplicate delivery
- Dead-letter queue for permanently failed events
- Delivery logs: status, latency, response body, attempt count
- Manual retry via API and dashboard
- React dashboard with metrics charts

---

## 3. Architecture

```
Client → FastAPI → PostgreSQL
              └── Redis Queue → ARQ Worker → HTTP POST → Target
                                                  └── Delivery Log → PostgreSQL
```

**Why Redis?** Fast, battle-tested for job queues, native support for delayed jobs via sorted sets.

**Why PostgreSQL?** Relational model suits audit trail. JSONB for flexible event payloads. Complex metrics queries.

---

## 4. Data Model

| Table      | Purpose                                     |
| ---------- | ------------------------------------------- |
| users      | Authentication                              |
| webhooks   | Registered endpoints + secrets              |
| events     | Queued payloads + status                    |
| deliveries | Per-attempt log (status, latency, response) |
| retry_logs | Scheduled retry timestamps + reasons        |

---

## 5. Retry Strategy

| Attempt | Delay      |
| ------- | ---------- |
| 1       | 1 minute   |
| 2       | 5 minutes  |
| 3       | 30 minutes |
| 4       | 2 hours    |
| 5       | 8 hours    |

After attempt 5 → dead-letter queue. Manual retry available via `POST /deliveries/retry/{event_id}`.

---

## 6. API Surface

```
POST   /auth/register | /auth/login
POST   /webhooks      GET /webhooks       PUT/DELETE /webhooks/{id}
POST   /events        GET /events         GET /events/{id}
GET    /deliveries/{event_id}
POST   /deliveries/retry/{event_id}
GET    /metrics
```

---

## 7. Success Criteria

- [ ] Webhook registered via API
- [ ] Event delivered to real HTTP endpoint
- [ ] Failed delivery automatically retried up to 5x
- [ ] Delivery logs visible in dashboard
- [ ] `docker compose up` starts everything
- [ ] 5-minute demo video recorded
