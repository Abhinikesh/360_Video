import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusCircle, Search, Film, MoreVertical, Play, Download, Link2, Pencil, Trash2, Menu, Star } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'

const DEMO_PROJECTS = [
  {
    id: 1,
    title: 'Taj Mahal, Agra',
    date: 'Jun 12, 2026',
    duration: '2:15',
    format: 'MP4 1080p',
    formatColor: 'bg-blue-100 text-blue-700',
    status: 'Ready',
    gradient: 'from-amber-100 to-orange-200',
  },
  {
    id: 2,
    title: 'Gateway of India, Mumbai',
    date: 'Jun 10, 2026',
    duration: '1:48',
    format: 'Reels 9:16',
    formatColor: 'bg-purple-100 text-purple-700',
    status: 'Ready',
    gradient: 'from-sky-100 to-blue-200',
  },
]

function ThreeDotMenu({ onAction }) {
  const [open, setOpen] = useState(false)
  const items = [
    { icon: Play,     label: 'Preview',         action: 'preview' },
    { icon: Download, label: 'Download MP4',     action: 'download' },
    { icon: Link2,    label: 'Copy Share Link',  action: 'copy' },
    { icon: Pencil,   label: 'Rename',           action: 'rename' },
    { icon: Trash2,   label: 'Delete',           action: 'delete', red: true },
  ]
  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 w-44 overflow-hidden">
            {items.map(it => (
              <button
                key={it.action}
                onClick={e => { e.stopPropagation(); setOpen(false); onAction(it.action) }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-gray-50 transition-colors ${it.red ? 'text-red-600' : 'text-gray-700'}`}
              >
                <it.icon size={14} />
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ProjectCard({ project, onAction }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
      {/* Thumbnail */}
      <div className={`relative w-full bg-gradient-to-br ${project.gradient} flex items-center justify-center`} style={{ aspectRatio: '16/9' }}>
        <Film size={28} className="text-white/60" />
        <div className="absolute top-2.5 right-2.5">
          <ThreeDotMenu onAction={action => onAction(project, action)} />
        </div>
      </div>

      {/* Card info */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">{project.title}</h3>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">Created {project.date}</p>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${project.formatColor}`}>
            {project.format}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            Ready
          </span>
          <span className="ml-auto text-[11px] text-gray-400 tabular-nums">{project.duration}</span>
        </div>
      </div>
    </div>
  )
}

const TABS = ['All', 'Recent', 'Favorites']

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab]     = useState('All')
  const [search, setSearch]           = useState('')
  const [projects, setProjects]       = useState(DEMO_PROJECTS)
  const [toast, setToast]             = useState(null)

  const showToast = msg => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = (project, action) => {
    if (action === 'download') showToast('Download started!')
    if (action === 'copy')     { navigator.clipboard.writeText('https://360tales.app/share/' + project.id).catch(() => {}); showToast('Link copied!') }
    if (action === 'delete')   { if (window.confirm(`Delete "${project.title}"?`)) setProjects(ps => ps.filter(p => p.id !== project.id)) }
    if (action === 'rename')   { const name = window.prompt('New name:', project.title); if (name) setProjects(ps => ps.map(p => p.id === project.id ? { ...p, title: name } : p)) }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex w-60 shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full z-10"><Sidebar onClose={() => setSidebarOpen(false)} /></div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-semibold text-gray-900">My Projects</h1>
          <div className="flex-1" />
          <Link to="/create" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            <PlusCircle size={15} />
            New Story
          </Link>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Tabs + Search */}
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                {TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}>{tab}</button>
                ))}
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search your stories..."
                  className="form-input pl-9"
                />
              </div>
            </div>

            {/* Stats bar */}
            {filtered.length > 0 && (
              <p className="text-xs text-gray-400">
                {filtered.length} {filtered.length === 1 ? 'story' : 'stories'} · 0 MB used · Free plan: 5 stories max
              </p>
            )}

            {/* Grid or empty */}
            {filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(p => (
                  <ProjectCard key={p.id} project={p} onAction={handleAction} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-xl border border-dashed border-gray-200">
                <svg width="80" height="72" viewBox="0 0 80 72" fill="none" className="mb-6">
                  <rect x="4"  y="20" width="52" height="40" rx="5" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5"/>
                  <rect x="14" y="10" width="52" height="40" rx="5" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.5"/>
                  <rect x="24" y="0"  width="52" height="40" rx="5" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1.5"/>
                  <rect x="36" y="12" width="28" height="16" rx="3" fill="white" opacity="0.6"/>
                </svg>
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  {search ? 'No results found' : 'No projects yet'}
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
                  {search
                    ? `No stories match "${search}"`
                    : 'Your created 360° stories will appear here. Start by creating your first immersive story.'}
                </p>
                {!search && (
                  <Link to="/create"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                    <PlusCircle size={15} />
                    Create Your First Story
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Local toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[200] bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 toast-item">
          <span className="text-green-400">✓</span> {toast}
        </div>
      )}
    </div>
  )
}
