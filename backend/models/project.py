from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from models.database import Base


class Project(Base):
    __tablename__ = "projects"

    id:                  Mapped[int]            = mapped_column(Integer,     primary_key=True, autoincrement=True)
    user_id:             Mapped[int]            = mapped_column(Integer,     ForeignKey("users.id"), nullable=False, index=True)
    title:               Mapped[str]            = mapped_column(String(200), nullable=False)
    original_filename:   Mapped[Optional[str]]  = mapped_column(String(255), nullable=True)
    upload_path:         Mapped[Optional[str]]  = mapped_column(String(500), nullable=True)
    output_video_path:   Mapped[Optional[str]]  = mapped_column(String(500), nullable=True)
    narration_text:      Mapped[Optional[str]]  = mapped_column(Text,        nullable=True)
    language:            Mapped[str]            = mapped_column(String(50),  nullable=False, default="English")
    voice_style:         Mapped[str]            = mapped_column(String(50),  nullable=False, default="Natural (Female)")
    export_format:       Mapped[str]            = mapped_column(String(50),  nullable=False, default="Standard MP4")
    effect_type:         Mapped[str]            = mapped_column(String(50),  nullable=False, default="Slow Pan")
    # pending | processing | ready | failed
    status:              Mapped[str]            = mapped_column(String(20),  nullable=False, default="pending")
    progress_percent:    Mapped[int]            = mapped_column(Integer,     nullable=False, default=0)
    duration_seconds:    Mapped[Optional[int]]  = mapped_column(Integer,     nullable=True)
    file_size_mb:        Mapped[Optional[float]]= mapped_column(Float,       nullable=True)
    error_message:       Mapped[Optional[str]]  = mapped_column(Text,        nullable=True)
    created_at:          Mapped[datetime]       = mapped_column(DateTime,    nullable=False, default=datetime.utcnow)
    updated_at:          Mapped[datetime]       = mapped_column(DateTime,    nullable=False, default=datetime.utcnow)

    def to_dict(self, base_url: str = "http://localhost:8000"):
        output_url = None
        if self.output_video_path:
            output_url = f"{base_url}/{self.output_video_path.replace(chr(92), '/')}"
        return {
            "id":               self.id,
            "user_id":          self.user_id,
            "title":            self.title,
            "status":           self.status,
            "progress_percent": self.progress_percent,
            "output_url":       output_url,
            "export_format":    self.export_format,
            "duration_seconds": self.duration_seconds,
            "file_size_mb":     self.file_size_mb,
            "error_message":    self.error_message,
            "created_at":       self.created_at.isoformat(),
            "updated_at":       self.updated_at.isoformat(),
        }
