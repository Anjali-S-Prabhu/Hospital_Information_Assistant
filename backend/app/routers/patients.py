from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.patient import PatientCreate, PatientUpdate, PatientOut
from app.services import patient_service
from app.dependencies import get_current_active_user, RoleChecker
from app.models.user import User

router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)

@router.post(
    "/", 
    response_model=PatientOut, 
    status_code=status.HTTP_201_CREATED,
    summary="Create a new patient record",
    description="Registers a new patient with contact and demographic details."
)
def create(
    patient_in: PatientCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To expose an endpoint for registering a new patient profile.

    What it does:
    Authenticates the request, then calls patient_service.create_patient.

    Inputs:
    - patient_in (PatientCreate): Patient payload.
    - db (Session): Injected database session.
    - current_user (User): Current logged-in active user.

    Outputs:
    - PatientOut: The created patient record.
    """
    return patient_service.create_patient(db, patient_in)

@router.get(
    "/", 
    response_model=List[PatientOut], 
    status_code=status.HTTP_200_OK,
    summary="List patient records",
    description="Retrieves a list of patients, optionally filtered by search text."
)
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Search by name, email, or contact number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To expose a searchable list of patients for display in the client dashboard.

    What it does:
    Fetches matching patient profiles with offset pagination.

    Inputs:
    - skip (int): Offset records.
    - limit (int): Max records.
    - search (Optional[str]): Search filter query.
    - db (Session): Database session.
    - current_user (User): Current logged-in user.

    Outputs:
    - List[PatientOut]: List of patient profiles.
    """
    return patient_service.get_patients(db, skip=skip, limit=limit, search=search)

@router.get(
    "/{patient_id}", 
    response_model=PatientOut, 
    status_code=status.HTTP_200_OK,
    summary="Get patient details",
    description="Retrieves the detailed record of a patient by ID."
)
def get_by_id(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To expose patient profile details for a dedicated detail screen.

    What it does:
    Fetches the patient record. Raises a 404 error if not found.

    Inputs:
    - patient_id (int): Primary key ID of the patient.
    - db (Session): Database session.
    - current_user (User): Authenticated user.

    Outputs:
    - PatientOut: The matching patient details.
    """
    return patient_service.get_patient(db, patient_id)

@router.put(
    "/{patient_id}", 
    response_model=PatientOut, 
    status_code=status.HTTP_200_OK,
    summary="Update a patient record",
    description="Updates demographic or medical summary fields of an existing patient profile."
)
def update(
    patient_id: int, 
    patient_in: PatientUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To expose an endpoint allowing staff members to modify a patient's information.

    What it does:
    Validates, updates, and saves updated fields.

    Inputs:
    - patient_id (int): ID of the patient.
    - patient_in (PatientUpdate): Input schemas containing fields to update.
    - db (Session): Database session.

    Outputs:
    - PatientOut: The updated patient database object.
    """
    return patient_service.update_patient(db, patient_id, patient_in)

@router.delete(
    "/{patient_id}", 
    response_model=PatientOut, 
    status_code=status.HTTP_200_OK,
    summary="Delete a patient record",
    description="Deletes a patient profile. Accessible only to administrators or doctors."
)
def delete(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff"]))
):
    """
    Why it is written:
    To expose a secure endpoint to delete a patient profile. Enforces high-level RBAC.

    What it does:
    Authenticates administrator or doctor privileges and executes deletion.

    Inputs:
    - patient_id (int): ID of the patient.
    - db (Session): Database session.
    - current_user (User): Authenticated high-privilege user.

    Outputs:
    - PatientOut: The deleted patient record.
    """
    return patient_service.delete_patient(db, patient_id)
