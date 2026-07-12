from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.uploaded_file import UploadedFile

# This ensures all models are loaded and registered with SQLAlchemy's metadata
# before we try to use them, preventing "failed to locate a name" errors
# with string-based relationships.
