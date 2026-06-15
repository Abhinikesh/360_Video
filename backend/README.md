# 360Tales Backend

FastAPI backend powering the 360Tales immersive video creation platform.
Works **100% offline** with free tools — no paid API keys required.

---

## Quick Start

```bash
cd backend

# 1. Create & activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac / Linux
# venv\Scripts\activate         # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env template and configure
cp .env.example .env
# Edit .env — at minimum set a strong SECRET_KEY

# 4. Start the server
uvicorn main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs** (Swagger UI)

---

## System Requirements

| Requirement | How to install |
|---|---|
| Python 3.10+ | https://python.org |
| FFmpeg | `brew install ffmpeg` (Mac) · `sudo apt install ffmpeg` (Ubuntu) · https://ffmpeg.org (Windows) |

Verify FFmpeg: `ffmpeg -version`

---

## Folder Structure

```
backend/
├── main.py                  ← FastAPI app entry point
├── requirements.txt         ← Python dependencies
├── .env.example             ← Environment variable template
│
├── routers/
│   ├── auth.py              ← POST /signup · POST /login · GET /me
│   ├── upload.py            ← POST /upload/image · POST /upload/video
│   ├── generate.py          ← POST /generate/start · GET /generate/status/{id}
│   ├── projects.py          ← GET/PATCH/DELETE /projects
│   └── tts.py               ← POST /tts/preview
│
├── services/
│   ├── depth_service.py     ← Replicate API → PIL fallback
│   ├── animation_service.py ← OpenCV parallax frame generator
│   ├── tts_service.py       ← ElevenLabs API → gTTS fallback
│   ├── video_service.py     ← FFmpeg merge + subtitles + resize
│   └── storage_service.py   ← Local disk → Cloudinary fallback
│
├── models/
│   ├── database.py          ← SQLAlchemy async engine + session
│   ├── user.py              ← User table
│   └── project.py           ← Project table
│
└── utils/
    ├── auth_utils.py        ← JWT + bcrypt helpers
    └── file_utils.py        ← Upload validation + save utilities
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user profile |
| PATCH | `/api/auth/me` | Update profile name |

### Upload
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload/image` | Upload JPEG/PNG/WebP (max 50 MB) |
| POST | `/api/upload/video` | Upload MP4/MOV (max 50 MB) |
| GET | `/api/upload/{file_id}` | Get upload metadata |

### Generation
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/generate/start` | Start pipeline, returns project_id immediately |
| GET | `/api/generate/status/{id}` | Poll status (pending/processing/ready/failed) |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List all user projects |
| GET | `/api/projects/{id}` | Get single project |
| PATCH | `/api/projects/{id}` | Rename project |
| DELETE | `/api/projects/{id}` | Delete project + files |

### TTS
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tts/preview` | Generate 3s voice preview (audio/mpeg) |

---

## Generation Pipeline

```
Upload → Depth Map → Parallax Animation → TTS Narration → FFmpeg Assembly
  0%       20%            50%                 70%              95%  → 100%
```

**With no API keys** (free, offline):
- Depth map: PIL Gaussian blur simulation
- TTS: Google gTTS (requires internet for TTS only)
- Animation: OpenCV frame transforms
- Video: FFmpeg (installed locally)

**With API keys** (premium quality):
- `REPLICATE_API_KEY` → Depth Anything V2 model
- `ELEVENLABS_API_KEY` → 7 professional multilingual voices
- `CLOUDINARY_URL` → Cloud storage for output videos

---

## Frontend Integration

The React frontend connects at `http://localhost:8000`.

```javascript
// src/services/api.js — see frontend source
import { api } from './services/api'

// Login
const { access_token, user } = await api.post('/api/auth/login', { email, password })

// Upload image
const { file_id } = await api.upload('/api/upload/image', formData)

// Start generation
const { project_id } = await api.post('/api/generate/start', { file_id, narration_text, ... })

// Poll status every 3s
const { status, progress_percent, output_url } = await api.get(`/api/generate/status/${project_id}`)
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ Yes | JWT signing secret (generate with `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `DATABASE_URL` | No | SQLite default · swap to PostgreSQL for production |
| `ELEVENLABS_API_KEY` | No | Professional multilingual voices · falls back to gTTS |
| `REPLICATE_API_KEY` | No | AI depth maps · falls back to PIL |
| `CLOUDINARY_URL` | No | Cloud video storage · falls back to local disk |
