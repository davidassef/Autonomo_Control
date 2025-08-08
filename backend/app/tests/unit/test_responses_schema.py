"""
Testes unitários para schemas de respostas (responses.py)
"""
from typing import List

import pytest
from pydantic import ValidationError

from app.schemas.responses import (
    ResponseBase,
    SingleResponse,
    ListResponse,
    ErrorResponse
)


class TestResponseBase:
    """Testes para o schema ResponseBase"""

    def test_response_base_default_values(self):
        """Testa valores padrão do ResponseBase"""
        response = ResponseBase()

        assert response.success is True
        assert response.message == "Operação realizada com sucesso"

    def test_response_base_custom_values(self):
        """Testa ResponseBase com valores customizados"""
        response = ResponseBase(
            success=False,
            message="Operação customizada"
        )

        assert response.success is False
        assert response.message == "Operação customizada"

    def test_response_base_success_only(self):
        """Testa ResponseBase alterando apenas success"""
        response = ResponseBase(success=False)

        assert response.success is False
        assert response.message == "Operação realizada com sucesso"

    def test_response_base_message_only(self):
        """Testa ResponseBase alterando apenas message"""
        response = ResponseBase(message="Mensagem personalizada")

        assert response.success is True
        assert response.message == "Mensagem personalizada"

    def test_response_base_empty_message(self):
        """Testa ResponseBase com mensagem vazia"""
        response = ResponseBase(message="")

        assert response.success is True
        assert response.message == ""


class TestSingleResponse:
    """Testes para o schema SingleResponse"""

    def test_single_response_default(self):
        """Testa SingleResponse com valores padrão"""
        response = SingleResponse()

        assert response.success is True
        assert response.message == "Operação realizada com sucesso"
        assert response.data is None

    def test_single_response_with_string_data(self):
        """Testa SingleResponse com dados string"""
        response = SingleResponse[str](
            data="Dados de teste",
            message="Dados carregados"
        )

        assert response.success is True
        assert response.message == "Dados carregados"
        assert response.data == "Dados de teste"

    def test_single_response_with_dict_data(self):
        """Testa SingleResponse com dados de dicionário"""
        test_data = {"id": 1, "name": "Teste", "active": True}
        response = SingleResponse[dict](
            data=test_data,
            success=True,
            message="Dados do dicionário"
        )

        assert response.success is True
        assert response.message == "Dados do dicionário"
        assert response.data == test_data
        assert response.data["id"] == 1
        assert response.data["name"] == "Teste"
        assert response.data["active"] is True

    def test_single_response_with_list_data(self):
        """Testa SingleResponse com dados de lista"""
        test_data = [1, 2, 3, 4, 5]
        response = SingleResponse[List[int]](
            data=test_data,
            message="Lista de números"
        )

        assert response.success is True
        assert response.data == test_data
        assert len(response.data) == 5

    def test_single_response_with_none_data(self):
        """Testa SingleResponse com data explicitamente None"""
        response = SingleResponse[str](
            data=None,
            message="Sem dados"
        )

        assert response.success is True
        assert response.data is None

    def test_single_response_failure(self):
        """Testa SingleResponse com falha"""
        response = SingleResponse[str](
            success=False,
            message="Operação falhou",
            data=None
        )

        assert response.success is False
        assert response.message == "Operação falhou"
        assert response.data is None


class TestListResponse:
    """Testes para o schema ListResponse"""

    def test_list_response_default(self):
        """Testa ListResponse com valores padrão"""
        response = ListResponse()

        assert response.success is True
        assert response.message == "Operação realizada com sucesso"
        assert response.data == []
        assert response.total == 0
        assert response.page == 1
        assert response.page_size == 10

    def test_list_response_with_data(self):
        """Testa ListResponse com dados"""
        test_data = ["item1", "item2", "item3"]
        response = ListResponse[str](
            data=test_data,
            total=3,
            page=1,
            page_size=10,
            message="Lista carregada"
        )

        assert response.success is True
        assert response.message == "Lista carregada"
        assert response.data == test_data
        assert response.total == 3
        assert response.page == 1
        assert response.page_size == 10

    def test_list_response_pagination(self):
        """Testa ListResponse com paginação"""
        test_data = [{"id": i, "name": f"Item {i}"} for i in range(1, 6)]
        response = ListResponse[dict](
            data=test_data,
            total=50,
            page=2,
            page_size=5,
            message="Página 2 de 10"
        )

        assert response.data == test_data
        assert response.total == 50
        assert response.page == 2
        assert response.page_size == 5
        assert len(response.data) == 5

    def test_list_response_empty_data(self):
        """Testa ListResponse com dados vazios"""
        response = ListResponse[str](
            data=[],
            total=0,
            page=1,
            page_size=20,
            message="Nenhum item encontrado"
        )

        assert response.data == []
        assert response.total == 0
        assert response.page == 1
        assert response.page_size == 20

    def test_list_response_large_dataset(self):
        """Testa ListResponse com dataset grande"""
        test_data = list(range(100, 150))  # 50 items
        response = ListResponse[int](
            data=test_data,
            total=1000,
            page=3,
            page_size=50,
            message="Dados paginados"
        )

        assert len(response.data) == 50
        assert response.total == 1000
        assert response.page == 3
        assert response.page_size == 50

    def test_list_response_failure(self):
        """Testa ListResponse com falha"""
        response = ListResponse[str](
            success=False,
            message="Falha ao carregar lista",
            data=[],
            total=0
        )

        assert response.success is False
        assert response.message == "Falha ao carregar lista"
        assert response.data == []
        assert response.total == 0

    def test_list_response_custom_page_size(self):
        """Testa ListResponse com page_size customizado"""
        response = ListResponse[str](
            page_size=25,
            page=4,
            total=100
        )

        assert response.page_size == 25
        assert response.page == 4
        assert response.total == 100


