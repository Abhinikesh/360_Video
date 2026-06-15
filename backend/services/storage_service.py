"""
Storage service — abstracts file storage.

LOCAL  : Save/serve from disk (default, zero config)
CLOUD  : Cloudinary (requires CLOUDINARY_URL in .env)
"""
import os
import asyncio
import uuid
from pathlib import Path


async def store_file(local_path: str, resource_type: str = "video") -> str:
    """
    Store a file and return its public URL.
    Uses Cloudinary if CLOUDINARY_URL is set, else returns a localhost URL.
    """
    cloud_url = os.getenv("CLOUDINARY_URL", "").strip()
    if cloud_url:
        try:
            return await _cloudinary_upload(local_path, resource_type)
        except Exception as exc:
            print(f"[storage_service] Cloudinary failed ({exc}), falling back to local")

    return _local_url(local_path)


def _local_url(path: str) -> str:
    """Return a localhost URL for the file."""
    base = os.getenv("API_BASE_URL", "http://localhost:8000")
    clean = path.replace("\\", "/")
    return f"{base}/{clean}"


async def _cloudinary_upload(local_path: str, resource_type: str) -> str:
    """Upload to Cloudinary and return the secure URL."""
    import cloudinary
    import cloudinary.uploader

    def _run():
        result = cloudinary.uploader.upload(
            local_path,
            resource_type=resource_type,
            folder="360tales",
            use_filename=True,
            unique_filename=True,
        )
        return result["secure_url"]

    return await asyncio.get_event_loop().run_in_executor(None, _run)


def cleanup_temp_files(*paths: str) -> None:
    """Delete temporary files, ignoring errors."""
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception:
            pass


def get_file_size_mb(path: str) -> float:
    """Return file size in MB, 0 on error."""
    try:
        return round(os.path.getsize(path) / (1024 * 1024), 2)
    except Exception:
        return 0.0


def ensure_dirs(*dirs: str) -> None:
    """Create directories if they don't exist."""
    for d in dirs:
        os.makedirs(d, exist_ok=True)
