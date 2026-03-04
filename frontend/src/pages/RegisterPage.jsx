import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.register(email, password)
      await login(email, password)
      navigate('/metrics')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-400">Ránṣẹ́</h1>
          <p className="text-gray-500 mt-2 text-sm">Create your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="min. 8 characters" minLength={8} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-sm text-gray-500 text-center mt-4">
            Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
