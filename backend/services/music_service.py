"""
Music service — procedural background music generation.

Generates simple royalty-free audio tracks using sine waves / numpy.
All tracks are CC0-equivalent (generated programmatically, no copyright).
Tracks are generated once on first boot and cached for reuse.

No paid APIs, no downloads required — works 100% offline.
"""
import os
import wave
import math
import numpy as np

# ─── Paths ────────────────────────────────────────────────────────────────────

MUSIC_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "assets", "music",
)

MUSIC_STYLES: dict[str, str] = {
    "Ambient":       "ambient.wav",
    "Classical":     "classical.wav",
    "Nature Sounds": "nature.wav",
    "Upbeat Travel": "upbeat.wav",
    "Cinematic":     "cinematic.wav",
}

# ─── Frequency profiles ───────────────────────────────────────────────────────

_PROFILES: dict[str, dict] = {
    "Ambient": {
        "freqs":   [110, 165, 220, 330],
        "volumes": [0.30, 0.20, 0.15, 0.10],
        "lfo_rate": 0.3,
        "lfo_depth": 0.004,
    },
    "Classical": {
        "freqs":   [261, 329, 392, 523],
        "volumes": [0.25, 0.20, 0.20, 0.15],
        "lfo_rate": 0.5,
        "lfo_depth": 0.002,
    },
    "Nature Sounds": {
        # Higher-frequency components simulate gentle wind/bird ambience
        "freqs":   [200, 400, 600, 800, 1000],
        "volumes": [0.10, 0.08, 0.06, 0.04, 0.03],
        "lfo_rate": 1.2,
        "lfo_depth": 0.008,
    },
    "Upbeat Travel": {
        "freqs":   [392, 494, 587, 698],
        "volumes": [0.20, 0.18, 0.15, 0.12],
        "lfo_rate": 2.0,
        "lfo_depth": 0.003,
    },
    "Cinematic": {
        "freqs":   [98, 147, 196, 294],
        "volumes": [0.35, 0.25, 0.20, 0.15],
        "lfo_rate": 0.2,
        "lfo_depth": 0.005,
    },
}

# ─── Core generation ──────────────────────────────────────────────────────────

def _generate_track(style: str, output_path: str, duration: int = 60) -> None:
    """
    Synthesise a loopable background music track and write it as 16-bit mono WAV.
    Each style uses a distinct frequency profile and subtle LFO vibrato.
    """
    sample_rate = 44100
    n = sample_rate * duration
    t = np.linspace(0.0, duration, n, endpoint=False)

    profile = _PROFILES.get(style, _PROFILES["Ambient"])
    lfo = 1.0 + profile["lfo_depth"] * np.sin(2.0 * math.pi * profile["lfo_rate"] * t)

    samples = np.zeros(n, dtype=np.float64)
    for freq, vol in zip(profile["freqs"], profile["volumes"]):
        samples += vol * np.sin(2.0 * math.pi * freq * lfo * t)

    # Add subtle noise floor for "Nature Sounds" realism
    if style == "Nature Sounds":
        rng = np.random.default_rng(seed=42)
        samples += 0.02 * rng.standard_normal(n)

    # Normalise to ±0.7 (leave headroom)
    peak = np.max(np.abs(samples))
    if peak > 0:
        samples = samples / peak * 0.70

    # Fade-in / fade-out (3 seconds each end) for seamless looping
    fade_len = sample_rate * 3
    fade_in  = np.linspace(0.0, 1.0, fade_len)
    fade_out = np.linspace(1.0, 0.0, fade_len)
    samples[:fade_len]  *= fade_in
    samples[-fade_len:] *= fade_out

    # Write 16-bit PCM mono WAV
    pcm = (samples * 32767).astype(np.int16)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with wave.open(output_path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm.tobytes())

    print(f"[music_service] Generated: {output_path}")


# ─── Public API ───────────────────────────────────────────────────────────────

def ensure_music_files() -> None:
    """
    Generate any missing music tracks.  Called once at server startup so every
    request can immediately serve pre-generated files.
    """
    os.makedirs(MUSIC_DIR, exist_ok=True)
    for style, filename in MUSIC_STYLES.items():
        path = os.path.join(MUSIC_DIR, filename)
        if not os.path.exists(path):
            _generate_track(style, path)


def get_music_path(style: str) -> str | None:
    """
    Return the absolute path to the WAV file for *style*.
    Generates the file on-demand if it is missing.
    Returns None for unknown / disabled styles.
    """
    filename = MUSIC_STYLES.get(style)
    if not filename:
        return None
    path = os.path.join(MUSIC_DIR, filename)
    if not os.path.exists(path):
        _generate_track(style, path)
    return path


def list_styles() -> list[str]:
    """Return the ordered list of available music styles."""
    return list(MUSIC_STYLES.keys())
