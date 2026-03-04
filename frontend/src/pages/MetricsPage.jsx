import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CheckCircle, XCircle, Skull, Clock, Activity } from 'lucide-react'

const COLORS = ['#22c55e', '#ef4444', '#6b7280', '#eab308']

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMetrics()
      .then(setMetrics)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-500 text-center py-20">Loading metrics...</div>
  if (!metrics) return null

  const pieData = [
    { name: 'Sent', value: metrics.total_sent },
    { name: 'Failed', value: metrics.total_failed },
    { name: 'Dead', value: metrics.total_dead },
    { name: 'Pending', value: metrics.total_events - metrics.total_sent - metrics.total_failed - metrics.total_dead },
  ].filter(d => d.value > 0)

  const statCards = [
    { label: 'Total Events', value: metrics.total_events, icon: Activity, color: 'text-brand-400' },
    { label: 'Delivered', value: metrics.total_sent, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Failed', value: metrics.total_failed, icon: XCircle, color: 'text-red-400' },
    { label: 'Dead Letter', value: metrics.total_dead, icon: Skull, color: 'text-gray-400' },
    { label: 'Success Rate', value: `${metrics.success_rate}%`, icon: CheckCircle, color: 'text-brand-400' },
    { label: 'Avg Latency', value: metrics.avg_latency_ms ? `${metrics.avg_latency_ms}ms` : '—', icon: Clock, color: 'text-yellow-400' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Metrics</h2>
        <p className="text-gray-500 text-sm mt-1">Overview of your webhook delivery performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center gap-3 mb-2">
              <Icon size={18} className={color} />
              <span className="text-sm text-gray-400">{label}</span>
            </div>
            <div className="text-3xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {metrics.total_events > 0 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">Event Status Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">Delivery Overview</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: 'Sent', count: metrics.total_sent, fill: '#22c55e' },
                { name: 'Failed', count: metrics.total_failed, fill: '#ef4444' },
                { name: 'Dead', count: metrics.total_dead, fill: '#6b7280' },
              ]}>
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {[{ fill: '#22c55e' }, { fill: '#ef4444' }, { fill: '#6b7280' }].map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {metrics.total_events === 0 && (
        <div className="card text-center py-16 text-gray-500">
          No events yet. Send some events to see metrics here.
        </div>
      )}
    </div>
  )
}
