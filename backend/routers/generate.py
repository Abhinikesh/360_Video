import os
import asyncio
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from bson import ObjectId
from models.database import get_db, serialize_doc
from models.project import make_project_doc
from utils.auth_utils import make_current_user_dep

router = APIRouter()
_get_current_user = make_current_user_dep(get_db)


# ─── Request schema ───────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    file_id: str
    title: str = "My 360° Story"
    narration_text: str = ""
    language: str = "English"
    voice_style: str = "Natural (Female)"
    export_format: str = "Standard MP4"
    effect_type: str = "Slow Pan"
    burn_subtitles: bool = True
    add_background_music: bool = False
    music_style: str = "Ambient"
    duration_seconds: int = 10


# ─── Background pipeline ──────────────────────────────────────────────────────

async def _run_pipeline(project_id: str, params: dict) -> None:
    """
    Full generation pipeline — runs in the background.
    Opens its own DB reference (Motor is thread-safe / async-safe).
    """
    from services.depth_service     import generate_depth_map
    from services.animation_service import create_parallax_animation
    from services.tts_service       import generate_speech
    from services.video_service     import assemble_final_video

    db  = get_db()
    oid = ObjectId(project_id)

    async def _update(status: str, progress: int, **kw):
        updates = {
            "status":           status,
            "progress_percent": progress,
            "updated_at":       datetime.utcnow(),
            **kw,
        }
        await db.projects.update_one({"_id": oid}, {"$set": updates})

    try:
        upload_path = params["upload_path"]
        run_id      = str(uuid.uuid4())[:8]

        # Step 1 — Depth map (20%)
        await _update("processing", 5)
        depth_path = await generate_depth_map(upload_path)
        await _update("processing", 20)

        # Step 2 — Parallax animation (50%)
        anim_path = await create_parallax_animation(
            image_path=upload_path,
            depth_path=depth_path,
            effect_type=params["effect_type"],
            duration_seconds=params["duration_seconds"],
        )
        await _update("processing", 50)

        # Step 3 — TTS narration (70%)
        audio_path = f"outputs/audio/{run_id}.mp3"
        narration  = params["narration_text"] or "Welcome to this amazing destination."
        await generate_speech(
            text=narration,
            language=params["language"],
            voice_style=params["voice_style"],
            output_path=audio_path,
        )
        await _update("processing", 70)

        # Step 4 — FFmpeg assembly (95%)
        output_path = f"outputs/videos/{run_id}.mp4"
        await assemble_final_video(
            video_path=anim_path,
            audio_path=audio_path,
            narration_text=narration,
            output_path=output_path,
            burn_subtitles=params["burn_subtitles"],
            export_format=params["export_format"],
        )
        await _update("processing", 95)

        # Done
        size_mb = round(os.path.getsize(output_path) / (1024 * 1024), 2) if os.path.exists(output_path) else 0
        await _update(
            "ready", 100,
            output_video_path=output_path,
            duration_seconds=params["duration_seconds"],
            file_size_mb=size_mb,
        )

        # Increment user story count
        project = await db.projects.find_one({"_id": oid})
        if project:
            await db.users.update_one(
                {"_id": ObjectId(project["user_id"])},
                {"$inc": {"total_stories": 1}},
            )

    except Exception as exc:
        await _update("failed", 0, error_message=str(exc))


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/start")
async def start_generation(
    body: GenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(_get_current_user),
):
    from routers.upload import get_file_path
    upload_path = get_file_path(body.file_id)
    if not upload_path:
        raise HTTPException(404, "Uploaded file not found. Please upload first.")

    db  = get_db()
    doc = make_project_doc(
        user_id=current_user["id"],
        title=body.title,
        original_filename=upload_path.split("/")[-1],
        upload_path=upload_path,
        narration_text=body.narration_text,
        language=body.language,
        voice_style=body.voice_style,
        export_format=body.export_format,
        effect_type=body.effect_type,
    )
    doc["status"]           = "processing"
    doc["progress_percent"] = 0

    result     = await db.projects.insert_one(doc)
    project_id = str(result.inserted_id)

    params = {
        "upload_path":      upload_path,
        "narration_text":   body.narration_text,
        "language":         body.language,
        "voice_style":      body.voice_style,
        "export_format":    body.export_format,
        "effect_type":      body.effect_type,
        "burn_subtitles":   body.burn_subtitles,
        "duration_seconds": body.duration_seconds,
    }
    background_tasks.add_task(_run_pipeline, project_id, params)

    return {"project_id": project_id, "status": "processing", "message": "Pipeline started"}


@router.get("/status/{project_id}")
async def get_status(project_id: str, current_user: dict = Depends(_get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(404, "Project not found")

    project = await db.projects.find_one({"_id": oid})
    if not project or project.get("user_id") != current_user["id"]:
        raise HTTPException(404, "Project not found")

    base = os.getenv("API_BASE_URL", "http://localhost:8000")
    return {
        "project_id":       project_id,
        "status":           project.get("status"),
        "progress_percent": project.get("progress_percent", 0),
        "output_url": (
            f"{base}/{project['output_video_path'].replace(os.sep, '/')}"
            if project.get("output_video_path") else None
        ),
        "error": project.get("error_message"),
    }
