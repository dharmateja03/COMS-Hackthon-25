from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "CortexIQ API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Import and include routers
from app.api import auth, courses, uploads, quiz, ai, analytics, ai_platforms
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(courses.router, prefix=f"{settings.API_V1_STR}/courses", tags=["courses"])
app.include_router(uploads.router, prefix=f"{settings.API_V1_STR}/courses", tags=["uploads"])
app.include_router(quiz.router, prefix=f"{settings.API_V1_STR}/quiz", tags=["quiz"])
app.include_router(ai.router, prefix=f"{settings.API_V1_STR}/ai", tags=["ai"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(ai_platforms.router, prefix=f"{settings.API_V1_STR}/ai-platforms", tags=["ai-platforms-hackathon-prize"])
