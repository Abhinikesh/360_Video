import os
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, field_validator
from datetime import datetime
from models.database import get_db, serialize_doc
from models.user import make_user_doc
from utils.auth_utils import (
    hash_password, verify_password,
    create_access_token, make_current_user_dep,
)

router = APIRouter()
_get_current_user = make_current_user_dep(get_db)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthBody(BaseModel):
    credential: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _user_response(user_id: str, user_doc: dict, token: str) -> dict:
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "id":         user_id,
            "name":       user_doc.get("name", ""),
            "email":      user_doc.get("email", ""),
            "avatar_url": user_doc.get("avatar_url", ""),
        },
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest):
    db = get_db()
    if db is None:
        raise HTTPException(503, "Database not connected. Set MONGODB_URL in backend/.env")

    if await db.users.find_one({"email": data.email}):
        raise HTTPException(400, "Email already registered")

    doc = make_user_doc(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    result  = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    token   = create_access_token({"sub": user_id})
    return _user_response(user_id, doc, token)


@router.post("/login")
async def login(data: LoginRequest):
    db = get_db()
    if db is None:
        raise HTTPException(503, "Database not connected. Set MONGODB_URL in backend/.env")

    user = await db.users.find_one({"email": data.email.lower().strip()})
    if not user or not user.get("password_hash") or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    user_id = str(user["_id"])
    token   = create_access_token({"sub": user_id})
    return _user_response(user_id, user, token)


@router.post("/google")
async def google_auth(body: GoogleAuthBody):
    """Verify a Google ID token and sign in / register the user."""
    db = get_db()
    if db is None:
        raise HTTPException(503, "Database not connected. Set MONGODB_URL in backend/.env")

    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not google_client_id:
        raise HTTPException(500, "GOOGLE_CLIENT_ID not configured on server")

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        idinfo = id_token.verify_oauth2_token(
            body.credential,
            google_requests.Request(),
            google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(400, f"Invalid Google token: {exc}")

    email      = idinfo["email"]
    name       = idinfo.get("name", email.split("@")[0])
    google_id  = idinfo["sub"]
    avatar_url = idinfo.get("picture", "")

    # Find existing user or create new one
    user = await db.users.find_one({"email": email})
    if not user:
        doc = make_user_doc(name=name, email=email, google_id=google_id, avatar_url=avatar_url)
        result  = await db.users.insert_one(doc)
        user_id = str(result.inserted_id)
        user    = doc
    else:
        user_id = str(user["_id"])
        # Update Google ID and avatar if missing
        from bson import ObjectId
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"google_id": google_id, "avatar_url": avatar_url}},
        )

    token = create_access_token({"sub": user_id})
    return _user_response(user_id, user, token)


@router.get("/me")
async def me(current_user: dict = Depends(_get_current_user)):
    return {
        "id":            current_user["id"],
        "name":          current_user.get("name", ""),
        "email":         current_user.get("email", ""),
        "avatar_url":    current_user.get("avatar_url", ""),
        "total_stories": current_user.get("total_stories", 0),
        "created_at":    current_user.get("created_at", datetime.utcnow()).isoformat()
                         if hasattr(current_user.get("created_at"), "isoformat")
                         else str(current_user.get("created_at", "")),
    }


@router.patch("/me")
async def update_profile(body: dict, current_user: dict = Depends(_get_current_user)):
    db = get_db()
    from bson import ObjectId
    updates = {}
    if "name" in body and str(body["name"]).strip():
        updates["name"] = str(body["name"]).strip()
    if updates:
        await db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$set": updates})
    updated = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    updated["id"] = str(updated.pop("_id"))
    return {k: updated.get(k) for k in ["id", "name", "email", "avatar_url", "total_stories"]}
