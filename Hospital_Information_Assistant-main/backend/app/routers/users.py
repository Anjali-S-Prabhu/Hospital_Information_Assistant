from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut
from app.dependencies import get_current_active_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get(
    "/",
    response_model=List[UserOut],
    status_code=status.HTTP_200_OK,
    summary="List all registered staff users",
    description="Returns a list of all hospital staff accounts. Used by the appointment form to pick a doctor."
)
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[str] = Query(None, description="Filter by role (doctor, nurse, admin, staff)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetches all hospital staff user accounts.

    Inputs:
    - skip (int): Number of records to skip (for pagination).
    - limit (int): Maximum number of records to return.
    - role (Optional[str]): Filter by role (e.g., 'doctor').
    - db (Session): Database session.
    - current_user (User): Authenticated active user.

    Outputs:
    - List[UserOut]: List of user profile records.
    """
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.offset(skip).limit(limit).all()


@router.get(
    "/{user_id}",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
    summary="Get a specific user by ID",
    description="Returns the profile of a specific staff member."
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetches a single user by their ID.

    Inputs:
    - user_id (int): The user's primary key.
    - db (Session): Database session.
    - current_user (User): Authenticated active user.

    Outputs:
    - UserOut: The user's profile data.
    """
    from fastapi import HTTPException
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
    return user
