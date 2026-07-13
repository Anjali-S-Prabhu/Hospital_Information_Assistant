from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentOut, AppointmentDetailOut
from app.services import appointment_service
from app.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)

@router.post(
    "/", 
    response_model=AppointmentOut, 
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a new appointment",
    description="Schedules a consultation mapping a patient to a doctor user at a designated datetime."
)
def create(
    appointment_in: AppointmentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To expose an endpoint for scheduling appointments.

    What it does:
    Authenticates user, validates doctor and patient exists, then saves appointment.

    Inputs:
    - appointment_in (AppointmentCreate): Fields representing the scheduled appointment.
    - db (Session): Database session.
    - current_user (User): Authenticated user.

    Outputs:
    - AppointmentOut: The created appointment record details.
    """
    return appointment_service.create_appointment(db, appointment_in)

@router.get(
    "/", 
    response_model=List[AppointmentDetailOut], 
    status_code=status.HTTP_200_OK,
    summary="List all scheduled appointments",
    description="Retrieves a list of appointments. Supports optional filtering by doctor ID or patient ID."
)
def list_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    doctor_id: Optional[int] = Query(None, description="Filter by assigned doctor ID"),
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To support loading calendar or listings of scheduled appointments, optionally filtered.

    What it does:
    Retrieves matching appointments with preloaded nested doctor and patient details.

    Inputs:
    - skip (int): Offset records.
    - limit (int): Max records.
    - doctor_id (Optional[int]): Filter query for doctor.
    - patient_id (Optional[int]): Filter query for patient.
    - db (Session): Database session.

    Outputs:
    - List[AppointmentDetailOut]: List of appointments containing preloaded user/patient metadata.
    """
    return appointment_service.get_appointments(
        db, 
        skip=skip, 
        limit=limit, 
        doctor_id=doctor_id, 
        patient_id=patient_id
    )

@router.get(
    "/{appointment_id}", 
    response_model=AppointmentDetailOut, 
    status_code=status.HTTP_200_OK,
    summary="Get appointment details",
    description="Loads a specific appointment record along with full doctor/patient sub-models."
)
def get_by_id(
    appointment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To display full details of a specific appointment on the client.

    What it does:
    Fetches the appointment and returns it. Raises 404 if missing.

    Inputs:
    - appointment_id (int): Primary key.
    - db (Session): Database session.

    Outputs:
    - AppointmentDetailOut: Detailed appointment record.
    """
    return appointment_service.get_appointment(db, appointment_id)

@router.put(
    "/{appointment_id}", 
    response_model=AppointmentOut, 
    status_code=status.HTTP_200_OK,
    summary="Update an appointment",
    description="Reschedules an appointment or updates its status (e.g. cancelled/completed) or notes."
)
def update(
    appointment_id: int, 
    appointment_in: AppointmentUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To expose an endpoint for modifications (rescheduling, cancellations, notes logging).

    What it does:
    Authenticates, validates inputs, and updates fields.

    Inputs:
    - appointment_id (int): Primary key ID.
    - appointment_in (AppointmentUpdate): Updatable fields.
    - db (Session): Database session.

    Outputs:
    - AppointmentOut: The updated appointment object.
    """
    return appointment_service.update_appointment(db, appointment_id, appointment_in)

@router.delete(
    "/{appointment_id}", 
    response_model=AppointmentOut, 
    status_code=status.HTTP_200_OK,
    summary="Delete an appointment",
    description="Removes a scheduled appointment record completely."
)
def delete(
    appointment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To allow staff to remove an appointment record.

    What it does:
    Deletes the appointment record. Raises 404 if missing.

    Inputs:
    - appointment_id (int): ID of the appointment.
    - db (Session): Database session.

    Outputs:
    - AppointmentOut: The deleted appointment details.
    """
    return appointment_service.delete_appointment(db, appointment_id)
