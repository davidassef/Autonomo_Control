from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.system_config_service import SystemConfigService

router = APIRouter(prefix="/system-config", tags=["System Configuration"])

# Schemas
class ConfigUpdateRequest(BaseModel):
    """Schema para atualização de configuração."""
    key: str = Field(..., description="Chave da configuração")
    value: Any = Field(..., description="Valor da configuração")

class MultipleConfigUpdateRequest(BaseModel):
    """Schema para atualização múltipla de configurações."""
    configs: Dict[str, Any] = Field(..., description="Dicionário de configurações")

class ConfigResponse(BaseModel):
    """Schema de resposta para configuração."""
    key: str
    value: Any
    type: str
    category: str
    is_public: bool
    updated_at: Optional[str] = None

class ConfigHistoryResponse(BaseModel):
    """Schema de resposta para histórico de configurações."""
    config_key: str
    config_value: str
    value_type: str
    category: str
    created_at: Optional[str]
    updated_at: Optional[str]
    is_active: bool
    updated_by: Dict[str, Optional[str]]

# Dependency para verificar se o usuário é MASTER
def require_master_user(current_user: User = Depends(get_current_user)):
    """Verifica se o usuário atual é MASTER."""
    if current_user.role != "MASTER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários MASTER podem acessar configurações do sistema"
        )
    return current_user

@router.get("/", response_model=Dict[str, Any])
async def get_all_configs(
    category: Optional[str] = None,
    public_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna todas as configurações do sistema."""
    try:
        # Se não for MASTER, só pode ver configurações públicas
        if current_user.role != "MASTER":
            public_only = True
        
        service = SystemConfigService(db)
        configs = service.get_all_configs(category=category, public_only=public_only)
        
        return {
            "success": True,
            "data": configs,
            "message": "Configurações recuperadas com sucesso"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar configurações: {str(e)}"
        )

@router.get("/public", response_model=Dict[str, Any])
async def get_public_configs(
    db: Session = Depends(get_db)
):
    """Retorna apenas as configurações públicas (não requer autenticação)."""
    try:
        service = SystemConfigService(db)
        configs = service.get_public_configs()
        
        return {
            "success": True,
            "data": configs,
            "message": "Configurações públicas recuperadas com sucesso"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar configurações públicas: {str(e)}"
        )

@router.get("/category/{category}", response_model=Dict[str, Any])
async def get_configs_by_category(
    category: str,
    current_user: User = Depends(require_master_user),
    db: Session = Depends(get_db)
):
    """Retorna configurações de uma categoria específica."""
    try:
        service = SystemConfigService(db)
        configs = service.get_configs_by_category(category)
        
        return {
            "success": True,
            "data": configs,
            "message": f"Configurações da categoria '{category}' recuperadas com sucesso"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar configurações da categoria: {str(e)}"
        )

@router.get("/key/{key}", response_model=Dict[str, Any])
async def get_config_by_key(
    key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna uma configuração específica."""
    try:
        service = SystemConfigService(db)
        
        # Verificar se a configuração existe e se o usuário pode acessá-la
        if current_user.role != "MASTER":
            # Usuários não-MASTER só podem ver configurações públicas
            public_configs = service.get_public_configs()
            if key not in public_configs:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Acesso negado a esta configuração"
                )
            value = public_configs[key]
        else:
            value = service.get_config(key)
        
        if value is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração não encontrada"
            )
        
        return {
            "success": True,
            "data": {key: value},
            "message": "Configuração recuperada com sucesso"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar configuração: {str(e)}"
        )

@router.put("/", response_model=Dict[str, Any])
async def update_config(
    request: ConfigUpdateRequest,
    current_user: User = Depends(require_master_user),
    db: Session = Depends(get_db)
):
    """Atualiza uma configuração específica."""
    try:
        service = SystemConfigService(db)
        
        # Validar o valor
        is_valid, error_message = service.validate_config_value(request.key, request.value)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # Atualizar configuração
        success = service.update_config(request.key, request.value, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao atualizar configuração"
            )
        
        return {
            "success": True,
            "message": f"Configuração '{request.key}' atualizada com sucesso"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar configuração: {str(e)}"
        )

@router.put("/multiple", response_model=Dict[str, Any])
async def update_multiple_configs(
    request: MultipleConfigUpdateRequest,
    current_user: User = Depends(require_master_user),
    db: Session = Depends(get_db)
):
    """Atualiza múltiplas configurações de uma vez."""
    try:
        service = SystemConfigService(db)
        
        # Validar todas as configurações primeiro
        validation_errors = []
        for key, value in request.configs.items():
            is_valid, error_message = service.validate_config_value(key, value)
            if not is_valid:
                validation_errors.append(f"{key}: {error_message}")
        
        if validation_errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erros de validação: {'; '.join(validation_errors)}"
            )
        
        # Atualizar configurações
        results = service.update_multiple_configs(request.configs, current_user.id)
        
        # Verificar se todas foram atualizadas com sucesso
        failed_updates = [key for key, success in results.items() if not success]
        
        if failed_updates:
            return {
                "success": False,
                "message": f"Algumas configurações falharam: {', '.join(failed_updates)}",
                "data": results
            }
        
        return {
            "success": True,
            "message": f"{len(request.configs)} configurações atualizadas com sucesso",
            "data": results
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar configurações: {str(e)}"
        )

@router.post("/reset", response_model=Dict[str, Any])
async def reset_to_defaults(
    current_user: User = Depends(require_master_user),
    db: Session = Depends(get_db)
):
    """Reseta todas as configurações para os valores padrão."""
    try:
        service = SystemConfigService(db)
        success = service.reset_to_defaults(current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao resetar configurações"
            )
        
        return {
            "success": True,
            "message": "Configurações resetadas para os valores padrão com sucesso"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao resetar configurações: {str(e)}"
        )

@router.post("/initialize", response_model=Dict[str, Any])
async def initialize_default_configs(
    current_user: User = Depends(require_master_user),
    db: Session = Depends(get_db)
):
    """Inicializa as configurações padrão no banco de dados."""
    try:
        service = SystemConfigService(db)
        success = service.initialize_default_configs(current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao inicializar configurações padrão"
            )
        
        return {
            "success": True,
            "message": "Configurações padrão inicializadas com sucesso"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao inicializar configurações: {str(e)}"
        )

@router.get("/history", response_model=Dict[str, Any])
async def get_config_history(
    key: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(require_master_user),
    db: Session = Depends(get_db)
):
    """Retorna o histórico de alterações das configurações."""
    try:
        service = SystemConfigService(db)
        history = service.get_config_history(key=key, limit=limit)
        
        return {
            "success": True,
            "data": history,
            "message": "Histórico de configurações recuperado com sucesso"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar histórico: {str(e)}"
        )

@router.get("/categories", response_model=Dict[str, Any])
async def get_config_categories(
    current_user: User = Depends(require_master_user),
    db: Session = Depends(get_db)
):
    """Retorna todas as categorias de configuração disponíveis."""
    try:
        service = SystemConfigService(db)
        categories = set()
        
        for config_data in service.default_configs.values():
            categories.add(config_data["category"])
        
        return {
            "success": True,
            "data": sorted(list(categories)),
            "message": "Categorias de configuração recuperadas com sucesso"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar categorias: {str(e)}"
        )