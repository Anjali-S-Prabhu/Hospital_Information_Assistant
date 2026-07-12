import os
import uuid
import logging
import shutil
from typing import Optional
from fastapi import HTTPException, UploadFile, status

logger = logging.getLogger(__name__)

# Local storage directory — files are saved in backend/uploads/
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

# Allowed file types and max size
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".docx", ".txt"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def get_upload_dir() -> str:
    """Creates the upload directory if it doesn't exist and returns the path."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    return UPLOAD_DIR


def save_file_locally(file_obj, original_filename: str) -> tuple[str, str]:
    """
    Saves an uploaded file to the local uploads/ directory.

    Generates a unique filename to prevent collisions.

    Inputs:
    - file_obj: The binary file stream from FastAPI UploadFile.
    - original_filename (str): The original name of the uploaded file.

    Outputs:
    - tuple[str, str]: (unique_filename, local_file_path)
    """
    upload_dir = get_upload_dir()
    ext = os.path.splitext(original_filename)[1].lower()
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    try:
        with open(file_path, "wb") as out_file:
            shutil.copyfileobj(file_obj, out_file)
        logger.info(f"File saved locally: {file_path}")
        return unique_filename, file_path
    except Exception as e:
        logger.error(f"Failed to save file locally: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )


def delete_local_file(file_url: str) -> None:
    """
    Deletes a file from the local uploads/ directory.

    Inputs:
    - file_url (str): The stored file URL/path (just the filename portion).

    Outputs:
    - None
    """
    try:
        # file_url is stored as "/uploads/filename.ext" or just the filename
        filename = os.path.basename(file_url)
        file_path = os.path.join(get_upload_dir(), filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted local file: {file_path}")
    except Exception as e:
        logger.error(f"Failed to delete local file: {e}")


def validate_uploaded_file(file: UploadFile) -> None:
    """
    Validates file extension, presence, and size before saving.

    Inputs:
    - file (UploadFile): FastAPI file wrapper.

    Outputs:
    - None (raises HTTPException on failure)
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a valid filename."
        )

    _, ext = os.path.splitext(file.filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(ALLOWED_EXTENSIONS)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed types: {allowed}"
        )

    # Check file size
    try:
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read file: {str(e)}"
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content is empty."
        )

    if file_size > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds the {max_mb}MB size limit."
        )
