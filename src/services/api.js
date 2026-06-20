/**
 * Horizon API service layer
 * Wraps fetch with JWT auth, base URL, and error handling.
 */

const BASE_URL = import.meta.env.VITE_API_URL || ''

// ─── Token helpers ────────────────────────────────────────────────────────────

export const getToken   = ()  => localStorage.getItem('horizon_token')
export const setToken   = (t) => localStorage.setItem('horizon_token', t)
export const clearToken = ()  => localStorage.removeItem('horizon_token')

function authHeaders(extra = {}) {
  const token = getToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

// ─── Response handler ─────────────────────────────────────────────────────────

async function handleResponse(res) {
  if (res.ok) {
    if (res.status === 204) return null
    return res.json()
  }
  const err = await res.json().catch(() => ({ detail: res.statusText }))
  const msg = err.detail || err.message || 'Request failed'
  throw new Error(Array.isArray(msg) ? msg.map(e => e.msg).join('; ') : msg)
}

// ─── Core methods ─────────────────────────────────────────────────────────────

export const api = {
  post: async (url, data) => {
    const res = await fetch(BASE_URL + url, {
      method:  'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body:    JSON.stringify(data),
    })
    return handleResponse(res)
  },

  get: async (url) => {
    const res = await fetch(BASE_URL + url, { headers: authHeaders() })
    return handleResponse(res)
  },

  patch: async (url, data) => {
    const res = await fetch(BASE_URL + url, {
      method:  'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body:    JSON.stringify(data),
    })
    return handleResponse(res)
  },

  delete: async (url) => {
    const res = await fetch(BASE_URL + url, {
      method:  'DELETE',
      headers: authHeaders(),
    })
    return handleResponse(res)
  },

  upload: async (url, formData) => {
    const res = await fetch(BASE_URL + url, {
      method:  'POST',
      headers: authHeaders(),
      body:    formData,
    })
    return handleResponse(res)
  },
}

// ─── Auth convenience ─────────────────────────────────────────────────────────

function _storeAuth(data) {
  setToken(data.access_token)
  localStorage.setItem('horizon_name',  data.user.name)
  localStorage.setItem('horizon_email', data.user.email)
  localStorage.setItem('horizon_auth',  '1')
}

export const authAPI = {
  signup: async (name, email, password) => {
    const data = await api.post('/api/auth/signup', { name, email, password })
    _storeAuth(data)
    return data.user
  },

  login: async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password })
    _storeAuth(data)
    return data.user
  },

  googleAuth: async (credential) => {
    const data = await api.post('/api/auth/google', { credential })
    _storeAuth(data)
    return data.user
  },

  me: () => api.get('/api/auth/me'),

  logout: () => {
    clearToken()
    localStorage.removeItem('horizon_auth')
    localStorage.removeItem('horizon_name')
    localStorage.removeItem('horizon_email')
  },
}

// ─── Upload convenience ───────────────────────────────────────────────────────

export const uploadAPI = {
  image: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.upload('/api/upload/image', fd)
  },
  video: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.upload('/api/upload/video', fd)
  },
}

// ─── Generation convenience ───────────────────────────────────────────────────

export const generateAPI = {
  start:  (params)     => api.post('/api/generate/start', params),
  status: (projectId)  => api.get(`/api/generate/status/${projectId}`),

  poll: (projectId, onProgress, intervalMs = 3000) => {
    return new Promise((resolve, reject) => {
      const timer = setInterval(async () => {
        try {
          const data = await generateAPI.status(projectId)
          if (onProgress) onProgress(data.progress_percent ?? 0)
          if (data.status === 'ready') { clearInterval(timer); resolve(data) }
          else if (data.status === 'failed') { clearInterval(timer); reject(new Error(data.error || 'Generation failed')) }
        } catch (err) { clearInterval(timer); reject(err) }
      }, intervalMs)
    })
  },
}

// ─── Projects convenience ─────────────────────────────────────────────────────

export const projectsAPI = {
  list:   ()          => api.get('/api/projects/'),
  get:    (id)        => api.get(`/api/projects/${id}`),
  rename: (id, title) => api.patch(`/api/projects/${id}`, { title }),
  delete: (id)        => api.delete(`/api/projects/${id}`),
}

// ─── TTS convenience ──────────────────────────────────────────────────────────

export const ttsAPI = {
  preview: async (text, language, voiceStyle) => {
    const res = await fetch(BASE_URL + '/api/tts/preview', {
      method:  'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body:    JSON.stringify({ text, language, voice_style: voiceStyle }),
    })
    if (!res.ok) throw new Error('TTS preview failed')
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  },
}

// ─── AI convenience ───────────────────────────────────────────────────────────

export const aiAPI = {
  /** Check whether Gemini / ElevenLabs are configured on the server */
  status: () => api.get('/api/ai/status'),

  /**
   * Ask the backend to analyse an uploaded image and return a narration script.
   * @param {string} fileId  - The file_id returned by the upload endpoint
   * @param {string} language - e.g. "English", "Hindi"
   */
  describe: (fileId, language = 'English') =>
    api.post('/api/ai/describe', { file_id: fileId, language }),
}

// ─── Music convenience ────────────────────────────────────────────────────────

export const musicAPI = {
  /** List available music styles (no auth required). */
  styles: () => api.get('/api/music/styles'),

  /**
   * Fetch a 5-second WAV preview for a music style.
   * Returns a blob URL safe to pass to `new Audio(url).play()`.
   * @param {string} style - e.g. "Ambient", "Classical"
   */
  preview: async (style) => {
    const encoded = encodeURIComponent(style)
    const res = await fetch(BASE_URL + `/api/music/preview/${encoded}`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Music preview failed')
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  },
}

// ─── QR Code convenience ──────────────────────────────────────────────────────

export const qrAPI = {
  /**
   * Fetch the branded QR code PNG for a project.
   * Returns a blob URL safe for <img src=...> or anchor download.
   * @param {string} projectId
   */
  download: async (projectId) => {
    const res = await fetch(BASE_URL + `/api/qr/${projectId}`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error('QR generation failed')
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  },
}
