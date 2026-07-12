import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Why it is written:
    To verify whether a login password matches the stored bcrypt hash in the database.

    What it does:
    Uses the bcrypt library to compare the plain text password with the hashed password.

    Inputs:
    - plain_password (str): The password entered by the user.
    - hashed_password (str): The bcrypt hashed password from the database.

    Outputs:
    - bool: True if password matches, False otherwise.
    """
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """
    Why it is written:
    To hash a user's password securely before saving it into the PostgreSQL database.

    What it does:
    Salt and hashes the password string using bcrypt.

    Inputs:
    - password (str): The plain-text password to hash.

    Outputs:
    - str: The resulting secure bcrypt hash.
    """
    return bcrypt.hashpw(
        password.encode('utf-8'), 
        bcrypt.gensalt()
    ).decode('utf-8')

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Why it is written:
    To generate a secure JSON Web Token (JWT) that authenticated users can use to access protected routes.

    What it does:
    Encodes the data payload (like email and role), adds an expiration timestamp (exp), and signs it using HS256.

    Inputs:
    - data (Dict[str, Any]): The payload data to encode into the token.
    - expires_delta (Optional[timedelta]): Optional override for token lifespan duration.

    Outputs:
    - str: The encoded JWT access token string.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Why it is written:
    To authenticate and authorize requests by decoding and validating incoming JWT tokens.

    What it does:
    Decodes the JWT token using the secret key and algorithm, handles signature expiration, 
    and returns the payload if the token is valid.

    Inputs:
    - token (str): The JWT string to decode.

    Outputs:
    - Optional[Dict[str, Any]]: The decoded payload dictionary if valid; None if expired or invalid.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
