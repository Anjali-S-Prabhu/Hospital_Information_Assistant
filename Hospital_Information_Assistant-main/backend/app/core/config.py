# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from typing import Any

class Settings(BaseSettings):
    """
    Settings class to manage application configuration and environment variables.
    It automatically reads environment variables or loads them from a .env file.
    """
    
    # Configuration to read from .env file
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )

    # FastAPI Configuration
    PROJECT_NAME: str = Field(default="Hospital Information Assistant")
    API_V1_STR: str = Field(default="/api/v1")

    # Security & JWT Token Config
    SECRET_KEY: str
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)

    # PostgreSQL (Neon Database) URL
    DATABASE_URL: str

    # Groq LLM API Key
    GROQ_API_KEY: str

    # Qdrant Vector DB Cloud Settings
    QDRANT_URL: str
    QDRANT_API_KEY: str


    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: Any) -> Any:
        """
        Why it is written:
        To ensure the database URL is present and to handle potential SQLAlchemy 
        compatibility issues (e.g. replacing 'postgres://' with 'postgresql://').

        What it does:
        Checks the input string and formats it properly as a PostgreSQL URL.

        Inputs:
        - v: The raw database connection string.

        Outputs:
        - The validated/modified connection string.
        """
        if not isinstance(v, str):
            raise ValueError("DATABASE_URL must be a string")
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

# Instantiate the settings object to be imported across the application
settings = Settings()
