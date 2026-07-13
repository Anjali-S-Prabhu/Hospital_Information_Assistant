from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    """
    SQLAlchemy model representing a Hospital Staff User (doctor, nurse, admin, or support staff).
    This model contains identification, credential hashes, authorization roles, and status flags.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="staff", nullable=False)  # Roles: admin, doctor, nurse, staff
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    # If a doctor is linked to appointments or patients, these can be mapped here.
    # For instance, a doctor user can have multiple scheduled appointments:
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        """
        Why it is written:
        To provide a human-readable string representation of the User model instance.

        What it does:
        Returns a formatted string containing the user's ID, email, and role.

        Inputs:
        - None

        Outputs:
        - str: The string representation of the user.
        """
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
