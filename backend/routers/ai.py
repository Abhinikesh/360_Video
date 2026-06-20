"""
AI description router — POST /api/ai/describe
                          GET  /api/ai/status
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.ai_description_service import (
    generate_image_description,
    is_gemini_enabled,
)
from models.database import get_db
from utils.auth_utils import make_current_user_dep

router = APIRouter()
_get_current_user = make_current_user_dep(get_db)


# ─── Status endpoint ──────────────────────────────────────────────────────────

@router.get("/status")
async def ai_status():
    """Returns which AI features are enabled. No auth required."""
    return {
        "gemini_enabled": is_gemini_enabled(),
        "tts_provider": "elevenlabs" if os.getenv("ELEVENLABS_API_KEY") else "gtts",
    }


# ─── Describe endpoint ────────────────────────────────────────────────────────

class DescribeRequest(BaseModel):
    file_id: str
    language: str = "English"


@router.post("/describe")
async def describe_image(
    body: DescribeRequest,
    current_user: dict = Depends(_get_current_user),
):
    """
    Analyze uploaded image and return AI-generated narration script.
    Works with or without GEMINI_API_KEY — falls back to quality template.
    """
    # Resolve image path (uploads are stored flat in /uploads/)
    image_path = os.path.join("uploads", body.file_id)

    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=404,
            detail=f"Uploaded file not found: {body.file_id}",
        )

    # Validate it is an image
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
    ext = os.path.splitext(body.file_id)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail="File must be an image (JPEG, PNG, WebP)",
        )

    description = await generate_image_description(image_path, body.language)

    return {
        "description": description,
        "language":    body.language,
        "word_count":  len(description.split()),
        "ai_powered":  is_gemini_enabled(),
    }
