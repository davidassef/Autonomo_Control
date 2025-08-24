"""Endpoints para consulta de CEP e autocompletar endereço."""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from app.services.cep_service import CEPService
from app.dependencies import get_current_user
from app.schemas.user_schema import UserInDB
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/cep/{cep}", response_model=Dict[str, Any])
async def get_address_by_cep(
    cep: str, current_user: UserInDB = Depends(get_current_user)
) -> Dict[str, Any]:
    """Busca dados de endereço pelo CEP.

    Args:
        cep: CEP a ser consultado (com ou sem formatação)
        current_user: Usuário autenticado

    Returns:
        Dados do endereço encontrado

    Raises:
        HTTPException: Se CEP não for encontrado ou houver erro na consulta
    """
    try:
        logger.info(f"Usuário {current_user.username} consultando CEP: {cep}")

        address_data = await CEPService.get_address_by_cep(cep)

        if not address_data:
            raise HTTPException(
                status_code=404,
                detail="CEP não encontrado. Verifique se o CEP está correto.",
            )

        logger.info(
            f"CEP {cep} encontrado com sucesso para usuário {current_user.username}"
        )

        return {
            "success": True,
            "data": address_data,
            "message": "Endereço encontrado com sucesso",
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(
            f"Erro ao consultar CEP {cep} para usuário {current_user.username}: {str(e)}"
        )
        raise HTTPException(
            status_code=500, detail="Erro interno do servidor ao consultar CEP"
        )


@router.get("/cep/{cep}/validate")
async def validate_cep(
    cep: str, current_user: UserInDB = Depends(get_current_user)
) -> Dict[str, Any]:
    """Valida formato do CEP sem fazer consulta completa.

    Args:
        cep: CEP a ser validado
        current_user: Usuário autenticado

    Returns:
        Resultado da validação
    """
    try:
        clean_cep = CEPService._clean_cep(cep)
        is_valid = CEPService._validate_cep_format(clean_cep)

        return {
            "success": True,
            "data": {
                "cep": cep,
                "clean_cep": clean_cep,
                "is_valid": is_valid,
                "formatted_cep": (
                    CEPService._format_cep(clean_cep) if is_valid else None
                ),
            },
            "message": "CEP válido" if is_valid else "CEP inválido",
        }

    except Exception as e:
        logger.error(f"Erro ao validar CEP {cep}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Erro interno do servidor ao validar CEP"
        )
