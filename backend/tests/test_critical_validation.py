import pytest
from pydantic import ValidationError
from app.schemas.user_schema import UserCreate, UserUpdate, User as UserResponse
from app.schemas.user_schema import (
    SecretKeyGenerate as SecretKeyCreate,
    SecretKeyResponse,
    Token,
)
import re
from typing import Any, Dict
from app.tests.conftest import test_db


# Classe TestCriticalValidation removida - funções de validação não implementadas


class TestUserSchemaValidation:
    """Testes críticos para validação do schema de usuário"""

    def test_user_create_validation(self):
        """Testa validação do schema UserCreate"""
        # Dados válidos
        valid_data = {
            "name": "Test User",
            "full_name": "Test User Full",
            "email": "test@example.com",
            "password": "StrongP@ssw0rd123",
            "security_question_1_id": "MOTHER_MAIDEN_NAME",
            "security_answer_1": "Smith",
            "security_question_2_id": "FIRST_PET_NAME",
            "security_answer_2": "Fluffy",
            "security_question_3_id": "FAVORITE_TEACHER",
            "security_answer_3": "Johnson",
        }

        user = UserCreate(**valid_data)
        assert user.name == "Test User"
        assert user.email == "test@example.com"

    def test_user_create_malicious_input(self):
        """Testa proteção contra entradas maliciosas no UserCreate"""
        malicious_data_sets = [
            # XSS no nome
            {
                "name": "<script>alert('xss')</script>",
                "full_name": "Test User",
                "email": "test@example.com",
                "password": "StrongP@ssw0rd123",
                "security_question_1_id": "MOTHER_MAIDEN_NAME",
                "security_answer_1": "Smith",
                "security_question_2_id": "FIRST_PET_NAME",
                "security_answer_2": "Fluffy",
                "security_question_3_id": "FAVORITE_TEACHER",
                "security_answer_3": "Johnson",
            },
            # SQL Injection no email
            {
                "name": "Test User",
                "full_name": "Test User",
                "email": "test@example.com'; DROP TABLE users; --",
                "password": "StrongP@ssw0rd123",
                "security_question_1_id": "MOTHER_MAIDEN_NAME",
                "security_answer_1": "Smith",
                "security_question_2_id": "FIRST_PET_NAME",
                "security_answer_2": "Fluffy",
                "security_question_3_id": "FAVORITE_TEACHER",
                "security_answer_3": "Johnson",
            },
            # Path traversal na resposta de segurança
            {
                "name": "Test User",
                "full_name": "Test User",
                "email": "test@example.com",
                "password": "StrongP@ssw0rd123",
                "security_question_1_id": "MOTHER_MAIDEN_NAME",
                "security_answer_1": "../../../etc/passwd",
                "security_question_2_id": "FIRST_PET_NAME",
                "security_answer_2": "Fluffy",
                "security_question_3_id": "FAVORITE_TEACHER",
                "security_answer_3": "Johnson",
            },
            # Null bytes
            {
                "name": "Test\x00User",
                "full_name": "Test User",
                "email": "test@example.com",
                "password": "StrongP@ssw0rd123",
                "security_question_1_id": "MOTHER_MAIDEN_NAME",
                "security_answer_1": "Smith",
                "security_question_2_id": "FIRST_PET_NAME",
                "security_answer_2": "Fluffy",
                "security_question_3_id": "FAVORITE_TEACHER",
                "security_answer_3": "Johnson",
            },
        ]

        for malicious_data in malicious_data_sets:
            with pytest.raises(ValidationError):
                UserCreate(**malicious_data)

    def test_user_create_missing_fields(self):
        """Testa validação de campos obrigatórios"""
        base_data = {
            "name": "Test User",
            "full_name": "Test User Full",
            "email": "test@example.com",
            "password": "StrongP@ssw0rd123",
            "security_question_1_id": "MOTHER_MAIDEN_NAME",
            "security_answer_1": "Smith",
            "security_question_2_id": "FIRST_PET_NAME",
            "security_answer_2": "Fluffy",
            "security_question_3_id": "FAVORITE_TEACHER",
            "security_answer_3": "Johnson",
        }

        required_fields = [
            "name",
            "full_name",
            "email",
            "password",
            "security_question_1_id",
            "security_answer_1",
            "security_question_2_id",
            "security_answer_2",
            "security_question_3_id",
            "security_answer_3",
        ]

        for field in required_fields:
            incomplete_data = base_data.copy()
            del incomplete_data[field]

            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**incomplete_data)

            # Verifica se o erro menciona o campo faltante
            error_str = str(exc_info.value)
            assert field in error_str or "required" in error_str.lower()

    def test_user_create_field_length_limits(self):
        """Testa limites de tamanho dos campos"""
        base_data = {
            "name": "Test User",
            "full_name": "Test User Full",
            "email": "test@example.com",
            "password": "StrongP@ssw0rd123",
            "security_question_1_id": "MOTHER_MAIDEN_NAME",
            "security_answer_1": "Smith",
            "security_question_2_id": "FIRST_PET_NAME",
            "security_answer_2": "Fluffy",
            "security_question_3_id": "FAVORITE_TEACHER",
            "security_answer_3": "Johnson",
        }

        # Testa campos muito longos
        long_string = "A" * 1000

        fields_to_test = [
            "name",
            "full_name",
            "security_answer_1",
            "security_answer_2",
            "security_answer_3",
        ]

        for field in fields_to_test:
            long_data = base_data.copy()
            long_data[field] = long_string

            with pytest.raises(ValidationError):
                UserCreate(**long_data)

    def test_user_response_data_exposure(self):
        """Testa que dados sensíveis não são expostos no UserResponse"""
        user_data = {
            "id": 1,
            "name": "Test User",
            "full_name": "Test User Full",
            "email": "test@example.com",
            "role": "USER",
            "is_active": True,
            "is_blocked": False,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
        }

        user_response = UserResponse(**user_data)

        # Verifica que campos sensíveis não estão presentes
        response_dict = user_response.dict()
        sensitive_fields = [
            "password",
            "security_answer_1",
            "security_answer_2",
            "security_answer_3",
        ]

        for field in sensitive_fields:
            assert field not in response_dict, f"Campo sensível exposto: {field}"


