"""
Project document helpers for MongoDB.
No SQLAlchemy models — just plain dicts stored in the 'projects' collection.
"""
from datetime import datetime


def make_project_doc(user_id: str, title: str, original_filename: str,
                     upload_path: str, narration_text: str = "",
                     language: str = "English",
                     voice_style: str = "Natural (Female)",
                     export_format: str = "Standard MP4",
                     effect_type: str = "Slow Pan") -> dict:
    """Build a new project document for insertion."""
    now = datetime.utcnow()
    return {
        "user_id":           user_id,
        "title":             title,
        "original_filename": original_filename,
        "upload_path":       upload_path,
        "output_video_path": None,
        "narration_text":    narration_text,
        "language":          language,
        "voice_style":       voice_style,
        "export_format":     export_format,
        "effect_type":       effect_type,
        "status":            "pending",
        "progress_percent":  0,
        "error_message":     None,
        "duration_seconds":  0,
        "file_size_mb":      0.0,
        "created_at":        now,
        "updated_at":        now,
    }
