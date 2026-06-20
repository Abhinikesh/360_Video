/**
 * SharePage — public landing page for scanned QR codes.
 * Route: /share/:projectId
 * NO auth required — anyone with the link can view.
 */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Globe, Download, Calendar, Languages, Play, Loader, Film } from 'lucide-react'

const API_BASE = ''  // uses Vite proxy in dev

export default function SharePage() {
  const { projectId } = useParams()
  const [project,  setProject]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [videoErr, setVideoErr] = useState(false)

  useEffect(() => {
    if (!projectId) { setNotFound(true); setLoading(false); return }
    fetch(`${API_BASE}/api/projects/share/${projectId}`)
      .then(r => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(data => setProject(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleDownload = () => {
    if (!project?.output_video_url) return
    const a = document.createElement('a')
    a.href     = project.output_video_url
    a.download = `${project.title.replace(/\s+/g, '-')}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const formattedDate = project?.created_at
    ? new Date(project.created_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <SharedHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
          <Loader size={28} className="animate-spin" />
          <p className="text-sm">Loading story…</p>
        </div>
      </div>
    )
  }

  /* ── Not found ── */
  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <SharedHeader />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
            🔍
          </div>
          <h1 className="text-xl font-bold text-gray-900">Story not found</h1>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
            This story may have been deleted or is not ready yet.
          </p>
          <Link
            to="/"
            className="mt-2 px-6 py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Horizon
          </Link>
        </div>
      </div>
    )
  }

  /* ── Success ── */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SharedHeader />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Creator attribution */}
        <p className="text-xs text-gray-400 font-medium">
          Shared by <span className="text-gray-700">{project.creator_name}</span>
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{project.title}</h1>

        {/* Video player */}
        <div className="rounded-xl overflow-hidden bg-black border border-gray-200 shadow-sm">
          {videoErr || !project.output_video_url ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-3 bg-gray-100">
              <Film size={32} className="text-gray-300" />
              <p className="text-sm text-gray-400">Video unavailable</p>
            </div>
          ) : (
            <video
              src={project.output_video_url}
              controls
              autoPlay
              loop
              playsInline
              onError={() => setVideoErr(true)}
              style={{ width: '100%', display: 'block' }}
            />
          )}
        </div>

        {/* Narration */}
        {project.narration_text && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Narration Script
            </p>
            <p className="text-sm text-gray-700 italic leading-relaxed">
              "{project.narration_text}"
            </p>
          </div>
        )}

        {/* Info pills */}
        <div className="flex flex-wrap gap-2">
          {project.language && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              <Languages size={12} />
              {project.language}
            </span>
          )}
          {formattedDate && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
              <Calendar size={12} />
              {formattedDate}
            </span>
          )}
        </div>

        {/* Download button */}
        {project.output_video_url && (
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[.99] transition-all"
          >
            <Download size={16} />
            Download Video
          </button>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-200" />

        {/* CTA footer box */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center space-y-2">
          <p className="text-sm font-bold text-blue-900">
            Create your own 360° story with Horizon
          </p>
          <p className="text-xs text-blue-600 leading-relaxed">
            Turn any photo into an immersive narrated video — free
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 mt-3 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Play size={14} />
            Start Creating Free →
          </Link>
        </div>
      </main>
    </div>
  )
}

function SharedHeader() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 shrink-0">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <Globe size={14} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold text-gray-900">
          Hori<span className="text-blue-600">zon</span>
        </span>
      </Link>
    </header>
  )
}
