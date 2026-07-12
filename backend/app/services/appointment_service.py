from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate

def create_appointment(db: Session, appointment_in: AppointmentCreate) -> Appointment:
    """
    Why it is written:
    To schedule a new doctor-patient appointment, verifying that both the patient 
    and the doctor exist in their respective tables.

    What it does:
    Validates patient existence and doctor role. Creates an Appointment database model 
    instance, persists it to the database, and returns the newly scheduled record.

    Inputs:
    - db (Session): The active database session.
    - appointment_in (AppointmentCreate): Data parameters for scheduling the appointment.

    Outputs:
    - Appointment: The newly created Appointment model instance.
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == appointment_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {appointment_in.patient_id} not found"
        )

    # Verify doctor user exists
    doctor = db.query(User).filter(User.id == appointment_in.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with User ID {appointment_in.doctor_id} not found"
        )

    db_appointment = Appointment(
        patient_id=appointment_in.patient_id,
        doctor_id=appointment_in.doctor_id,
        appointment_date=appointment_in.appointment_date,
        reason=appointment_in.reason,
        status=appointment_in.status,
        notes=appointment_in.notes
    )

    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def get_appointment(db: Session, appointment_id: int) -> Appointment:
    """
    Why it is written:
    To fetch a specific appointment's details by its primary key ID.

    What it does:
    Queries the database for an appointment by ID. Raises 404 if not found.

    Inputs:
    - db (Session): The active database session.
    - appointment_id (int): The database ID of the appointment.

    Outputs:
    - Appointment: The found database Appointment object.
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment with ID {appointment_id} not found"
        )
    return appointment

def get_appointments(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    doctor_id: Optional[int] = None,
    patient_id: Optional[int] = None
) -> List[Appointment]:
    """
    Why it is written:
    To query appointments list with support for filtering by doctor, patient, and pagination.

    What it does:
    Builds a query, applies filters if optional IDs are provided, applies pagination offset/limit,
    and returns a list of appointments.

    Inputs:
    - db (Session): The database session.
    - skip (int): Offset records.
    - limit (int): Max records.
    - doctor_id (Optional[int]): Filter appointments assigned to this doctor.
    - patient_id (Optional[int]): Filter appointments booked for this patient.

    Outputs:
    - List[Appointment]: A list of matching appointment records.
    """
    query = db.query(Appointment)
    if doctor_id is not None:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if patient_id is not None:
        query = query.filter(Appointment.patient_id == patient_id)
    return query.offset(skip).limit(limit).all()

def update_appointment(
    db: Session, 
    appointment_id: int, 
    appointment_in: AppointmentUpdate
) -> Appointment:
    """
    Why it is written:
    To update an appointment's status, notes, date, or links.

    What it does:
    Retrieves the appointment (raising 404 if missing). Validates new foreign keys if updated.
    Applies updates, commits the database session, and returns the updated object.

    Inputs:
    - db (Session): The database session.
    - appointment_id (int): ID of the appointment to update.
    - appointment_in (AppointmentUpdate): Fields to update.

    Outputs:
    - Appointment: The updated appointment object.
    """
    db_appointment = get_appointment(db, appointment_id)
    update_data = appointment_in.model_dump(exclude_unset=True)

    # Validate updated patient ID if provided
    if "patient_id" in update_data:
        patient = db.query(Patient).filter(Patient.id == update_data["patient_id"]).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {update_data['patient_id']} not found"
            )

    # Validate updated doctor ID if provided
    if "doctor_id" in update_data:
        doctor = db.query(User).filter(User.id == update_data["doctor_id"]).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Doctor with User ID {update_data['doctor_id']} not found"
            )

    for field, value in update_data.items():
        setattr(db_appointment, field, value)

    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def delete_appointment(db: Session, appointment_id: int) -> Appointment:
    """
    Why it is written:
    To remove a scheduled appointment from the database.

    What it does:
    Fetches the appointment (raising 404 if missing), deletes it from the DB session, 
    commits, and returns the deleted object.

    Inputs:
    - db (Session): The database session.
    - appointment_id (int): ID of the appointment to delete.

    Outputs:
    - Appointment: The deleted database record.
    """
    db_appointment = get_appointment(db, appointment_id)
    db.delete(db_appointment)
    db.commit()
    return db_appointment
