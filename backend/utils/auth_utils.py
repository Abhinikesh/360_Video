import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-use-secrets-token-hex-32")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ─── Password helpers ─────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ─── JWT helpers ──────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = data.copy()
    expire  = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload["exp"] = expire
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ─── Current-user dependency ──────────────────────────────────────────────────

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(None),  # overridden at import time by each router
):
    """
    Thin wrapper — routers call get_current_user_dep(db) which is built below.
    """
    raise NotImplementedError("Use get_current_user_dep instead")


def make_current_user_dep(get_db_dep):
    """
    Factory so each router can inject its own get_db dependency cleanly.
    Usage:
        from utils.auth_utils import make_current_user_dep
        from models.database import get_db
        get_current_user = make_current_user_dep(get_db)
    """
    from models.user import User

    async def _dep(
        token: str = Depends(oauth2_scheme),
        db: AsyncSession = Depends(get_db_dep),
    ):
        payload = decode_token(token)
        uid = payload.get("sub")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        result = await db.execute(select(User).where(User.id == int(uid)))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user

    return _dep
