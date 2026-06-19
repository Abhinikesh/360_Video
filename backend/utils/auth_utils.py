import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-use-secrets-token-hex-32")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ─── Password helpers ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt   = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ─── JWT helpers ───────────────────────────────────────────────────────────────

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


# ─── Current-user dependency (MongoDB version) ────────────────────────────────

def make_current_user_dep(get_db_dep):
    """
    Factory returning a FastAPI dependency that decodes the JWT and
    returns the raw MongoDB user document (as a dict with 'id' key).
    """
    from bson import ObjectId

    async def _dep(token: str = Depends(oauth2_scheme)):
        payload = decode_token(token)
        uid = payload.get("sub")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        db = get_db_dep()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not connected. Set MONGODB_URL in backend/.env")

        try:
            user_doc = await db.users.find_one({"_id": ObjectId(uid)})
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid user ID in token")

        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")

        # Return as plain dict with string id
        user_doc["id"] = str(user_doc.pop("_id"))
        return user_doc

    return _dep
