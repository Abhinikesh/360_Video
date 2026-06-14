import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Download, Link2, Share2, Globe, Plus, Clock, Film, Mic, HardDrive, X } from 'lucide-react'
import { useToast } from '../ToastProvider'

const SAMPLE_VIDEO = 'https://www.w3schools.com/html/mov_bbb.mp4'
const SHARE_LINK   = 'https://360tales.app/share/demo-story-001'

export default function ResultScreen({ fileUrl, format, language, voiceStyle, onCreateAnother }) {
  const addToast        = useToast()
  const [videoErr, setVideoErr]         = useState(false)
  const [reelsModal, setReelsModal]     = useState(false)

  /* ── Download ── */
  const handleDownload = () => {
    const a = document.createElement('a')
    a.href     = SAMPLE_VIDEO
    a.download = '360Tales-Story.mp4'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    addToast('Download started!')
  }

  /* ── Copy share link ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(SHARE_LINK).catch(() => {})
    addToast('Link copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Globe size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-gray-900">
            360<span className="text-blue-600">Tales</span>
          </span>
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle size={16} />
          <span className="text-sm font-semibold">Story Ready</span>
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Heading */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your 360° Story is Ready!</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review, download, or share your immersive video.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Video player — 2 cols ── */}
          <div className="lg:col-span-2 space-y-4">
            {videoErr ? (
              /* Error state */
              <div className="rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
                <div className="text-4xl">🎬</div>
                <p className="text-sm font-semibold text-gray-700">Video preview unavailable</p>
                <p className="text-xs text-gray-400">Your download is still ready below.</p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden bg-black border border-gray-200 shadow-sm">
                <video
                  src={SAMPLE_VIDEO}
                  controls
                  autoPlay
                  loop
                  playsInline
                  poster={fileUrl || undefined}
                  onError={() => setVideoErr(true)}
                  style={{ width: '100%', display: 'block', borderRadius: 0 }}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[.98] transition-all">
                <Download size={16} />
                Download MP4
              </button>
              <button onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
                <Link2 size={16} />
                Copy Share Link
              </button>
              <button onClick={() => setReelsModal(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
                <Share2 size={16} />
                Export to Reels
              </button>
            </div>

            <div className="pt-1">
              <button onClick={onCreateAnother}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                <Plus size={15} />
                Create Another Story
              </button>
            </div>
          </div>

          {/* ── Summary card ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {fileUrl ? (
                <img src={fileUrl} alt="Source" className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
                  <Film size={28} className="text-gray-300" />
                </div>
              )}
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Video Details</h3>
                <dl className="space-y-2.5">
                  {[
                    { icon: Clock,     label: 'Duration',  value: '2:15'                            },
                    { icon: Film,      label: 'Format',    value: format || 'Standard MP4 · 1080p'  },
                    { icon: Mic,       label: 'Narration', value: `${language || 'English'} — ${voiceStyle || 'Natural Female'}` },
                    { icon: HardDrive, label: 'File size', value: '24.3 MB'                          },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2.5">
                      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <dt className="text-[11px] text-gray-400">{label}</dt>
                        <dd className="text-xs font-medium text-gray-700 truncate">{value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-semibold text-blue-800 mb-1">Share your creation</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                Copy the share link to send your story to anyone — no app required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Export to Reels modal ── */}
      {reelsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setReelsModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-xl">
                📤
              </div>
              <button onClick={() => setReelsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Export to Instagram Reels</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              To export for Instagram Reels, download the MP4 first then upload directly to Instagram.
              The vertical <strong>(9:16)</strong> format is already optimized for Reels.
            </p>
            <div className="flex gap-2">
              <button onClick={() => { setReelsModal(false); handleDownload() }}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                Download MP4
              </button>
              <button onClick={() => setReelsModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
