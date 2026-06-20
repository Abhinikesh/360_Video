"""
AI image description service using Google Gemini.

Uses gemini-1.5-flash to analyze uploaded images and generate
professional travel narration scripts.

Falls back gracefully if GEMINI_API_KEY is not set.
"""
import os
import asyncio
from PIL import Image


# ─── Singleton setup ─────────────────────────────────────────────────────────

_model = None


def _get_model():
    """Lazy-load Gemini model. Returns None if no API key."""
    global _model
    if _model is not None:
        return _model

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel("gemini-1.5-flash")
        return _model
    except Exception as e:
        print(f"⚠️  Gemini setup failed: {e}")
        return None


def is_gemini_enabled() -> bool:
    """Return True if a valid GEMINI_API_KEY is configured."""
    return bool(os.getenv("GEMINI_API_KEY", "").strip())


# ─── Main function ────────────────────────────────────────────────────────────

async def generate_image_description(
    image_path: str,
    language: str = "English",
) -> str:
    """
    Analyze image and generate a narration script.
    Falls back to a generic description if no API key is configured.
    """
    model = _get_model()

    if not model:
        return _fallback_description(language)

    return await asyncio.get_event_loop().run_in_executor(
        None, _call_gemini, model, image_path, language
    )


def _call_gemini(model, image_path: str, language: str) -> str:
    """Blocking Gemini call — runs in thread executor."""
    try:
        img = Image.open(image_path)

        prompt = f"""You are a professional travel narrator for an immersive 360° video experience called Horizon.

Look at this image carefully and write an engaging narration script for a tourist or traveler visiting this place.

Requirements:
- Write in {language} language
- Length: 80 to 120 words exactly
- Tone: warm, inviting, informative like a knowledgeable local guide
- Mention what you see: architecture, nature, atmosphere, historical significance if visible, best time to visit
- Start with a welcoming sentence drawing the viewer in
- End with an inspiring closing sentence
- Do NOT use phrases like "In this image" or "I can see"
- Write as if you are THERE speaking to the visitor
- No bullet points, no headings — pure flowing narration text only

Write only the narration. Nothing else."""

        response = model.generate_content([prompt, img])
        text = response.text.strip()

        # Safety: if somehow empty, return fallback
        if not text:
            return _fallback_description(language)

        return text

    except Exception as e:
        print(f"⚠️  Gemini API error: {e}")
        return _fallback_description(language)


# ─── Fallback ─────────────────────────────────────────────────────────────────

def _fallback_description(language: str) -> str:
    """Used when no API key is configured or Gemini call fails."""
    fallbacks = {
        "Hindi": (
            "इस अद्भुत स्थान में आपका स्वागत है, जहाँ इतिहास और सौंदर्य का अद्भुत संगम है। "
            "यह शानदार जगह सदियों से अपनी भव्य वास्तुकला और समृद्ध सांस्कृतिक विरासत से "
            "पर्यटकों को मंत्रमुग्ध करती आई है। यहाँ का वातावरण आपको एक अनूठे अनुभव की ओर "
            "ले जाता है। चाहे आप पहली बार यहाँ आ रहे हों या पुरानी यादों को ताजा करने, "
            "यह स्थान हर बार आपको एक नई अनुभूति देता है।"
        ),
        "Spanish": (
            "Bienvenido a este destino extraordinario, donde la historia y la belleza convergen "
            "en perfecta armonía. Este magnífico lugar ha cautivado a los visitantes durante siglos "
            "con su impresionante arquitectura y su rica herencia cultural. Mientras explores este "
            "espacio, tómate un momento para absorber la atmósfera única que lo hace verdaderamente "
            "especial. Ya sea tu primera visita o un reencuentro con recuerdos queridos, este lugar "
            "nunca deja de cautivar a quienes lo visitan."
        ),
        "French": (
            "Bienvenue dans cette destination extraordinaire, où l'histoire et la beauté se rejoignent "
            "en parfaite harmonie. Ce lieu magnifique captive les visiteurs depuis des siècles grâce à "
            "son architecture impressionnante et son riche patrimoine culturel. Prenez le temps d'absorber "
            "l'atmosphère unique qui le rend si spécial. Que ce soit votre première visite ou un retour "
            "pour revivre de précieux souvenirs, cet endroit ne manque jamais de laisser une impression "
            "durable sur tous ceux qui le découvrent."
        ),
    }

    return fallbacks.get(language, (
        "Welcome to this remarkable destination, where history and beauty converge in perfect harmony. "
        "This magnificent place has captivated visitors for centuries with its stunning surroundings "
        "and rich cultural significance. As you explore this space, take a moment to absorb the unique "
        "atmosphere that makes it truly special. Whether you are visiting for the first time or returning "
        "to relive cherished memories, this place never fails to leave a lasting impression on all who "
        "come here. Discover its stories, breathe in its spirit, and let it inspire you."
    ))
