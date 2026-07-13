from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate

def create_patient(db: Session, patient_in: PatientCreate) -> Patient:
    """
    Why it is written:
    To add a new patient record to the database after validating that the patient's
    email (if provided) is unique.

    What it does:
    Checks if a patient with the same email exists. If so, raises a 409 Conflict.
    Otherwise, initializes a Patient model instance, adds it to the session, commits, and returns it.

    Inputs:
    - db (Session): The active database session.
    - patient_in (PatientCreate): Schema containing demographic and medical details.

    Outputs:
    - Patient: The newly created Patient database instance.
    """
    if patient_in.email:
        existing_patient = db.query(Patient).filter(Patient.email == patient_in.email).first()
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A patient with this email address already exists"
            )
            
    db_patient = Patient(
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        contact_number=patient_in.contact_number,
        email=patient_in.email,
        address=patient_in.address,
        medical_history=patient_in.medical_history
    )
    
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def get_patient(db: Session, patient_id: int) -> Patient:
    """
    Why it is written:
    To retrieve a specific patient record by its database primary key.

    What it does:
    Queries the Patient model by ID. Raises a 404 Not Found exception if no record matches.

    Inputs:
    - db (Session): The database session.
    - patient_id (int): The ID of the patient to find.

    Outputs:
    - Patient: The patient model instance.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    return patient

def get_patients(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None
) -> List[Patient]:
    """
    Why it is written:
    To support listing patient records in the dashboard, with optional query filters and pagination.

    What it does:
    Queries the patients table, optionally searching names, emails, or phone numbers using LIKE queries,
    applies pagination parameters, and returns the list.

    Inputs:
    - db (Session): The database session.
    - skip (int): Number of records to skip.
    - limit (int): Maximum number of records to return.
    - search (Optional[str]): A keyword query to search first_name, last_name, or contact_number.

    Outputs:
    - List[Patient]: A list of matching patient database objects.
    """
    query = db.query(Patient)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Patient.first_name.ilike(search_filter),
                Patient.last_name.ilike(search_filter),
                Patient.contact_number.ilike(search_filter),
                Patient.email.ilike(search_filter)
            )
        )
    return query.offset(skip).limit(limit).all()

def update_patient(db: Session, patient_id: int, patient_in: PatientUpdate) -> Patient:
    """
    Why it is written:
    To update an existing patient's details selectively.

    What it does:
    Fetches the patient record (raising 404 if not found). Updates provided fields, 
    commits changes to the database, and returns the modified object.

    Inputs:
    - db (Session): The database session.
    - patient_id (int): ID of the patient to update.
    - patient_in (PatientUpdate): Schema containing fields to update.

    Outputs:
    - Patient: The updated patient database object.
    """
    db_patient = get_patient(db, patient_id)
    
    update_data = patient_in.model_dump(exclude_unset=True)
    
    # Check email conflict if email is updated
    if "email" in update_data and update_data["email"] != db_patient.email:
        existing = db.query(Patient).filter(Patient.email == update_data["email"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A patient with this email address already exists"
            )
            
    for field, value in update_data.items():
        setattr(db_patient, field, value)
        
    db.commit()
    db.refresh(db_patient)
    return db_patient

def delete_patient(db: Session, patient_id: int) -> Patient:
    """
    Why it is written:
    To permanently remove a patient profile from the database.

    What it does:
    Fetches the patient record (raising 404 if not found). Deletes the record from the session, 
    commits the deletion, and returns the deleted object.

    Inputs:
    - db (Session): The database session.
    - patient_id (int): ID of the patient to delete.

    Outputs:
    - Patient: The deleted patient database object.
    """
    db_patient = get_patient(db, patient_id)
    db.delete(db_patient)
    db.commit()
    return db_patient