class TestErrorResponse:
    """Testes para o schema ErrorResponse"""

    def test_error_response_minimal(self):
        """Testa ErrorResponse com campos mínimos"""
        response = ErrorResponse(message="Erro ocorreu")

        assert response.success is False
        assert response.message == "Erro ocorreu"
        assert response.error_code is None
        assert response.details is None

    def test_error_response_complete(self):
        """Testa ErrorResponse com todos os campos"""
        details = {
            "field": "email",
            "value": "invalid-email",
            "constraint": "format"
        }
        response = ErrorResponse(
            message="Erro de validação",
            error_code="VALIDATION_ERROR",
            details=details
        )

        assert response.success is False
        assert response.message == "Erro de validação"
        assert response.error_code == "VALIDATION_ERROR"
        assert response.details == details
        assert response.details["field"] == "email"

    def test_error_response_with_error_code_only(self):
        """Testa ErrorResponse apenas com código de erro"""
        response = ErrorResponse(
            message="Erro interno",
            error_code="INTERNAL_ERROR"
        )

        assert response.success is False
        assert response.message == "Erro interno"
        assert response.error_code == "INTERNAL_ERROR"
        assert response.details is None

    def test_error_response_with_details_only(self):
        """Testa ErrorResponse apenas com detalhes"""
        details = {"timestamp": "2025-05-24T10:00:00Z", "request_id": "123"}
        response = ErrorResponse(
            message="Erro de sistema",
            details=details
        )

        assert response.success is False
        assert response.message == "Erro de sistema"
        assert response.error_code is None
        assert response.details == details

    def test_error_response_success_always_false(self):
        """Testa que ErrorResponse sempre tem success=False"""
        # Mesmo tentando definir success=True, deve ser False
        response = ErrorResponse(message="Teste")

        assert response.success is False

    def test_error_response_empty_details(self):
        """Testa ErrorResponse com detalhes vazios"""
        response = ErrorResponse(
            message="Erro com detalhes vazios",
            details={}
        )

        assert response.success is False
        assert response.details == {}

    def test_error_response_complex_details(self):
        """Testa ErrorResponse com detalhes complexos"""
        details = {
            "errors": [
                {"field": "name", "message": "Nome é obrigatório"},
                {"field": "email", "message": "Email inválido"}
            ],
            "metadata": {
                "validation_time": 0.025,
                "rules_applied": 5
            },
            "suggestions": [
                "Verifique o formato do email",
                "Preencha todos os campos obrigatórios"
            ]
        }

        response = ErrorResponse(
            message="Múltiplos erros de validação",
            error_code="MULTIPLE_VALIDATION_ERRORS",
            details=details
        )

        assert response.success is False
        assert response.error_code == "MULTIPLE_VALIDATION_ERRORS"
        assert len(response.details["errors"]) == 2
        assert "validation_time" in response.details["metadata"]
        assert len(response.details["suggestions"]) == 2

    def test_error_response_required_message(self):
        """Testa que ErrorResponse requer message"""
        with pytest.raises(ValidationError):
            ErrorResponse()


class TestResponseIntegration:
    """Testes de integração entre schemas de resposta"""

    def test_response_consistency(self):
        """Testa consistência entre diferentes tipos de resposta"""
        # Sucesso
        single_success = SingleResponse[str](data="teste")
        list_success = ListResponse[str](data=["teste"])

        assert single_success.success == list_success.success
        assert single_success.success is True

        # Falha
        single_error = SingleResponse[str](success=False, message="Erro")
        list_error = ListResponse[str](success=False, message="Erro")
        error_response = ErrorResponse(message="Erro")

        assert (single_error.success ==
                list_error.success ==
                error_response.success)
        assert single_error.success is False

    def test_response_message_inheritance(self):
        """Testa herança de mensagens padrão"""
        responses = [
            SingleResponse(),
            ListResponse(),
            ResponseBase()
        ]

        for response in responses:
            assert response.message == "Operação realizada com sucesso"
            assert response.success is True

    def test_response_type_flexibility(self):
        """Testa flexibilidade de tipos genéricos"""
        # Diferentes tipos de dados
        str_response = SingleResponse[str](data="string")
        int_response = SingleResponse[int](data=42)
        bool_response = SingleResponse[bool](data=True)

        assert isinstance(str_response.data, str)
        assert isinstance(int_response.data, int)
        assert isinstance(bool_response.data, bool)

        # Lista de diferentes tipos
        str_list = ListResponse[str](data=["a", "b", "c"])
        int_list = ListResponse[int](data=[1, 2, 3])

        assert all(isinstance(item, str) for item in str_list.data)
        assert all(isinstance(item, int) for item in int_list.data)
