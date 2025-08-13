from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, UTC

from app.core.database import get_db
from app.dependencies import get_current_admin, get_current_master, require_master_password
from app.models.user import User
from app.schemas.user_schema import (
    User, UserCreate, RoleUpdate, StatusUpdate, 
    AdminVisibilityUpdate, UserHierarchyAction, UserListFilters
)
from app.services.audit_service import AuditService, AuditActions
from app.services.hierarchy_service import HierarchyService
from app.services import email_service
from app.core.security import get_password_hash

router = APIRouter(prefix="/admin/users", tags=["admin"])

@router.get("/", response_model=List[User])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
    role: Optional[str] = None,
    active: Optional[bool] = None,
    blocked: Optional[bool] = None,
    can_view_admins: Optional[bool] = None
):
    """
    Lista usuários baseado na hierarquia e permissões do usuário atual.
    
    - MASTER: Pode ver todos os usuários
    - ADMIN: Pode ver apenas usuários USER por padrão, ou ADMINs se permitido pelo MASTER
    """
    hierarchy_service = HierarchyService(db)
    
    filters = {
        "role": role,
        "active": active,
        "blocked": blocked,
        "can_view_admins": can_view_admins
    }
    
    # Remover filtros None
    filters = {k: v for k, v in filters.items() if v is not None}
    
    return hierarchy_service.get_visible_users(current_user, filters)

@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
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
    
    # Registrar log de auditoria
    AuditService.log_user_action(
        db=db,
        action=AuditActions.CREATE_USER,
        target_user=new_user,
        performed_by=current_user,
        description=f"Usuário {new_user.name} ({new_user.email}) criado com role {role_value}",
        details={"role": role_value, "created_by_role": current_user.role},
        request=request
    )
    
    return new_user

@router.patch("/{user_id}/role", response_model=User)
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
    
    old_role = user.role
    user.role = payload.role  # type: ignore[assignment]
    db.commit()
    db.refresh(user)
    
    # Registrar log de auditoria
    AuditService.log_user_action(
        db=db,
        action=AuditActions.CHANGE_USER_ROLE,
        target_user=user,
        performed_by=current_user,
        description=f"Role do usuário {user.name} alterada de {old_role} para {payload.role}",
        details={"old_role": old_role, "new_role": payload.role},
        request=request
    )
    
    return user

@router.patch("/{user_id}/status", response_model=User)
async def change_status(
    user_id: str,
    payload: StatusUpdate,
    request: Request,
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
    
    old_status = user.is_active
    user.is_active = bool(payload.is_active)  # type: ignore[assignment]
    db.commit()
    db.refresh(user)
    
    # Registrar log de auditoria
    status_text = "ativado" if payload.is_active else "desativado"
    AuditService.log_user_action(
        db=db,
        action=AuditActions.CHANGE_USER_STATUS,
        target_user=user,
        performed_by=current_user,
        description=f"Usuário {user.name} foi {status_text}",
        details={"old_status": old_status, "new_status": payload.is_active},
        request=request
    )
    
    return user


@router.post("/{user_id}/hierarchy", response_model=User)
async def manage_user_hierarchy(
    user_id: str,
    action: UserHierarchyAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_master)
):
    """
    Gerencia hierarquia de usuários (promover, rebaixar, bloquear, desbloquear).
    Apenas usuários MASTER podem usar este endpoint.
    """
    hierarchy_service = HierarchyService(db)
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if action.action == "promote":
        return hierarchy_service.promote_to_admin(current_user, target_user, action.reason)
    elif action.action == "demote":
        return hierarchy_service.demote_to_user(current_user, target_user, action.reason)
    elif action.action == "block":
        return hierarchy_service.block_user(current_user, target_user, action.reason)
    elif action.action == "unblock":
        return hierarchy_service.unblock_user(current_user, target_user, action.reason)
    else:
        raise HTTPException(
            status_code=400, 
            detail="Ação inválida. Use: promote, demote, block, unblock"
        )


@router.patch("/{user_id}/admin-visibility", response_model=User)
async def toggle_admin_visibility(
    user_id: str,
    payload: AdminVisibilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_master)
):
    """
    Controla se um usuário ADMIN pode ver outras contas ADMIN.
    Apenas usuários MASTER podem usar este endpoint.
    """
    hierarchy_service = HierarchyService(db)
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return hierarchy_service.toggle_admin_visibility(
        current_user, target_user, payload.can_view_admins
    )


