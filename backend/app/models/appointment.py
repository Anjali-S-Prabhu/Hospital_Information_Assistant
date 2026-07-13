from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.database import Base

class Appointment(Base):
    """
    SQLAlchemy model representing a doctor-patient appointment.
    Tracks schedule, status, reasons, and notes.
    """
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    appointment_date = Column(DateTime(timezone=True), nullable=False)
    reason = Column(String(255), nullable=False)
    status = Column(String(50), default="scheduled", nullable=False)  # Status: scheduled, completed, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("User", back_populates="appointments")

    def __repr__(self) -> str:
        """
        Why it is written:
        To provide a representation of the appointment showing the mapping between 
        patient, doctor, and the scheduled time.

        What it does:
        Returns a formatted string containing appointment ID, patient ID, doctor ID, and date.

        Inputs:
        - None

        Outputs:
        - str: String representation of the appointment.
        """
        return f"<Appointment(id={self.id}, patient_id={self.patient_id}, doctor_id={self.doctor_id}, date={self.appointment_date})>"
