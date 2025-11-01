from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
import os
import shutil
from datetime import datetime

from app.db.base import get_db
from app.models.user import User
from app.models.course import Course
from app.models.upload import Upload
from app.api.auth import get_current_user
from app.core.config import settings
from app.services.gemini_service import gemini_service

router = APIRouter()


# Pydantic schemas
class UploadResponse(BaseModel):
    id: str
    course_id: str
    file_name: str
    file_type: str
    status: str
    created_at: str
    text_content: Optional[str] = None
    transcript: Optional[str] = None
    timestamps: Optional[List[dict]] = None
    summary: Optional[str] = None
    video_duration_seconds: Optional[int] = None

    class Config:
        from_attributes = True


def process_upload_background(upload_id: str, file_path: str, file_type: str, db_session):
    """Background task to process uploaded file"""
    try:
        upload = db_session.query(Upload).filter(Upload.id == upload_id).first()

        if file_type == 'pdf':
            # Extract text from PDF
            text = gemini_service.extract_pdf_text(file_path)
            upload.text_content = text

            # Generate embeddings for text chunks
            chunks = gemini_service.chunk_text(text, chunk_size=500)
            embeddings_data = []

            for chunk in chunks:
                if chunk.strip():  # Skip empty chunks
                    try:
                        embedding = gemini_service.generate_embeddings(chunk)
                        embeddings_data.append({
                            "chunk": chunk,
                            "embedding": embedding
                        })
                    except Exception as e:
                        print(f"Error generating embedding for chunk: {str(e)}")

            upload.embeddings = embeddings_data
            upload.status = 'ready'

        elif file_type == 'video':
            # Process video with Gemini
            result = gemini_service.process_video(file_path)
            upload.transcript = result.get('transcript')
            upload.timestamps = result.get('timestamps', [])
            upload.summary = result.get('summary')
            upload.video_duration_seconds = result.get('duration_seconds')
            upload.text_content = result.get('transcript')  # Use transcript as text content

            # Generate embeddings for transcript chunks
            if upload.text_content:
                chunks = gemini_service.chunk_text(upload.text_content, chunk_size=500)
                embeddings_data = []

                for chunk in chunks:
                    if chunk.strip():
                        try:
                            embedding = gemini_service.generate_embeddings(chunk)
                            embeddings_data.append({
                                "chunk": chunk,
                                "embedding": embedding
                            })
                        except Exception as e:
                            print(f"Error generating embedding for chunk: {str(e)}")

                upload.embeddings = embeddings_data

            upload.status = 'ready'

        upload.processed_at = datetime.utcnow()
        db_session.commit()

    except Exception as e:
        print(f"Error processing upload: {str(e)}")
        upload = db_session.query(Upload).filter(Upload.id == upload_id).first()
        if upload:
            upload.status = 'failed'
            db_session.commit()


@router.post("/{course_id}/uploads", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    course_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a PDF or video file to a course"""

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

    # Determine file type
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension == 'pdf':
        file_type = 'pdf'
        upload_dir = os.path.join(settings.UPLOAD_DIR, 'pdfs')
    elif file_extension in ['mp4', 'avi', 'mov', 'mkv', 'webm']:
        file_type = 'video'
        upload_dir = os.path.join(settings.UPLOAD_DIR, 'videos')
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload PDF or video files."
        )

    # Create upload directory if it doesn't exist
    os.makedirs(upload_dir, exist_ok=True)

    # Create new upload record
    new_upload = Upload(
        course_id=course_id,
        file_name=file.filename,
        file_path="",  # Will be set after saving file
        file_type=file_type,
        status='processing'
    )

    db.add(new_upload)
    db.commit()
    db.refresh(new_upload)

    # Save file
    file_path = os.path.join(upload_dir, f"{new_upload.id}_{file.filename}")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Update file path and size
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        new_upload.file_path = file_path
        new_upload.file_size_mb = file_size_mb
        db.commit()

    except Exception as e:
        # Clean up if file save fails
        db.delete(new_upload)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving file: {str(e)}"
        )

    # Process file in background
    background_tasks.add_task(
        process_upload_background,
        str(new_upload.id),
        file_path,
        file_type,
        db
    )

    return UploadResponse(
        id=str(new_upload.id),
        course_id=str(new_upload.course_id),
        file_name=new_upload.file_name,
        file_type=new_upload.file_type,
        status=new_upload.status,
        created_at=new_upload.created_at.isoformat()
    )


@router.get("/{course_id}/uploads", response_model=List[UploadResponse])
def get_uploads(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all uploads for a course"""

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

    uploads = db.query(Upload).filter(Upload.course_id == course_id).all()

    return [
        UploadResponse(
            id=str(upload.id),
            course_id=str(upload.course_id),
            file_name=upload.file_name,
            file_type=upload.file_type,
            status=upload.status,
            created_at=upload.created_at.isoformat(),
            text_content=upload.text_content if upload.file_type == 'pdf' else None,
            transcript=upload.transcript if upload.file_type == 'video' else None,
            timestamps=upload.timestamps if upload.file_type == 'video' else None,
            summary=upload.summary if upload.file_type == 'video' else None,
            video_duration_seconds=upload.video_duration_seconds
        )
        for upload in uploads
    ]


@router.get("/uploads/{upload_id}", response_model=UploadResponse)
def get_upload(
    upload_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific upload"""

    upload = db.query(Upload).filter(Upload.id == upload_id).first()

    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )

    # Verify user owns the course
    course = db.query(Course).filter(
        Course.id == upload.course_id,
        Course.user_id == current_user.id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )

    return UploadResponse(
        id=str(upload.id),
        course_id=str(upload.course_id),
        file_name=upload.file_name,
        file_type=upload.file_type,
        status=upload.status,
        created_at=upload.created_at.isoformat(),
        text_content=upload.text_content if upload.file_type == 'pdf' else None,
        transcript=upload.transcript if upload.file_type == 'video' else None,
        timestamps=upload.timestamps if upload.file_type == 'video' else None,
        summary=upload.summary if upload.file_type == 'video' else None,
        video_duration_seconds=upload.video_duration_seconds
    )


@router.delete("/uploads/{upload_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_upload(
    upload_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an upload"""

    upload = db.query(Upload).filter(Upload.id == upload_id).first()

    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )

    # Verify user owns the course
    course = db.query(Course).filter(
        Course.id == upload.course_id,
        Course.user_id == current_user.id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )

    # Delete file from disk
    try:
        if os.path.exists(upload.file_path):
            os.remove(upload.file_path)
    except Exception as e:
        print(f"Error deleting file: {str(e)}")

    # Delete from database
    db.delete(upload)
    db.commit()

    return None


@router.get("/{course_id}/files/{upload_id}")
def serve_file(
    course_id: UUID,
    upload_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Serve uploaded file for viewing"""

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

    # Get upload
    upload = db.query(Upload).filter(
        Upload.id == upload_id,
        Upload.course_id == course_id
    ).first()

    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Check if file exists
    if not os.path.exists(upload.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )

    # Return file
    media_type = "application/pdf" if upload.file_type == "pdf" else "video/mp4"

    return FileResponse(
        path=upload.file_path,
        media_type=media_type,
        filename=upload.file_name
    )
