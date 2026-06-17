import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusCircle, Search, Film, MoreVertical,
  Download, Link2, Pencil, Trash2, Menu, Clock
} from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import { projectsAPI } from '../services/api'

const STATUS_COLOR = {
  ready:      'bg-green-100 text-green-700',
  processing: 'bg-blue-100  text-blue-700',
  failed:     'bg-red-100   text-red-700',
  pending:    'bg-gray-100  text-gray-600',
}
const FORMAT_COLOR = {
  'Standard MP4':    'bg-blue-100   text-blue-700',
  'Instagram Reels': 'bg-purple-100 text-purple-700',
  'YouTube 360':     'bg-red-100    text-red-700',
  'VR Ready':        'bg-indigo-100 text-indigo-700',
}

function ThreeDotMenu({ onAction }) {
  const [open, setOpen] = useState(false)
  const items = [
    { icon: Download, label: 'Download MP4',    action: 'download' },
    { icon: Link2,    label: 'Copy Share Link', action: 'copy'     },
    { icon: Pencil,   label: 'Rename',          action: 'rename'   },
    { icon: Trash2,   label: 'Delete',          action: 'delete', red: true },
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
          <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 w-44">
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
  const statusClass = STATUS_COLOR[project.status] || STATUS_COLOR.pending
  const formatClass = FORMAT_COLOR[project.export_format] || 'bg-gray-100 text-gray-600'
  const date = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const duration = project.duration_seconds
    ? `${Math.floor(project.duration_seconds / 60)}:${String(project.duration_seconds % 60).padStart(2, '0')}`
    : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
      {/* Thumbnail */}
      <div
        className="relative w-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center"
        style={{ aspectRatio: '16/9' }}
      >
        {project.output_url ? (
          <video
            src={project.output_url}
            className="w-full h-full object-cover"
            muted playsInline
            onMouseEnter={e => e.currentTarget.play()}
            onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0 }}
          />
        ) : (
          <Film size={28} className="text-blue-300" />
        )}
        <div className="absolute top-2.5 right-2.5">
          <ThreeDotMenu onAction={action => onAction(project, action)} />
        </div>
        {project.status === 'processing' && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-blue-600 rounded text-white text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
            {project.progress_percent ?? 0}%
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3.5">
        <h3 className="text-sm font-semibold text-gray-900 truncate mb-1.5">{project.title}</h3>
        <p className="text-[11px] text-gray-400 flex items-center gap-1 mb-3">
          <Clock size={10} /> {date}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${formatClass}`}>
            {project.export_format || 'MP4'}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusClass}`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
          {duration && (
            <span className="ml-auto text-[11px] text-gray-400 tabular-nums">{duration}</span>
          )}
        </div>
      </div>
    </div>
  )
}

const TABS = ['All', 'Ready', 'Processing', 'Failed']

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab,   setActiveTab]   = useState('All')
  const [search,      setSearch]      = useState('')
  const [projects,    setProjects]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [toast,       setToast]       = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('360tales_auth')) { navigate('/login'); return }
    loadProjects()
  }, [navigate])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const data = await projectsAPI.list()
      setProjects(data || [])
    } catch {
      // show empty state on error
    } finally {
      setLoading(false)
    }
  }

  const showToast = msg => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'Ready')      return matchSearch && p.status === 'ready'
    if (activeTab === 'Processing') return matchSearch && (p.status === 'processing' || p.status === 'pending')
    if (activeTab === 'Failed')     return matchSearch && p.status === 'failed'
    return matchSearch
  })

  const handleAction = async (project, action) => {
    if (action === 'download') {
      if (project.output_url) {
        const a = document.createElement('a')
        a.href = project.output_url; a.download = `${project.title}.mp4`
        a.click(); showToast('Download started!')
      } else {
        showToast('Video not ready yet.')
      }
    }
    if (action === 'copy') {
      navigator.clipboard.writeText(`${window.location.origin}/share/${project.id}`).catch(() => {})
      showToast('Link copied!')
    }
    if (action === 'delete') {
      if (!window.confirm(`Delete "${project.title}"?`)) return
      try {
        await projectsAPI.delete(project.id)
        setProjects(ps => ps.filter(p => p.id !== project.id))
        showToast('Project deleted.')
      } catch {
        showToast('Failed to delete project.')
      }
    }
    if (action === 'rename') {
      const name = window.prompt('New name:', project.title)
      if (!name?.trim()) return
      try {
        const updated = await projectsAPI.rename(project.id, name.trim())
        setProjects(ps => ps.map(p => p.id === project.id ? { ...p, title: updated.title } : p))
        showToast('Renamed successfully.')
      } catch {
        showToast('Failed to rename project.')
      }
    }
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
          <div className="relative w-64 h-full z-10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
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
                    }`}>
                    {tab}
                  </button>
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
            {!loading && filtered.length > 0 && (
              <p className="text-xs text-gray-400">
                {filtered.length} {filtered.length === 1 ? 'story' : 'stories'} ·{' '}
                {projects.filter(p => p.status === 'ready').length} ready
              </p>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="bg-gray-100" style={{ aspectRatio: '16/9' }} />
                    <div className="p-3.5 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grid or empty state */}
            {!loading && (
              filtered.length > 0 ? (
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
                    {search
                      ? 'No results found'
                      : activeTab !== 'All'
                        ? `No ${activeTab.toLowerCase()} projects`
                        : 'No projects yet'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
                    {search
                      ? `No stories match "${search}"`
                      : 'Your created 360° stories will appear here. Start by creating your first immersive story.'}
                  </p>
                  {!search && activeTab === 'All' && (
                    <Link to="/create"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                      <PlusCircle size={15} />
                      Create Your First Story
                    </Link>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[200] bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 toast-item">
          <span className="text-green-400">✓</span> {toast}
        </div>
      )}
    </div>
  )
}
