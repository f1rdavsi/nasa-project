"""
Database configuration and session management.
"""
import os
from typing import Generator
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Default to SQLite
    cache_db_path = os.getenv("OPENAQ_CACHE_DB", "./data/openaq_cache.db")
    # Ensure directory exists
    os.makedirs(os.path.dirname(cache_db_path), exist_ok=True)
    DATABASE_URL = f"sqlite:///{cache_db_path}"

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("LOG_LEVEL", "INFO") == "DEBUG",
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)


def create_db_and_tables():
    """Create database tables."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Get database session."""
    with Session(engine) as session:
        yield session
