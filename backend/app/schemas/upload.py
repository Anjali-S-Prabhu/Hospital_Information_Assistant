from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class UploadOut(BaseModel):
    """
    Pydantic schema representing the file metadata response returned after a successful 
    upload and database record instantiation.
    """
    id: int = Field(..., description="The unique database ID of the file record.")
    file_name: str = Field(..., description="The original filename of the uploaded file.")
    file_url: str = Field(..., description="The public AWS S3 URL to access the uploaded asset.")
    upload_date: datetime = Field(..., description="The timestamp when the file was uploaded.")
    patient_id: Optional[int] = Field(None, description="The ID of the patient this file is associated with.")
    user_id: int = Field(..., description="The ID of the staff user who uploaded this file.")

    # Enable reading data from arbitrary SQLAlchemy objects
    model_config = {
        "from_attributes": True
    }
