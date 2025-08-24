import pytest
from unittest.mock import Mock, patch, AsyncMock
import httpx
from app.services.cep_service import CEPService, get_address_by_cep


class TestCEPService:
    """Testes para o serviço de CEP."""

    def setup_method(self):
        """Configuração para cada teste."""
        self.cep_service = CEPService()

    def test_clean_cep_valid(self):
        """Testa limpeza de CEP válido."""
        test_cases = [
            ("01310-100", "01310100"),
            ("01310100", "01310100"),
            (" 01310-100 ", "01310100"),
            ("01310 100", "01310100"),
            ("01.310-100", "01310100"),
        ]

        for input_cep, expected in test_cases:
            result = self.cep_service.clean_cep(input_cep)
            assert result == expected, f"CEP {input_cep} deveria resultar em {expected}"

    def test_clean_cep_invalid(self):
        """Testa limpeza de CEP inválido."""
        invalid_ceps = [
            "",
            "   ",
            "1234567",  # Muito curto
            "123456789",  # Muito longo
            "abcdefgh",  # Não numérico
            "12345-abc",
        ]

        for cep in invalid_ceps:
            with pytest.raises(ValueError) as exc_info:
                self.cep_service.clean_cep(cep)
            assert "CEP inválido" in str(exc_info.value)

    def test_validate_cep_format(self):
        """Testa validação de formato de CEP."""
        # CEPs válidos
        valid_ceps = ["01310100", "04038001", "20040020", "30112000"]

        for cep in valid_ceps:
            assert self.cep_service.validate_cep_format(cep) is True

        # CEPs inválidos
        invalid_ceps = [
            "1234567",  # Muito curto
            "123456789",  # Muito longo
            "abcdefgh",  # Não numérico
            "",
        ]

        for cep in invalid_ceps:
            assert self.cep_service.validate_cep_format(cep) is False

    def test_format_cep_valid(self):
        """Testa formatação de CEP válido."""
        test_cases = [
            ("01310100", "01310-100"),
            ("04038001", "04038-001"),
            ("20040020", "20040-020"),
        ]

        for cep, expected in test_cases:
            result = self.cep_service.format_cep(cep)
            assert result == expected

    def test_format_cep_invalid(self):
        """Testa formatação de CEP inválido."""
        invalid_ceps = ["1234567", "abcdefgh", ""]

        for cep in invalid_ceps:
            with pytest.raises(ValueError):
                self.cep_service.format_cep(cep)

    @pytest.mark.asyncio
    async def test_get_address_by_cep_success(self):
        """Testa busca de endereço por CEP com sucesso."""
        mock_response_data = {
            "cep": "01310-100",
            "logradouro": "Rua Augusta",
            "complemento": "",
            "bairro": "Consolação",
            "localidade": "São Paulo",
            "uf": "SP",
            "ibge": "3550308",
            "gia": "1004",
            "ddd": "11",
            "siafi": "7107",
        }

        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_response_data
            mock_get.return_value = mock_response

            result = await self.cep_service.get_address_by_cep("01310100")

            assert result is not None
            assert result["cep"] == "01310-100"
            assert result["street"] == "Rua Augusta"
            assert result["neighborhood"] == "Consolação"
            assert result["city"] == "São Paulo"
            assert result["state"] == "SP"

            # Verifica se a URL foi chamada corretamente
            mock_get.assert_called_once_with(
                "https://viacep.com.br/ws/01310100/json/", timeout=10.0
            )

    @pytest.mark.asyncio
    async def test_get_address_by_cep_not_found(self):
        """Testa busca de CEP não encontrado."""
        mock_response_data = {"erro": True}

        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_response_data
            mock_get.return_value = mock_response

            result = await self.cep_service.get_address_by_cep("99999999")

            assert result is None

    @pytest.mark.asyncio
    async def test_get_address_by_cep_http_error(self):
        """Testa erro HTTP na busca de CEP."""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = Mock()
            mock_response.status_code = 500
            mock_get.return_value = mock_response

            result = await self.cep_service.get_address_by_cep("01310100")

            assert result is None

    @pytest.mark.asyncio
    async def test_get_address_by_cep_timeout(self):
        """Testa timeout na busca de CEP."""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_get.side_effect = httpx.TimeoutException("Timeout")

            result = await self.cep_service.get_address_by_cep("01310100")

            assert result is None

    @pytest.mark.asyncio
    async def test_get_address_by_cep_request_error(self):
        """Testa erro de requisição na busca de CEP."""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_get.side_effect = httpx.RequestError("Connection error")

            result = await self.cep_service.get_address_by_cep("01310100")

            assert result is None

    @pytest.mark.asyncio
    async def test_get_address_by_cep_invalid_json(self):
        """Testa resposta com JSON inválido."""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.side_effect = ValueError("Invalid JSON")
            mock_get.return_value = mock_response

            result = await self.cep_service.get_address_by_cep("01310100")

            assert result is None

    @pytest.mark.asyncio
    async def test_get_address_by_cep_invalid_format(self):
        """Testa busca com CEP de formato inválido."""
        invalid_ceps = [
            "1234567",  # Muito curto
            "123456789",  # Muito longo
            "abcdefgh",  # Não numérico
            "",
        ]

        for cep in invalid_ceps:
            with pytest.raises(ValueError) as exc_info:
                await self.cep_service.get_address_by_cep(cep)
            assert "CEP inválido" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_address_by_cep_with_formatting(self):
        """Testa busca de CEP com formatação."""
        mock_response_data = {
            "cep": "01310-100",
            "logradouro": "Rua Augusta",
            "complemento": "",
            "bairro": "Consolação",
            "localidade": "São Paulo",
            "uf": "SP",
        }

        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_response_data
            mock_get.return_value = mock_response

            # Testa com CEP formatado
            result = await self.cep_service.get_address_by_cep("01310-100")

            assert result is not None
            assert result["cep"] == "01310-100"

            # Verifica se o CEP foi limpo antes da chamada
            mock_get.assert_called_once_with(
                "https://viacep.com.br/ws/01310100/json/", timeout=10.0
            )

    @pytest.mark.asyncio
    async def test_search_cep_by_address_placeholder(self):
        """Testa método placeholder para busca por endereço."""
        result = await self.cep_service.search_cep_by_address(
            "SP", "São Paulo", "Rua Augusta"
        )

        # Por enquanto deve retornar None (não implementado)
        assert result is None


