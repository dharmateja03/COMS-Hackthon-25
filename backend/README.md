# CortexIQ - Backend

FastAPI backend for the CortexIQ learning platform.

## Setup

### Using Docker (Recommended)

```bash
# Copy environment file
cp .env.example .env

# Edit .env and add your API keys

# Start services
docker-compose up -d

# Backend will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Manual Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup PostgreSQL database
createdb classroom_ai

# Copy environment file
cp .env.example .env

# Edit .env with your database URL and API keys

# Run the server
uvicorn app.main:app --reload
```

## Environment Variables

See `.env.example` for required environment variables:
- Database connection
- JWT secret
- Gemini API key
- Snowflake credentials
- 11 Labs API key (optional)

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/          # API route handlers
│   ├── core/         # Core functionality (config, security)
│   ├── db/           # Database connection
│   ├── models/       # SQLAlchemy models
│   ├── services/     # Business logic
│   └── main.py       # FastAPI application
├── uploads/          # Uploaded files storage
├── requirements.txt
└── docker-compose.yml
```
