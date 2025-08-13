from sqlalchemy import Column, String, DateTime, Text, Boolean, JSON
from sqlalchemy.sql import func
from uuid import uuid4

from app.core.database import Base

class SystemConfig(Base):
    """Modelo para armazenar configurações do sistema."""
    __tablename__ = "system_configs"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    
    # Chave única da configuração
    key = Column(String, nullable=False, unique=True, index=True)
    
    # Valor da configuração (armazenado como string)
    value = Column(Text, nullable=True)
    
    # Tipo do valor para validação (string, integer, boolean, json, etc.)
    value_type = Column(String, nullable=False, default="string")
    
    # Descrição da configuração
    description = Column(Text, nullable=True)
    
    # Categoria da configuração (email, backup, security, etc.)
    category = Column(String, nullable=True, index=True)
    
    # Se a configuração é pública (pode ser lida por usuários não-MASTER)
    is_public = Column(Boolean, default=False)
    
    # Se a configuração está ativa
    is_active = Column(Boolean, default=True)
    
    # Valor padrão da configuração
    default_value = Column(Text, nullable=True)
    
    # Metadados adicionais (validações, opções, etc.)
    config_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Usuário que criou/modificou a configuração
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)