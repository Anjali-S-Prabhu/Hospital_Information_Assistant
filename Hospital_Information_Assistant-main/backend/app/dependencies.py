from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Callable
from app.database import get_db
from app.core.config import settings
from app.core.security import decode_access_token
from app.models.user import User

# OAuth2 scheme configures how Swagger UI and client apps authenticate.
# Clients send their JWT in the 'Authorization' header as a Bearer token.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Why it is written:
    To validate the bearer token sent in HTTP headers and retrieve the corresponding User object.
    Acts as a secure gatekeeper for authenticated routes.

    What it does:
    Decodes the JWT token, extracts the user's email, searches for the user in the database, 
    and raises an HTTP 401 Unauthorized exception if verification fails.

    Inputs:
    - db (Session): The active database session injected by get_db.
    - token (str): The JWT string extracted from the Authorization header by oauth2_scheme.

    Outputs:
    - User: The SQLAlchemy User model instance of the authenticated user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("email")
    if email is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Why it is written:
    To block authenticated users whose accounts have been deactivated by an administrator.

    What it does:
    Checks the 'is_active' boolean flag on the user instance. Raises a 400 Bad Request exception if inactive.

    Inputs:
    - current_user (User): The authenticated user instance injected by get_current_user.

    Outputs:
    - User: The active user model instance.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    return current_user

class RoleChecker:
    """
    A helper dependency class that enforces role-based access control (RBAC).
    Usage: Depends(RoleChecker(["admin", "doctor"]))
    """
    def __init__(self, allowed_roles: List[str]):
        """
        Stores the list of roles permitted to access the decorated endpoint.
        """
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_active_user)) -> User:
        """
        Why it is written:
        To perform authorization checks verifying that the user has an allowed role.

        What it does:
        Compares the current user's role against the permitted roles. Raises a 403 Forbidden exception if no match.

        Inputs:
        - current_user (User): The active authenticated user model.

        Outputs:
        - User: The authorized user model.
        """
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have the required permissions to perform this action"
            )
        return current_user
