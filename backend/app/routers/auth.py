from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserOut, Token
from app.services.auth_service import register_user, authenticate_user
from app.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post(
    "/register", 
    response_model=UserOut, 
    status_code=status.HTTP_201_CREATED,
    summary="Register a new hospital staff member",
    description="Registers a new staff member (doctor, nurse, or support staff) into the database."
)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Why it is written:
    To expose an endpoint for registering new users.

    What it does:
    Delegates registration business logic to auth_service.register_user.

    Inputs:
    - user_in (UserCreate): The registration inputs (email, full name, role, password).
    - db (Session): Injected database session.

    Outputs:
    - UserOut: The registered user profile without sensitive fields.
    """
    return register_user(db, user_in)

@router.post(
    "/login", 
    response_model=Token, 
    status_code=status.HTTP_200_OK,
    summary="Log in and retrieve JWT access token",
    description="Logs in a registered user using email and password, returning a JWT token for authorization."
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Why it is written:
    To authenticate users and return a JWT access token for subsequent API calls.

    What it does:
    Extracts email (username field) and password from the form payload, authenticates 
    using auth_service.authenticate_user, and returns the token.

    Inputs:
    - form_data (OAuth2PasswordRequestForm): FastAPI's dependency to handle OAuth2 password flow format.
    - db (Session): Injected database session.

    Outputs:
    - Token: The JSON Web Token object containing access token and type.
    """
    access_token = authenticate_user(db, form_data.username, form_data.password)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get(
    "/me", 
    response_model=UserOut, 
    status_code=status.HTTP_200_OK,
    summary="Get current logged in user details",
    description="Returns the profile of the currently logged-in user."
)
def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Why it is written:
    To provide a profile fetch route that frontend apps can call to identify who is logged in.

    What it does:
    Returns the user model instance fetched during authentication.

    Inputs:
    - current_user (User): The authenticated active user session.

    Outputs:
    - UserOut: The profile details of the user.
    """
    return current_user
