import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Globe, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { authAPI } from '../services/api'

export default function LoginPage() {
  const [showPw,   setShowPw]   = useState(false)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const navigate = useNavigate()
  const location  = useLocation()
  // Handles BOTH: state.from = '/demo-maker' (string) OR state.from = location object
  const redirectTo = location.state?.from?.pathname || location.state?.from || '/dashboard'

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authAPI.login(email, password)
      console.log('[Login] Email login success → navigating to:', redirectTo)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    setLoading(true)
    try {
      await authAPI.googleAuth(credentialResponse.credential)
      // Resolve destination — handles both string and location-object state.from
      const from = location.state?.from?.pathname || location.state?.from || '/dashboard'
      console.log('[Login] Google success → navigating to:', from)
      navigate(from, { replace: true })
    } catch (err) {
      console.error('[Login] Google auth error:', err)
      // Safari reports network errors as "Load failed"; Chrome says "Failed to fetch"
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-7">Sign in to your account to continue.</p>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 mb-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email" type="email" autoComplete="email"
              placeholder="you@example.com" className="form-input"
              value={email} onChange={e => setEmail(e.target.value)}
              required disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="form-label mb-0">Password</label>
              <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                id="password" type={showPw ? 'text' : 'password'}
                autoComplete="current-password" placeholder="••••••••"
                className="form-input pr-10"
                value={password} onChange={e => setPassword(e.target.value)}
                required disabled={loading}
              />
              <button
                type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="btn-primary w-full py-3 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google Sign In */}
        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign in failed. Please try again.')}
            width={380}
            text="continue_with"
            shape="rectangular"
            theme="outline"
            logo_alignment="left"
          />
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}