@router.get("/hierarchy/stats")
async def get_hierarchy_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_master)
):
    """
    Retorna estatísticas da hierarquia de usuários.
    Apenas usuários MASTER podem acessar.
    """
    total_users = db.query(User).count()
    masters = db.query(User).filter(User.role == "MASTER").count()
    admins = db.query(User).filter(User.role == "ADMIN").count()
    users = db.query(User).filter(User.role == "USER").count()
    blocked_users = db.query(User).filter(User.blocked_at.isnot(None)).count()
    admins_with_visibility = db.query(User).filter(
        User.role == "ADMIN", User.can_view_admins == True
    ).count()
    
    return {
        "total_users": total_users,
        "by_role": {
            "MASTER": masters,
            "ADMIN": admins,
            "USER": users
        },
        "blocked_users": blocked_users,
        "admins_with_visibility": admins_with_visibility,
        "hierarchy_health": {
            "masters_ratio": round((masters / total_users) * 100, 2) if total_users > 0 else 0,
            "admins_ratio": round((admins / total_users) * 100, 2) if total_users > 0 else 0,
            "blocked_ratio": round((blocked_users / total_users) * 100, 2) if total_users > 0 else 0
        }
    }


@router.post("/{user_id}/reset-password", response_model=dict)
async def reset_user_password(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Reset senha do usuário e envia nova senha temporária por email."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if str(user.role) == 'MASTER':  # type: ignore[operator]
        raise HTTPException(status_code=400, detail="Não é possível resetar senha do MASTER")
    
    # Verificar se o usuário tem email válido
    if not user.email or '@' not in user.email:
        raise HTTPException(status_code=400, detail="Usuário não possui email válido")
    
    # Gerar senha temporária
    temp_password = email_service.generate_temporary_password()
    temp_password_hash = get_password_hash(temp_password)
    
    # Definir expiração para 24 horas
    expires_at = datetime.now(UTC) + timedelta(hours=24)
    
    # Atualizar usuário com senha temporária
    user.temp_password_hash = temp_password_hash  # type: ignore[assignment]
    user.temp_password_expires = expires_at  # type: ignore[assignment]
    user.password_reset_by = current_user.id  # type: ignore[assignment]
    user.updated_at = datetime.now(UTC)  # type: ignore[assignment]
    
    db.commit()
    
    # Enviar email com senha temporária
    email_sent = email_service.send_temporary_password_email(
        to_email=user.email,
        user_name=user.name,
        temp_password=temp_password
    )
    
    if not email_sent:
        # Reverter alterações se email falhou
        user.temp_password_hash = None  # type: ignore[assignment]
        user.temp_password_expires = None  # type: ignore[assignment]
        user.password_reset_by = None  # type: ignore[assignment]
        db.commit()
        raise HTTPException(status_code=500, detail="Falha ao enviar email com senha temporária")
    
    # Enviar notificação de reset
    email_service.send_password_reset_notification(
        to_email=user.email,
        user_name=user.name,
        admin_name=current_user.name
    )
    
    # Registrar log de auditoria
    AuditService.log_user_action(
        db=db,
        action=AuditActions.RESET_USER_PASSWORD,
        target_user=user,
        performed_by=current_user,
        description=f"Senha do usuário {user.name} foi resetada",
        details={"expires_at": expires_at.isoformat(), "email_sent": True},
        request=request
    )
    
    return {
        "message": "Senha resetada com sucesso",
        "email_sent": True,
        "expires_at": expires_at.isoformat()
    }


@router.post("/{user_id}/block", response_model=dict)
async def block_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Bloqueia um usuário, impedindo seu acesso ao sistema."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if str(user.role) == 'MASTER':  # type: ignore[operator]
        raise HTTPException(status_code=400, detail="Não é possível bloquear o MASTER")
    
    # ADMIN não pode bloquear outro ADMIN
    if str(current_user.role) == 'ADMIN' and str(user.role) == 'ADMIN':  # type: ignore[operator]
        raise HTTPException(status_code=403, detail="ADMIN não pode bloquear outro ADMIN")
    
    # Verificar se já está bloqueado
    if user.blocked_at:
        raise HTTPException(status_code=400, detail="Usuário já está bloqueado")
    
    # Bloquear usuário
    blocked_at = datetime.now(UTC)
    user.blocked_at = blocked_at  # type: ignore[assignment]
    user.blocked_by = current_user.id  # type: ignore[assignment]
    user.is_active = False  # type: ignore[assignment]
    user.updated_at = blocked_at  # type: ignore[assignment]
    
    db.commit()
    
    # Registrar log de auditoria
    AuditService.log_user_action(
        db=db,
        action=AuditActions.BLOCK_USER,
        target_user=user,
        performed_by=current_user,
        description=f"Usuário {user.name} foi bloqueado",
        details={"blocked_at": blocked_at.isoformat()},
        request=request
    )
    
    return {
        "message": f"Usuário {user.name} foi bloqueado com sucesso",
        "blocked_at": blocked_at.isoformat(),
        "blocked_by": current_user.name
    }


@router.post("/{user_id}/unblock", response_model=dict)
async def unblock_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Desbloqueia um usuário, permitindo seu acesso ao sistema."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # ADMIN não pode desbloquear outro ADMIN
    if str(current_user.role) == 'ADMIN' and str(user.role) == 'ADMIN':  # type: ignore[operator]
        raise HTTPException(status_code=403, detail="ADMIN não pode desbloquear outro ADMIN")
    
    # Verificar se está bloqueado
    if not user.blocked_at:
        raise HTTPException(status_code=400, detail="Usuário não está bloqueado")
    
    # Desbloquear usuário
    unblocked_at = datetime.now(UTC)
    user.blocked_at = None  # type: ignore[assignment]
    user.blocked_by = None  # type: ignore[assignment]
    user.is_active = True  # type: ignore[assignment]
    user.updated_at = unblocked_at  # type: ignore[assignment]
    
    db.commit()
    
    # Registrar log de auditoria
    AuditService.log_user_action(
        db=db,
        action=AuditActions.UNBLOCK_USER,
        target_user=user,
        performed_by=current_user,
        description=f"Usuário {user.name} foi desbloqueado",
        details={"unblocked_at": unblocked_at.isoformat()},
        request=request
    )
    
    return {
        "message": f"Usuário {user.name} foi desbloqueado com sucesso",
        "unblocked_at": unblocked_at.isoformat(),
        "unblocked_by": current_user.name
    }


@router.delete("/{user_id}", response_model=dict)
async def delete_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Exclui uma conta de usuário do sistema.
    
    Regras de segurança:
    - MASTER pode excluir qualquer usuário (exceto outros MASTERs)
    - ADMIN pode excluir apenas usuários USER
    - Não é possível excluir a própria conta
    - Registra ação de auditoria antes da exclusão
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Não permitir auto-exclusão
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="Não é possível excluir sua própria conta"
        )
    
    # Não permitir exclusão de MASTER
    if str(user.role) == 'MASTER':  # type: ignore[operator]
        raise HTTPException(
            status_code=400, 
            detail="Não é possível excluir conta MASTER"
        )
    
    # ADMIN só pode excluir usuários USER
    if str(current_user.role) == 'ADMIN' and str(user.role) == 'ADMIN':  # type: ignore[operator]
        raise HTTPException(
            status_code=403, 
            detail="ADMIN não pode excluir outro ADMIN"
        )
    
    # Registrar log de auditoria ANTES da exclusão
    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "was_blocked": user.blocked_at is not None
    }
    
    AuditService.log_user_action(
        db=db,
        action=AuditActions.DELETE_USER,
        target_user=user,
        performed_by=current_user,
        description=f"Usuário {user.name} ({user.email}) foi excluído do sistema",
        details={
            "deleted_user_data": user_data,
            "deletion_reason": "Administrative action",
            "performed_by_role": current_user.role
        },
        request=request
    )
    
    # Realizar a exclusão (hard delete)
    deleted_user_name = user.name
    deleted_user_email = user.email
    
    db.delete(user)
    db.commit()
    
    return {
        "message": f"Usuário {deleted_user_name} ({deleted_user_email}) foi excluído com sucesso",
        "deleted_at": datetime.now(UTC).isoformat(),
        "deleted_by": current_user.name,
        "deleted_by_role": current_user.role
    }
