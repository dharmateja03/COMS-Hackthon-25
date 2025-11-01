from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Float, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # 'pdf' or 'video'

    # Storage
    storage_url = Column(String, nullable=True)
    file_size_mb = Column(Float, nullable=True)

    # Processing status
    status = Column(String, default='processing')  # 'processing', 'ready', 'failed'

    # Content
    text_content = Column(Text, nullable=True)  # extracted text or transcript

    # Vector embeddings for RAG
    # Stores chunks with embeddings: [{"chunk": "text...", "embedding": [0.1, 0.2, ...]}]
    embeddings = Column(JSONB, nullable=True)

    # Video-specific fields
    transcript = Column(Text, nullable=True)
    video_duration_seconds = Column(Integer, nullable=True)
    timestamps = Column(JSONB, nullable=True)  # [{time, topic, description}]
    summary = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    course = relationship("Course", back_populates="uploads")
