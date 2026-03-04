import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { RefreshCw, ChevronDown, ChevronUp, Send } from 'lucide-react'

const STATUS_BADGE = {
  pending: 'badge-pending',
  sent: 'badge-sent',
  failed: 'badge-failed',
  dead: 'badge-dead',
}

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [deliveries, setDeliveries] = useState({})
  const [retrying, setRetrying] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.getEvents(filter || undefined)
      setEvents(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const toggleExpand = async (eventId) => {
    if (expanded === eventId) {
      setExpanded(null)
      return
    }
    setExpanded(eventId)
    if (!deliveries[eventId]) {
      const data = await api.getDeliveries(eventId)
      setDeliveries(p => ({ ...p, [eventId]: data }))
    }
  }

  const handleRetry = async (eventId) => {
    setRetrying(eventId)
    try {
      await api.retryEvent(eventId)
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setRetrying(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-gray-500 text-sm mt-1">Track all webhook delivery attempts</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['', 'pending', 'sent', 'failed', 'dead'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === s ? 'bg-brand-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-20">Loading...</div>
      ) : events.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">No events found.</div>
      ) : (
        <div className="space-y-2">
          {events.map(ev => (
            <div key={ev.id} className="card p-0 overflow-hidden">
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleExpand(ev.id)}>
                <span className={STATUS_BADGE[ev.status]}>{ev.status}</span>
                <span className="text-sm font-medium">{ev.event_type}</span>
                <span className="text-xs text-gray-500 font-mono truncate flex-1">{ev.id}</span>
                <span className="text-xs text-gray-500">{new Date(ev.created_at).toLocaleString()}</span>
                <span className="text-xs text-gray-500">{ev.attempt_count} attempt{ev.attempt_count !== 1 ? 's' : ''}</span>

                {(ev.status === 'failed' || ev.status === 'dead') && (
                  <button onClick={e => { e.stopPropagation(); handleRetry(ev.id) }}
                    disabled={retrying === ev.id}
                    className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
                    <Send size={12} />
                    {retrying === ev.id ? 'Retrying...' : 'Retry'}
                  </button>
                )}

                {expanded === ev.id ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </div>

              {expanded === ev.id && (
                <div className="border-t border-gray-800 p-4 bg-gray-900/50">
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payload</p>
                      <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded-lg overflow-auto max-h-40">
                        {JSON.stringify(ev.payload, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Delivery Attempts</p>
                      {deliveries[ev.id]?.length === 0 ? (
                        <p className="text-xs text-gray-500">No attempts yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {(deliveries[ev.id] || []).map(d => (
                            <div key={d.id} className="bg-gray-800 rounded-lg p-2 text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-medium ${d.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                  #{d.attempt_number} — {d.status}
                                </span>
                                {d.status_code && <span className="text-gray-400">HTTP {d.status_code}</span>}
                                {d.latency_ms && <span className="text-gray-500">{d.latency_ms}ms</span>}
                              </div>
                              {d.error_message && <p className="text-red-400">{d.error_message}</p>}
                              {d.response_body && <p className="text-gray-500 truncate">{d.response_body}</p>}
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
  )
}
