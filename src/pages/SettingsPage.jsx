import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Sliders, CreditCard, Trash2, Upload, Eye, EyeOff, ChevronDown, Menu } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Arabic', 'Japanese', 'German', 'Portuguese', 'Italian', 'Russian']
const VOICES    = ['Natural Female', 'Natural Male', 'Documentary', 'Energetic', 'Calm & Peaceful']

function Section({ id, title, icon: Icon, children }) {
  return (
    <section id={id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <Icon size={16} className="text-blue-600" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function FormField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('360tales_auth')) navigate('/login')
  }, [navigate])

  const [name,       setName]       = useState(localStorage.getItem('360tales_name')  || '')
  const [email,      setEmail]      = useState(localStorage.getItem('360tales_email') || '')
  const [saved,      setSaved]      = useState(false)
  const [showOld,    setShowOld]    = useState(false)
  const [showNew,    setShowNew]    = useState(false)
  const [showConf,   setShowConf]   = useState(false)
  const [oldPw,      setOldPw]      = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confPw,     setConfPw]     = useState('')
  const [defLang,    setDefLang]    = useState('English')
  const [defVoice,   setDefVoice]   = useState('Natural Female')

  const handleSaveProfile = e => {
    e.preventDefault()
    localStorage.setItem('360tales_name',  name)
    localStorage.setItem('360tales_email', email)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleDeleteAccount = () => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return
    localStorage.clear()
    navigate('/login')
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
          <h1 className="text-sm font-semibold text-gray-900">Settings</h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* ── PROFILE ── */}
            <Section id="profile" title="Profile" icon={User}>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar upload */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <button type="button" className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                      <Upload size={14} />
                      Upload Avatar
                    </button>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG — max 2MB</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Full Name">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="Your name" />
                  </FormField>
                  <FormField label="Email Address">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" />
                  </FormField>
                </div>

                <div className="flex items-center gap-3">
                  <button type="submit" className="btn-primary text-sm px-5 py-2.5">Save Profile</button>
                  {saved && <span className="text-sm text-green-600 font-medium">✓ Saved successfully</span>}
                </div>
              </form>
            </Section>

            {/* ── PASSWORD ── */}
            <Section id="password" title="Change Password" icon={Lock}>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); setOldPw(''); setNewPw(''); setConfPw('') }}>
                {[
                  { label: 'Current Password', val: oldPw, set: setOldPw, show: showOld, tog: setShowOld },
                  { label: 'New Password',      val: newPw, set: setNewPw, show: showNew, tog: setShowNew },
                  { label: 'Confirm Password',  val: confPw, set: setConfPw, show: showConf, tog: setShowConf },
                ].map(({ label, val, set, show, tog }) => (
                  <FormField key={label} label={label}>
                    <div className="relative">
                      <input
                        type={show ? 'text' : 'password'}
                        value={val} onChange={e => set(e.target.value)}
                        className="form-input pr-10" placeholder="••••••••"
                      />
                      <button type="button" onClick={() => tog(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </FormField>
                ))}
                <button type="submit" className="btn-primary text-sm px-5 py-2.5">Update Password</button>
              </form>
            </Section>

            {/* ── PREFERENCES ── */}
            <Section id="preferences" title="Preferences" icon={Sliders}>
              <div className="space-y-4">
                <FormField label="Default Narration Language">
                  <div className="relative">
                    <select value={defLang} onChange={e => setDefLang(e.target.value)} className="form-input pr-8 appearance-none cursor-pointer">
                      {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </FormField>
                <FormField label="Default Voice Style">
                  <div className="relative">
                    <select value={defVoice} onChange={e => setDefVoice(e.target.value)} className="form-input pr-8 appearance-none cursor-pointer">
                      {VOICES.map(v => <option key={v}>{v}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </FormField>
                <button className="btn-primary text-sm px-5 py-2.5">Save Preferences</button>
              </div>
            </Section>

            {/* ── PLAN & BILLING ── */}
            <Section id="billing" title="Plan & Billing" icon={CreditCard}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">Free Plan</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">CURRENT</span>
                  </div>
                  <p className="text-xs text-gray-500">5 videos/month · 1080p · 3 voices · Community support</p>
                </div>
                <button className="btn-primary text-sm px-5 py-2.5 shrink-0">Upgrade to Creator</button>
              </div>

              <div className="mt-5 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs font-semibold text-blue-800 mb-1">Creator Plan — $19/mo</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Unlimited videos · 4K export · 40+ voices · Custom branding · Priority queue
                </p>
              </div>
            </Section>

            {/* ── DANGER ZONE ── */}
            <Section id="danger" title="Danger Zone" icon={Trash2}>
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-red-200 bg-red-50">
                <div>
                  <p className="text-sm font-semibold text-red-800">Delete Account</p>
                  <p className="text-xs text-red-500 mt-0.5">Permanently delete your account and all your stories. This cannot be undone.</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="shrink-0 px-4 py-2 rounded-lg border border-red-400 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </div>
  )
}
