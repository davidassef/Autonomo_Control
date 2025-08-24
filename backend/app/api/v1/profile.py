from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, UTC

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User as UserModel
from app.schemas.user_schema import CompleteProfileUpdate, User
from app.services.audit_service import AuditService, AuditActions

router = APIRouter()


@router.get("/profile/status")
async def get_profile_status(
    db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)
):
    """
    Verifica se o usuário precisa completar o perfil.
    """
    return {
        "requires_complete_profile": current_user.requires_complete_profile,
        "profile_completed_at": current_user.profile_completed_at,
        "role": current_user.role,
    }


@router.patch("/profile/complete", response_model=User)
async def complete_profile(
    profile_data: CompleteProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Completa o perfil obrigatório do usuário quando promovido a administrador.
    """
    if not current_user.requires_complete_profile:
        raise HTTPException(
            status_code=400, detail="Perfil não requer preenchimento obrigatório"
        )

    # Atualizar os campos do perfil
    current_user.cpf = profile_data.cpf
    current_user.birth_date = profile_data.birth_date
    current_user.phone = profile_data.phone
    current_user.cep = profile_data.cep
    current_user.street = profile_data.street
    current_user.number = profile_data.number
    current_user.complement = profile_data.complement
    current_user.neighborhood = profile_data.neighborhood
    current_user.city = profile_data.city
    current_user.state = profile_data.state

    # Marcar como completado
    current_user.requires_complete_profile = False
    current_user.profile_completed_at = datetime.now(UTC)
    current_user.updated_at = datetime.now(UTC)

    db.commit()
    db.refresh(current_user)

    # Registrar log de auditoria
    AuditService.log_user_action(
        db=db,
        action=AuditActions.UPDATE_PROFILE,
        target_user=current_user,
        performed_by=current_user,
        description=f"Usuário {current_user.name} completou perfil obrigatório",
        details={"completed_at": current_user.profile_completed_at.isoformat()},
        request=request,
    )

    return current_user
