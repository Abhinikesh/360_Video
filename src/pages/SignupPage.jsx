import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Globe, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { authAPI } from '../services/api'

function getStrength(pw) {
  let score = 0
  if (pw.length >= 8)          score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
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
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const strength = getStrength(password)
  const pwMatch  = confirm.length > 0 && password === confirm
  const navigate = useNavigate()
  const location  = useLocation()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!pwMatch) return
    setError('')
    setLoading(true)
    try {
      await authAPI.signup(fullName, email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    setLoading(true)
    try {
      await authAPI.googleAuth(credentialResponse.credential)
      const from = location.state?.from?.pathname || location.state?.from || '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      console.error('[Signup] Google auth error:', err)
      const isNetworkErr = /load failed|failed to fetch/i.test(err.message)
      setError(
        isNetworkErr
          ? 'Cannot reach the server. Make sure the backend is running on port 8000.'
          : err.message || 'Google sign in failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
          <Globe size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          Hori<span className="text-blue-600">zon</span>
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-7">Get started for free — no credit card required.</p>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 mb-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="form-label">Full Name</label>
            <input id="name" type="text" autoComplete="name" placeholder="John Doe"
              className="form-input" value={fullName} onChange={e => setFullName(e.target.value)}
              required disabled={loading} />
          </div>

          <div>
            <label htmlFor="email" className="form-label">Email address</label>
            <input id="email" type="email" autoComplete="email" placeholder="you@example.com"
              className="form-input" value={email} onChange={e => setEmail(e.target.value)}
              required disabled={loading} />
          </div>

          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <div className="relative">
              <input id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                placeholder="Min. 8 characters" className="form-input pr-10"
                value={password} onChange={e => setPassword(e.target.value)}
                required disabled={loading} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1,2,3,4].map(n => (
                    <div key={n} className={`flex-1 h-1 rounded-full transition-colors duration-200 ${n <= strength ? strengthColor[strength] : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strengthText[strength]}`}>{strengthLabel[strength]}</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="form-label">Confirm Password</label>
            <div className="relative">
              <input id="confirm" type={showCPw ? 'text' : 'password'} autoComplete="new-password"
                placeholder="Re-enter password"
                className={`form-input pr-10 ${confirm.length > 0 ? (pwMatch ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20' : 'border-red-400 focus:border-red-400 focus:ring-red-400/20') : ''}`}
                value={confirm} onChange={e => setConfirm(e.target.value)} required disabled={loading} />
              <button type="button" onClick={() => setShowCPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showCPw ? 'Hide password' : 'Show password'}>
                {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {pwMatch && <Check size={14} className="absolute right-9 top-1/2 -translate-y-1/2 text-green-500" />}
            </div>
            {confirm.length > 0 && !pwMatch && (
              <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
            )}
          </div>

          <button type="submit" disabled={loading || !pwMatch}
            className="btn-primary w-full py-3 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating account…
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign in failed. Please try again.')}
            width={380}
            text="signup_with"
            shape="rectangular"
            theme="outline"
            logo_alignment="left"
          />
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">Log In</Link>
        </p>
      </div>
    </div>
  )
}
