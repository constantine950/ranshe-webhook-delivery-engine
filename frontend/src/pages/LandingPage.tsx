export default function LandingPage() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        background: "#080810",
        minHeight: "100vh",
        color: "#f1f0ff",
        overflowX: "hidden",
      }}
    >
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --brand: #a21bcf;
          --brand-dark: #6f168a;
          --bg: #080810;
          --surface: #0f0f1a;
          --surface2: #16162a;
          --border: rgba(255,255,255,0.08);
          --text: #f1f0ff;
          --muted: #9b98b8;
        }
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 2.5rem;
          background: rgba(8,8,16,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .lp-nav-logo { font-size: 1.4rem; font-weight: 700; color: #d870fa; letter-spacing: -0.02em; text-decoration: none; }
        .lp-nav-links { display: flex; align-items: center; gap: 2rem; list-style: none; }
        .lp-nav-links a { color: var(--muted); text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
        .lp-nav-links a:hover { color: var(--text); }
        .lp-nav-cta { background: var(--brand) !important; color: #fff !important; padding: 0.5rem 1.25rem !important; border-radius: 8px; font-weight: 500; font-size: 0.875rem !important; }
        .lp-hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
          padding: 8rem 2rem 4rem; position: relative; overflow: hidden;
        }
        .lp-hero::before {
          content: ''; position: absolute; top: 20%; left: 50%; transform: translateX(-50%);
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(162,27,207,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(162,27,207,0.15); border: 1px solid rgba(162,27,207,0.3);
          color: #d870fa; padding: 0.375rem 1rem; border-radius: 999px;
          font-size: 0.8rem; font-weight: 500; margin-bottom: 2rem;
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .lp-badge-dot { width: 6px; height: 6px; background: #d870fa; border-radius: 50%; animation: lp-pulse 2s infinite; }
        @keyframes lp-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .lp-h1 { font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 1.5rem; max-width: 800px; }
        .lp-h1 span { background: linear-gradient(135deg, #d870fa, #a21bcf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .lp-hero p { font-size: 1.2rem; color: var(--muted); max-width: 560px; margin-bottom: 2.5rem; line-height: 1.7; }
        .lp-actions { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; justify-content: center; }
        .lp-btn-primary {
          background: var(--brand); color: #fff; padding: 0.875rem 2rem; border-radius: 10px;
          font-weight: 600; font-size: 1rem; text-decoration: none; cursor: pointer; border: none;
          transition: background 0.2s, transform 0.1s; display: inline-flex; align-items: center; gap: 0.5rem;
        }
        .lp-btn-primary:hover { background: var(--brand-dark); transform: translateY(-1px); }
        .lp-btn-secondary {
          color: var(--muted); padding: 0.875rem 2rem; border-radius: 10px; font-size: 1rem;
          text-decoration: none; border: 1px solid var(--border); background: transparent;
          transition: border-color 0.2s, color 0.2s; cursor: pointer;
        }
        .lp-btn-secondary:hover { border-color: rgba(255,255,255,0.2); color: var(--text); }
        .lp-flow { display: flex; align-items: center; justify-content: center; margin: 5rem auto 0; max-width: 700px; padding: 0 2rem; flex-wrap: wrap; gap: 0.5rem; }
        .lp-flow-step { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 0.875rem 1.25rem; font-size: 0.8rem; color: var(--muted); }
        .lp-flow-step strong { display: block; color: var(--text); font-size: 0.9rem; margin-bottom: 2px; }
        .lp-flow-step.hl { border-color: rgba(162,27,207,0.4); background: rgba(162,27,207,0.1); }
        .lp-flow-step.hl strong { color: #d870fa; }
        .lp-flow-arrow { color: #a21bcf; font-size: 1.2rem; padding: 0 0.25rem; }
        .lp-section { padding: 6rem 2rem; max-width: 1100px; margin: 0 auto; }
        .lp-label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #d870fa; margin-bottom: 1rem; }
        .lp-section-title { font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 1rem; max-width: 600px; }
        .lp-section-sub { color: var(--muted); font-size: 1.05rem; max-width: 500px; margin-bottom: 3.5rem; }
        .lp-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .lp-feature { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 1.75rem; transition: border-color 0.2s; }
        .lp-feature:hover { border-color: rgba(162,27,207,0.3); }
        .lp-feature-icon { width: 42px; height: 42px; background: rgba(162,27,207,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin-bottom: 1rem; }
        .lp-feature h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text); }
        .lp-feature p { font-size: 0.875rem; color: var(--muted); line-height: 1.6; }
        .lp-retry-section { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .lp-retry-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
        .lp-retry-timeline { display: flex; flex-direction: column; }
        .lp-retry-item { display: flex; align-items: flex-start; gap: 1rem; position: relative; }
        .lp-retry-item:not(:last-child)::after { content: ''; position: absolute; left: 15px; top: 32px; width: 2px; height: 100%; background: var(--border); }
        .lp-retry-dot { width: 32px; height: 32px; border-radius: 50%; background: var(--surface2); border: 2px solid #ef4444; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #ef4444; flex-shrink: 0; z-index: 1; }
        .lp-retry-dot.dead { border-color: #555; color: #555; background: #111; }
        .lp-retry-content { padding: 0.6rem 0; }
        .lp-retry-content strong { display: block; font-size: 0.875rem; margin-bottom: 2px; color: var(--text); }
        .lp-retry-content span { font-size: 0.8rem; color: var(--muted); }
        .lp-tag { font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; font-weight: 500; margin-left: 0.5rem; }
        .lp-tag-failed { background: rgba(239,68,68,0.15); color: #ef4444; }
        .lp-tag-dead { background: rgba(100,100,100,0.15); color: #888; }
        .lp-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; }
        .lp-step-num { font-size: 2.5rem; font-weight: 800; color: rgba(162,27,207,0.25); line-height: 1; margin-bottom: 0.75rem; }
        .lp-step h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text); }
        .lp-step p { font-size: 0.875rem; color: var(--muted); line-height: 1.6; }
        .lp-stack { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; }
        .lp-stack-item { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 1.25rem; text-align: center; }
        .lp-stack-item .name { font-size: 0.9rem; font-weight: 600; margin-bottom: 4px; color: var(--text); }
        .lp-stack-item .role { font-size: 0.75rem; color: var(--muted); }
        .lp-cta { text-align: center; padding: 8rem 2rem; position: relative; overflow: hidden; }
        .lp-cta::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 500px; height: 500px; background: radial-gradient(circle, rgba(162,27,207,0.12) 0%, transparent 70%); pointer-events: none; }
        .lp-cta h2 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 1rem; }
        .lp-cta p { color: var(--muted); font-size: 1.1rem; margin-bottom: 2.5rem; }
        .lp-footer { border-top: 1px solid var(--border); padding: 2rem 2.5rem; display: flex; align-items: center; justify-content: space-between; color: var(--muted); font-size: 0.85rem; max-width: 1100px; margin: 0 auto; }
        @media (max-width: 768px) {
          .lp-nav-links { display: none; }
          .lp-retry-grid { grid-template-columns: 1fr; gap: 2rem; }
          .lp-flow { flex-direction: column; }
        }
      `}</style>

      {/* NAV */}
      <nav className="lp-nav">
        <a href="/" className="lp-nav-logo">
          Ránṣẹ́
        </a>
        <ul className="lp-nav-links">
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#how-it-works">How it works</a>
          </li>
          <li>
            <a href="#stack">Stack</a>
          </li>
          <li>
            <a href="/login" className="lp-nav-cta">
              Open Dashboard →
            </a>
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-badge">
          <span className="lp-badge-dot" />
          Webhook Delivery Engine
        </div>
        <h1 className="lp-h1">
          Send it. Trust it.
          <br />
          <span>Ránṣẹ́.</span>
        </h1>
        <p>
          A self-hostable webhook delivery engine that queues, sends, retries,
          and guarantees event delivery between your services.
        </p>
        <div className="lp-actions">
          <a href="/login" className="lp-btn-primary">
            Open Dashboard →
          </a>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="lp-btn-secondary"
          >
            API Docs
          </a>
        </div>
        <div className="lp-flow">
          <div className="lp-flow-step">
            <strong>Your App</strong>POST /events
          </div>
          <div className="lp-flow-arrow">→</div>
          <div className="lp-flow-step hl">
            <strong>Ránṣẹ́</strong>Queue · Deliver · Retry
          </div>
          <div className="lp-flow-arrow">→</div>
          <div className="lp-flow-step">
            <strong>Your Service</strong>Webhook URL
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section" id="features">
        <div className="lp-label">Features</div>
        <h2 className="lp-section-title">
          Everything delivery needs. Nothing it doesn't.
        </h2>
        <p className="lp-section-sub">
          Built for reliability. Every feature exists to guarantee your events
          land.
        </p>
        <div className="lp-features">
          {[
            {
              icon: "🔁",
              title: "Exponential backoff retries",
              desc: "Failed deliveries retry at 1m → 5m → 30m → 2h → 8h. No event is abandoned after one failure.",
            },
            {
              icon: "🔐",
              title: "HMAC-SHA256 signatures",
              desc: "Every outgoing request is signed with your webhook secret. Verify payload integrity on your end.",
            },
            {
              icon: "🧾",
              title: "Full delivery logs",
              desc: "HTTP status, response body, latency, and attempt count logged per delivery. Nothing is invisible.",
            },
            {
              icon: "🪪",
              title: "Idempotency keys",
              desc: "Same payload to the same endpoint returns 409. Duplicates are rejected before they queue.",
            },
            {
              icon: "☠️",
              title: "Dead-letter queue",
              desc: "Events that exhaust all retries are quarantined, not lost. Retry them when the service recovers.",
            },
            {
              icon: "📊",
              title: "Metrics dashboard",
              desc: "Success rate, failure rate, average latency, and delivery charts — full visibility at a glance.",
            },
          ].map((f) => (
            <div className="lp-feature" key={f.title}>
              <div className="lp-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RETRY TIMELINE */}
      <div className="lp-retry-section">
        <div className="lp-section">
          <div className="lp-retry-grid">
            <div>
              <div className="lp-label">Retry Strategy</div>
              <h2 className="lp-section-title">
                It keeps trying so you don't have to.
              </h2>
              <p className="lp-section-sub" style={{ marginBottom: 0 }}>
                Delays grow exponentially to avoid hammering a struggling
                service.
              </p>
            </div>
            <div className="lp-retry-timeline">
              {[
                {
                  num: "1",
                  label: "Attempt 1 fails",
                  tag: "500",
                  delay: "Retry in 1 minute",
                },
                {
                  num: "2",
                  label: "Attempt 2 fails",
                  tag: "timeout",
                  delay: "Retry in 5 minutes",
                },
                {
                  num: "3",
                  label: "Attempt 3 fails",
                  tag: "503",
                  delay: "Retry in 30 minutes",
                },
                {
                  num: "4",
                  label: "Attempt 4 fails",
                  tag: "500",
                  delay: "Retry in 2 hours",
                },
                {
                  num: "5",
                  label: "Attempt 5 fails",
                  tag: "500",
                  delay: "Retry in 8 hours",
                },
              ].map((r) => (
                <div className="lp-retry-item" key={r.num}>
                  <div className="lp-retry-dot">{r.num}</div>
                  <div className="lp-retry-content">
                    <strong>
                      {r.label}{" "}
                      <span className="lp-tag lp-tag-failed">{r.tag}</span>
                    </strong>
                    <span>{r.delay}</span>
                  </div>
                </div>
              ))}
              <div className="lp-retry-item">
                <div className="lp-retry-dot dead">☠</div>
                <div className="lp-retry-content">
                  <strong>
                    Dead letter queue{" "}
                    <span className="lp-tag lp-tag-dead">dead</span>
                  </strong>
                  <span>Manually retry when service recovers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="lp-section" id="how-it-works">
        <div className="lp-label">How it works</div>
        <h2 className="lp-section-title">
          Simple to integrate. Serious about delivery.
        </h2>
        <p className="lp-section-sub">
          Four steps from your app to guaranteed delivery.
        </p>
        <div className="lp-steps">
          {[
            {
              num: "01",
              title: "Register a webhook",
              desc: "POST your destination URL to /webhooks. Get back a signed secret for request verification.",
            },
            {
              num: "02",
              title: "Submit an event",
              desc: "POST your payload to /events with the webhook ID. Ránṣẹ́ queues it in Redis immediately.",
            },
            {
              num: "03",
              title: "Worker delivers it",
              desc: "The background worker picks up the event and POSTs it to your URL with an HMAC signature.",
            },
            {
              num: "04",
              title: "Failure? It retries.",
              desc: "Non-2xx or timeout? Retry with exponential backoff. Up to 5 attempts total.",
            },
          ].map((s) => (
            <div className="lp-step" key={s.num}>
              <div className="lp-step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STACK */}
      <section className="lp-section" id="stack">
        <div className="lp-label">Tech Stack</div>
        <h2 className="lp-section-title">Built on battle-tested tools.</h2>
        <p className="lp-section-sub" style={{ marginBottom: "2.5rem" }}>
          Every choice made for reliability and simplicity.
        </p>
        <div className="lp-stack">
          {[
            { name: "FastAPI", role: "API layer" },
            { name: "PostgreSQL", role: "Persistence" },
            { name: "Redis", role: "Event queue" },
            { name: "Python 3.11", role: "Runtime" },
            { name: "React + TS", role: "Dashboard" },
            { name: "Docker", role: "Containers" },
          ].map((s) => (
            <div className="lp-stack-item" key={s.name}>
              <div className="name">{s.name}</div>
              <div className="role">{s.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <h2>Ready to send?</h2>
        <p>Open the dashboard and start delivering events in minutes.</p>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a href="/login" className="lp-btn-primary">
            Open Dashboard →
          </a>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="lp-btn-secondary"
          >
            View API Docs
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <div className="lp-footer">
        <span>Ránṣẹ́ — Webhook Delivery Engine</span>
        <span>FastAPI · Redis · PostgreSQL</span>
      </div>
    </div>
  );
}
