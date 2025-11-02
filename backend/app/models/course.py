from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    standard_course_code = Column(String, nullable=True)  # e.g., "CSCI-335" for shared embeddings
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    uploads = relationship("Upload", back_populates="course", cascade="all, delete-orphan")
