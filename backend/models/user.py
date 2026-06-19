"""
User document helpers for MongoDB.
No SQLAlchemy models — just plain dicts stored in the 'users' collection.
"""
from datetime import datetime


def make_user_doc(name: str, email: str, password_hash: str | None = None,
                  google_id: str | None = None, avatar_url: str = "") -> dict:
    """Build a new user document for insertion."""
    return {
        "name":          name,
        "email":         email.lower().strip(),
        "password_hash": password_hash,
        "google_id":     google_id,
        "avatar_url":    avatar_url or "",
        "created_at":    datetime.utcnow(),
        "total_stories": 0,
    }
