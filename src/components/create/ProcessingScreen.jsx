import { useEffect, useState, useCallback } from 'react'
import { Globe } from 'lucide-react'

const STEPS = [
  'Analyzing your image…',
  'Generating AI depth map…',
  'Creating parallax animation…',
  'Synthesizing voice narration…',
  'Assembling final video…',
  'Finalizing output…',
]

export default function ProcessingScreen({ onComplete }) {
  const [stepIdx,  setStepIdx]  = useState(0)
  const [progress, setProgress] = useState(0)

  /* Cycle steps every 2.5s */
  useEffect(() => {
    const t = setInterval(() => setStepIdx(s => Math.min(s + 1, STEPS.length - 1)), 2500)
    return () => clearInterval(t)
  }, [])

  /* Smooth progress over 12s */
  useEffect(() => {
    const start    = performance.now()
    const DURATION = 12000
    let raf
    const tick = now => {
      const pct = Math.min(100, Math.round(((now - start) / DURATION) * 100))
      setProgress(pct)
      if (pct < 100) raf = requestAnimationFrame(tick)
      else setTimeout(onComplete, 500)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onComplete])

  const RADIUS = 54
  const CIRC   = 2 * Math.PI * RADIUS
  const offset = CIRC - (progress / 100) * CIRC

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="absolute top-5 left-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <Globe size={14} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold text-gray-900">360<span className="text-blue-600">Tales</span></span>
      </div>

      <div className="flex flex-col items-center gap-8 max-w-sm w-full">
        {/* SVG ring */}
        <div className="relative">
          <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
            <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="7" />
            <circle
              cx="64" cy="64" r={RADIUS}
              fill="none" stroke="#2563eb" strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 tabular-nums">{progress}%</span>
          </div>
        </div>

        {/* Step text */}
        <div className="text-center space-y-1.5">
          <p className="text-base font-semibold text-gray-900">{STEPS[stepIdx]}</p>
          <p className="text-sm text-gray-400">Please keep this tab open</p>
        </div>

        {/* Step dots */}
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i < stepIdx ? 'bg-blue-600' : i === stepIdx ? 'bg-blue-400 scale-125' : 'bg-gray-200'
            }`} />
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Processing your story</span>
            <span className="tabular-nums">
              {Math.max(0, Math.ceil(((100 - progress) / 100) * 12))}s remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
