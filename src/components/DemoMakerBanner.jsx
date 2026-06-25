/**
 * DemoMakerBanner — homepage section promoting Demo Maker.
 * Placed between Features and Footer. Uses a light-gray background
 * with a dashed top border to feel visually separate from core product.
 */
import { useNavigate } from 'react-router-dom'
import { getToken } from '../services/api'

export default function DemoMakerBanner() {
  const navigate = useNavigate()

  const handleClick = () => {
    if (getToken()) {
      navigate('/demo-maker')
    } else {
      navigate('/login', { state: { from: '/demo-maker' } })
    }
  }

  return (
    <section
      aria-label="Demo Maker — also available"
      style={{
        background: '#F9FAFB',
        borderTop: '1.5px dashed #E5E7EB',
      }}
    >
      <div className="container py-16 text-center">

        {/* Label */}
        <p
          className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4"
          style={{ letterSpacing: '0.1em' }}
        >
          Also Available
        </p>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Need a quick demo video instead?
        </h2>

        {/* Subtext */}
        <p className="text-base text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Turn screenshots or a screen recording into a narrated walkthrough video —
          perfect for explaining your product, app, or process.
        </p>

        {/* Two feature columns */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 max-w-2xl mx-auto mb-10">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 text-left space-y-2 shadow-sm">
            <div className="text-3xl mb-1">📸</div>
            <p className="text-sm font-semibold text-gray-900">Photos to Video</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Upload 5–10 images, get a narrated slideshow with smooth transitions
            </p>
          </div>

          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 text-left space-y-2 shadow-sm">
            <div className="text-3xl mb-1">🎥</div>
            <p className="text-sm font-semibold text-gray-900">Screen Recording Voiceover</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Add AI narration to any screen recording or demo video
            </p>
          </div>
        </div>

        {/* Secondary CTA — gray outlined, NOT the primary blue */}
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-[.99]"
        >
          Try Demo Maker →
        </button>
      </div>
    </section>
  )
}
