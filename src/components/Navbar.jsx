import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, Menu, X } from 'lucide-react'
import { getToken } from '../services/api'

const navLinks = [
  { label: 'Home',         href: '/#home' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Features',     href: '/#features' },
]

/** Navigate to /demo-maker — requires auth, so redirect via /login if needed. */
function useDemoMakerNav() {
  const navigate = useNavigate()
  return () => {
    if (getToken()) {
      navigate('/demo-maker')
    } else {
      navigate('/login', { state: { from: '/demo-maker' } })
    }
  }
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const goDemoMaker = useDemoMakerNav()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 inset-x-0 z-50 bg-white transition-shadow duration-200 ${scrolled ? 'shadow-[0_1px_0_#e5e7eb]' : 'border-b border-gray-200'}`}>
      <nav className="container flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Globe size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            Hori<span className="text-blue-600">zon</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-md hover:bg-gray-50 transition-colors"
            >
              {link.label}
            </a>
          ))}

          {/* Demo Maker link with BETA badge */}
          <button
            onClick={goDemoMaker}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-md hover:bg-gray-50 transition-colors"
          >
            Demo Maker
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 leading-none">
              BETA
            </span>
          </button>
        </div>

        {/* Auth CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login"  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Log In
          </Link>
          <Link to="/signup" className="btn-primary">
            Sign Up
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="container py-3 space-y-0.5">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}

            {/* Demo Maker in mobile drawer */}
            <button
              onClick={() => { setMenuOpen(false); goDemoMaker() }}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              Demo Maker
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 leading-none">
                BETA
              </span>
            </button>

            <div className="pt-3 pb-1 flex gap-2">
              <Link to="/login"  className="flex-1 btn-outline text-center" onClick={() => setMenuOpen(false)}>Log In</Link>
              <Link to="/signup" className="flex-1 btn-primary text-center" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
