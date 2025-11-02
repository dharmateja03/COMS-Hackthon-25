from sqlalchemy import Column, String, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.sql import func
import uuid
from app.db.base import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    upload_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=False)
    questions = Column(JSONB, nullable=False)  # [{question, options, correct, explanation}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    answers = Column(JSONB, nullable=False)  # [{question_id, selected_answer, confidence}]
    score = Column(Float, nullable=False)
    time_taken_seconds = Column(Float, nullable=True)  # Time taken to complete quiz
    performance_data = Column(JSONB, nullable=True)  # {weak_topics: [], strong_topics: [], accuracy_by_topic: {}}
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
