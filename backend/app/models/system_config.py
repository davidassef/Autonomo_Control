from sqlalchemy import Column, String, DateTime, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
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
    value = Column(Text, nullable=False)

    # Tipo do valor para validação (string, integer, boolean, json, etc.)
    value_type = Column(String, nullable=False, default="string", index=True)

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

    # Campos de auditoria
    created_by = Column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )  # ID do usuário que criou
    updated_by = Column(
        String, ForeignKey("users.id"), nullable=True, index=True
    )  # ID do usuário que atualizou

    # Relacionamentos SQLAlchemy
    creator = relationship(
        "User", foreign_keys=[created_by], back_populates="system_configs_created"
    )
    updater = relationship(
        "User", foreign_keys=[updated_by], back_populates="system_configs_updated"
    )
