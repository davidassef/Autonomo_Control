from pydantic import BaseModel, EmailStr, Field, ConfigDict, validator
from typing import Optional, List
from datetime import datetime, date
from app.utils.validators import (
    validate_cpf,
    validate_phone,
    validate_cep,
    validate_birth_date,
    validate_state,
)


class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = Field(
        None, description="Nome de usuário único (opcional)"
    )
    name: str


class UserCreate(UserBase):
    # Para registro tradicional com senha
    password: str = Field(..., min_length=6, description="Senha do usuário")
    full_name: str = Field(..., description="Nome completo do usuário")

    # Perguntas secretas para recuperação de senha (sistema flexível)
    security_question_1_id: str = Field(
        ..., description="ID da primeira pergunta secreta escolhida"
    )
    security_answer_1: str = Field(
        ..., description="Resposta para a primeira pergunta secreta"
    )
    security_question_2_id: str = Field(
        ..., description="ID da segunda pergunta secreta escolhida"
    )
    security_answer_2: str = Field(
        ..., description="Resposta para a segunda pergunta secreta"
    )
    security_question_3_id: str = Field(
        ..., description="ID da terceira pergunta secreta escolhida"
    )
    security_answer_3: str = Field(
        ..., description="Resposta para a terceira pergunta secreta"
    )

    # Campos opcionais do perfil
    cpf: Optional[str] = Field(None, description="CPF do usuário (opcional)")
    birth_date: Optional[date] = Field(
        None, description="Data de nascimento (opcional)"
    )
    phone: Optional[str] = Field(None, description="Telefone do usuário (opcional)")

    # Endereço completo (opcional)
    cep: Optional[str] = Field(None, description="CEP (opcional)")
    street: Optional[str] = Field(
        None, max_length=255, description="Logradouro (opcional)"
    )
    number: Optional[str] = Field(None, max_length=10, description="Número (opcional)")
    complement: Optional[str] = Field(
        None, max_length=100, description="Complemento (opcional)"
    )
    neighborhood: Optional[str] = Field(
        None, max_length=100, description="Bairro (opcional)"
    )
    city: Optional[str] = Field(None, max_length=100, description="Cidade (opcional)")
    state: Optional[str] = Field(
        None, max_length=2, description="Estado - sigla (opcional)"
    )

    @validator("cpf")
    def validate_cpf_field(cls, v):
        if v is not None and v.strip():
            if not validate_cpf(v):
                raise ValueError("CPF inválido")
        return v

    @validator("phone")
    def validate_phone_field(cls, v):
        if v is not None and v.strip():
            if not validate_phone(v):
                raise ValueError("Telefone inválido")
        return v

    @validator("cep")
    def validate_cep_field(cls, v):
        if v is not None and v.strip():
            if not validate_cep(v):
                raise ValueError("CEP inválido")
        return v

    @validator("birth_date")
    def validate_birth_date_field(cls, v):
        if v is not None:
            if not validate_birth_date(v):
                raise ValueError("Data de nascimento inválida (idade mínima: 16 anos)")
        return v

    @validator("state")
    def validate_state_field(cls, v):
        if v is not None and v.strip():
            if not validate_state(v):
                raise ValueError("Estado inválido")
        return v.upper() if v else v


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100, description="Nome do usuário")
    email: Optional[EmailStr] = Field(None, description="Email do usuário")
    username: Optional[str] = Field(
        None, max_length=50, description="Nome de usuário único"
    )

    # Campos opcionais do perfil
    cpf: Optional[str] = Field(None, description="CPF do usuário")
    birth_date: Optional[date] = Field(None, description="Data de nascimento")
    phone: Optional[str] = Field(None, description="Telefone do usuário")

    # Endereço completo
    cep: Optional[str] = Field(None, description="CEP")
    street: Optional[str] = Field(None, max_length=255, description="Logradouro")
    number: Optional[str] = Field(None, max_length=10, description="Número")
    complement: Optional[str] = Field(None, max_length=100, description="Complemento")
    neighborhood: Optional[str] = Field(None, max_length=100, description="Bairro")
    city: Optional[str] = Field(None, max_length=100, description="Cidade")
    state: Optional[str] = Field(None, max_length=2, description="Estado - sigla")

    @validator("cpf")
    def validate_cpf_field(cls, v):
        if v is not None and v.strip():
            if not validate_cpf(v):
                raise ValueError("CPF inválido")
        return v

    @validator("phone")
    def validate_phone_field(cls, v):
        if v is not None and v.strip():
            if not validate_phone(v):
                raise ValueError("Telefone inválido")
        return v

    @validator("cep")
    def validate_cep_field(cls, v):
        if v is not None and v.strip():
            if not validate_cep(v):
                raise ValueError("CEP inválido")
        return v

    @validator("birth_date")
    def validate_birth_date_field(cls, v):
        if v is not None:
            if not validate_birth_date(v):
                raise ValueError("Data de nascimento inválida (idade mínima: 16 anos)")
        return v

    @validator("state")
    def validate_state_field(cls, v):
        if v is not None and v.strip():
            if not validate_state(v):
                raise ValueError("Estado inválido")
        return v.upper() if v else v

    model_config = ConfigDict(from_attributes=True)


