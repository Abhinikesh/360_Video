"""
Video assembly service using FFmpeg.

Steps:
  0. (Optional) Mix TTS narration with background music
  1. Combine animation video + (mixed) audio → combined.mp4
  2. Optionally burn subtitles (SRT generated from narration text)
  3. Optionally resize for target export format
"""
import os
import asyncio
import subprocess
import shutil
import uuid


# ─── Resolution presets ───────────────────────────────────────────────────────

FORMAT_SCALE = {
    "Standard MP4":    None,           # keep source resolution
    "Instagram Reels": "1080:1920",    # 9:16 vertical
    "YouTube 360":     "3840:2160",    # 4K UHD
    "VR Ready":        "3840:1920",    # equirectangular
}


# ─── Public async entry point ─────────────────────────────────────────────────

async def assemble_final_video(
    video_path: str,
    audio_path: str,
    narration_text: str,
    output_path: str,
    burn_subtitles: bool = True,
    export_format: str = "Standard MP4",
    add_background_music: bool = False,
    music_style: str = "Ambient",
) -> str:
    """
    Full FFmpeg pipeline.  Returns path to the final output video.
    Raises RuntimeError if FFmpeg is not installed or fails.
    """
    _check_ffmpeg()

    return await asyncio.get_event_loop().run_in_executor(
        None,
        _assemble,
        video_path, audio_path, narration_text,
        output_path, burn_subtitles, export_format,
        add_background_music, music_style,
    )


# ─── FFmpeg helpers ───────────────────────────────────────────────────────────

def _check_ffmpeg() -> None:
    if not shutil.which("ffmpeg"):
        raise RuntimeError(
            "FFmpeg is not installed. "
            "Install it with: brew install ffmpeg (Mac) or "
            "sudo apt install ffmpeg (Ubuntu)"
        )


