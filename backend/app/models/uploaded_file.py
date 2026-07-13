from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class UploadedFile(Base):
    """
    SQLAlchemy model representing a metadata record of a file uploaded to AWS S3.
    Includes references to the patient (if applicable) and the staff member who performed the upload.
    """
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(1024), nullable=False)  # S3 public/presigned access URL
    upload_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Associated Patient
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=True)
    # Uploading Staff/Doctor
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    patient = relationship("Patient", back_populates="uploaded_files")
    uploader = relationship("User")

    def __repr__(self) -> str:
        """
        Why it is written:
        To provide a representation of the uploaded file metadata.

        What it does:
        Returns a formatted string containing the file ID, name, and associated patient ID.

        Inputs:
        - None

        Outputs:
        - str: String representation of the uploaded file.
        """
        return f"<UploadedFile(id={self.id}, name='{self.file_name}', patient_id={self.patient_id})>"
