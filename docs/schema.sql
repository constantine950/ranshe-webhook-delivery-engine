-- Ránṣẹ́ Database Schema
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────

CREATE TYPE event_status AS ENUM ('pending', 'sent', 'failed', 'dead');
CREATE TYPE delivery_status AS ENUM ('success', 'failed', 'timeout');

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ─────────────────────────────────────────
-- WEBHOOKS
-- ─────────────────────────────────────────

CREATE TABLE webhooks (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    url        TEXT NOT NULL,
    secret     TEXT NOT NULL,
    enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_enabled ON webhooks(enabled);

-- ─────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────

CREATE TABLE events (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id       UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    payload          JSONB NOT NULL,
    event_type       TEXT NOT NULL DEFAULT 'generic',
    idempotency_key  TEXT UNIQUE NOT NULL,
    status           event_status NOT NULL DEFAULT 'pending',
    attempt_count    INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_webhook_id ON events(webhook_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_idempotency_key ON events(idempotency_key);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- ─────────────────────────────────────────
-- DELIVERIES
-- ─────────────────────────────────────────

CREATE TABLE deliveries (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id       UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL,
    status         delivery_status NOT NULL,
    status_code    INT,
    response_body  TEXT,
    latency_ms     INT,
    error_message  TEXT,
    delivered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliveries_event_id ON deliveries(event_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_delivered_at ON deliveries(delivered_at DESC);

-- ─────────────────────────────────────────
-- RETRY LOGS
-- ─────────────────────────────────────────

CREATE TABLE retry_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    attempt       INT NOT NULL,
    next_retry_at TIMESTAMPTZ NOT NULL,
    reason        TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_retry_logs_event_id ON retry_logs(event_id);
CREATE INDEX idx_retry_logs_next_retry_at ON retry_logs(next_retry_at);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
