"""
Video assembly service using FFmpeg.

Steps:
  1. Combine animation video + TTS audio → combined.mp4
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


async def assemble_final_video(
    video_path: str,
    audio_path: str,
    narration_text: str,
    output_path: str,
    burn_subtitles: bool = True,
    export_format: str = "Standard MP4",
) -> str:
    """
    Full FFmpeg pipeline. Returns path to the final output video.
    Raises RuntimeError if FFmpeg is not installed or fails.
    """
    _check_ffmpeg()

    return await asyncio.get_event_loop().run_in_executor(
        None,
        _assemble,
        video_path, audio_path, narration_text,
        output_path, burn_subtitles, export_format,
    )


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


def _assemble(
    video_path: str,
    audio_path: str,
    narration_text: str,
    output_path: str,
    burn_subtitles: bool,
    export_format: str,
) -> str:
    run_id  = str(uuid.uuid4())[:8]
    tmp_dir = f"outputs/videos/tmp_{run_id}"
    os.makedirs(tmp_dir, exist_ok=True)

    # ── Step 1: Merge video + audio ──────────────────────────────────────────
    merged = f"{tmp_dir}/merged.mp4"
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
    if burn_subtitles and narration_text.strip():
        srt_path = _generate_srt(narration_text, tmp_dir)
        subtitled = f"{tmp_dir}/subtitled.mp4"
        # Escape path for FFmpeg filter (colons must be escaped on Windows)
        safe_srt = srt_path.replace("\\", "/").replace(":", "\\:")
        _run_ffmpeg([
            "ffmpeg", "-y",
            "-i", merged,
            "-vf", (
                f"subtitles='{safe_srt}'"
                ":force_style='FontSize=18,PrimaryColour=&H00FFFFFF,"
                "OutlineColour=&H00000000,BorderStyle=3,Outline=1,Shadow=0'"
            ),
            "-c:a", "copy",
            subtitled,
        ])
        current = subtitled
    else:
        current = merged

    # ── Step 3: Resize for export format ────────────────────────────────────
    scale = FORMAT_SCALE.get(export_format)
    if scale:
        resized = f"{tmp_dir}/resized.mp4"
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
    h   = seconds // 3600
    m   = (seconds % 3600) // 60
    s   = seconds % 60
    ms  = 0
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
