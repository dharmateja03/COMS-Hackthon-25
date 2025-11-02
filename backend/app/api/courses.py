from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

from app.db.base import get_db
from app.models.user import User
from app.models.course import Course
from app.api.auth import get_current_user
from app.data.standard_courses import search_courses, get_all_courses, get_course_by_code

router = APIRouter()


# Pydantic schemas
class CourseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    standard_course_code: Optional[str] = None  # For shared embeddings


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CourseResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    standard_course_code: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class StandardCourseResponse(BaseModel):
    code: str
    name: str
    display: str


@router.get("/autocomplete", response_model=List[StandardCourseResponse])
def autocomplete_courses(
    query: str = Query("", description="Search query for course name or code"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    current_user: User = Depends(get_current_user)
):
    """
    Autocomplete endpoint for standard course names
    Returns course suggestions based on alphabetical matching
    """
    matches = search_courses(query, limit)
    return [
        StandardCourseResponse(
            code=course["code"],
            name=course["name"],
            display=course["display"]
        )
        for course in matches
    ]


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new course"""
    new_course = Course(
        user_id=current_user.id,
        name=course_data.name,
        description=course_data.description,
        standard_course_code=course_data.standard_course_code
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return CourseResponse(
        id=str(new_course.id),
        user_id=str(new_course.user_id),
        name=new_course.name,
        description=new_course.description,
        standard_course_code=new_course.standard_course_code,
        created_at=new_course.created_at.isoformat()
    )


@router.get("", response_model=List[CourseResponse])
def get_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all courses for the current user"""
    courses = db.query(Course).filter(Course.user_id == current_user.id).all()

    return [
        CourseResponse(
            id=str(course.id),
            user_id=str(course.user_id),
            name=course.name,
            description=course.description,
            standard_course_code=course.standard_course_code,
            created_at=course.created_at.isoformat()
        )
        for course in courses
    ]


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific course"""
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    return CourseResponse(
        id=str(course.id),
        user_id=str(course.user_id),
        name=course.name,
        description=course.description,
        standard_course_code=course.standard_course_code,
        created_at=course.created_at.isoformat()
    )


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a course"""
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Update fields if provided
    if course_data.name is not None:
        course.name = course_data.name
    if course_data.description is not None:
        course.description = course_data.description

    db.commit()
    db.refresh(course)

    return CourseResponse(
        id=str(course.id),
        user_id=str(course.user_id),
        name=course.name,
        description=course.description,
        standard_course_code=course.standard_course_code,
        created_at=course.created_at.isoformat()
    )


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a course"""
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    db.delete(course)
    db.commit()

    return None