class SecurityQuestionsUpdate(BaseModel):
    # Para atualização das perguntas secretas (requer confirmação de senha)
    current_password: str = Field(..., description="Senha atual para confirmação")
    security_question_1_id: str = Field(
        ..., description="ID da primeira pergunta secreta escolhida"
    )
    security_answer_1: str = Field(
        ..., description="Nova resposta para a primeira pergunta secreta"
    )
    security_question_2_id: str = Field(
        ..., description="ID da segunda pergunta secreta escolhida"
    )
    security_answer_2: str = Field(
        ..., description="Nova resposta para a segunda pergunta secreta"
    )
    security_question_3_id: str = Field(
        ..., description="ID da terceira pergunta secreta escolhida"
    )
    security_answer_3: str = Field(
        ..., description="Nova resposta para a terceira pergunta secreta"
    )


class PasswordResetRequest(BaseModel):
    email: EmailStr = Field(..., description="Email do usuário")
    method: str = Field(
        ..., description="Método de reset: 'email' ou 'security_questions'"
    )


class PasswordResetByEmail(BaseModel):
    email: EmailStr = Field(..., description="Email do usuário")
    reset_token: str = Field(..., description="Token de reset recebido por email")
    new_password: str = Field(..., min_length=6, description="Nova senha")


class PasswordResetBySecurityQuestions(BaseModel):
    email: EmailStr = Field(..., description="Email do usuário")
    security_answer_1: str = Field(
        ..., description="Resposta para a primeira pergunta secreta"
    )
    security_answer_2: str = Field(
        ..., description="Resposta para a segunda pergunta secreta"
    )
    security_answer_3: str = Field(
        ..., description="Resposta para a terceira pergunta secreta"
    )
    new_password: str = Field(..., min_length=6, description="Nova senha")


class PasswordResetBySecretKey(BaseModel):
    username: str = Field(..., description="Nome de usuário (apenas para Master)")
    secret_key: str = Field(..., description="Chave secreta do Master")
    new_password: str = Field(..., min_length=6, description="Nova senha")


class SecretKeyGenerate(BaseModel):
    """Schema para gerar nova chave secreta (apenas Master)"""

    pass


class SecretKeyResponse(BaseModel):
    secret_key: str = Field(
        ..., description="Chave secreta gerada (mostrar apenas uma vez)"
    )
    created_at: Optional[datetime] = Field(None, description="Data de criação da chave")


class ProfileUpdate(BaseModel):
    # Para atualização de dados do perfil (requer confirmação de senha)
    current_password: str = Field(..., description="Senha atual para confirmação")
    name: Optional[str] = Field(None, description="Novo nome")
    full_name: Optional[str] = Field(None, description="Novo nome completo")
    username: Optional[str] = Field(None, description="Novo nome de usuário")


class RoleUpdate(BaseModel):
    role: str = Field(..., description="Novo role: USER ou ADMIN")


class StatusUpdate(BaseModel):
    is_active: bool = Field(..., description="Novo status de ativação")


