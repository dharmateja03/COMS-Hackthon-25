# Classroom AI

**Co-authored by:** Dharmatejasamudrala & Keshav

## Purpose
An AI-powered learning platform that helps students study smarter through intelligent tutoring, automated quiz generation, and comprehensive analytics. Upload your course materials (PDFs/videos) and let AI help you learn more effectively.

## Tech Stack

### Frontend
- **React 19** - JavaScript library for building interactive user interfaces
- **Vite** - Fast build tool and dev server for modern web apps
- **TypeScript** - Type-safe JavaScript for fewer bugs
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **React Router** - Client-side routing for navigation
- **Recharts** - Data visualization library for analytics charts

### Backend
- **FastAPI** - High-performance Python web framework with automatic API docs
- **SQLAlchemy** - ORM for database interactions
- **PostgreSQL** - Relational database for storing users, courses, and quizzes
- **JWT** - Secure token-based authentication

### AI & Analytics
- **Google Gemini API** - Multimodal AI for video transcription, quiz generation, and intelligent tutoring
- **Snowflake** - Enterprise data warehouse for vector embeddings and analytics
- **11 Labs** - Voice synthesis for AI tutor speech

### Deployment
- **DigitalOcean** - Cloud hosting platform for app deployment
- **Docker** - Containerization for consistent environments

## Quick Start

### Backend
```bash
cd backend
docker-compose up -d
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 to start learning!
