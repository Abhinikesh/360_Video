import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from models.database import get_db
from models.user import User
from utils.auth_utils import make_current_user_dep

router = APIRouter()
_get_current_user = make_current_user_dep(get_db)

LANG_CODES = {
    "English":    "en", "Hindi":      "hi", "Spanish":    "es",
    "French":     "fr", "Arabic":     "ar", "Japanese":   "ja",
    "German":     "de", "Portuguese": "pt", "Italian":    "it",
    "Russian":    "ru",
}


class TTSPreviewRequest(BaseModel):
    text: str
    language: str = "English"
    voice_style: str = "Natural (Female)"


@router.post("/preview")
async def tts_preview(
    body: TTSPreviewRequest,
    current_user: User = Depends(_get_current_user),
):
    """
    Generate a short audio preview (first 200 chars) using gTTS.
    Returns the audio file directly as audio/mpeg.
    """
    text = body.text[:200].strip()
    if not text:
        text = "Welcome to 360Tales. Experience your story come alive."

    lang = LANG_CODES.get(body.language, "en")
    output_path = f"outputs/audio/preview_{current_user.id}.mp3"

    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(output_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

    if not os.path.exists(output_path):
        raise HTTPException(status_code=500, detail="Audio file was not created")

    return FileResponse(
        output_path,
        media_type="audio/mpeg",
        filename="preview.mp3",
        headers={"Cache-Control": "no-cache"},
    )
