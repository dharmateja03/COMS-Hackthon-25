"""
Database initialization script
Run this to create all tables
"""
from app.db.base import Base, engine
from app.models import *  # Import all models

def init_db():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    init_db()
