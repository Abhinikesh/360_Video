from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from models.database import get_db, serialize_doc
from models.project import make_project_doc
from utils.auth_utils import make_current_user_dep
from utils.file_utils import safe_delete

router = APIRouter()
_get_current_user = make_current_user_dep(get_db)


@router.get("/")
async def list_projects(current_user: dict = Depends(_get_current_user)):
    db       = get_db()
    cursor   = db.projects.find({"user_id": current_user["id"]}).sort("created_at", -1)
    projects = await cursor.to_list(length=200)
    return [serialize_doc(p) for p in projects]


@router.get("/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(_get_current_user)):
    db      = get_db()
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(404, "Project not found")

    project = await db.projects.find_one({"_id": oid})
    if not project or project.get("user_id") != current_user["id"]:
        raise HTTPException(404, "Project not found")
    return serialize_doc(project)


@router.patch("/{project_id}")
async def update_project(project_id: str, body: dict,
                         current_user: dict = Depends(_get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(404, "Project not found")

    project = await db.projects.find_one({"_id": oid})
    if not project or project.get("user_id") != current_user["id"]:
        raise HTTPException(404, "Project not found")

    updates = {"updated_at": datetime.utcnow()}
    if "title" in body and str(body["title"]).strip():
        updates["title"] = str(body["title"]).strip()

    await db.projects.update_one({"_id": oid}, {"$set": updates})
    updated = await db.projects.find_one({"_id": oid})
    return serialize_doc(updated)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, current_user: dict = Depends(_get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(404, "Project not found")

    project = await db.projects.find_one({"_id": oid})
    if not project or project.get("user_id") != current_user["id"]:
        raise HTTPException(404, "Project not found")

    # Clean up files
    safe_delete(project.get("upload_path"))
    safe_delete(project.get("output_video_path"))

    await db.projects.delete_one({"_id": oid})

    # Decrement user story count
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"]), "total_stories": {"$gt": 0}},
        {"$inc": {"total_stories": -1}},
    )
