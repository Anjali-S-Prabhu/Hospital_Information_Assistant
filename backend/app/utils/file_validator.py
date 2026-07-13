from fastapi import HTTPException, UploadFile, status
import os

# Define security boundaries for file uploads
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".docx"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # Limit files to 5MB

def validate_uploaded_file(file: UploadFile) -> None:
    """
    Why it is written:
    To validate incoming files (size, type, content presence) uploaded by clinical 
    staff before transmitting them to AWS S3, shielding the bucket from security 
    hazards and oversized uploads.

    What it does:
    Reads file size, checks the extension against the whitelist, verifies the file 
    is not empty, and raises appropriate HTTP 400 Bad Request exceptions if validation fails.

    Inputs:
    - file (UploadFile): The file wrapper object from FastAPI.

    Outputs:
    - None (raises HTTPException if invalid; exits cleanly if valid).
    """
    # 1. Validate empty files
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a valid filename."
        )

    # 2. Validate file extension/type
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        allowed_list = ", ".join(ALLOWED_EXTENSIONS)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {allowed_list}"
        )

    # 3. Validate file size
    # Fastapi's UploadFile provides a temporary file wrapper. We seek to end to check size.
    try:
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        # Reset file cursor position to the beginning so that subsequent read/upload calls work.
        file.file.seek(0)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read file contents for size validation: {str(e)}"
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
            detail=f"File exceeds maximum size limit of {max_mb}MB."
        )
