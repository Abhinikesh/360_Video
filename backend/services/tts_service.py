"""
Text-to-Speech service.

PRIMARY  : ElevenLabs API (requires ELEVENLABS_API_KEY in .env)
FALLBACK : gTTS — Google Text-to-Speech (free, no key needed)
"""
import os
import asyncio

LANG_TO_GTTS = {
    "English":    "en",
    "Hindi":      "hi",
    "Spanish":    "es",
    "French":     "fr",
    "Arabic":     "ar",
    "Japanese":   "ja",
    "German":     "de",
    "Portuguese": "pt",
    "Italian":    "it",
    "Russian":    "ru",
}

# ElevenLabs voice IDs (multilingual v2 model)
VOICE_IDS = {
    "Natural (Female)":  "EXAVITQu4vr4xnSDxMaL",  # Bella
    "Natural (Male)":    "TxGEqnHWrfWFTfGW9XjX",  # Josh
    "Documentary":       "VR6AewLTigWG4xSOukaG",  # Arnold (deep)
    "Energetic":         "pNInz6obpgDQGcFmaJgB",  # Adam
    "Calm & Peaceful":   "yoZ06aMxZJJ28mfd3POQ",  # Sam
    "News Anchor":       "D38z5RcWu1voky8WS1ja",  # Matthew
    "Storyteller":       "jBpfuIE2acCO8z3wKNLl",  # Freya
}


async def generate_speech(
    text: str,
    language: str,
    voice_style: str,
    output_path: str,
) -> str:
    """
    Convert narration text to an MP3 audio file.
    Returns the path to the saved audio file.
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()

    if api_key:
        try:
            return await _elevenlabs_tts(text, language, voice_style, output_path, api_key)
        except Exception as exc:
            print(f"[tts_service] ElevenLabs failed ({exc}), falling back to gTTS")

    return await _gtts_fallback(text, language, output_path)


async def _elevenlabs_tts(
    text: str, language: str, voice_style: str,
    output_path: str, api_key: str,
) -> str:
    import httpx

    voice_id = VOICE_IDS.get(voice_style, VOICE_IDS["Natural (Female)"])

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key":   api_key,
                "Content-Type": "application/json",
            },
            json={
                "text":     text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
            },
        )
        resp.raise_for_status()
        with open(output_path, "wb") as f:
            f.write(resp.content)

    return output_path


async def _gtts_fallback(text: str, language: str, output_path: str) -> str:
    """Use Google Text-to-Speech (free). Runs in thread pool (blocking I/O)."""
    lang_code = LANG_TO_GTTS.get(language, "en")

    def _run():
        from gtts import gTTS
        tts = gTTS(text=text, lang=lang_code, slow=False)
        tts.save(output_path)

    await asyncio.get_event_loop().run_in_executor(None, _run)
    return output_path
