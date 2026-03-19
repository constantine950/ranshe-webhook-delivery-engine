import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Event, Delivery, EventStatus, Webhook } from "@/types";
import { RefreshCw, ChevronDown, ChevronUp, Send, Plus, X } from "lucide-react";

const STATUS_BADGE: Record<EventStatus, string> = {
  pending: "badge-pending",
  sent: "badge-sent",
  failed: "badge-failed",
  dead: "badge-dead",
};

const FILTERS: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
  { label: "Dead", value: "dead" },
];

const DEFAULT_PAYLOAD = `{
  "key": "value"
}`;

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
  const [retrying, setRetrying] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState("");
  const [eventType, setEventType] = useState("generic");
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [payloadError, setPayloadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [eventsData, webhooksData] = await Promise.all([
        api.getEvents(filter || undefined),
        api.getWebhooks(),
      ]);
      setEvents(eventsData);
      setWebhooks(webhooksData);
      if (webhooksData.length > 0 && !selectedWebhook) {
        setSelectedWebhook(webhooksData[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filter]);

  const validatePayload = (value: string): Record<string, unknown> | null => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const handleSubmitEvent = async () => {
    setSubmitError("");
    setSubmitSuccess("");
    setPayloadError("");

    if (!selectedWebhook) {
      setSubmitError("Please select a webhook");
      return;
    }

    const parsed = validatePayload(payload);
    if (!parsed) {
      setPayloadError("Invalid JSON payload");
      return;
    }

    setSubmitting(true);
    try {
      await api.createEvent(selectedWebhook, parsed, eventType);
      setSubmitSuccess("Event submitted successfully!");
      setPayload(DEFAULT_PAYLOAD);
      setEventType("generic");
      setTimeout(() => {
        setSubmitSuccess("");
        setShowForm(false);
      }, 2000);
      await load();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit event",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = async (eventId: string) => {
    if (expanded === eventId) {
      setExpanded(null);
      return;
    }
    setExpanded(eventId);
    if (!deliveries[eventId]) {
      const data = await api.getDeliveries(eventId);
      setDeliveries((prev) => ({ ...prev, [eventId]: data }));
    }
  };

  const handleRetry = async (eventId: string) => {
    setRetrying(eventId);
    try {
      await api.retryEvent(eventId);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-gray-500 text-sm mt-1">
            Submit and track webhook delivery attempts
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => void load()}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Cancel" : "Send Event"}
          </button>
        </div>
      </div>

      {/* Submit Event Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Send Event</h3>

          {submitError && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg mb-4">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="bg-green-900/40 border border-green-700 text-green-300 text-sm px-3 py-2 rounded-lg mb-4">
              {submitSuccess}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Webhook
              </label>
              {webhooks.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No webhooks found. Create one first.
                </p>
              ) : (
                <select
                  className="input"
                  value={selectedWebhook}
                  onChange={(e) => setSelectedWebhook(e.target.value)}
                >
                  {webhooks.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} —{" "}
                      {wh.url.length > 40
                        ? wh.url.slice(0, 40) + "..."
                        : wh.url}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Event Type
              </label>
              <input
                className="input"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="e.g. user.signup, order.created"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">
              Payload (JSON)
            </label>
            <textarea
              className={`input font-mono text-sm resize-none h-36 ${payloadError ? "border-red-500" : ""}`}
              value={payload}
              onChange={(e) => {
                setPayload(e.target.value);
                setPayloadError("");
              }}
              placeholder='{"key": "value"}'
              spellCheck={false}
            />
            {payloadError && (
              <p className="text-red-400 text-xs mt-1">{payloadError}</p>
            )}
          </div>

          <button
            onClick={() => void handleSubmitEvent()}
            disabled={submitting || webhooks.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            <Send size={14} />
            {submitting ? "Sending..." : "Send Event"}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f.value
                ? "bg-brand-700 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-20">Loading...</div>
      ) : events.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          No events found. Send one using the button above.
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <div key={ev.id} className="card p-0 overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => void toggleExpand(ev.id)}
              >
                <span className={STATUS_BADGE[ev.status]}>{ev.status}</span>
                <span className="text-sm font-medium">{ev.event_type}</span>
                <span className="text-xs text-gray-500 font-mono truncate flex-1">
                  {ev.id}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(ev.created_at).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">
                  {ev.attempt_count} attempt{ev.attempt_count !== 1 ? "s" : ""}
                </span>

                {(ev.status === "failed" || ev.status === "dead") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRetry(ev.id);
                    }}
                    disabled={retrying === ev.id}
                    className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                  >
                    <Send size={12} />
                    {retrying === ev.id ? "Retrying..." : "Retry"}
                  </button>
                )}

                {expanded === ev.id ? (
                  <ChevronUp size={16} className="text-gray-500 shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-gray-500 shrink-0" />
                )}
              </div>

              {expanded === ev.id && (
                <div className="border-t border-gray-800 p-4 bg-gray-900/50">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payload</p>
                      <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded-lg overflow-auto max-h-40">
                        {JSON.stringify(ev.payload, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">
                        Delivery Attempts
                      </p>
                      {!deliveries[ev.id] || deliveries[ev.id].length === 0 ? (
                        <p className="text-xs text-gray-500">
                          No attempts yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {deliveries[ev.id].map((d) => (
                            <div
                              key={d.id}
                              className="bg-gray-800 rounded-lg p-2 text-xs"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`font-medium ${d.status === "success" ? "text-green-400" : "text-red-400"}`}
                                >
                                  #{d.attempt_number} — {d.status}
                                </span>
                                {d.status_code && (
                                  <span className="text-gray-400">
                                    HTTP {d.status_code}
                                  </span>
                                )}
                                {d.latency_ms && (
                                  <span className="text-gray-500">
                                    {d.latency_ms}ms
                                  </span>
                                )}
                              </div>
                              {d.error_message && (
                                <p className="text-red-400">
                                  {d.error_message}
                                </p>
                              )}
                              {d.response_body && (
                                <p className="text-gray-500 truncate">
                                  {d.response_body}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
