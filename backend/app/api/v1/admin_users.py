from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.user import User
from app.schemas.user_schema import (
    User as UserSchema,
    UserCreate,
    UserUpdate,
    RoleUpdate,
    StatusUpdate,
)
from app.dependencies import get_current_admin, get_current_master, require_master_password
from app.core.security import get_password_hash

router = APIRouter(prefix="/admin/users", tags=["admin"])

@router.get("/", response_model=List[UserSchema])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
    role: Optional[str] = None,
    active: Optional[bool] = None
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if active is not None:
        q = q.filter(User.is_active == active)
    return q.order_by(User.created_at.desc()).all()

@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user_admin(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    # ROLE selection via query/body extension (simplified: only USER by default unless MASTER sets ?role=ADMIN)
    desired_role = request.query_params.get('role')
    if desired_role == 'ADMIN':
        # Only MASTER can create ADMIN and must provide master password
        if str(current_user.role) != 'MASTER':  # type: ignore[operator]
            raise HTTPException(status_code=403, detail="Apenas MASTER cria ADMIN")
        require_master_password(request)
    elif desired_role and desired_role not in ('USER', 'ADMIN'):
        raise HTTPException(status_code=400, detail="Role inválida")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    role_value = desired_role if desired_role in ('USER', 'ADMIN') else 'USER'
    new_user = User(email=payload.email, name=payload.name, role=role_value, is_active=True,
                    hashed_password=get_password_hash('changeme'))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.patch("/{user_id}/role", response_model=UserSchema)
async def change_role(
    user_id: str,
    payload: RoleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_master)
):
    require_master_password(request)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if str(user.role) == 'MASTER':  # type: ignore[operator]
        raise HTTPException(status_code=400, detail="Não alterar role do MASTER")
    if payload.role not in ('USER', 'ADMIN'):
        raise HTTPException(status_code=400, detail="Role inválida")
    user.role = payload.role  # type: ignore[assignment]
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/status", response_model=UserSchema)
async def change_status(
    user_id: str,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if str(user.role) == 'MASTER':  # type: ignore[operator]
        raise HTTPException(status_code=400, detail="Não desativar MASTER")
    if str(current_user.role) == 'ADMIN' and str(user.role) == 'ADMIN':  # type: ignore[operator]
        raise HTTPException(status_code=403, detail="ADMIN não desativa ADMIN")
    user.is_active = bool(payload.is_active)  # type: ignore[assignment]
    db.commit()
    db.refresh(user)
    return user
