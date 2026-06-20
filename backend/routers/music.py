"""
Music router — background music preview endpoint.

GET /api/music/styles        → list available music styles
GET /api/music/preview/{style} → 5-second audio sample of a music style
"""
import os
import subprocess
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from models.database import get_db
from utils.auth_utils import make_current_user_dep
from services.music_service import get_music_path, list_styles, ensure_music_files

router = APIRouter()
_get_current_user = make_current_user_dep(get_db)

_PREVIEW_DIR = "outputs/audio"


@router.get("/styles")
async def music_styles():
    """Return the list of available music styles. No auth required."""
    return {"styles": list_styles()}


@router.get("/preview/{style}")
async def preview_music(
    style: str,
    current_user: dict = Depends(_get_current_user),
):
    """
    Return a 5-second audio preview of the requested music style.
    Generates tracks on-demand if not yet created.
    Requires authentication.
    """
    valid = list_styles()
    if style not in valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid style '{style}'. Valid options: {', '.join(valid)}",
        )

    music_path = get_music_path(style)
    if not music_path or not os.path.exists(music_path):
        raise HTTPException(status_code=500, detail="Music track not available")

    os.makedirs(_PREVIEW_DIR, exist_ok=True)
    safe_name   = style.replace(" ", "_")
    preview_path = os.path.join(_PREVIEW_DIR, f"preview_{safe_name}.wav")

    # Trim to 5 seconds with a 0.5s fade-in so it doesn't start abruptly
    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", music_path,
            "-t", "5",
            "-af", "afade=t=in:st=0:d=0.5,afade=t=out:st=4.5:d=0.5",
            preview_path,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0 or not os.path.exists(preview_path):
        raise HTTPException(
            status_code=500,
            detail="Failed to generate music preview",
        )

    return FileResponse(
        preview_path,
        media_type="audio/wav",
        filename=f"preview_{safe_name}.wav",
        headers={"Cache-Control": "public, max-age=3600"},
    )
