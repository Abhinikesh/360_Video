from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from models.database import get_db
from models.user import User
from models.project import Project
from utils.auth_utils import make_current_user_dep
from utils.file_utils import safe_delete

router = APIRouter()
_get_current_user = make_current_user_dep(get_db)


@router.get("/")
async def list_projects(
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(desc(Project.created_at))
    )
    projects = result.scalars().all()
    return [p.to_dict() for p in projects]


@router.get("/{project_id}")
async def get_project(
    project_id: int,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project: Project = await db.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.to_dict()


@router.patch("/{project_id}")
async def update_project(
    project_id: int,
    body: dict,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project: Project = await db.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    if "title" in body and body["title"].strip():
        project.title      = body["title"].strip()
        project.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(project)
    return project.to_dict()


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project: Project = await db.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    # Clean up files
    safe_delete(project.upload_path)
    safe_delete(project.output_video_path)

    await db.delete(project)
    await db.commit()

    # Decrement user story count
    user: User = await db.get(User, current_user.id)
    if user and user.total_stories > 0:
        user.total_stories -= 1
        await db.commit()
