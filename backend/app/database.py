# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator
from app.core.config import settings

# Create the SQLAlchemy engine to manage connections to the Neon PostgreSQL database.
# We enable pool_pre_ping=True to prevent issues with stale connections, which is 
# especially helpful with serverless databases like Neon.
# Support SQLite databases (helpful for local student development fallback)
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Create a session factory to generate database session instances for individual requests.
# autoflush=False ensures changes aren't written to the database until explicitly committed.
# autocommit=False prevents sessions from committing changes automatically.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declarative base class that our models will inherit from to be mapped to DB tables.
Base = declarative_base()

def get_db() -> Generator:
    """
    Why it is written:
    To provide a database session dependency for FastAPI endpoints, ensuring that 
    the session is automatically closed once the request lifecycle is complete.

    What it does:
    Yields an active SQLAlchemy Session and guarantees its cleanup inside a try-finally block.

    Inputs:
    - None

    Outputs:
    - Yields a sqlalchemy.orm.Session object.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
