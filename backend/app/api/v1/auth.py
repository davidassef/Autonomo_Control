from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_token, verify_password
from app.models.user import User
from app.dependencies import get_current_user
import secrets
import string
from app.schemas.user_schema import (
    Token, UserInDB, UserCreate, PasswordResetRequest, 
    PasswordResetByEmail, PasswordResetBySecurityQuestions,
    SecurityQuestionsUpdate, ProfileUpdate, SecurityQuestionsResponse
)
from app.core.security_questions import get_all_questions, get_question_text, is_valid_question_id
from app.services.google_auth import verify_google_token
from app.services.audit_service import AuditService, AuditActions
from app.core.security import get_password_hash
from datetime import datetime, UTC, timedelta

router = APIRouter(prefix="/auth", tags=["autenticação"])

# Esquema OAuth2 para autenticação via token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

@router.get("/security-questions", response_model=SecurityQuestionsResponse)
async def get_security_questions():
    """
    Retorna a lista de perguntas secretas disponíveis para escolha
    """
    questions = get_all_questions()
    return SecurityQuestionsResponse(questions=questions)

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Endpoint de login tradicional com email e senha (para desenvolvimento)
    Suporta tanto senha normal quanto senha temporária
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        # Registrar tentativa de login com email inexistente
        AuditService.log_auth_action(
            db=db,
            action=AuditActions.LOGIN_FAILED,
            user_email=form_data.username,
            description=f"Tentativa de login com email inexistente: {form_data.username}",
            success=False,
            details={"reason": "email_not_found"},
            request=request
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar primeiro se há senha temporária válida
    temp_password_valid = False
    if (user.temp_password_hash and 
        user.temp_password_expires and 
        user.temp_password_expires > datetime.now(UTC)):
        temp_password_valid = verify_password(form_data.password, user.temp_password_hash)
        
        if temp_password_valid:
            # Limpar senha temporária após uso bem-sucedido
            user.temp_password_hash = None  # type: ignore[assignment]
            user.temp_password_expires = None  # type: ignore[assignment]
            user.password_reset_by = None  # type: ignore[assignment]
            user.updated_at = datetime.now(UTC)  # type: ignore[assignment]
            db.commit()
    
    # Se não há senha temporária válida, verificar senha normal
    if not temp_password_valid:
        if not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not verify_password(form_data.password, user.hashed_password):
            # Registrar tentativa de login com senha incorreta
            AuditService.log_auth_action(
                db=db,
                action=AuditActions.LOGIN_FAILED,
                user_email=user.email,
                description=f"Tentativa de login com senha incorreta para {user.email}",
                success=False,
                details={"reason": "invalid_password"},
                request=request
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos",
                headers={"WWW-Authenticate": "Bearer"},
            )

    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role}
    )
    
    # Registrar login bem-sucedido
    login_method = "temporary_password" if temp_password_valid else "normal_password"
    AuditService.log_auth_action(
        db=db,
        action=AuditActions.LOGIN_SUCCESS,
        user_email=user.email,
        description=f"Login bem-sucedido para {user.email}",
        success=True,
        details={"login_method": login_method, "role": user.role},
        request=request
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# Endpoints para recuperação de senha
@router.post("/password-reset/request")
async def request_password_reset(
    request_data: PasswordResetRequest,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Solicita reset de senha por email ou perguntas secretas
    """
    user = db.query(User).filter(User.email == request_data.email).first()
    if not user:
        # Por segurança, não revelamos se o email existe
        return {"success": True, "message": "Se o email existir, você receberá instruções"}
    
    if request_data.method == "email":
        # Mock do envio de email - gerar token temporário
        reset_token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        
        # Salvar token temporário no usuário (simulação)
        user.temp_password_hash = reset_token  # type: ignore[assignment]
        user.temp_password_expires = datetime.now(UTC) + timedelta(hours=1)  # type: ignore[assignment]
        user.password_reset_by = "email_mock"  # type: ignore[assignment]
        db.commit()
        
        # Log da ação
        AuditService.log_auth_action(
            db=db,
            action="PASSWORD_RESET_REQUEST",
            user_email=user.email,
            description=f"Solicitação de reset de senha por email (mock) para {user.email}",
            success=True,
            details={"method": "email", "reset_token": reset_token[:8] + "..."},
            request=request
        )
        
        return {
            "success": True, 
            "message": "Token de reset enviado (MOCK)",
            "mock_token": reset_token  # Em produção, isso seria enviado por email
        }
    
    elif request_data.method == "security_questions":
        # Verificar se o usuário tem perguntas secretas configuradas
        if not all([user.security_answer_1, user.security_answer_2, user.security_answer_3,
                   user.security_question_1_id, user.security_question_2_id, user.security_question_3_id]):
            return {
                "success": False, 
                "message": "Usuário não possui perguntas secretas configuradas"
            }
        
        # Retornar as perguntas específicas do usuário
        user_questions = [
            {"id": user.security_question_1_id, "text": get_question_text(user.security_question_1_id)},
            {"id": user.security_question_2_id, "text": get_question_text(user.security_question_2_id)},
            {"id": user.security_question_3_id, "text": get_question_text(user.security_question_3_id)}
        ]
        
        return {
            "success": True,
            "message": "Responda às perguntas secretas",
            "questions": user_questions
        }
    
    return {"success": False, "message": "Método inválido"}

@router.post("/password-reset/email")
async def reset_password_by_email(
    reset_data: PasswordResetByEmail,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Reset de senha usando token recebido por email (mock)
    """
    user = db.query(User).filter(User.email == reset_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Verificar token temporário
    if (not user.temp_password_hash or 
        user.temp_password_hash != reset_data.reset_token or
        not user.temp_password_expires or
        datetime.now(UTC) > user.temp_password_expires):
        
        AuditService.log_auth_action(
            db=db,
            action="PASSWORD_RESET_FAILED",
            user_email=user.email,
            description=f"Tentativa de reset com token inválido para {user.email}",
            success=False,
            details={"method": "email", "reason": "invalid_token"},
            request=request
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado"
        )
    
    # Atualizar senha
    user.hashed_password = get_password_hash(reset_data.new_password)  # type: ignore[assignment]
    user.temp_password_hash = None  # type: ignore[assignment]
    user.temp_password_expires = None  # type: ignore[assignment]
    user.password_reset_by = None  # type: ignore[assignment]
    user.updated_at = datetime.now(UTC)  # type: ignore[assignment]
    db.commit()
    
    # Log da ação
    AuditService.log_auth_action(
        db=db,
        action="PASSWORD_RESET_SUCCESS",
        user_email=user.email,
        description=f"Senha resetada com sucesso via email para {user.email}",
        success=True,
        details={"method": "email"},
        request=request
    )
    
    return {"success": True, "message": "Senha alterada com sucesso"}

@router.post("/password-reset/security-questions")
async def reset_password_by_security_questions(
    reset_data: PasswordResetBySecurityQuestions,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Reset de senha usando perguntas secretas
    """
    user = db.query(User).filter(User.email == reset_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Verificar se o usuário tem perguntas secretas
    if not all([user.security_answer_1, user.security_answer_2, user.security_answer_3]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não possui perguntas secretas configuradas"
        )
    
    # Verificar respostas
    answer_1_valid = verify_password(reset_data.security_answer_1.lower().strip(), user.security_answer_1)
    answer_2_valid = verify_password(reset_data.security_answer_2.lower().strip(), user.security_answer_2)
    answer_3_valid = verify_password(reset_data.security_answer_3.strip(), user.security_answer_3)
    
    if not all([answer_1_valid, answer_2_valid, answer_3_valid]):
        AuditService.log_auth_action(
            db=db,
            action="PASSWORD_RESET_FAILED",
            user_email=user.email,
            description=f"Tentativa de reset com respostas incorretas para {user.email}",
            success=False,
            details={"method": "security_questions", "reason": "wrong_answers"},
            request=request
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Respostas das perguntas secretas incorretas"
        )
    
    # Atualizar senha
    user.hashed_password = get_password_hash(reset_data.new_password)  # type: ignore[assignment]
    user.updated_at = datetime.now(UTC)  # type: ignore[assignment]
    db.commit()
    
    # Log da ação
    AuditService.log_auth_action(
        db=db,
        action="PASSWORD_RESET_SUCCESS",
        user_email=user.email,
        description=f"Senha resetada com sucesso via perguntas secretas para {user.email}",
        success=True,
        details={"method": "security_questions"},
        request=request
    )
    
    return {"success": True, "message": "Senha alterada com sucesso"}

# Endpoints para perfil do usuário
@router.put("/profile/security-questions")
async def update_security_questions(
    update_data: SecurityQuestionsUpdate,
    current_user: User = Depends(get_current_user),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Atualiza as perguntas secretas do usuário
    """
    # Verificar senha atual
    if not verify_password(update_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta"
        )
    
    # Validar IDs das perguntas
    question_ids = [update_data.security_question_1_id, update_data.security_question_2_id, update_data.security_question_3_id]
    
    # Verificar se todas as perguntas são válidas
    for qid in question_ids:
        if not is_valid_question_id(qid):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"ID de pergunta inválido: {qid}"
            )
    
    # Verificar se as perguntas são diferentes
    if len(set(question_ids)) != 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="As três perguntas devem ser diferentes"
        )
    
    # Atualizar perguntas e respostas
    current_user.security_question_1_id = update_data.security_question_1_id  # type: ignore[assignment]
    current_user.security_answer_1 = get_password_hash(update_data.security_answer_1.lower().strip())  # type: ignore[assignment]
    current_user.security_question_2_id = update_data.security_question_2_id  # type: ignore[assignment]
    current_user.security_answer_2 = get_password_hash(update_data.security_answer_2.lower().strip())  # type: ignore[assignment]
    current_user.security_question_3_id = update_data.security_question_3_id  # type: ignore[assignment]
    current_user.security_answer_3 = get_password_hash(update_data.security_answer_3.strip())  # type: ignore[assignment]
    current_user.updated_at = datetime.now(UTC)  # type: ignore[assignment]
    db.commit()
    
    # Log da ação
    AuditService.log_auth_action(
        db=db,
        action="SECURITY_QUESTIONS_UPDATED",
        user_email=current_user.email,
        description=f"Perguntas secretas atualizadas para {current_user.email}",
        success=True,
        details={
            "question_1_id": update_data.security_question_1_id,
            "question_2_id": update_data.security_question_2_id,
            "question_3_id": update_data.security_question_3_id
        },
        request=request
    )
    
    return {"success": True, "message": "Perguntas secretas atualizadas com sucesso"}

@router.put("/profile")
async def update_profile(
    update_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Atualiza dados do perfil do usuário
    """
    # Verificar senha atual
    if not verify_password(update_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta"
        )
    
    # Atualizar dados do perfil
    if update_data.name:
        current_user.name = update_data.name  # type: ignore[assignment]
    
    current_user.updated_at = datetime.now(UTC)  # type: ignore[assignment]
    db.commit()
    
    # Log da ação
    AuditService.log_auth_action(
        db=db,
        action="PROFILE_UPDATED",
        user_email=current_user.email,
        description=f"Perfil atualizado para {current_user.email}",
        success=True,
        details={"updated_fields": [k for k, v in update_data.dict().items() if v and k != "current_password"]},
        request=request
    )
    
    return {"success": True, "message": "Perfil atualizado com sucesso"}

@router.post("/register", response_model=Token)
async def register_user(
    user_data: UserCreate,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Registra um novo usuário (para desenvolvimento e testes)
    """
    # Verificar se o usuário já existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já está em uso"
        )
    
    # Validar IDs das perguntas
    question_ids = [user_data.security_question_1_id, user_data.security_question_2_id, user_data.security_question_3_id]
    
    # Verificar se todas as perguntas são válidas
    for qid in question_ids:
        if not is_valid_question_id(qid):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"ID de pergunta inválido: {qid}"
            )
    
    # Verificar se as perguntas são diferentes
    if len(set(question_ids)) != 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="As três perguntas devem ser diferentes"
        )
    
    # Criar novo usuário
    hashed_password = get_password_hash(user_data.password)
    
    # Hash das respostas das perguntas secretas
    hashed_answer_1 = get_password_hash(user_data.security_answer_1.lower().strip())
    hashed_answer_2 = get_password_hash(user_data.security_answer_2.lower().strip())
    hashed_answer_3 = get_password_hash(user_data.security_answer_3.strip())
    
    new_user = User(
        email=user_data.email,
        name=user_data.full_name,
        hashed_password=hashed_password,
        role='MASTER' if user_data.username == 'master' else 'USER',
        is_active=True,
        security_question_1_id=user_data.security_question_1_id,
        security_answer_1=hashed_answer_1,
        security_question_2_id=user_data.security_question_2_id,
        security_answer_2=hashed_answer_2,
        security_question_3_id=user_data.security_question_3_id,
        security_answer_3=hashed_answer_3
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Gerar token de acesso
    access_token = create_access_token(
        data={"sub": new_user.email, "user_id": new_user.id, "role": new_user.role}
    )
    
    # Registrar criação de usuário
    AuditService.log_auth_action(
        db=db,
        action=AuditActions.USER_CREATED,
        user_email=new_user.email,
        description=f"Usuário criado: {new_user.email} com role {new_user.role}",
        success=True,
        details={"role": new_user.role, "username": user_data.username},
        request=request
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": new_user.id}

@router.get("/me", response_model=UserInDB)
async def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Retorna os dados do usuário autenticado
    """
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
        )

    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
        )

    return user

@router.post("/google", response_model=Token)
async def login_with_google(token: str, request: Request = None, db: Session = Depends(get_db)):
    """
    Autentica um usuário com token do Google OAuth2
    """
    user_data = verify_google_token(token)
    if not user_data:
        # Registrar falha na autenticação Google
        AuditService.log_auth_action(
            db=db,
            action=AuditActions.LOGIN_FAILED,
            user_email="unknown",
            description="Tentativa de login com token Google inválido",
            success=False,
            details={"reason": "invalid_google_token", "login_method": "google"},
            request=request
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de autenticação Google inválido")

    # Valida campos essenciais
    email = user_data.get("email") if isinstance(user_data, dict) else None
    google_id = user_data.get("google_id") if isinstance(user_data, dict) else None
    name = user_data.get("name") if isinstance(user_data, dict) else None
    if not email or not google_id or not name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Dados de usuário Google incompletos")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        new_user = User(email=email, name=name, picture=user_data.get("picture"), google_id=google_id)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user

    # Gera um token de acesso
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role}
    )
    
    # Registrar login bem-sucedido com Google
    is_new_user = user.created_at and (datetime.now(UTC) - user.created_at).total_seconds() < 60
    AuditService.log_auth_action(
        db=db,
        action=AuditActions.LOGIN_SUCCESS,
        user_email=user.email,
        description=f"Login bem-sucedido via Google para {user.email}",
        success=True,
        details={
            "login_method": "google", 
            "role": user.role,
            "is_new_user": is_new_user
        },
        request=request
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
async def refresh_token(
    token: str = Depends(oauth2_scheme), 
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Atualiza o token de acesso
    """
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
        )

    # Verifica se o usuário existe
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
        )

    # Gera um novo token de acesso
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role}
    )
    
    # Registrar refresh de token
    AuditService.log_auth_action(
        db=db,
        action=AuditActions.TOKEN_REFRESH,
        user_email=user.email,
        description=f"Token renovado para {user.email}",
        success=True,
        details={"role": user.role},
        request=request
    )

    return {"access_token": access_token, "token_type": "bearer"}
