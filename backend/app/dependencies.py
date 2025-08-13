from fastapi import Depends, HTTPException, status, Request
import hmac
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import verify_token
from app.core.database import get_db
from app.models.user import User
from app.schemas.user_schema import TokenData
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Dependência para obter o usuário atual a partir do token JWT
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_data = verify_token(token)
    if token_data is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception

    if not bool(user.is_active):  # type: ignore[arg-type]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    
    # Verificar se o usuário está bloqueado
    if getattr(user, 'blocked_at', None) is not None:  # type: ignore[attr-defined]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário bloqueado pelo administrador"
        )

    # Backfill defensivo: alguns registros legados podem ter role NULL
    if getattr(user, 'role', None) is None:  # type: ignore[attr-defined]
        user.role = 'USER'  # type: ignore[assignment]
        try:
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()

    return user


async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ("ADMIN", "MASTER"):  # type: ignore[operator]
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ação não permitida")
    return current_user


async def get_current_master(current_user: User = Depends(get_current_user)):
    if current_user.role != "MASTER":  # type: ignore[operator]
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ação restrita ao MASTER")
    return current_user


def require_master_password(request: Request):
    if not settings.MASTER_PASSWORD:
        raise HTTPException(status_code=500, detail="MASTER_PASSWORD não configurada")
    provided = request.headers.get("X-Master-Key")
    if not provided or not hmac.compare_digest(provided, settings.MASTER_PASSWORD):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Master password inválida")
