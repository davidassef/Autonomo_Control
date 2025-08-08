from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    # Como estamos usando Google OAuth, não precisamos de senha no registro
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None

class UserInDB(UserBase):
    id: str
    google_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    picture: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class User(UserInDB):
    # Versão do usuário exposta na API
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: str
