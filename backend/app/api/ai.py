from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
import numpy as np
import base64

from app.db.base import get_db
from app.models.user import User
from app.models.course import Course
from app.models.upload import Upload
from app.api.auth import get_current_user
from app.services.gemini_service import gemini_service
from app.services.voice_service import voice_service

router = APIRouter()


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    vec1_np = np.array(vec1)
    vec2_np = np.array(vec2)
    return float(np.dot(vec1_np, vec2_np) / (np.linalg.norm(vec1_np) * np.linalg.norm(vec2_np)))


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


class VoiceChatRequest(BaseModel):
    message: str
    course_id: str
    upload_id: Optional[str] = None
    emotion: Optional[str] = "encouraging"  # neutral, encouraging, excited, patient, serious


class TextToSpeechRequest(BaseModel):
    text: str
    emotion: Optional[str] = "neutral"


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

    # Build context using semantic search with embeddings
    context = ""

    try:
        # Generate embedding for the user's question
        question_embedding = gemini_service.semantic_search_query(chat_request.message)

        # Get uploads to search
        if chat_request.upload_id:
            # Search in specific upload
            upload_id = UUID(chat_request.upload_id)
            uploads = db.query(Upload).filter(
                Upload.id == upload_id,
                Upload.course_id == course_id,
                Upload.status == 'ready'
            ).all()
        else:
            # Search across all course uploads
            uploads = db.query(Upload).filter(
                Upload.course_id == course_id,
                Upload.status == 'ready'
            ).all()

        # Find most relevant chunks using cosine similarity
        relevant_chunks = []

        for upload in uploads:
            if upload.embeddings:
                for chunk_data in upload.embeddings:
                    chunk_text = chunk_data.get('chunk', '')
                    chunk_embedding = chunk_data.get('embedding', [])

                    if chunk_embedding:
                        similarity = cosine_similarity(question_embedding, chunk_embedding)
                        relevant_chunks.append({
                            'text': chunk_text,
                            'similarity': similarity,
                            'file_name': upload.file_name
                        })

        # Sort by similarity and take top 5 chunks
        relevant_chunks.sort(key=lambda x: x['similarity'], reverse=True)
        top_chunks = relevant_chunks[:5]

        # Build context from top chunks
        if top_chunks:
            context = "Relevant context from course materials:\n\n"
            for i, chunk in enumerate(top_chunks, 1):
                context += f"[{i}] From {chunk['file_name']} (relevance: {chunk['similarity']:.2f}):\n"
                context += f"{chunk['text']}\n\n"
        else:
            # Fallback to basic text if no embeddings available
            uploads_with_text = [u for u in uploads if u.text_content]
            if uploads_with_text:
                context = f"Content from {uploads_with_text[0].file_name}:\n\n"
                context += uploads_with_text[0].text_content[:2000]

    except Exception as e:
        print(f"Error in semantic search: {str(e)}")
        # Fallback: Use full text content when embeddings fail (e.g., quota exceeded)
        if chat_request.upload_id:
            upload_id = UUID(chat_request.upload_id)
            uploads = db.query(Upload).filter(
                Upload.id == upload_id,
                Upload.course_id == course_id,
                Upload.status == 'ready'
            ).all()
        else:
            uploads = db.query(Upload).filter(
                Upload.course_id == course_id,
                Upload.status == 'ready'
            ).all()

        if uploads:
            context = "Context from course materials:\n\n"
            for upload in uploads[:2]:  # Limit to 2 files to avoid token limits
                if upload.text_content:
                    context += f"=== {upload.file_name} ===\n\n"
                    context += upload.text_content[:3000] + "\n\n"  # First 3000 chars per file

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


@router.post("/voice-chat")
def voice_chat(
    chat_request: VoiceChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat with AI tutor and get voice response with emotion

    This endpoint:
    1. Performs semantic search on course materials
    2. Generates AI response using Gemini
    3. Converts response to speech with emotional tone using 11 Labs
    4. Returns both text and audio
    """

    # First, get text response using existing chat logic
    text_request = ChatRequest(
        message=chat_request.message,
        course_id=chat_request.course_id,
        upload_id=chat_request.upload_id
    )

    # Reuse chat logic (inline to avoid code duplication)
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

    # Build context using semantic search
    context = ""
    try:
        question_embedding = gemini_service.semantic_search_query(chat_request.message)

        if chat_request.upload_id:
            upload_id = UUID(chat_request.upload_id)
            uploads = db.query(Upload).filter(
                Upload.id == upload_id,
                Upload.course_id == course_id,
                Upload.status == 'ready'
            ).all()
        else:
            uploads = db.query(Upload).filter(
                Upload.course_id == course_id,
                Upload.status == 'ready'
            ).all()

        relevant_chunks = []
        for upload in uploads:
            if upload.embeddings:
                for chunk_data in upload.embeddings:
                    chunk_text = chunk_data.get('chunk', '')
                    chunk_embedding = chunk_data.get('embedding', [])
                    if chunk_embedding:
                        similarity = cosine_similarity(question_embedding, chunk_embedding)
                        relevant_chunks.append({
                            'text': chunk_text,
                            'similarity': similarity,
                            'file_name': upload.file_name
                        })

        relevant_chunks.sort(key=lambda x: x['similarity'], reverse=True)
        top_chunks = relevant_chunks[:5]

        if top_chunks:
            context = "Relevant context from course materials:\n\n"
            for i, chunk in enumerate(top_chunks, 1):
                context += f"[{i}] From {chunk['file_name']} (relevance: {chunk['similarity']:.2f}):\n"
                context += f"{chunk['text']}\n\n"
    except Exception as e:
        print(f"Error in semantic search: {str(e)}")
        # Fallback: Use full text content when embeddings fail
        if chat_request.upload_id:
            upload_id = UUID(chat_request.upload_id)
            uploads = db.query(Upload).filter(
                Upload.id == upload_id,
                Upload.course_id == course_id,
                Upload.status == 'ready'
            ).all()
        else:
            uploads = db.query(Upload).filter(
                Upload.course_id == course_id,
                Upload.status == 'ready'
            ).all()

        if uploads:
            context = "Context from course materials:\n\n"
            for upload in uploads[:2]:  # Limit to 2 files to avoid token limits
                if upload.text_content:
                    context += f"=== {upload.file_name} ===\n\n"
                    context += upload.text_content[:3000] + "\n\n"  # First 3000 chars per file

    # Get AI response
    try:
        response_text = gemini_service.chat(
            message=chat_request.message,
            context=context
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error chatting with AI: {str(e)}"
        )

    # Convert to speech with emotion
    try:
        emotion_settings = voice_service.get_emotional_voice_settings(chat_request.emotion)
        audio_bytes = voice_service.text_to_speech(
            text=response_text,
            **emotion_settings
        )

        # Base64 encode response text to avoid header issues with newlines/special chars
        response_text_b64 = base64.b64encode(response_text.encode('utf-8')).decode('utf-8')

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "X-Response-Text": response_text_b64,  # Base64 encoded to avoid header issues
                "X-Emotion": chat_request.emotion
            }
        )
    except Exception as e:
        # If voice fails, return text response as fallback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating voice: {str(e)}"
        )


@router.post("/text-to-speech")
def text_to_speech(
    request: TextToSpeechRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Convert any text to speech with emotion
    Useful for reading out quiz results, feedback, etc.
    """
    try:
        emotion_settings = voice_service.get_emotional_voice_settings(request.emotion)
        audio_bytes = voice_service.text_to_speech(
            text=request.text,
            **emotion_settings
        )

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating speech: {str(e)}"
        )
