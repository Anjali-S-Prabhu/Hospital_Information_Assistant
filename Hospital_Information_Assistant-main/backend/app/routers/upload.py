from fastapi import APIRouter, Depends, status, File, Form, UploadFile, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import os
from app.database import get_db
from app.models.uploaded_file import UploadedFile
from app.models.patient import Patient
from app.models.user import User
from app.schemas.upload import UploadOut
from app.services.local_storage_service import save_file_locally, delete_local_file, validate_uploaded_file
from app.dependencies import get_current_active_user

router = APIRouter(
    prefix="/upload",
    tags=["File Uploads"]
)

@router.post(
    "",
    response_model=UploadOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a patient file or clinical document",
    description="Validates and saves the uploaded file to local storage, then records metadata in the database."
)
def upload_file(
    file: UploadFile = File(..., description="The file to upload (PDF, image, DOCX, or TXT)."),
    patient_id: Optional[int] = Form(None, description="Optional patient ID to link this file to."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Handles file uploads and stores them locally.

    Inputs:
    - file (UploadFile): The uploaded file stream.
    - patient_id (Optional[int]): The patient to associate with this file.
    - db (Session): Database session.
    - current_user (User): The logged-in user performing the upload.

    Outputs:
    - UploadOut: Metadata record of the uploaded file.
    """
    # 1. Validate file type and size
    validate_uploaded_file(file)

    # 2. Check patient exists if ID is provided
    if patient_id is not None:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} does not exist"
            )

    # 3. Save file to local storage
    unique_filename, _ = save_file_locally(file.file, file.filename)
    file_url = f"/uploads/{unique_filename}"

    # 4. Save metadata to database
    db_file = UploadedFile(
        file_name=file.filename,
        file_url=file_url,
        patient_id=patient_id,
        user_id=current_user.id
    )

    try:
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        return db_file
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file record: {str(e)}"
        )


@router.get(
    "/list",
    response_model=List[UploadOut],
    status_code=status.HTTP_200_OK,
    summary="List all uploaded files",
    description="Returns a list of all uploaded file records from the database."
)
def list_files(
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists all file records optionally filtered by patient.

    Inputs:
    - patient_id (Optional[int]): Filter files by patient.
    - db (Session): Database session.
    - current_user (User): Authenticated user.

    Outputs:
    - List[UploadOut]: List of file metadata records.
    """
    query = db.query(UploadedFile)
    if patient_id is not None:
        query = query.filter(UploadedFile.patient_id == patient_id)
    return query.order_by(UploadedFile.upload_date.desc()).all()


@router.get(
    "/{file_id}",
    response_model=UploadOut,
    status_code=status.HTTP_200_OK,
    summary="Get file metadata by ID",
    description="Returns metadata for a specific uploaded file."
)
def get_file_details(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetches a single file record by its primary key ID.

    Inputs:
    - file_id (int): The file's primary key.
    - db (Session): Database session.
    - current_user (User): Authenticated user.

    Outputs:
    - UploadOut: File metadata record.
    """
    db_file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with ID {file_id} not found."
        )
    return db_file


@router.delete(
    "/{file_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete an uploaded file",
    description="Deletes the file from local storage and removes the database record."
)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Deletes a file from local disk and its database record.

    Inputs:
    - file_id (int): The file's primary key.
    - db (Session): Database session.
    - current_user (User): Authenticated user.

    Outputs:
    - dict: Confirmation message.
    """
    db_file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with ID {file_id} not found."
        )

    # Delete from local storage
    delete_local_file(db_file.file_url)

    # Delete database record
    try:
        db.delete(db_file)
        db.commit()
        return {"message": f"File '{db_file.file_name}' deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file record: {str(e)}"
        )
