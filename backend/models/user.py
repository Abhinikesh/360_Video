from datetime import datetime
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from models.database import Base


class User(Base):
    __tablename__ = "users"

    id:            Mapped[int]      = mapped_column(Integer,     primary_key=True, autoincrement=True)
    name:          Mapped[str]      = mapped_column(String(100), nullable=False)
    email:         Mapped[str]      = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str]      = mapped_column(String(255), nullable=False)
    plan:          Mapped[str]      = mapped_column(String(20),  nullable=False, default="free")
    total_stories: Mapped[int]      = mapped_column(Integer,     nullable=False, default=0)
    created_at:    Mapped[datetime] = mapped_column(DateTime,    nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":            self.id,
            "name":          self.name,
            "email":         self.email,
            "plan":          self.plan,
            "total_stories": self.total_stories,
            "created_at":    self.created_at.isoformat(),
        }