class TestGetAddressByCEPFunction:
    """Testes para a função de conveniência get_address_by_cep."""

    @pytest.mark.asyncio
    async def test_get_address_by_cep_function_success(self):
        """Testa função de conveniência com sucesso."""
        mock_response_data = {
            "cep": "01310-100",
            "logradouro": "Rua Augusta",
            "complemento": "",
            "bairro": "Consolação",
            "localidade": "São Paulo",
            "uf": "SP",
        }

        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_response_data
            mock_get.return_value = mock_response

            result = await get_address_by_cep("01310100")

            assert result is not None
            assert result["street"] == "Rua Augusta"
            assert result["city"] == "São Paulo"

    @pytest.mark.asyncio
    async def test_get_address_by_cep_function_failure(self):
        """Testa função de conveniência com falha."""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_get.side_effect = httpx.RequestError("Connection error")

            result = await get_address_by_cep("01310100")

            assert result is None


class TestCEPServiceIntegration:
    """Testes de integração para o serviço de CEP."""

    @pytest.mark.asyncio
    async def test_full_workflow_success(self):
        """Testa fluxo completo de validação e busca."""
        cep_service = CEPService()

        # Mock da resposta da API
        mock_response_data = {
            "cep": "01310-100",
            "logradouro": "Rua Augusta",
            "complemento": "",
            "bairro": "Consolação",
            "localidade": "São Paulo",
            "uf": "SP",
        }

        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_response_data
            mock_get.return_value = mock_response

            # Testa com CEP formatado
            input_cep = "01310-100"

            # 1. Limpa o CEP
            clean_cep = cep_service.clean_cep(input_cep)
            assert clean_cep == "01310100"

            # 2. Valida o formato
            is_valid = cep_service.validate_cep_format(clean_cep)
            assert is_valid is True

            # 3. Busca o endereço
            result = await cep_service.get_address_by_cep(input_cep)

            assert result is not None
            assert result["cep"] == "01310-100"
            assert result["street"] == "Rua Augusta"

            # 4. Formata o CEP de volta
            formatted_cep = cep_service.format_cep(clean_cep)
            assert formatted_cep == "01310-100"

    @pytest.mark.asyncio
    async def test_full_workflow_invalid_cep(self):
        """Testa fluxo completo com CEP inválido."""
        cep_service = CEPService()

        invalid_cep = "1234567"  # Muito curto

        # Deve falhar na limpeza
        with pytest.raises(ValueError):
            cep_service.clean_cep(invalid_cep)

    @pytest.mark.asyncio
    async def test_full_workflow_api_failure(self):
        """Testa fluxo completo com falha na API."""
        cep_service = CEPService()

        with patch("httpx.AsyncClient.get") as mock_get:
            mock_get.side_effect = httpx.RequestError("Connection error")

            input_cep = "01310100"

            # Validação deve passar
            clean_cep = cep_service.clean_cep(input_cep)
            is_valid = cep_service.validate_cep_format(clean_cep)
            assert is_valid is True

            # Mas a busca deve falhar graciosamente
            result = await cep_service.get_address_by_cep(input_cep)
            assert result is None
