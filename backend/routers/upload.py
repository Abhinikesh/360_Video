import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from models.database import get_db
from models.user import User
from utils.auth_utils import make_current_user_dep
from utils.file_utils import (
    validate_image, validate_video, validate_size,
    save_upload, get_image_dimensions, get_file_size_mb,
)

router = APIRouter()
_get_current_user = make_current_user_dep(get_db)

# In-memory registry of uploaded file metadata (production: use DB or Redis)
_file_registry: dict[str, dict] = {}


def _make_url(path: str, base: str = "http://localhost:8000") -> str:
    return f"{base}/{path.replace(os.sep, '/')}"


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(_get_current_user),
):
    validate_image(file)
    data = await file.read()
    validate_size(data)

    file_id, path = save_upload(data, "uploads", file.content_type)
    w, h = get_image_dimensions(path)
    size = get_file_size_mb(path)

    meta = {
        "file_id":   file_id,
        "filename":  file.filename,
        "file_url":  _make_url(path),
        "local_path": path,
        "width":     w,
        "height":    h,
        "file_size_mb": size,
        "content_type": file.content_type,
    }
    _file_registry[file_id] = meta
    return meta


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(_get_current_user),
):
    validate_video(file)
    data = await file.read()
    validate_size(data)

    file_id, path = save_upload(data, "uploads", file.content_type)
    size = get_file_size_mb(path)

    meta = {
        "file_id":    file_id,
        "filename":   file.filename,
        "file_url":   _make_url(path),
        "local_path": path,
        "file_size_mb": size,
        "content_type": file.content_type,
    }
    _file_registry[file_id] = meta
    return meta


@router.get("/{file_id}")
async def get_file_info(
    file_id: str,
    current_user: User = Depends(_get_current_user),
):
    meta = _file_registry.get(file_id)
    if not meta:
        raise HTTPException(status_code=404, detail="File not found")
    return meta


def get_file_path(file_id: str) -> str | None:
    """Utility used by generate router to retrieve upload path."""
    meta = _file_registry.get(file_id)
    return meta["local_path"] if meta else None
