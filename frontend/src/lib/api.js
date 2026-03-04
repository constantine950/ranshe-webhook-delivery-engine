const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('ranshe_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // Auth
  register: (email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: async (email, password) => {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    localStorage.setItem('ranshe_token', data.access_token)
    return data
  },
  logout: () => localStorage.removeItem('ranshe_token'),
  me: () => request('/auth/me'),

  // Webhooks
  getWebhooks: () => request('/webhooks'),
  createWebhook: (name, url) =>
    request('/webhooks', { method: 'POST', body: JSON.stringify({ name, url }) }),
  updateWebhook: (id, data) =>
    request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWebhook: (id) =>
    request(`/webhooks/${id}`, { method: 'DELETE' }),
  rotateSecret: (id) =>
    request(`/webhooks/${id}/rotate-secret`, { method: 'POST' }),

  // Events
  getEvents: (status) =>
    request(`/events${status ? `?status=${status}` : ''}`),
  createEvent: (webhookId, payload, eventType = 'generic') =>
    request('/events', { method: 'POST', body: JSON.stringify({ webhook_id: webhookId, payload, event_type: eventType }) }),

  // Deliveries
  getDeliveries: (eventId) => request(`/deliveries/${eventId}`),
  retryEvent: (eventId) =>
    request(`/deliveries/retry/${eventId}`, { method: 'POST' }),

  // Metrics
  getMetrics: () => request('/metrics'),
}
