from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Classroom AI"

    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Gemini API
    GEMINI_API_KEY: str

    # Snowflake
    SNOWFLAKE_ACCOUNT: str
    SNOWFLAKE_USER: str
    SNOWFLAKE_PASSWORD: str
    SNOWFLAKE_DATABASE: str = "classroom_ai"
    SNOWFLAKE_SCHEMA: str = "public"
    SNOWFLAKE_WAREHOUSE: str = "compute_wh"

    # 11 Labs (optional)
    ELEVEN_LABS_API_KEY: Optional[str] = None

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 500
    UPLOAD_DIR: str = "./uploads"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
