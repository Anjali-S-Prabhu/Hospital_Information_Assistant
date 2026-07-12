from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    """
    Base Pydantic schema containing fields shared by all User-related schemas.
    """
    email: EmailStr = Field(..., description="The unique login email address of the staff member.")
    full_name: Optional[str] = Field(None, description="The full name of the staff member.")
    role: str = Field(default="staff", description="The role of the user (e.g., admin, doctor, nurse, staff).")
    is_active: bool = Field(default=True, description="Indicates whether the user account is active.")

class UserCreate(UserBase):
    """
    Pydantic schema used for creating a new user (registration).
    Requires a password in addition to the base fields.
    """
    password: str = Field(..., min_length=6, description="The secure password for the user, minimum 6 characters.")

class UserUpdate(BaseModel):
    """
    Pydantic schema used for updating user details. All fields are optional.
    """
    email: Optional[EmailStr] = Field(None, description="Updated email address.")
    full_name: Optional[str] = Field(None, description="Updated full name.")
    role: Optional[str] = Field(None, description="Updated role.")
    is_active: Optional[bool] = Field(None, description="Updated active status.")
    password: Optional[str] = Field(None, min_length=6, description="Updated password (if changing password).")

class UserOut(UserBase):
    """
    Pydantic schema returned in API responses to represent a user.
    Excludes sensitive fields like hashed password.
    """
    id: int
    created_at: datetime
    updated_at: datetime

    # Enable ORM mode for compatibility with SQLAlchemy model instances
    model_config = {
        "from_attributes": True
    }

class Token(BaseModel):
    """
    Response schema returned upon successful authentication.
    Contains the JWT access token and its type.
    """
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """
    Internal schema representing the payload extracted from a decoded JWT.
    """
    email: Optional[str] = None
    role: Optional[str] = None
