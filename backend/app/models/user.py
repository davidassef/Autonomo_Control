from sqlalchemy import Boolean, Column, String, DateTime, Integer
from sqlalchemy.sql import func
from uuid import uuid4

from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    email = Column(String, unique=True, index=True)
    name = Column(String)
    picture = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)    # Autenticação Google
    google_id = Column(String, unique=True, index=True, nullable=True)

    # Senha temporária para desenvolvimento (apenas para admin)
    hashed_password = Column(String, nullable=True)

    # Campos de controle
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
