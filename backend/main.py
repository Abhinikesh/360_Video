import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

# ─── Create required directories at import time ───────────────────────────────
for _folder in ["uploads", "outputs", "outputs/videos", "outputs/audio", "outputs/depth"]:
    os.makedirs(_folder, exist_ok=True)


# ─── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Generate music tracks on first boot (zero-cost, procedural)
    from services.music_service import ensure_music_files
    import asyncio
    await asyncio.get_event_loop().run_in_executor(None, ensure_music_files)

    from models.database import connect_db, close_db
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Horizon API",
    version="1.0.0",
    description="Backend for Horizon — AI-powered 360° immersive story creator",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static file serving ──────────────────────────────────────────────────────
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
app.mount("/uploads", StaticFiles(directory="uploads"),  name="uploads")

# ─── Routers ──────────────────────────────────────────────────────────────────
from routers import auth, upload, generate, projects, tts, ai, music, qr

app.include_router(auth.router,     prefix="/api/auth",     tags=["auth"])
app.include_router(upload.router,   prefix="/api/upload",   tags=["upload"])
app.include_router(generate.router, prefix="/api/generate", tags=["generate"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(tts.router,      prefix="/api/tts",      tags=["tts"])
app.include_router(ai.router,       prefix="/api/ai",       tags=["ai"])
app.include_router(music.router,    prefix="/api/music",    tags=["music"])
app.include_router(qr.router,       prefix="/api/qr",       tags=["qr"])

# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["health"])
async def health():
    return {"status": "ok", "service": "Horizon API", "version": "1.0.0"}
