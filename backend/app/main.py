import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database import Base, engine
from app.routers.auth import router as auth_router
from app.routers.patients import router as patients_router
from app.routers.appointments import router as appointments_router
from app.routers.chatbot import router as chatbot_router
from app.routers.rag import router as rag_router
from app.routers.upload import router as upload_router
from app.routers.users import router as users_router
import app.models  # Import all models to ensure they are registered

from starlette.exceptions import HTTPException as StarletteHTTPException

# Create all database tables on startup.
# SQLAlchemy reads all registered models and creates the corresponding tables
# in the PostgreSQL database if they don't already exist.
Base.metadata.create_all(bind=engine)

# Create the uploads directory if it doesn't exist
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Initialize the FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for the Hospital Information Assistant application.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS so the React frontend (localhost:5173) can make requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files as static files at /uploads/<filename>
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Register all API routers under the /api/v1 prefix
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(patients_router, prefix=settings.API_V1_STR)
app.include_router(appointments_router, prefix=settings.API_V1_STR)
app.include_router(chatbot_router, prefix=settings.API_V1_STR)
app.include_router(rag_router, prefix=settings.API_V1_STR)
app.include_router(upload_router, prefix=settings.API_V1_STR)


@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    """
    Catches any unhandled exceptions and returns a clean 500 JSON response
    instead of an HTML error traceback, but allows HTTPExceptions to propagate their status.
    """
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact support."}
    )


@app.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Health check",
    tags=["Health"]
)
def health_check():
    """
    Simple health check endpoint to verify the backend is running.
    Returns the project name and version.
    """
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": "1.0.0"
    }
