import { useState } from 'react'
import { Search, ChevronDown, Menu, Mail, MessageCircle } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'

const FAQS = [
  {
    q: 'What types of photos can I upload?',
    a: '360Tales accepts JPEG, PNG, WebP, and RAW image formats up to 50 MB per file. For best results, use high-resolution photos taken in landscape orientation with good lighting.',
  },
  {
    q: 'How does the AI 360° effect work?',
    a: 'Our AI uses depth estimation technology to analyze your photo and create a realistic depth map. It then animates the camera movement around the scene using parallax layers, creating an immersive parallax 360° effect without requiring a special camera.',
  },
  {
    q: 'Can I use my phone camera to capture panoramas?',
    a: 'Yes! Click the Camera tab in the creator tool and enable Panoramic Mode. Slowly rotate your phone from left to right while the tool automatically captures and stitches frames together into a wide panoramic image.',
  },
  {
    q: 'What languages are available for narration?',
    a: 'We currently support 10 languages: English, Hindi, Spanish, French, Arabic, Japanese, German, Portuguese, Italian, and Russian. More languages are added regularly.',
  },
  {
    q: 'How long does video generation take?',
    a: 'Most videos are ready in 1–3 minutes depending on length and export format. 4K exports may take slightly longer. You will be notified when your video is ready to download.',
  },
  {
    q: 'Can I download my videos?',
    a: 'Yes. All generated videos can be downloaded as MP4 files directly from the result screen or from My Projects. The Free plan supports up to 5 videos per month at 1080p resolution.',
  },
  {
    q: 'What is the difference between Path A and Path B?',
    a: 'Path A (Upload File or Camera) works with any normal photo and creates an AI-generated parallax 360° effect. Path B (360° File Upload) is for photos already taken with a real 360° camera like Insta360 and displays them in a true interactive sphere viewer.',
  },
  {
    q: 'How do I export for Instagram Reels or YouTube?',
    a: 'In the Settings panel before generating, select your desired export format: Instagram Reels (9:16 vertical) or YouTube 360 (16:9). The video will be optimized in the correct resolution and aspect ratio for that platform automatically.',
  },
]

const QUICK_LINKS = [
  {
    emoji: '📖', title: 'Getting Started Guide',
    desc: 'Learn how to create your first 360° story in minutes',
    link: 'Read guide →',
  },
  {
    emoji: '🎥', title: 'Video Tutorials',
    desc: 'Watch step-by-step walkthroughs of every feature',
    link: 'Watch now →',
  },
  {
    emoji: '💬', title: 'Contact Support',
    desc: "Can't find what you need? Our team replies in 24 hours",
    link: 'Send message →',
  },
]

function FAQItem({ q, a, open, onToggle }) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
        onClick={onToggle}
      >
        <span className={`text-sm font-semibold leading-snug ${open ? 'text-blue-700' : 'text-gray-900'}`}>{q}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-blue-500' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-60' : 'max-h-0'}`}>
        <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

export default function HelpPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq,     setOpenFaq]     = useState(null)

  const toggleFaq = idx => setOpenFaq(v => (v === idx ? null : idx))

  const filteredFaqs = FAQS.filter(
    f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
         f.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <h1 className="text-sm font-semibold text-gray-900">Help & Support</h1>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

            {/* Hero */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How can we help?</h2>
              <p className="text-sm text-gray-500 mb-6">Find answers, tutorials, and get in touch with our team.</p>
              {/* Search bar */}
              <div className="flex gap-2 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search help articles..."
                    className="form-input pl-9"
                  />
                </div>
                <button className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Search
                </button>
              </div>
            </div>

            {/* Quick links */}
            {!searchQuery && (
              <div className="grid sm:grid-cols-3 gap-4">
                {QUICK_LINKS.map(card => (
                  <div key={card.title}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="text-2xl mb-3">{card.emoji}</div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">{card.title}</h3>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">{card.desc}</p>
                    <span className="text-xs font-semibold text-blue-600">{card.link}</span>
                  </div>
                ))}
              </div>
            )}

            {/* FAQ */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-4">
                {searchQuery
                  ? `${filteredFaqs.length} result${filteredFaqs.length !== 1 ? 's' : ''} for "${searchQuery}"`
                  : 'Frequently Asked Questions'}
              </h3>
              {filteredFaqs.length > 0 ? (
                <div className="space-y-2">
                  {filteredFaqs.map((faq, i) => (
                    <FAQItem
                      key={i}
                      q={faq.q}
                      a={faq.a}
                      open={openFaq === i}
                      onToggle={() => toggleFaq(i)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500">No articles match your search.</p>
                </div>
              )}
            </div>

            {/* Contact section */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-4">Still need help?</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Email */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <Mail size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Email Support</h4>
                    <p className="text-xs font-medium text-blue-600 mb-1">support@360tales.app</p>
                    <p className="text-xs text-gray-500">We respond within 24 hours</p>
                  </div>
                  <a
                    href="mailto:support@360tales.app"
                    className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-blue-300 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Send Email
                  </a>
                </div>

                {/* Discord */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                    <MessageCircle size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Community Discord</h4>
                    <p className="text-xs font-medium text-indigo-600 mb-1">Join 500+ creators</p>
                    <p className="text-xs text-gray-500">Get help from the community</p>
                  </div>
                  <a
                    href="https://discord.gg/360tales"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-indigo-300 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors"
                  >
                    Join Discord
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
