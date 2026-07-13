from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional

class PatientBase(BaseModel):
    """
    Base Pydantic schema containing properties common to patient profiles.
    """
    first_name: str = Field(..., description="First name of the patient.")
    last_name: str = Field(..., description="Last name of the patient.")
    date_of_birth: date = Field(..., description="Date of birth of the patient (YYYY-MM-DD).")
    gender: Optional[str] = Field(None, description="Gender of the patient (e.g., Male, Female, Other).")
    contact_number: Optional[str] = Field(None, description="Primary contact phone number.")
    email: Optional[EmailStr] = Field(None, description="Email address for notifications.")
    address: Optional[str] = Field(None, description="Home address of the patient.")
    medical_history: Optional[str] = Field(None, description="Brief summaries of chronic conditions, allergies, etc.")

class PatientCreate(PatientBase):
    """
    Pydantic schema used for creating a new patient record.
    """
    pass

class PatientUpdate(BaseModel):
    """
    Pydantic schema used to update an existing patient record. All fields are optional.
    """
    first_name: Optional[str] = Field(None, description="First name of the patient.")
    last_name: Optional[str] = Field(None, description="Last name of the patient.")
    date_of_birth: Optional[date] = Field(None, description="Date of birth of the patient (YYYY-MM-DD).")
    gender: Optional[str] = Field(None, description="Gender of the patient.")
    contact_number: Optional[str] = Field(None, description="Primary contact phone number.")
    email: Optional[EmailStr] = Field(None, description="Email address.")
    address: Optional[str] = Field(None, description="Home address.")
    medical_history: Optional[str] = Field(None, description="Medical history summary.")

class PatientOut(PatientBase):
    """
    Pydantic schema returned in API responses representing a patient profile.
    """
    id: int
    created_at: datetime
    updated_at: datetime

    # Enable reading data from arbitrary SQLAlchemy attributes / classes
    model_config = {
        "from_attributes": True
    }
