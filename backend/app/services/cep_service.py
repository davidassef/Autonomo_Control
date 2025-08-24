"""Serviço para integração com API ViaCEP para autocompletar endereços."""

import httpx
from typing import Optional, Dict, Any
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class AddressData(BaseModel):
    """Modelo para dados de endereço retornados pela API ViaCEP."""

    cep: str
    logradouro: str
    complemento: str
    bairro: str
    localidade: str  # cidade
    uf: str  # estado
    ibge: str
    gia: str
    ddd: str
    siafi: str
    erro: Optional[bool] = None


class CEPService:
    """Serviço para consulta de CEP via API ViaCEP."""

    BASE_URL = "https://viacep.com.br/ws"
    TIMEOUT = 10.0

    @classmethod
    async def get_address_by_cep(cls, cep: str) -> Optional[Dict[str, Any]]:
        """Busca dados de endereço pelo CEP.

        Args:
            cep: CEP a ser consultado (com ou sem formatação)

        Returns:
            Dict com dados do endereço ou None se não encontrado

        Raises:
            Exception: Em caso de erro na consulta
        """
        try:
            # Remove formatação do CEP
            clean_cep = cls._clean_cep(cep)

            if not cls._validate_cep_format(clean_cep):
                logger.warning(f"CEP inválido fornecido: {cep}")
                return None

            url = f"{cls.BASE_URL}/{clean_cep}/json/"

            async with httpx.AsyncClient(timeout=cls.TIMEOUT) as client:
                response = await client.get(url)
                response.raise_for_status()

                data = response.json()

                # Verifica se a API retornou erro
                if data.get("erro"):
                    logger.info(f"CEP não encontrado: {cep}")
                    return None

                # Valida e processa os dados
                address_data = AddressData(**data)

                return {
                    "cep": cls._format_cep(address_data.cep),
                    "street": address_data.logradouro,
                    "complement": address_data.complemento,
                    "neighborhood": address_data.bairro,
                    "city": address_data.localidade,
                    "state": address_data.uf,
                    "ibge_code": address_data.ibge,
                    "ddd": address_data.ddd,
                }

        except httpx.TimeoutException:
            logger.error(f"Timeout ao consultar CEP: {cep}")
            raise Exception("Timeout na consulta do CEP. Tente novamente.")

        except httpx.HTTPStatusError as e:
            logger.error(f"Erro HTTP ao consultar CEP {cep}: {e.response.status_code}")
            raise Exception("Erro na consulta do CEP. Serviço indisponível.")

        except Exception as e:
            logger.error(f"Erro inesperado ao consultar CEP {cep}: {str(e)}")
            raise Exception("Erro interno na consulta do CEP.")

    @classmethod
    def search_cep_by_address(cls, state: str, city: str, street: str) -> str:
        """Busca CEP por endereço (funcionalidade futura).

        Args:
            state: Estado (sigla)
            city: Cidade
            street: Logradouro

        Returns:
            URL para consulta manual (ViaCEP não suporta busca reversa via API)
        """
        # ViaCEP não oferece busca reversa via API JSON
        # Retorna URL para consulta manual
        base_url = "https://viacep.com.br"
        return f"{base_url}/{state}/{city}/{street}/"

    @staticmethod
    def _clean_cep(cep: str) -> str:
        """Remove formatação do CEP.

        Args:
            cep: CEP com ou sem formatação

        Returns:
            CEP apenas com números
        """
        import re

        return re.sub(r"[^0-9]", "", cep)

    @staticmethod
    def _validate_cep_format(cep: str) -> bool:
        """Valida formato do CEP.

        Args:
            cep: CEP apenas com números

        Returns:
            True se formato é válido
        """
        return len(cep) == 8 and cep.isdigit()

    @staticmethod
    def _format_cep(cep: str) -> str:
        """Formata CEP para exibição.

        Args:
            cep: CEP apenas com números

        Returns:
            CEP formatado (XXXXX-XXX)
        """
        if len(cep) == 8:
            return f"{cep[:5]}-{cep[5:]}"
        return cep


# Função de conveniência para uso direto
async def get_address_by_cep(cep: str) -> Optional[Dict[str, Any]]:
    """Função de conveniência para buscar endereço por CEP.

    Args:
        cep: CEP a ser consultado

    Returns:
        Dados do endereço ou None se não encontrado
    """
    return await CEPService.get_address_by_cep(cep)