def _run_ffmpeg(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg error:\n{result.stderr[-2000:]}")


def _escape_srt_path(path: str) -> str:
    """
    Escape an SRT path for use inside an FFmpeg -vf subtitles= filter.

    FFmpeg's libavfilter parses filter strings with its own rules:
    - The path must be an absolute path (avoids working-dir issues)
    - Single-quotes wrap the path, so any single-quote inside must be escaped
    - Colons inside the quoted path must be escaped as \\:
    - Backslashes must be escaped as \\\\
    """
    path = os.path.abspath(path)
    path = path.replace("\\", "\\\\")
    path = path.replace("'",  "\\'")
    path = path.replace(":",  "\\:")
    return path


# ─── Sync assembly (runs in thread executor) ──────────────────────────────────

def _assemble(
    video_path: str,
    audio_path: str,
    narration_text: str,
    output_path: str,
    burn_subtitles: bool,
    export_format: str,
    add_background_music: bool,
    music_style: str,
) -> str:
    run_id  = str(uuid.uuid4())[:8]
    tmp_dir = os.path.abspath(f"outputs/videos/tmp_{run_id}")
    os.makedirs(tmp_dir, exist_ok=True)

    # ── Step 0: Mix background music into narration audio ────────────────────
    if add_background_music and music_style and music_style != "None":
        audio_path = _mix_music(audio_path, music_style, tmp_dir)

    # ── Step 1: Merge video + audio ──────────────────────────────────────────
    merged = os.path.join(tmp_dir, "merged.mp4")
    _run_ffmpeg([
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        "-movflags", "+faststart",
        merged,
    ])

    # ── Step 2: Subtitles ────────────────────────────────────────────────────
    current = merged
    if burn_subtitles and narration_text.strip():
        srt_path  = _generate_srt(narration_text, tmp_dir)
        subtitled = os.path.join(tmp_dir, "subtitled.mp4")
        safe_srt  = _escape_srt_path(srt_path)

        style = (
            "FontSize=18,"
            "PrimaryColour=&H00FFFFFF,"
            "OutlineColour=&H00000000,"
            "BorderStyle=3,"
            "Outline=1,"
            "Shadow=0"
        )
        vf_filter = f"subtitles='{safe_srt}':force_style='{style}'"

        try:
            _run_ffmpeg([
                "ffmpeg", "-y",
                "-i", merged,
                "-vf", vf_filter,
                "-c:a", "copy",
                subtitled,
            ])
            current = subtitled
        except RuntimeError:
            # If subtitle burning fails (e.g. font not found), skip gracefully
            current = merged

    # ── Step 3: Resize for export format ────────────────────────────────────
    scale = FORMAT_SCALE.get(export_format)
    if scale:
        resized = os.path.join(tmp_dir, "resized.mp4")
        _run_ffmpeg([
            "ffmpeg", "-y",
            "-i", current,
            "-vf", (
                f"scale={scale}:force_original_aspect_ratio=decrease,"
                f"pad={scale}:(ow-iw)/2:(oh-ih)/2:black"
            ),
            "-c:a", "copy",
            resized,
        ])
        current = resized

    # ── Final copy to output path ────────────────────────────────────────────
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    shutil.copy(current, output_path)

    # Cleanup temp dir
    shutil.rmtree(tmp_dir, ignore_errors=True)

    return output_path


# ─── Background music mixing ─────────────────────────────────────────────────

def _mix_music(
    narration_path: str,
    music_style: str,
    tmp_dir: str,
    music_volume: float = 0.15,
) -> str:
    """
    Mix background music underneath the narration using FFmpeg amix filter.
    Music is looped to match narration length and kept at music_volume (0.15).
    Falls back to original narration audio if anything goes wrong.
    """
    try:
        from services.music_service import get_music_path
        music_path = get_music_path(music_style)
        if not music_path or not os.path.exists(music_path):
            return narration_path

        mixed_path = os.path.join(tmp_dir, "narration_mixed.aac")

        result = subprocess.run(
            [
                "ffmpeg", "-y",
                # Input 0: narration (sets the duration)
                "-i", narration_path,
                # Input 1: music track looped indefinitely
                "-stream_loop", "-1",
                "-i", music_path,
                "-filter_complex",
                (
                    f"[0:a]volume=1.0[narration];"
                    f"[1:a]volume={music_volume}[music];"
                    f"[narration][music]amix=inputs=2:duration=first:dropout_transition=2[out]"
                ),
                "-map", "[out]",
                "-c:a", "aac",
                "-b:a", "128k",
                "-shortest",
                mixed_path,
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode == 0 and os.path.exists(mixed_path):
            print(f"[video_service] Music mixed: {music_style} at {int(music_volume * 100)}% volume")
            return mixed_path
        else:
            print(f"[video_service] Music mix warning (using narration only): {result.stderr[-500:]}")
            return narration_path

    except Exception as exc:
        print(f"[video_service] Music mix skipped: {exc}")
        return narration_path


# ─── SRT subtitle generation ─────────────────────────────────────────────────

def _generate_srt(text: str, tmp_dir: str) -> str:
    """
    Generate a simple SRT subtitle file from narration text.
    Splits into ~10-word chunks, 4 seconds each.
    """
    words      = text.split()
    chunk_size = 10
    chunks     = [words[i:i + chunk_size] for i in range(0, len(words), chunk_size)]
    srt_lines  = []

    for idx, chunk in enumerate(chunks):
        start = idx * 4
        end   = start + 4
        srt_lines.append(
            f"{idx + 1}\n"
            f"{_srt_ts(start)} --> {_srt_ts(end)}\n"
            f"{' '.join(chunk)}\n"
        )

    srt_path = os.path.join(tmp_dir, "subs.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_lines))
    return srt_path


def _srt_ts(seconds: int) -> str:
    h  = seconds // 3600
    m  = (seconds % 3600) // 60
    s  = seconds % 60
    ms = 0
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
