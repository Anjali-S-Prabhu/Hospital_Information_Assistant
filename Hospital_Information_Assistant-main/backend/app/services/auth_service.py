from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password, create_access_token

def register_user(db: Session, user_in: UserCreate) -> User:
    """
    Why it is written:
    To handle user registration business logic, ensuring email uniqueness and 
    storing passwords as secure hashes.

    What it does:
    Queries the database to check if the email already exists. If it exists, raises a 409 Conflict exception.
    Otherwise, hashes the password, creates a User model instance, saves it to the DB, and returns it.

    Inputs:
    - db (Session): The active database session.
    - user_in (UserCreate): User registration input data schema.

    Outputs:
    - User: The newly created User model instance.
    """
    # Check if a user with this email is already registered
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists"
        )
    
    # Hash password and create database object
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, plain_password: str) -> str:
    """
    Why it is written:
    To validate credentials (email and password) and generate a JWT token on successful login.

    What it does:
    Searches the database for the user email. Verifies the password using bcrypt.
    If valid, returns a signed JWT token string. If invalid or user inactive, raises a 401 Unauthorized exception.

    Inputs:
    - db (Session): The database session.
    - email (str): The email provided at login.
    - plain_password (str): The password string provided at login.

    Outputs:
    - str: The generated JWT access token.
    """
    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    
    # Verify user exists and credentials are correct
    if not user or not verify_password(plain_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verify account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account has been deactivated"
        )
    
    # Generate token payload
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }
    
    # Return JWT token
    return create_access_token(data=token_payload)
