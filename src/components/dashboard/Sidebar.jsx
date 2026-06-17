import { NavLink, useNavigate } from 'react-router-dom'
import { Globe, LayoutDashboard, PlusCircle, FolderOpen, Settings, HelpCircle, LogOut, User } from 'lucide-react'
import { clearToken } from '../../services/api'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'       },
  { to: '/create',    icon: PlusCircle,       label: 'Create New Story' },
  { to: '/projects',  icon: FolderOpen,       label: 'My Projects'      },
  { to: '/settings',  icon: Settings,         label: 'Settings'         },
  { to: '/help',      icon: HelpCircle,       label: 'Help'             },
]

export default function Sidebar({ onClose }) {
  const navigate = useNavigate()
  const name  = localStorage.getItem('360tales_name')  || 'Creator'
  const email = localStorage.getItem('360tales_email') || 'you@example.com'

  const handleLogout = () => {
    clearToken()
    localStorage.removeItem('360tales_auth')
    localStorage.removeItem('360tales_name')
    localStorage.removeItem('360tales_email')
    navigate('/login')
  }

  return (
    <aside className="h-full w-full bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-200 shrink-0">
        <NavLink to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Globe size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">
            360<span className="text-blue-600">Tales</span>
          </span>
        </NavLink>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-[10px]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} strokeWidth={1.75} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="shrink-0 border-t border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
            <User size={16} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={15} />
          Log Out
        </button>
      </div>
    </aside>
  )
}
