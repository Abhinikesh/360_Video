import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

# ─── Lifespan (replaces deprecated @app.on_event) ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    for folder in ["uploads", "outputs", "outputs/videos", "outputs/audio", "outputs/depth"]:
        os.makedirs(folder, exist_ok=True)
    from models.database import init_db
    await init_db()
    yield
    # Shutdown (nothing needed)

app = FastAPI(
    title="360Tales API",
    version="1.0.0",
    description="Backend for 360Tales — AI-powered 360° immersive video creation",
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

# ─── Static file serving ───────────────────────────────────────────────────────
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
app.mount("/uploads", StaticFiles(directory="uploads"),  name="uploads")

# ─── Routers ───────────────────────────────────────────────────────────────────
from routers import auth, upload, generate, projects, tts

app.include_router(auth.router,     prefix="/api/auth",     tags=["auth"])
app.include_router(upload.router,   prefix="/api/upload",   tags=["upload"])
app.include_router(generate.router, prefix="/api/generate", tags=["generate"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(tts.router,      prefix="/api/tts",      tags=["tts"])

# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["health"])
async def health():
    return {"status": "ok", "service": "360Tales API", "version": "1.0.0"}
