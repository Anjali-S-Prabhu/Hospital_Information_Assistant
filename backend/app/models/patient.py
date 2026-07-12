from sqlalchemy import Column, Integer, String, Date, DateTime, Text, func
from sqlalchemy.orm import relationship
from app.database import Base

class Patient(Base):
    """
    SQLAlchemy model representing a patient profile within the hospital database.
    Contains demographic info, contact info, and medical metadata.
    """
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    address = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)  # Store summary of allergies, diagnosis history
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    # A patient can have multiple appointments.
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    # A patient can have multiple uploaded medical files (reports, prescriptions).
    uploaded_files = relationship("UploadedFile", back_populates="patient", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        """
        Why it is written:
        To provide a clear string representation of a patient instance for logs and debugging.

        What it does:
        Returns a formatted string containing the patient's ID and full name.

        Inputs:
        - None

        Outputs:
        - str: String representation of the patient.
        """
        return f"<Patient(id={self.id}, name='{self.first_name} {self.last_name}')>"