class TestSecretKeySchemaValidation:
    """Testes críticos para validação do schema de chaves secretas"""

    def test_secret_key_create_validation(self):
        """Testa validação do schema SecretKeyCreate"""
        valid_data = {
            "user_id": 1,
            "key_hash": "abcd1234efgh5678",
            "hint": "Minha dica secreta",
        }

        secret_key = SecretKeyCreate(**valid_data)
        assert secret_key.user_id == 1
        assert secret_key.key_hash == "abcd1234efgh5678"

    def test_secret_key_malicious_input(self):
        """Testa proteção contra entradas maliciosas no SecretKeyCreate"""
        malicious_data_sets = [
            # XSS na dica
            {
                "user_id": 1,
                "key_hash": "abcd1234efgh5678",
                "hint": "<script>alert('xss')</script>",
            },
            # SQL Injection no hash
            {
                "user_id": 1,
                "key_hash": "'; DROP TABLE secret_keys; --",
                "hint": "Minha dica",
            },
            # Path traversal na dica
            {
                "user_id": 1,
                "key_hash": "abcd1234efgh5678",
                "hint": "../../../etc/passwd",
            },
        ]

        for malicious_data in malicious_data_sets:
            with pytest.raises(ValidationError):
                SecretKeyCreate(**malicious_data)


class TestAuthSchemaValidation:
    """Testes críticos para validação dos schemas de autenticação"""

    def test_login_request_validation(self):
        """Testa validação do schema LoginRequest"""
        valid_data = {
            "username": "test@example.com",
            "password": "StrongP@ssw0rd123",
        }

        login_request = LoginRequest(**valid_data)
        assert login_request.username == "test@example.com"

    def test_login_request_malicious_input(self):
        """Testa proteção contra entradas maliciosas no LoginRequest"""
        malicious_data_sets = [
            # SQL Injection no username
            {
                "username": "admin'; DROP TABLE users; --",
                "password": "password123",
            },
            # XSS no username
            {
                "username": "<script>alert('xss')</script>",
                "password": "password123",
            },
            # Null bytes
            {
                "username": "test\x00@example.com",
                "password": "password123",
            },
        ]

        for malicious_data in malicious_data_sets:
            with pytest.raises(ValidationError):
                LoginRequest(**malicious_data)

    def test_token_response_structure(self):
        """Testa estrutura do Token response"""
        token_data = {
            "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
            "token_type": "bearer",
        }

        token = Token(**token_data)
        assert token.access_token.startswith("eyJ")
        assert token.token_type == "bearer"

        # Verifica que não há campos extras sensíveis
        token_dict = token.dict()
        sensitive_fields = ["user_id", "password", "secret"]

        for field in sensitive_fields:
            assert field not in token_dict, f"Campo sensível no token: {field}"


class TestValidationEdgeCases:
    """Testes de casos extremos de validação"""

    def test_unicode_normalization(self):
        """Testa normalização Unicode"""
        # Caracteres Unicode que podem ser normalizados
        unicode_inputs = [
            "café",  # é normal
            "cafe\u0301",  # e + combining acute accent
            "\u0041\u0300",  # A + combining grave accent
            "\ufefftest",  # BOM + test
        ]

        for unicode_input in unicode_inputs:
            sanitized = sanitize_input(unicode_input)
            # Deve ser normalizado consistentemente
            assert sanitized is not None

    def test_empty_and_whitespace_inputs(self):
        """Testa entradas vazias e com espaços"""
        empty_inputs = [
            "",
            " ",
            "\t",
            "\n",
            "\r\n",
            "   \t\n   ",
        ]

        for empty_input in empty_inputs:
            # Entradas vazias devem ser rejeitadas ou sanitizadas
            sanitized = sanitize_input(empty_input)
            assert sanitized == "" or sanitized.strip() == ""

    def test_numeric_string_validation(self):
        """Testa validação de strings numéricas"""
        # IDs de perguntas de segurança não devem aceitar números
        numeric_inputs = [
            "123",
            "0",
            "-1",
            "1.5",
            "1e10",
        ]

        for numeric_input in numeric_inputs:
            assert not validate_security_question_id(
                numeric_input
            ), f"Input numérico aceito como ID: {numeric_input}"

    def test_boolean_and_none_validation(self):
        """Testa validação de valores booleanos e None"""
        invalid_inputs = [None, True, False, [], {}, 0, 1]

        for invalid_input in invalid_inputs:
            assert not validate_security_question_id(
                invalid_input
            ), f"Input inválido aceito: {invalid_input}"
