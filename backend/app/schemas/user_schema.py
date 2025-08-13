from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    # Para registro tradicional com senha
    password: str = Field(..., min_length=6, description="Senha do usuário")
    username: Optional[str] = Field(None, description="Nome de usuário (opcional)")
    full_name: str = Field(..., description="Nome completo do usuário")
    
    # Perguntas secretas para recuperação de senha (sistema flexível)
    security_question_1_id: str = Field(..., description="ID da primeira pergunta secreta escolhida")
    security_answer_1: str = Field(..., description="Resposta para a primeira pergunta secreta")
    security_question_2_id: str = Field(..., description="ID da segunda pergunta secreta escolhida")
    security_answer_2: str = Field(..., description="Resposta para a segunda pergunta secreta")
    security_question_3_id: str = Field(..., description="ID da terceira pergunta secreta escolhida")
    security_answer_3: str = Field(..., description="Resposta para a terceira pergunta secreta")

class UserUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None

class SecurityQuestionsUpdate(BaseModel):
    # Para atualização das perguntas secretas (requer confirmação de senha)
    current_password: str = Field(..., description="Senha atual para confirmação")
    security_question_1_id: str = Field(..., description="ID da primeira pergunta secreta escolhida")
    security_answer_1: str = Field(..., description="Nova resposta para a primeira pergunta secreta")
    security_question_2_id: str = Field(..., description="ID da segunda pergunta secreta escolhida")
    security_answer_2: str = Field(..., description="Nova resposta para a segunda pergunta secreta")
    security_question_3_id: str = Field(..., description="ID da terceira pergunta secreta escolhida")
    security_answer_3: str = Field(..., description="Nova resposta para a terceira pergunta secreta")

class PasswordResetRequest(BaseModel):
    email: EmailStr = Field(..., description="Email do usuário")
    method: str = Field(..., description="Método de reset: 'email' ou 'security_questions'")

class PasswordResetByEmail(BaseModel):
    email: EmailStr = Field(..., description="Email do usuário")
    reset_token: str = Field(..., description="Token de reset recebido por email")
    new_password: str = Field(..., min_length=6, description="Nova senha")

class PasswordResetBySecurityQuestions(BaseModel):
    email: EmailStr = Field(..., description="Email do usuário")
    security_answer_1: str = Field(..., description="Resposta para a primeira pergunta secreta")
    security_answer_2: str = Field(..., description="Resposta para a segunda pergunta secreta")
    security_answer_3: str = Field(..., description="Resposta para a terceira pergunta secreta")
    new_password: str = Field(..., min_length=6, description="Nova senha")

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
    can_view_admins: bool = Field(..., description="Se ADMIN pode ver outras contas ADMIN")

class UserHierarchyAction(BaseModel):
    action: str = Field(..., description="Ação: promote, demote, block, unblock")
    reason: Optional[str] = Field(None, description="Motivo da ação (opcional)")

class UserListFilters(BaseModel):
    role: Optional[str] = Field(None, description="Filtrar por role: USER, ADMIN, MASTER")
    active: Optional[bool] = Field(None, description="Filtrar por status ativo")
    can_view_admins: Optional[bool] = Field(None, description="Filtrar por permissão de ver ADMINs")
    blocked: Optional[bool] = Field(None, description="Filtrar por usuários bloqueados")

class SecurityQuestion(BaseModel):
    id: str = Field(..., description="ID único da pergunta")
    text: str = Field(..., description="Texto da pergunta")

class SecurityQuestionsResponse(BaseModel):
    questions: List[SecurityQuestion] = Field(..., description="Lista de perguntas secretas disponíveis")

class UserInDB(UserBase):
    id: str
    google_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    picture: Optional[str] = None
    role: str = "USER"
    # Campos de hierarquia e visibilidade
    can_view_admins: bool = False
    promoted_by: Optional[str] = None
    demoted_by: Optional[str] = None
    demoted_at: Optional[datetime] = None
    blocked_at: Optional[datetime] = None
    blocked_by: Optional[str] = None
    # Campos de perguntas secretas
    security_question_1_id: Optional[str] = None
    security_question_2_id: Optional[str] = None
    security_question_3_id: Optional[str] = None

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
