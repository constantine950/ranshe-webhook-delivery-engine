export type EventStatus = 'pending' | 'sent' | 'failed' | 'dead'
export type DeliveryStatus = 'success' | 'failed' | 'timeout'

export interface User {
  id: string
  email: string
  is_active: boolean
  created_at: string
}

export interface Webhook {
  id: string
  name: string
  url: string
  secret?: string
  enabled: boolean
  created_at: string
}

export interface Event {
  id: string
  webhook_id: string
  event_type: string
  payload: Record<string, unknown>
  status: EventStatus
  attempt_count: number
  created_at: string
}

export interface Delivery {
  id: string
  event_id: string
  attempt_number: number
  status: DeliveryStatus
  status_code: number | null
  response_body: string | null
  latency_ms: number | null
  error_message: string | null
  delivered_at: string
}

export interface Metrics {
  total_events: number
  total_sent: number
  total_failed: number
  total_dead: number
  success_rate: number
  avg_latency_ms: number | null
  total_deliveries: number
}

export interface TokenResponse {
  access_token: string
  token_type: string
}
