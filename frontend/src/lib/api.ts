import type { User, Webhook, Event, Delivery, Metrics, TokenResponse } from '@/types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function getToken(): string | null {
  return localStorage.getItem('ranshe_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error((err as { detail: string }).detail ?? 'Request failed')
  }

  if (res.status === 204) return null as T
  return res.json() as Promise<T>
}

export const api = {
  // Auth
  register: (email: string, password: string): Promise<User> =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),

  login: async (email: string, password: string): Promise<TokenResponse> => {
    const data = await request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('ranshe_token', data.access_token)
    return data
  },

  logout: (): void => localStorage.removeItem('ranshe_token'),

  me: (): Promise<User> => request('/auth/me'),

  // Webhooks
  getWebhooks: (): Promise<Webhook[]> => request('/webhooks'),

  createWebhook: (name: string, url: string): Promise<Webhook> =>
    request('/webhooks', { method: 'POST', body: JSON.stringify({ name, url }) }),

  updateWebhook: (id: string, data: Partial<Webhook>): Promise<Webhook> =>
    request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteWebhook: (id: string): Promise<null> =>
    request(`/webhooks/${id}`, { method: 'DELETE' }),

  rotateSecret: (id: string): Promise<Webhook> =>
    request(`/webhooks/${id}/rotate-secret`, { method: 'POST' }),

  // Events
  getEvents: (status?: string): Promise<Event[]> =>
    request(`/events${status ? `?status=${status}` : ''}`),

  createEvent: (webhookId: string, payload: Record<string, unknown>, eventType = 'generic'): Promise<Event> =>
    request('/events', {
      method: 'POST',
      body: JSON.stringify({ webhook_id: webhookId, payload, event_type: eventType }),
    }),

  // Deliveries
  getDeliveries: (eventId: string): Promise<Delivery[]> =>
    request(`/deliveries/${eventId}`),

  retryEvent: (eventId: string): Promise<{ message: string; event_id: string }> =>
    request(`/deliveries/retry/${eventId}`, { method: 'POST' }),

  // Metrics
  getMetrics: (): Promise<Metrics> => request('/metrics'),
}
