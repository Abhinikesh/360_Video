from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, field_validator
from models.database import get_db
from models.user import User
from utils.auth_utils import hash_password, verify_password, create_access_token, make_current_user_dep

router = APIRouter()

# Build the dependency once at module level
_get_current_user = make_current_user_dep(get_db)


# ─── Request / Response schemas ───────────────────────────────────────────────

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


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Duplicate email check
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "plan": user.plan},
    }


@router.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email.lower().strip()))
    user: User | None = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "plan": user.plan},
    }


@router.get("/me")
async def me(current_user: User = Depends(_get_current_user)):
    return current_user.to_dict()


@router.patch("/me")
async def update_profile(
    body: dict,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if "name" in body and body["name"].strip():
        current_user.name = body["name"].strip()
    await db.commit()
    await db.refresh(current_user)
    return current_user.to_dict()
