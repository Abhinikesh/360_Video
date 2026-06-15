"""
Parallax animation service.

Takes an image + depth map and produces an animated MP4
using OpenCV frame-by-frame transformations.

Effects: Slow Pan | Zoom In | Rotate | Ken Burns
"""
import os
import uuid
import asyncio


EFFECT_TYPES = {"Slow Pan", "Zoom In", "Rotate", "Ken Burns"}


async def create_parallax_animation(
    image_path: str,
    depth_path: str,
    effect_type: str = "Slow Pan",
    duration_seconds: int = 10,
    fps: int = 24,
) -> str:
    """
    Generates an animated MP4 from the image.
    Returns the path to the output video (no audio).
    """
    run_id      = str(uuid.uuid4())[:8]
    output_path = f"outputs/videos/anim_{run_id}.mp4"
    os.makedirs("outputs/videos", exist_ok=True)

    if effect_type not in EFFECT_TYPES:
        effect_type = "Slow Pan"

    # CPU-bound — run in thread pool so event loop stays free
    return await asyncio.get_event_loop().run_in_executor(
        None,
        _generate_frames,
        image_path, depth_path, effect_type,
        duration_seconds, fps, output_path,
    )


def _generate_frames(
    image_path: str,
    depth_path: str,
    effect_type: str,
    duration_seconds: int,
    fps: int,
    output_path: str,
) -> str:
    import numpy as np
    import cv2
    from PIL import Image

    # ── Load image ────────────────────────────────────────────────────────────
    pil_img = Image.open(image_path).convert("RGB")
    # Pad to even dimensions (required by most video codecs)
    w, h = pil_img.size
    w = w if w % 2 == 0 else w - 1
    h = h if h % 2 == 0 else h - 1
    pil_img = pil_img.crop((0, 0, w, h))
    img = np.array(pil_img)

    total_frames = duration_seconds * fps

    # ── VideoWriter ───────────────────────────────────────────────────────────
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out    = cv2.VideoWriter(output_path, fourcc, fps, (w, h))

    if not out.isOpened():
        raise RuntimeError(f"OpenCV VideoWriter failed to open: {output_path}")

    # ── Frame generation ──────────────────────────────────────────────────────
    for i in range(total_frames):
        t     = i / max(total_frames - 1, 1)   # 0.0 → 1.0
        frame = img.copy()

        if effect_type == "Slow Pan":
            # Horizontal pan: shift left by up to 5% of width
            shift_x = int(t * w * 0.05)
            M       = np.float32([[1, 0, -shift_x], [0, 1, 0]])
            frame   = cv2.warpAffine(frame, M, (w, h),
                                     borderMode=cv2.BORDER_REPLICATE)

        elif effect_type == "Zoom In":
            # Gradual zoom 100% → 115%, anchored at centre
            scale  = 1.0 + t * 0.15
            cx, cy = w / 2, h / 2
            M      = cv2.getRotationMatrix2D((cx, cy), 0, scale)
            frame  = cv2.warpAffine(frame, M, (w, h),
                                    borderMode=cv2.BORDER_REPLICATE)

        elif effect_type == "Rotate":
            # Slow clockwise rotation 0° → 3°
            angle  = t * 3.0
            cx, cy = w / 2, h / 2
            M      = cv2.getRotationMatrix2D((cx, cy), -angle, 1.0)
            frame  = cv2.warpAffine(frame, M, (w, h),
                                    borderMode=cv2.BORDER_REPLICATE)

        elif effect_type == "Ken Burns":
            # Combined zoom + diagonal pan (cinematic Ken Burns)
            scale   = 1.0 + t * 0.12
            shift_x = int(t * w * 0.04)
            shift_y = int(t * h * 0.02)
            cx, cy  = w / 2, h / 2
            M       = cv2.getRotationMatrix2D((cx, cy), 0, scale)
            M[0][2] -= shift_x
            M[1][2] -= shift_y
            frame   = cv2.warpAffine(frame, M, (w, h),
                                     borderMode=cv2.BORDER_REPLICATE)

        # Convert RGB → BGR for OpenCV
        out.write(cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))

    out.release()

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        raise RuntimeError("Animation output file is empty or missing")

    return output_path