class AdminVisibilityUpdate(BaseModel):
    can_view_admins: bool = Field(
        ..., description="Se ADMIN pode ver outras contas ADMIN"
    )


class UserHierarchyAction(BaseModel):
    action: str = Field(..., description="Ação: promote, demote, block, unblock")
    reason: Optional[str] = Field(None, description="Motivo da ação (opcional)")


class UserRoleChange(BaseModel):
    role: str = Field(..., description="Novo cargo: USER, ADMIN, MASTER")
    reason: Optional[str] = Field(None, description="Motivo da alteração (opcional)")


class UserListFilters(BaseModel):
    role: Optional[str] = Field(
        None, description="Filtrar por role: USER, ADMIN, MASTER"
    )
    active: Optional[bool] = Field(None, description="Filtrar por status ativo")
    can_view_admins: Optional[bool] = Field(
        None, description="Filtrar por permissão de ver ADMINs"
    )
    blocked: Optional[bool] = Field(None, description="Filtrar por usuários bloqueados")


class SecurityQuestion(BaseModel):
    id: str = Field(..., description="ID único da pergunta")
    text: str = Field(..., description="Texto da pergunta")


class SecurityQuestionsResponse(BaseModel):
    questions: List[SecurityQuestion] = Field(
        ..., description="Lista de perguntas secretas disponíveis"
    )


# Schema para perfil completo obrigatório (quando usuário é promovido a admin)
class CompleteProfileUpdate(BaseModel):
    cpf: str = Field(..., description="CPF do usuário (obrigatório)")
    birth_date: date = Field(..., description="Data de nascimento (obrigatório)")
    phone: str = Field(..., description="Telefone do usuário (obrigatório)")

    # Endereço completo obrigatório
    cep: str = Field(..., description="CEP (obrigatório)")
    street: str = Field(..., max_length=255, description="Logradouro (obrigatório)")
    number: str = Field(..., max_length=10, description="Número (obrigatório)")
    neighborhood: str = Field(..., max_length=100, description="Bairro (obrigatório)")
    city: str = Field(..., max_length=100, description="Cidade (obrigatório)")
    state: str = Field(..., max_length=2, description="Estado - sigla (obrigatório)")
    complement: Optional[str] = Field(
        None, max_length=100, description="Complemento (opcional)"
    )

    @validator("cpf")
    def validate_cpf_field(cls, v):
        if not validate_cpf(v):
            raise ValueError("CPF inválido")
        return v

    @validator("phone")
    def validate_phone_field(cls, v):
        if not validate_phone(v):
            raise ValueError("Telefone inválido")
        return v

    @validator("cep")
    def validate_cep_field(cls, v):
        if not validate_cep(v):
            raise ValueError("CEP inválido")
        return v

    @validator("birth_date")
    def validate_birth_date_field(cls, v):
        if not validate_birth_date(v):
            raise ValueError("Data de nascimento inválida (idade mínima: 16 anos)")
        return v

    @validator("state")
    def validate_state_field(cls, v):
        if not validate_state(v):
            raise ValueError("Estado inválido")
        return v.upper()

    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserBase):
    id: str  # UUID string, não integer
    role: str
    hashed_password: str
    google_id: Optional[str] = None
    created_at: Optional[datetime] = None  # Pode ser None até ser salvo no banco
    updated_at: Optional[datetime] = None  # Pode ser None até ser salvo no banco
    last_login: Optional[datetime] = None
    is_active: bool = True
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None

    # Campos de segurança
    security_question_1_id: Optional[str] = None
    security_answer_1_hash: Optional[str] = None
    security_question_2_id: Optional[str] = None
    security_answer_2_hash: Optional[str] = None
    security_question_3_id: Optional[str] = None
    security_answer_3_hash: Optional[str] = None

    # Chaves secretas para recuperação
    secret_key_1: Optional[str] = None
    secret_key_2: Optional[str] = None
    secret_key_3: Optional[str] = None

    # Campos opcionais do perfil
    cpf: Optional[str] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None

    # Endereço completo
    cep: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    complement: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

    # Controle de perfil obrigatório
    requires_complete_profile: bool = False
    profile_completed_at: Optional[datetime] = None

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
    role: Optional[str] = None
