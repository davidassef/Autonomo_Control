from sqlalchemy import Column, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from uuid import uuid4

from app.core.database import Base

class AuditLog(Base):
    """Modelo para registrar logs de auditoria de ações administrativas."""
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    
    # Informações da ação
    action = Column(String, nullable=False, index=True)  # Ex: 'user_created', 'user_blocked', 'password_reset'
    resource_type = Column(String, nullable=False, index=True)  # Ex: 'user', 'entry', 'category'
    resource_id = Column(String, nullable=True, index=True)  # ID do recurso afetado
    
    # Informações do usuário que executou a ação
    performed_by = Column(String, nullable=False, index=True)  # ID do usuário que executou
    performed_by_role = Column(String, nullable=False, index=True)  # Role do usuário no momento da ação
    
    # Detalhes da ação
    description = Column(Text, nullable=True)  # Descrição legível da ação
    details = Column(JSON, nullable=True)  # Dados adicionais em JSON
    
    # Informações de contexto
    ip_address = Column(String, nullable=True)  # IP do usuário
    user_agent = Column(String, nullable=True)  # User agent do navegador
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)