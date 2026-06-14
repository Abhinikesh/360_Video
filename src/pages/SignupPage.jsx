import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, Eye, EyeOff, Check } from 'lucide-react'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

function getStrength(pw) {
  let score = 0
  if (pw.length >= 8)          score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score  // 0-4
}

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500']
const strengthText  = ['', 'text-red-500', 'text-yellow-600', 'text-blue-600', 'text-green-600']

export default function SignupPage() {
  const [showPw,   setShowPw]   = useState(false)
  const [showCPw,  setShowCPw]  = useState(false)
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const strength = getStrength(password)
  const pwMatch = confirm.length > 0 && password === confirm
  const navigate = useNavigate()

  const handleSubmit = e => {
    e.preventDefault()
    if (!pwMatch) return
    localStorage.setItem('360tales_auth',  '1')
    localStorage.setItem('360tales_name',  fullName || 'Creator')
    localStorage.setItem('360tales_email', email)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
          <Globe size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          360<span className="text-blue-600">Tales</span>
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-7">Get started for free — no credit card required.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full name */}
          <div>
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              className="form-input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="form-input pr-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength meter */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(n => (
                    <div
                      key={n}
                      className={`flex-1 h-1 rounded-full transition-colors duration-200 ${
                        n <= strength ? strengthColor[strength] : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strengthText[strength]}`}>
                  {strengthLabel[strength]}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirm" className="form-label">Confirm Password</label>
            <div className="relative">
              <input
                id="confirm"
                type={showCPw ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter password"
                className={`form-input pr-10 ${
                  confirm.length > 0
                    ? pwMatch
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                      : 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                    : ''
                }`}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowCPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showCPw ? 'Hide password' : 'Show password'}
              >
                {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {pwMatch && (
                <Check size={14} className="absolute right-9 top-1/2 -translate-y-1/2 text-green-500" />
              )}
            </div>
            {confirm.length > 0 && !pwMatch && (
              <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary w-full py-3 text-sm mt-2">
            Create Account
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-[.98]"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Footer */}
        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">Log In</Link>
        </p>
      </div>
    </div>
  )
}
