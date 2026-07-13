import boto3
import uuid
import os
import logging
from typing import Optional
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize AWS S3 Client using Boto3.
# This reads keys from settings loaded from environment variables.
try:
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
except Exception as e:
    logger.error(f"Failed to initialize S3 client: {str(e)}")
    s3_client = None

def upload_file_to_s3(file_obj, original_filename: str) -> str:
    """
    Why it is written:
    To transmit an validated clinical file stream into our AWS S3 bucket and 
    return its public HTTP URL.

    What it does:
    Generates a unique prefix key for the file to prevent file namespace overrides.
    Uploads the file object to S3, catches connection/credential errors, and formats
    the final public URL.

    Inputs:
    - file_obj: The file-like read stream.
    - original_filename (str): The raw name of the file.

    Outputs:
    - str: The public S3 URL of the uploaded asset.
    """
    if s3_client is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AWS S3 service is not initialized. Please verify AWS credentials."
        )

    # Clean filename and append a unique UUID to prevent overwriting assets
    ext = os.path.splitext(original_filename)[1]
    unique_key = f"uploads/{uuid.uuid4()}{ext}"

    try:
        # Uploading the file object to S3
        s3_client.upload_fileobj(
            file_obj,
            settings.AWS_BUCKET_NAME,
            unique_key,
            ExtraArgs={
                "ContentType": "application/octet-stream" # generic binary content
            }
        )
        
        # Build the standard S3 URL.
        # Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        file_url = f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_key}"
        return file_url

    except Exception as e:
        logger.error(f"AWS S3 Upload Failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file to storage: {str(e)}"
        )

def delete_file_from_s3(file_url: str) -> None:
    """
    Why it is written:
    To remove an asset from the AWS S3 bucket when a file record is deleted in PostgreSQL.

    What it does:
    Extracts the key path from the S3 URL, and calls delete_object on the S3 client.

    Inputs:
    - file_url (str): The full S3 URL of the file.

    Outputs:
    - None
    """
    if s3_client is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AWS S3 service is not initialized."
        )

    # Example URL: https://my-bucket.s3.us-east-1.amazonaws.com/uploads/some-uuid.pdf
    # We want to extract: uploads/some-uuid.pdf
    url_marker = f".amazonaws.com/"
    if url_marker not in file_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid S3 file URL format."
        )

    try:
        parts = file_url.split(url_marker)
        file_key = parts[1]
        
        s3_client.delete_object(
            Bucket=settings.AWS_BUCKET_NAME,
            Key=file_key
        )
    except Exception as e:
        logger.error(f"AWS S3 Delete Failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file from storage: {str(e)}"
        )
