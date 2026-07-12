from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Minimal representation of Patient/User for nested appointment data responses
class PatientMin(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str] = None
    contact_number: Optional[str] = None

    model_config = {"from_attributes": True}

class UserMin(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: str
    role: str

    model_config = {"from_attributes": True}

class AppointmentBase(BaseModel):
    """
    Base Pydantic schema containing properties common to appointments.
    """
    patient_id: int = Field(..., description="The ID of the patient.")
    doctor_id: int = Field(..., description="The ID of the doctor (staff user).")
    appointment_date: datetime = Field(..., description="The date and time of the appointment (ISO format).")
    reason: str = Field(..., max_length=255, description="The reason for scheduling the appointment.")
    status: str = Field(default="scheduled", description="Status of the appointment (scheduled, completed, cancelled).")
    notes: Optional[str] = Field(None, description="Optional diagnostic notes or clinical details.")

class AppointmentCreate(AppointmentBase):
    """
    Schema for creating a new appointment.
    """
    pass

class AppointmentUpdate(BaseModel):
    """
    Schema for updating an existing appointment. All fields are optional.
    """
    patient_id: Optional[int] = Field(None, description="The ID of the patient.")
    doctor_id: Optional[int] = Field(None, description="The ID of the doctor (staff user).")
    appointment_date: Optional[datetime] = Field(None, description="The date and time of the appointment.")
    reason: Optional[str] = Field(None, max_length=255, description="The reason for the appointment.")
    status: Optional[str] = Field(None, description="Status (scheduled, completed, cancelled).")
    notes: Optional[str] = Field(None, description="Clinical notes.")

class AppointmentOut(AppointmentBase):
    """
    Standard output schema representing an appointment.
    """
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class AppointmentDetailOut(AppointmentOut):
    """
    Detailed output schema representing an appointment including nested 
    doctor and patient details for easier front-end dashboard consumption.
    """
    patient: PatientMin
    doctor: UserMin
