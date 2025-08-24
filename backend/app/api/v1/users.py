from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.user_schema import User, UserUpdate, UserCreate
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["usuários"])


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    """Cria um novo usuário manual (fluxo alternativo ao Google OAuth).

    Regras:
    - Email deve ser único
    - Para agora, gera uma senha hash padrão se não existir (ex: first-login)
    - Pode ser extendido depois para aceitar senha explícita
    """
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado"
        )

    # Senha placeholder opcional para permitir login tradicional se necessário
    hashed_password = get_password_hash("changeme")
    new_user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hashed_password,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/", response_model=List[User])
async def read_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retorna a lista de usuários cadastrados
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/me", response_model=User)
async def read_current_user(current_user: User = Depends(get_current_user)):
    """
    Retorna os dados do usuário autenticado
    """
    return current_user


@router.get("/{user_id}", response_model=User)
async def read_user_by_id(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna os dados de um usuário específico pelo ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )
    return user


@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Atualiza os dados do usuário autenticado
    """
    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)

    return current_user
