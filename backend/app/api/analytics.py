from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime, timedelta

from app.db.base import get_db
from app.models.user import User
from app.models.course import Course
from app.models.quiz import Quiz, QuizAttempt
from app.api.auth import get_current_user
from app.services.snowflake_service import snowflake_service

router = APIRouter()


# Pydantic schemas
class QuizAttemptSummary(BaseModel):
    id: str
    quiz_id: str
    score: float
    time_taken_seconds: Optional[float]
    completed_at: str
    weak_topics: List[str] = []
    strong_topics: List[str] = []

    class Config:
        from_attributes = True


class CourseAnalytics(BaseModel):
    course_id: str
    course_name: str
    total_quizzes: int
    total_attempts: int
    average_score: float
    highest_score: float
    lowest_score: float
    recent_attempts: List[QuizAttemptSummary]
    weak_topics: List[str]
    strong_topics: List[str]
    progress_over_time: List[Dict]  # [{date, score}]


class StudentPerformance(BaseModel):
    overall_average: float
    total_quizzes_taken: int
    total_study_time_hours: float
    weak_areas: List[str]
    strong_areas: List[str]
    recommended_topics: List[str]
    recent_trend: str  # "improving", "declining", "stable"


@router.get("/courses/{course_id}/analytics", response_model=CourseAnalytics)
def get_course_analytics(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics for a course"""

    # Verify course belongs to user
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Get all quizzes for this course
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()
    quiz_ids = [q.id for q in quizzes]

    if not quiz_ids:
        return CourseAnalytics(
            course_id=str(course_id),
            course_name=course.name,
            total_quizzes=0,
            total_attempts=0,
            average_score=0.0,
            highest_score=0.0,
            lowest_score=0.0,
            recent_attempts=[],
            weak_topics=[],
            strong_topics=[],
            progress_over_time=[]
        )

    # Get all attempts for this user
    attempts = db.query(QuizAttempt).filter(
        and_(
            QuizAttempt.quiz_id.in_(quiz_ids),
            QuizAttempt.user_id == current_user.id
        )
    ).order_by(QuizAttempt.completed_at.desc()).all()

    if not attempts:
        return CourseAnalytics(
            course_id=str(course_id),
            course_name=course.name,
            total_quizzes=len(quizzes),
            total_attempts=0,
            average_score=0.0,
            highest_score=0.0,
            lowest_score=0.0,
            recent_attempts=[],
            weak_topics=[],
            strong_topics=[],
            progress_over_time=[]
        )

    # Calculate statistics
    scores = [a.score for a in attempts]
    average_score = sum(scores) / len(scores)
    highest_score = max(scores)
    lowest_score = min(scores)

    # Aggregate weak and strong topics
    all_weak_topics = []
    all_strong_topics = []
    for attempt in attempts:
        if attempt.performance_data:
            all_weak_topics.extend(attempt.performance_data.get('weak_topics', []))
            all_strong_topics.extend(attempt.performance_data.get('strong_topics', []))

    # Get most common weak/strong topics
    weak_topics_count = {}
    for topic in all_weak_topics:
        weak_topics_count[topic] = weak_topics_count.get(topic, 0) + 1
    weak_topics = sorted(weak_topics_count.keys(), key=lambda x: weak_topics_count[x], reverse=True)[:5]

    strong_topics_count = {}
    for topic in all_strong_topics:
        strong_topics_count[topic] = strong_topics_count.get(topic, 0) + 1
    strong_topics = sorted(strong_topics_count.keys(), key=lambda x: strong_topics_count[x], reverse=True)[:5]

    # Progress over time (last 10 attempts)
    progress_over_time = [
        {
            "date": attempt.completed_at.isoformat(),
            "score": attempt.score
        }
        for attempt in reversed(attempts[:10])
    ]

    # Recent attempts
    recent_attempts = [
        QuizAttemptSummary(
            id=str(attempt.id),
            quiz_id=str(attempt.quiz_id),
            score=attempt.score,
            time_taken_seconds=attempt.time_taken_seconds,
            completed_at=attempt.completed_at.isoformat(),
            weak_topics=attempt.performance_data.get('weak_topics', []) if attempt.performance_data else [],
            strong_topics=attempt.performance_data.get('strong_topics', []) if attempt.performance_data else []
        )
        for attempt in attempts[:5]
    ]

    return CourseAnalytics(
        course_id=str(course_id),
        course_name=course.name,
        total_quizzes=len(quizzes),
        total_attempts=len(attempts),
        average_score=round(average_score, 2),
        highest_score=round(highest_score, 2),
        lowest_score=round(lowest_score, 2),
        recent_attempts=recent_attempts,
        weak_topics=weak_topics,
        strong_topics=strong_topics,
        progress_over_time=progress_over_time
    )


@router.get("/performance", response_model=StudentPerformance)
def get_student_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overall student performance across all courses"""

    # Get all user's courses
    courses = db.query(Course).filter(Course.user_id == current_user.id).all()
    course_ids = [c.id for c in courses]

    if not course_ids:
        return StudentPerformance(
            overall_average=0.0,
            total_quizzes_taken=0,
            total_study_time_hours=0.0,
            weak_areas=[],
            strong_areas=[],
            recommended_topics=[],
            recent_trend="stable"
        )

    # Get all quizzes for user's courses
    quizzes = db.query(Quiz).filter(Quiz.course_id.in_(course_ids)).all()
    quiz_ids = [q.id for q in quizzes]

    if not quiz_ids:
        return StudentPerformance(
            overall_average=0.0,
            total_quizzes_taken=0,
            total_study_time_hours=0.0,
            weak_areas=[],
            strong_areas=[],
            recommended_topics=[],
            recent_trend="stable"
        )

    # Get all attempts
    attempts = db.query(QuizAttempt).filter(
        and_(
            QuizAttempt.quiz_id.in_(quiz_ids),
            QuizAttempt.user_id == current_user.id
        )
    ).order_by(QuizAttempt.completed_at.desc()).all()

    if not attempts:
        return StudentPerformance(
            overall_average=0.0,
            total_quizzes_taken=0,
            total_study_time_hours=0.0,
            weak_areas=[],
            strong_areas=[],
            recommended_topics=[],
            recent_trend="stable"
        )

    # Calculate statistics
    scores = [a.score for a in attempts]
    overall_average = sum(scores) / len(scores)
    total_study_time_hours = sum([a.time_taken_seconds or 0 for a in attempts]) / 3600

    # Aggregate weak and strong topics
    all_weak_topics = []
    all_strong_topics = []
    for attempt in attempts:
        if attempt.performance_data:
            all_weak_topics.extend(attempt.performance_data.get('weak_topics', []))
            all_strong_topics.extend(attempt.performance_data.get('strong_topics', []))

    # Get most common weak/strong topics
    weak_topics_count = {}
    for topic in all_weak_topics:
        weak_topics_count[topic] = weak_topics_count.get(topic, 0) + 1
    weak_areas = sorted(weak_topics_count.keys(), key=lambda x: weak_topics_count[x], reverse=True)[:10]

    strong_topics_count = {}
    for topic in all_strong_topics:
        strong_topics_count[topic] = strong_topics_count.get(topic, 0) + 1
    strong_areas = sorted(strong_topics_count.keys(), key=lambda x: strong_topics_count[x], reverse=True)[:10]

    # Calculate recent trend (compare last 3 vs previous 3)
    recent_trend = "stable"
    if len(attempts) >= 6:
        recent_avg = sum([a.score for a in attempts[:3]]) / 3
        previous_avg = sum([a.score for a in attempts[3:6]]) / 3
        if recent_avg > previous_avg + 5:
            recent_trend = "improving"
        elif recent_avg < previous_avg - 5:
            recent_trend = "declining"

    return StudentPerformance(
        overall_average=round(overall_average, 2),
        total_quizzes_taken=len(attempts),
        total_study_time_hours=round(total_study_time_hours, 2),
        weak_areas=weak_areas,
        strong_areas=strong_areas,
        recommended_topics=weak_areas[:5],  # Recommend reviewing weak areas
        recent_trend=recent_trend
    )


class StudyRecommendations(BaseModel):
    recommendations: List[str]
    study_plan: str
    estimated_hours: float
    priority_topics: List[str]
    powered_by: str  # "snowflake_cortex" or "basic_algorithm"


@router.get("/study-recommendations", response_model=StudyRecommendations)
def get_study_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized study recommendations using Snowflake Cortex AI

    This endpoint uses Snowflake's Cortex AI to generate intelligent,
    personalized study recommendations based on the student's performance data.
    Falls back to basic algorithm if Snowflake is not configured.
    """

    # Get all user's courses
    courses = db.query(Course).filter(Course.user_id == current_user.id).all()
    course_ids = [c.id for c in courses]

    if not course_ids:
        return StudyRecommendations(
            recommendations=["Start by uploading some course materials!"],
            study_plan="Upload PDFs or videos to get started with personalized learning.",
            estimated_hours=0.0,
            priority_topics=[],
            powered_by="basic_algorithm"
        )

    # Get all quizzes for user's courses
    quizzes = db.query(Quiz).filter(Quiz.course_id.in_(course_ids)).all()
    quiz_ids = [q.id for q in quizzes]

    if not quiz_ids:
        return StudyRecommendations(
            recommendations=["Generate and take quizzes to get personalized recommendations"],
            study_plan="Take quizzes on your course materials to help us understand your strengths and weaknesses.",
            estimated_hours=0.0,
            priority_topics=[],
            powered_by="basic_algorithm"
        )

    # Get all attempts
    attempts = db.query(QuizAttempt).filter(
        and_(
            QuizAttempt.quiz_id.in_(quiz_ids),
            QuizAttempt.user_id == current_user.id
        )
    ).order_by(QuizAttempt.completed_at.desc()).all()

    if not attempts:
        return StudyRecommendations(
            recommendations=["Take your first quiz to get started!"],
            study_plan="Complete quizzes to receive personalized study recommendations.",
            estimated_hours=0.0,
            priority_topics=[],
            powered_by="basic_algorithm"
        )

    # Aggregate weak and strong topics
    all_weak_topics = []
    all_strong_topics = []
    for attempt in attempts:
        if attempt.performance_data:
            all_weak_topics.extend(attempt.performance_data.get('weak_topics', []))
            all_strong_topics.extend(attempt.performance_data.get('strong_topics', []))

    # Get most common weak/strong topics
    weak_topics_count = {}
    for topic in all_weak_topics:
        weak_topics_count[topic] = weak_topics_count.get(topic, 0) + 1
    weak_areas = sorted(weak_topics_count.keys(), key=lambda x: weak_topics_count[x], reverse=True)[:5]

    strong_topics_count = {}
    for topic in all_strong_topics:
        strong_topics_count[topic] = strong_topics_count.get(topic, 0) + 1
    strong_areas = sorted(strong_topics_count.keys(), key=lambda x: strong_topics_count[x], reverse=True)[:5]

    # Recent scores
    recent_scores = [attempt.score for attempt in attempts[:10]]

    # Use Snowflake Cortex AI to generate recommendations
    try:
        recommendations_data = snowflake_service.generate_study_recommendations(
            weak_topics=weak_areas,
            strong_topics=strong_areas,
            recent_scores=recent_scores,
            context=f"Student has taken {len(attempts)} quizzes across {len(courses)} courses"
        )

        # Determine source
        powered_by = "snowflake_cortex" if snowflake_service.enabled else "basic_algorithm"
        if recommendations_data.get("source"):
            powered_by = recommendations_data["source"]

        return StudyRecommendations(
            recommendations=recommendations_data["recommendations"],
            study_plan=recommendations_data["study_plan"],
            estimated_hours=float(recommendations_data["estimated_hours"]),
            priority_topics=recommendations_data["priority_topics"],
            powered_by=powered_by
        )

    except Exception as e:
        print(f"Error generating study recommendations: {str(e)}")
        # Return basic recommendations
        return StudyRecommendations(
            recommendations=[f"Review {topic}" for topic in weak_areas[:3]],
            study_plan="Focus on your weak areas and practice regularly.",
            estimated_hours=float(len(weak_areas) * 2),
            priority_topics=weak_areas[:3],
            powered_by="basic_algorithm_fallback"
        )
