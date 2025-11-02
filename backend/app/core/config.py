from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "CortexIQ"

    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Gemini API
    GEMINI_API_KEY: str

    # Snowflake (optional - for vector search and Cortex AI)
    SNOWFLAKE_ACCOUNT: Optional[str] = None
    SNOWFLAKE_USER: Optional[str] = None
    SNOWFLAKE_PASSWORD: Optional[str] = None
    SNOWFLAKE_DATABASE: str = "CORTEXIQ"
    SNOWFLAKE_SCHEMA: str = "PUBLIC"
    SNOWFLAKE_WAREHOUSE: str = "COMPUTE_WH"
    SNOWFLAKE_USE_CORTEX: bool = True

    # 11 Labs (optional)
    ELEVENLABS_API_KEY: Optional[str] = None

    # DigitalOcean Gradient AI (for hackathon prize!)
    # NOTE: DO Gradient AI not public yet. Use OpenRouter as proxy for demo.
    # When DO releases API, update endpoint to: https://api.digitalocean.com/v2/ai
    DIGITALOCEAN_API_TOKEN: Optional[str] = None
    DIGITALOCEAN_GRADIENT_ENDPOINT: str = "https://openrouter.ai/api/v1"  # Proxy for demo
    DIGITALOCEAN_USE_GPU: bool = True

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 500
    UPLOAD_DIR: str = "./uploads"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
