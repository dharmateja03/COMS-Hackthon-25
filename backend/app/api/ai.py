from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

from app.db.base import get_db
from app.models.user import User
from app.models.course import Course
from app.models.upload import Upload
from app.api.auth import get_current_user
from app.services.gemini_service import gemini_service

router = APIRouter()


# Pydantic schemas
class ChatRequest(BaseModel):
    message: str
    course_id: str
    upload_id: Optional[str] = None  # Optional: specific upload context


class ChatResponse(BaseModel):
    message: str
    response: str


class SearchRequest(BaseModel):
    query: str
    course_id: str


class SearchResult(BaseModel):
    upload_id: str
    file_name: str
    file_type: str
    relevant_text: str
    relevance_score: float


@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with AI tutor - uses course materials as context"""

    # Verify course belongs to user
    course_id = UUID(chat_request.course_id)
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Build context from course materials
    context = ""

    if chat_request.upload_id:
        # Use specific upload as context
        upload_id = UUID(chat_request.upload_id)
        upload = db.query(Upload).filter(
            Upload.id == upload_id,
            Upload.course_id == course_id
        ).first()

        if not upload:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Upload not found"
            )

        if upload.text_content:
            context = f"Content from {upload.file_name}:\n\n{upload.text_content[:5000]}"

    else:
        # Use all course materials as context
        uploads = db.query(Upload).filter(
            Upload.course_id == course_id,
            Upload.status == 'ready'
        ).limit(5).all()  # Limit to avoid token overflow

        for upload in uploads:
            if upload.text_content:
                context += f"\n\n--- {upload.file_name} ---\n\n"
                context += upload.text_content[:2000]  # Limit each upload

    # Chat with Gemini
    try:
        response = gemini_service.chat(
            message=chat_request.message,
            context=context
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error chatting with AI: {str(e)}"
        )

    return ChatResponse(
        message=chat_request.message,
        response=response
    )


@router.post("/search", response_model=List[SearchResult])
def semantic_search(
    search_request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Semantic search across course materials
    Note: This is a simplified version. For production, use Snowflake vector similarity
    """

    # Verify course belongs to user
    course_id = UUID(search_request.course_id)
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Get all uploads for the course
    uploads = db.query(Upload).filter(
        Upload.course_id == course_id,
        Upload.status == 'ready'
    ).all()

    if not uploads:
        return []

    # Simple keyword-based search (placeholder for Snowflake vector search)
    # In production, this would use Snowflake VECTOR_COSINE_SIMILARITY
    results = []
    query_lower = search_request.query.lower()

    for upload in uploads:
        if upload.text_content:
            text_lower = upload.text_content.lower()

            # Simple relevance: check if query words appear in text
            query_words = query_lower.split()
            matches = sum(1 for word in query_words if word in text_lower)
            relevance = matches / len(query_words) if query_words else 0

            if relevance > 0:
                # Extract relevant snippet
                snippet_start = text_lower.find(query_words[0]) if query_words else 0
                snippet_start = max(0, snippet_start - 100)
                snippet_end = snippet_start + 500
                relevant_text = upload.text_content[snippet_start:snippet_end]

                results.append(
                    SearchResult(
                        upload_id=str(upload.id),
                        file_name=upload.file_name,
                        file_type=upload.file_type,
                        relevant_text=relevant_text,
                        relevance_score=relevance
                    )
                )

    # Sort by relevance
    results.sort(key=lambda x: x.relevance_score, reverse=True)

    return results[:10]  # Return top 10 results
