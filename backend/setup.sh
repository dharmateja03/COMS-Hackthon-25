#!/bin/bash

echo "🚀 Classroom AI - Backend Setup"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your API keys."
    echo ""
    echo "Required environment variables:"
    echo "  - DATABASE_URL"
    echo "  - SECRET_KEY (generate with: openssl rand -hex 32)"
    echo "  - GEMINI_API_KEY"
    echo "  - SNOWFLAKE_* (optional for now)"
    echo ""
    read -p "Press Enter after you've updated .env..."
fi

echo ""
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "🗄️  Initializing database..."
python init_db.py

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the backend server:"
echo "  uvicorn app.main:app --reload"
echo ""
echo "Or using Docker:"
echo "  docker-compose up -d"
echo ""
echo "API docs will be available at: http://localhost:8000/docs"
