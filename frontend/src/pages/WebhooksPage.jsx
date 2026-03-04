import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react'

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [revealedSecrets, setRevealedSecrets] = useState({})
  const [copied, setCopied] = useState(null)

  const load = async () => {
    try {
      const data = await api.getWebhooks()
      setWebhooks(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      await api.createWebhook(name, url)
      setName('')
      setUrl('')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (wh) => {
    await api.updateWebhook(wh.id, { enabled: !wh.enabled })
    await load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this webhook and all its events?')) return
    await api.deleteWebhook(id)
    await load()
  }

  const handleRotate = async (id) => {
    if (!confirm('Rotate the secret? Old signatures will be invalid.')) return
    await api.rotateSecret(id)
    await load()
  }

  const copySecret = (id, secret) => {
    navigator.clipboard.writeText(secret)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <p className="text-gray-500 text-sm mt-1">Register and manage your webhook endpoints</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Webhook
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Register Webhook</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Payment Service" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL</label>
                <input className="input" value={url} onChange={e => setUrl(e.target.value)} required placeholder="https://your-service.com/webhook" type="url" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-center py-20">Loading...</div>
      ) : webhooks.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-500">No webhooks yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map(wh => (
            <div key={wh.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold">{wh.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${wh.enabled ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                      {wh.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 truncate mb-3">{wh.url}</div>

                  {wh.secret && (
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-500 font-mono">Secret:</span>
                      <code className="text-xs text-brand-400 flex-1 font-mono truncate">
                        {revealedSecrets[wh.id] ? wh.secret : '••••••••••••••••••••••••••••••'}
                      </code>
                      <button onClick={() => setRevealedSecrets(p => ({...p, [wh.id]: !p[wh.id]}))} className="text-gray-500 hover:text-gray-300">
                        {revealedSecrets[wh.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => copySecret(wh.id, wh.secret)} className="text-gray-500 hover:text-gray-300">
                        {copied === wh.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleToggle(wh)} className="text-gray-400 hover:text-gray-200 p-1" title={wh.enabled ? 'Disable' : 'Enable'}>
                    {wh.enabled ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => handleRotate(wh.id)} className="text-gray-400 hover:text-yellow-400 p-1" title="Rotate secret">
                    <RefreshCw size={16} />
                  </button>
                  <button onClick={() => handleDelete(wh.id)} className="text-gray-400 hover:text-red-400 p-1" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
