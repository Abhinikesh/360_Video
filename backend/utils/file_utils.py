import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException

# Allowed MIME types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo"}
ALLOWED_MEDIA_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


def validate_image(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{file.content_type}'. Allowed: JPEG, PNG, WebP.",
        )


def validate_video(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video type '{file.content_type}'. Allowed: MP4, MOV, AVI.",
        )


def validate_size(data: bytes) -> None:
    if len(data) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds 50 MB limit ({len(data) // (1024*1024)} MB received).",
        )


def get_extension(content_type: str) -> str:
    mapping = {
        "image/jpeg":       ".jpg",
        "image/jpg":        ".jpg",
        "image/png":        ".png",
        "image/webp":       ".webp",
        "video/mp4":        ".mp4",
        "video/quicktime":  ".mov",
        "video/x-msvideo":  ".avi",
    }
    return mapping.get(content_type, ".bin")


def save_upload(data: bytes, folder: str, content_type: str) -> tuple[str, str]:
    """
    Save raw bytes to disk.
    Returns (file_id, file_path).
    """
    os.makedirs(folder, exist_ok=True)
    file_id  = str(uuid.uuid4())
    ext      = get_extension(content_type)
    filename = f"{file_id}{ext}"
    path     = os.path.join(folder, filename)
    with open(path, "wb") as f:
        f.write(data)
    return file_id, path


def get_image_dimensions(path: str) -> tuple[int, int]:
    try:
        from PIL import Image
        with Image.open(path) as img:
            return img.width, img.height
    except Exception:
        return 0, 0


def get_file_size_mb(path: str) -> float:
    try:
        return round(os.path.getsize(path) / (1024 * 1024), 2)
    except Exception:
        return 0.0


def safe_delete(path: str) -> None:
    """Delete a file, ignoring errors."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception:
        pass
