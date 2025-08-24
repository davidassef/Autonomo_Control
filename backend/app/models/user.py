from sqlalchemy import Boolean, Column, String, DateTime, Integer, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    name = Column(String)
    picture = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)  # Autenticação Google
    google_id = Column(
        String, unique=True, nullable=True, index=True
    )  # Para login com Google
    # Controle de acesso: roles hierárquicas (MASTER > ADMIN > USER)
    role = Column(String, nullable=False, default="user", index=True)  # admin, user

    # Senha temporária para desenvolvimento (apenas para admin)
    hashed_password = Column(String, nullable=True)  # Para desenvolvimento/admin
    temp_password_hash = Column(String, nullable=True)  # Senha temporária
    temp_password_expires = Column(
        DateTime(timezone=True), nullable=True
    )  # Expiração da senha temporária
    password_reset_by = Column(String, nullable=True)  # ID do admin que resetou a senha

    # Controle de bloqueio de usuários
    blocked_at = Column(DateTime(timezone=True), nullable=True)  # Data/hora do bloqueio
    blocked_by = Column(String, nullable=True)  # ID do admin que bloqueou o usuário

    # Controles de hierarquia e visibilidade
    can_view_admins = Column(
        Boolean, default=False, nullable=False
    )  # Se ADMIN pode ver outras contas ADMIN
    promoted_by = Column(String, nullable=True)  # ID do MASTER que promoveu para ADMIN
    demoted_by = Column(String, nullable=True)  # ID do MASTER que rebaixou de ADMIN
    demoted_at = Column(
        DateTime(timezone=True), nullable=True
    )  # Data/hora do rebaixamento

    # Perguntas secretas para recuperação de senha (sistema flexível)
    security_question_1_id = Column(
        String, nullable=True
    )  # ID da primeira pergunta escolhida
    security_answer_1 = Column(
        String, nullable=True
    )  # Hash da resposta da primeira pergunta
    security_question_2_id = Column(
        String, nullable=True
    )  # ID da segunda pergunta escolhida
    security_answer_2 = Column(
        String, nullable=True
    )  # Hash da resposta da segunda pergunta
    security_question_3_id = Column(
        String, nullable=True
    )  # ID da terceira pergunta escolhida
    security_answer_3 = Column(
        String, nullable=True
    )  # Hash da resposta da terceira pergunta

    # Sistema de chaves secretas para recuperação de senha do Master
    secret_key_hash = Column(String, nullable=True)  # Hash da chave secreta
    secret_key_created_at = Column(
        DateTime(timezone=True), nullable=True
    )  # Data de criação da chave
    secret_key_used_at = Column(
        DateTime(timezone=True), nullable=True
    )  # Data da última utilização

    # Campos opcionais do perfil do usuário
    cpf = Column(
        String(14), nullable=True, unique=True, index=True
    )  # CPF formatado (XXX.XXX.XXX-XX)
    birth_date = Column(Date, nullable=True)  # Data de nascimento
    phone = Column(String(15), nullable=True)  # Telefone formatado ((XX) XXXXX-XXXX)

    # Endereço completo
    cep = Column(String(9), nullable=True)  # CEP formatado (XXXXX-XXX)
    street = Column(String(255), nullable=True)  # Logradouro
    number = Column(String(10), nullable=True)  # Número
    complement = Column(String(100), nullable=True)  # Complemento
    neighborhood = Column(String(100), nullable=True)  # Bairro
    city = Column(String(100), nullable=True)  # Cidade
    state = Column(String(2), nullable=True)  # Estado (sigla)

    # Flag para controlar obrigatoriedade dos campos após promoção
    requires_complete_profile = Column(
        Boolean, default=False, nullable=False
    )  # Se campos são obrigatórios
    profile_completed_at = Column(
        DateTime(timezone=True), nullable=True
    )  # Data de completude do perfil

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relacionamentos SQLAlchemy
    entries = relationship("Entry", back_populates="user", cascade="all, delete-orphan")
    categories = relationship(
        "Category", back_populates="user", cascade="all, delete-orphan"
    )
    audit_logs_performed = relationship(
        "AuditLog", foreign_keys="AuditLog.performed_by", cascade="all, delete-orphan"
    )
    system_configs_created = relationship(
        "SystemConfig", foreign_keys="SystemConfig.created_by"
    )
    system_configs_updated = relationship(
        "SystemConfig", foreign_keys="SystemConfig.updated_by"
    )
