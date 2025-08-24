from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user_schema import (
    SecretKeyGenerate,
    SecretKeyResponse,
    PasswordResetBySecretKey,
)
from app.services.secret_key_service import SecretKeyService


router = APIRouter(prefix="/secret-keys", tags=["secret-keys"])


@router.post("/generate", response_model=SecretKeyResponse)
def generate_secret_key(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Gera uma nova chave secreta para o usuário Master.

    Apenas usuários com role MASTER podem gerar chaves secretas.

    Returns:
        Dict contendo a chave secreta gerada e informações adicionais

    Raises:
        HTTPException: Se o usuário não for Master
    """
    # Verificar se o usuário atual é Master
    if str(current_user.role) != "MASTER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários Master podem gerar chaves secretas",
        )

    try:
        # Gerar nova chave secreta
        secret_key = SecretKeyService.create_secret_key_for_master(
            db=db, master_user_id=current_user.id
        )

        return {
            "secret_key": secret_key,
            "message": "Chave secreta gerada com sucesso",
            "expires_in_days": 90,
            "warning": "Guarde esta chave em local seguro. Ela não será exibida novamente.",
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao gerar chave secreta",
        )


@router.get("/status")
def get_secret_key_status(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Verifica o status da chave secreta do usuário Master.

    Returns:
        Dict com informações sobre o status da chave secreta

    Raises:
        HTTPException: Se o usuário não for Master
    """
    # Verificar se o usuário atual é Master
    if str(current_user.role) != "MASTER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários Master podem verificar status de chaves secretas",
        )

    try:
        has_valid_key = SecretKeyService.has_valid_secret_key(
            db=db, master_user_id=current_user.id
        )

        response = {
            "has_secret_key": has_valid_key,
            "created_at": (
                current_user.secret_key_created_at.isoformat()
                if current_user.secret_key_created_at
                else None
            ),
            "used_at": (
                current_user.secret_key_used_at.isoformat()
                if current_user.secret_key_used_at
                else None
            ),
        }

        if current_user.secret_key_created_at:
            from datetime import datetime, timedelta

            expiry_date = current_user.secret_key_created_at + timedelta(days=90)
            response["expires_at"] = expiry_date.isoformat()
            response["is_expired"] = datetime.utcnow() > expiry_date

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao verificar status da chave secreta",
        )


@router.post("/reset-password")
def reset_password_by_secret_key(
    payload: PasswordResetBySecretKey, db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Redefine a senha do Master usando chave secreta.

    Args:
        payload: Dados contendo username, chave secreta e nova senha

    Returns:
        Dict com mensagem de sucesso

    Raises:
        HTTPException: Se a chave secreta for inválida ou expirada
    """
    try:
        # Validar chave secreta
        user = SecretKeyService.validate_secret_key_for_reset(
            db=db, username=payload.username, secret_key=payload.secret_key
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chave secreta inválida, expirada ou usuário não encontrado",
            )

        # Redefinir senha
        UserService.update_password(db=db, user=user, new_password=payload.new_password)

        # Marcar chave como usada
        SecretKeyService.mark_secret_key_as_used(db=db, user=user)

        return {"message": "Senha redefinida com sucesso usando chave secreta"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao redefinir senha",
        )


@router.delete("/revoke")
def revoke_secret_key(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Revoga a chave secreta atual do usuário Master.

    Returns:
        Dict com mensagem de sucesso

    Raises:
        HTTPException: Se o usuário não for Master
    """
    # Verificar se o usuário atual é Master
    if str(current_user.role) != "MASTER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários Master podem revogar chaves secretas",
        )

    try:
        # Remover chave secreta
        current_user.secret_key_hash = None
        current_user.secret_key_created_at = None
        current_user.secret_key_used_at = None

        db.commit()

        return {"message": "Chave secreta revogada com sucesso"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao revogar chave secreta",
        )
