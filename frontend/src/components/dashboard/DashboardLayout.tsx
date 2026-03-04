import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Webhook, Zap, BarChart3, LogOut } from 'lucide-react'

const navItems = [
  { to: '/metrics',  label: 'Metrics',  icon: BarChart3 },
  { to: '/webhooks', label: 'Webhooks', icon: Webhook   },
  { to: '/events',   label: 'Events',   icon: Zap       },
] as const

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-brand-400">Ránṣẹ́</h1>
          <p className="text-xs text-gray-500 mt-1">Webhook Engine</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-900 text-brand-300 font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-3 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-950 p-8">
        <Outlet />
      </main>
    </div>
  )
}
