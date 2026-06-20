"""
QR Code router — GET /api/qr/{project_id}
Returns a branded PNG QR code that links to the public share page.
Requires authentication (only the project owner can download their QR).
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from bson import ObjectId

from models.database import get_db
from utils.auth_utils import make_current_user_dep
from services.qr_service import generate_qr_code, ensure_qr_dir

router = APIRouter()
_get_current_user = make_current_user_dep(get_db)

_FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@router.get("/{project_id}")
async def get_project_qr(
    project_id: str,
    current_user: dict = Depends(_get_current_user),
):
    """
    Generate and return a QR code PNG for the given project.
    The QR encodes the public share URL /share/{project_id}.
    Only the project owner may request their QR code.
    """
    db = get_db()

    # ── Validate & fetch project ──────────────────────────────────────────────
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID")

    project = await db.projects.find_one({"_id": oid})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if str(project.get("user_id")) != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Access denied")

    # ── Generate QR ───────────────────────────────────────────────────────────
    ensure_qr_dir()
    share_url = f"{_FRONTEND_URL}/share/{project_id}"
    title     = project.get("title", "Untitled Story")

    qr_path = generate_qr_code(
        project_id=project_id,
        project_title=title,
        share_url=share_url,
    )

    return FileResponse(
        qr_path,
        media_type="image/png",
        filename=f"horizon-qr-{project_id[:8]}.png",
        headers={"Cache-Control": "public, max-age=300"},
    )
