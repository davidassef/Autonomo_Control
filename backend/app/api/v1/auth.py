from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_token, verify_password
from app.models.user import User
from app.schemas.user_schema import Token, UserInDB
from app.services.google_auth import verify_google_token

router = APIRouter(prefix="/auth", tags=["autenticação"])

# Esquema OAuth2 para autenticação via token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Endpoint de login tradicional com email e senha (para desenvolvimento)
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

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
async def login_with_google(token: str, db: Session = Depends(get_db)):
    """
    Autentica um usuário com token do Google OAuth2
    """
    user_data = verify_google_token(token)
    if not user_data:
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

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
async def refresh_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
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

    return {"access_token": access_token, "token_type": "bearer"}
