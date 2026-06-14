import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  PlusCircle, Eye, Download, Globe as GlobeIcon,
  Film, Camera, Menu, X, BarChart3, ArrowRight
} from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'

const STATS = [
  { label: 'Total Stories',  value: '0',    icon: Film,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { label: 'Total Views',    value: '0',    icon: Eye,       color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Downloads',      value: '0',    icon: Download,  color: 'text-emerald-600',bg: 'bg-emerald-50'},
  { label: 'Plan',           value: 'Free', icon: BarChart3, color: 'text-amber-600',  bg: 'bg-amber-50'  },
]

const QUICKSTART = [
  { emoji: '📷', title: 'Upload a Photo',    desc: 'Turn any image into a 360° story',  href: '/create' },
  { emoji: '🎥', title: 'Use Your Camera',   desc: 'Capture live and create instantly',  href: '/create' },
  { emoji: '🌐', title: 'Upload 360° File',  desc: 'From Insta360, GoPro, Ricoh Theta', href: '/create' },
]

function EmptyProjectsState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-xl border border-dashed border-gray-200">
      {/* Simple SVG illustration */}
      <svg width="96" height="80" viewBox="0 0 96 80" fill="none" className="mb-6">
        <rect x="8" y="24" width="80" height="52" rx="6" fill="#F3F4F6" />
        <rect x="8" y="24" width="80" height="52" rx="6" stroke="#E5E7EB" strokeWidth="1.5" />
        <rect x="20" y="36" width="28" height="20" rx="3" fill="#DBEAFE" />
        <rect x="54" y="36" width="22" height="8" rx="2" fill="#E5E7EB" />
        <rect x="54" y="48" width="16" height="8" rx="2" fill="#E5E7EB" />
        <circle cx="48" cy="12" r="12" fill="#EFF6FF" stroke="#DBEAFE" strokeWidth="2" />
        <path d="M44 12l3 3 5-5" stroke="#2563EB" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h3 className="text-base font-semibold text-gray-800 mb-1">No stories yet</h3>
      <p className="text-sm text-gray-500 mb-6">Create your first 360° story and it will appear here</p>
      <Link to="/create" className="btn-primary text-sm gap-2">
        <PlusCircle size={15} />
        Create Now
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const navigate  = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('360tales_auth')) navigate('/login')
  }, [navigate])

  const name = localStorage.getItem('360tales_name') || 'Creator'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">

      {/* Sidebar — desktop fixed, mobile overlay */}
      <div className="hidden lg:flex w-60 shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full z-10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <Link to="/create" className="btn-primary text-sm gap-2">
            <PlusCircle size={15} />
            <span>New Story</span>
          </Link>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

            {/* Greeting */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting}, {name} 👋
              </h1>
              <p className="text-sm text-gray-500 mt-1">Start creating your next immersive story.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {STATS.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon size={18} className={color} strokeWidth={1.75} />
                    </div>
                    {label === 'Plan' && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Free</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Recent Projects */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Recent Projects</h2>
              </div>
              <EmptyProjectsState />
            </div>

            {/* Quick Start */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Start</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {QUICKSTART.map(card => (
                  <Link
                    key={card.title}
                    to={card.href}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="text-3xl mb-3">{card.emoji}</div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{card.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4">{card.desc}</p>
                    <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                      Get started <ArrowRight size={13} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
