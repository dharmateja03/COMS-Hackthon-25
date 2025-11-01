from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.db.base import get_db
from app.models.user import User
from app.models.course import Course
from app.models.upload import Upload
from app.models.quiz import Quiz, QuizAttempt
from app.api.auth import get_current_user
from app.services.gemini_service import gemini_service

router = APIRouter()


# Pydantic schemas
class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    options: List[str]
    correct: int
    explanation: str


class QuizGenerateRequest(BaseModel):
    upload_ids: List[str]
    num_questions: int = 25


class QuizResponse(BaseModel):
    id: str
    course_id: str
    upload_ids: List[str]
    questions: List[QuizQuestionResponse]
    created_at: str

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    question_id: str
    selected_answer: int


class QuizSubmitRequest(BaseModel):
    answers: List[AnswerSubmit]


class QuestionResult(BaseModel):
    question_id: str
    question: str
    options: List[str]
    selected_answer: int
    correct_answer: int
    is_correct: bool
    explanation: str


class QuizResultsResponse(BaseModel):
    quiz_id: str
    score: float
    total_questions: int
    correct_answers: int
    results: List[QuestionResult]
    completed_at: str


@router.post("/generate", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def generate_quiz(
    quiz_request: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a quiz from selected uploads"""

    if not quiz_request.upload_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one upload must be selected"
        )

    # Get all uploads and verify ownership
    upload_uuids = [UUID(uid) for uid in quiz_request.upload_ids]
    uploads = db.query(Upload).filter(Upload.id.in_(upload_uuids)).all()

    if len(uploads) != len(quiz_request.upload_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more uploads not found"
        )

    # Verify all uploads belong to courses owned by the user
    for upload in uploads:
        course = db.query(Course).filter(
            Course.id == upload.course_id,
            Course.user_id == current_user.id
        ).first()

        if not course:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to one or more uploads"
            )

    # Combine content from all uploads
    combined_content = ""
    for upload in uploads:
        if upload.status != 'ready':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Upload '{upload.file_name}' is not ready yet"
            )

        if upload.text_content:
            combined_content += f"\n\n--- {upload.file_name} ---\n\n"
            combined_content += upload.text_content

    if not combined_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No content available to generate quiz"
        )

    # Generate quiz using Gemini
    try:
        questions = gemini_service.generate_quiz(
            content=combined_content,
            num_questions=quiz_request.num_questions
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating quiz: {str(e)}"
        )

    # Get course_id from first upload (they should all be from the same course ideally)
    course_id = uploads[0].course_id

    # Save quiz to database
    new_quiz = Quiz(
        course_id=course_id,
        upload_ids=[upload.id for upload in uploads],
        questions=questions
    )

    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    return QuizResponse(
        id=str(new_quiz.id),
        course_id=str(new_quiz.course_id),
        upload_ids=[str(uid) for uid in new_quiz.upload_ids],
        questions=[
            QuizQuestionResponse(
                id=q['id'],
                question=q['question'],
                options=q['options'],
                correct=q['correct'],
                explanation=q['explanation']
            )
            for q in questions
        ],
        created_at=new_quiz.created_at.isoformat()
    )


@router.post("/{quiz_id}/submit", response_model=QuizResultsResponse)
def submit_quiz(
    quiz_id: UUID,
    submission: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit quiz answers and get results"""

    # Get quiz
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )

    # Verify user has access to this quiz
    course = db.query(Course).filter(
        Course.id == quiz.course_id,
        Course.user_id == current_user.id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this quiz"
        )

    # Grade the quiz
    answers_dict = {ans.question_id: ans.selected_answer for ans in submission.answers}
    results = []
    correct_count = 0

    for question in quiz.questions:
        question_id = question['id']
        correct_answer = question['correct']
        selected_answer = answers_dict.get(question_id, -1)
        is_correct = selected_answer == correct_answer

        if is_correct:
            correct_count += 1

        results.append(
            QuestionResult(
                question_id=question_id,
                question=question['question'],
                options=question['options'],
                selected_answer=selected_answer,
                correct_answer=correct_answer,
                is_correct=is_correct,
                explanation=question['explanation']
            )
        )

    total_questions = len(quiz.questions)
    score = (correct_count / total_questions * 100) if total_questions > 0 else 0

    # Save quiz attempt
    quiz_attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        answers=[{"question_id": ans.question_id, "selected_answer": ans.selected_answer} for ans in submission.answers],
        score=score
    )

    db.add(quiz_attempt)
    db.commit()

    return QuizResultsResponse(
        quiz_id=str(quiz.id),
        score=score,
        total_questions=total_questions,
        correct_answers=correct_count,
        results=results,
        completed_at=quiz_attempt.completed_at.isoformat()
    )


@router.get("/{quiz_id}/results", response_model=QuizResultsResponse)
def get_quiz_results(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get results for the most recent quiz attempt"""

    # Get quiz
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )

    # Get most recent attempt
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.user_id == current_user.id
    ).order_by(QuizAttempt.completed_at.desc()).first()

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No quiz attempt found"
        )

    # Reconstruct results
    answers_dict = {ans['question_id']: ans['selected_answer'] for ans in attempt.answers}
    results = []
    correct_count = 0

    for question in quiz.questions:
        question_id = question['id']
        correct_answer = question['correct']
        selected_answer = answers_dict.get(question_id, -1)
        is_correct = selected_answer == correct_answer

        if is_correct:
            correct_count += 1

        results.append(
            QuestionResult(
                question_id=question_id,
                question=question['question'],
                options=question['options'],
                selected_answer=selected_answer,
                correct_answer=correct_answer,
                is_correct=is_correct,
                explanation=question['explanation']
            )
        )

    return QuizResultsResponse(
        quiz_id=str(quiz.id),
        score=attempt.score,
        total_questions=len(quiz.questions),
        correct_answers=correct_count,
        results=results,
        completed_at=attempt.completed_at.isoformat()
    )


@router.get("/history", response_model=List[dict])
def get_quiz_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all quiz attempts for the current user"""

    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id
    ).order_by(QuizAttempt.completed_at.desc()).all()

    history = []
    for attempt in attempts:
        quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
        if quiz:
            history.append({
                "attempt_id": str(attempt.id),
                "quiz_id": str(quiz.id),
                "course_id": str(quiz.course_id),
                "score": attempt.score,
                "total_questions": len(quiz.questions),
                "completed_at": attempt.completed_at.isoformat()
            })

    return history
