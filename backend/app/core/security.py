from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta, UTC
from typing import Optional

from app.core.config import settings
from app.schemas.user_schema import TokenData

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

    email = payload.get('sub')  # type: ignore[assignment]
    user_id = payload.get('user_id')  # type: ignore[assignment]
    role = payload.get('role')  # optional

    if not email or not user_id:
        return None

    return TokenData(email=email, user_id=user_id, role=role)
