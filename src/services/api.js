/**
 * 360Tales API service layer
 * Wraps fetch with JWT auth, base URL, and error handling.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─── Token helpers ────────────────────────────────────────────────────────────

export const getToken  = ()          => localStorage.getItem('360tales_token')
export const setToken  = (t)         => localStorage.setItem('360tales_token', t)
export const clearToken = ()         => localStorage.removeItem('360tales_token')

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
    // 204 No Content
    if (res.status === 204) return null
    return res.json()
  }
  const err = await res.json().catch(() => ({ detail: res.statusText }))
  const msg = err.detail || err.message || 'Request failed'
  throw new Error(Array.isArray(msg) ? msg.map(e => e.msg).join('; ') : msg)
}

// ─── Core methods ─────────────────────────────────────────────────────────────

export const api = {
  /** JSON POST */
  post: async (url, data) => {
    const res = await fetch(BASE_URL + url, {
      method:  'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body:    JSON.stringify(data),
    })
    return handleResponse(res)
  },

  /** JSON GET */
  get: async (url) => {
    const res = await fetch(BASE_URL + url, {
      headers: authHeaders(),
    })
    return handleResponse(res)
  },

  /** JSON PATCH */
  patch: async (url, data) => {
    const res = await fetch(BASE_URL + url, {
      method:  'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body:    JSON.stringify(data),
    })
    return handleResponse(res)
  },

  /** DELETE */
  delete: async (url) => {
    const res = await fetch(BASE_URL + url, {
      method:  'DELETE',
      headers: authHeaders(),
    })
    return handleResponse(res)
  },

  /** Multipart file upload */
  upload: async (url, formData) => {
    const res = await fetch(BASE_URL + url, {
      method:  'POST',
      headers: authHeaders(),   // NO Content-Type — browser sets multipart boundary
      body:    formData,
    })
    return handleResponse(res)
  },
}

// ─── Auth convenience ─────────────────────────────────────────────────────────

export const authAPI = {
  signup: async (name, email, password) => {
    const data = await api.post('/api/auth/signup', { name, email, password })
    setToken(data.access_token)
    localStorage.setItem('360tales_name',  data.user.name)
    localStorage.setItem('360tales_email', data.user.email)
    localStorage.setItem('360tales_auth',  '1')
    return data.user
  },

  login: async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password })
    setToken(data.access_token)
    localStorage.setItem('360tales_name',  data.user.name)
    localStorage.setItem('360tales_email', data.user.email)
    localStorage.setItem('360tales_auth',  '1')
    return data.user
  },

  me: () => api.get('/api/auth/me'),

  logout: () => {
    clearToken()
    localStorage.removeItem('360tales_auth')
    localStorage.removeItem('360tales_name')
    localStorage.removeItem('360tales_email')
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
  start: (params) => api.post('/api/generate/start', params),
  status: (projectId) => api.get(`/api/generate/status/${projectId}`),

  /** Poll until status is 'ready' or 'failed'. Calls onProgress(percent) each poll. */
  poll: (projectId, onProgress, intervalMs = 3000) => {
    return new Promise((resolve, reject) => {
      const timer = setInterval(async () => {
        try {
          const data = await generateAPI.status(projectId)
          if (onProgress) onProgress(data.progress_percent ?? 0)
          if (data.status === 'ready') {
            clearInterval(timer)
            resolve(data)
          } else if (data.status === 'failed') {
            clearInterval(timer)
            reject(new Error(data.error || 'Generation failed'))
          }
        } catch (err) {
          clearInterval(timer)
          reject(err)
        }
      }, intervalMs)
    })
  },
}

// ─── Projects convenience ─────────────────────────────────────────────────────

export const projectsAPI = {
  list:    ()           => api.get('/api/projects'),
  get:     (id)         => api.get(`/api/projects/${id}`),
  rename:  (id, title)  => api.patch(`/api/projects/${id}`, { title }),
  delete:  (id)         => api.delete(`/api/projects/${id}`),
}

// ─── TTS convenience ──────────────────────────────────────────────────────────

export const ttsAPI = {
  /** Returns a Blob URL for the audio preview. */
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
