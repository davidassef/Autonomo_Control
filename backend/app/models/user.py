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
    # Controle de acesso: roles hierárquicas (MASTER > ADMIN > USER)
    role = Column(String, default="USER", nullable=False, index=True)

    # Senha temporária para desenvolvimento (apenas para admin)
    hashed_password = Column(String, nullable=True)  # Para desenvolvimento/admin
    temp_password_hash = Column(String, nullable=True)  # Senha temporária
    temp_password_expires = Column(DateTime(timezone=True), nullable=True)  # Expiração da senha temporária
    password_reset_by = Column(String, nullable=True)  # ID do admin que resetou a senha
    
    # Controle de bloqueio de usuários
    blocked_at = Column(DateTime(timezone=True), nullable=True)  # Data/hora do bloqueio
    blocked_by = Column(String, nullable=True)  # ID do admin que bloqueou o usuário
    
    # Controles de hierarquia e visibilidade
    can_view_admins = Column(Boolean, default=False, nullable=False)  # Se ADMIN pode ver outras contas ADMIN
    promoted_by = Column(String, nullable=True)  # ID do MASTER que promoveu para ADMIN
    demoted_by = Column(String, nullable=True)  # ID do MASTER que rebaixou de ADMIN
    demoted_at = Column(DateTime(timezone=True), nullable=True)  # Data/hora do rebaixamento
    
    # Perguntas secretas para recuperação de senha (sistema flexível)
    security_question_1_id = Column(String, nullable=True)  # ID da primeira pergunta escolhida
    security_answer_1 = Column(String, nullable=True)  # Hash da resposta da primeira pergunta
    security_question_2_id = Column(String, nullable=True)  # ID da segunda pergunta escolhida
    security_answer_2 = Column(String, nullable=True)  # Hash da resposta da segunda pergunta
    security_question_3_id = Column(String, nullable=True)  # ID da terceira pergunta escolhida
    security_answer_3 = Column(String, nullable=True)  # Hash da resposta da terceira pergunta
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
