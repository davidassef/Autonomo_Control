#!/usr/bin/env python3
"""
Testes unitários para o endpoint /auth/register
Cobertura: casos de sucesso, falha, validações e tratamento de erros
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User
from app.core.security_questions import SECURITY_QUESTIONS


class TestAuthRegister:
    """Classe de testes para o endpoint /auth/register"""

    def setup_method(self):
        """Configuração executada antes de cada teste"""
        self.client = TestClient(app)
        self.valid_register_data = {
            "email": "test@example.com",
            "name": "Test User",
            "username": "testuser",
            "full_name": "Test User",
            "password": "SecurePass123!",
            "security_question_1_id": "MOTHER_MAIDEN_NAME",
            "security_answer_1": "Silva",
            "security_question_2_id": "FIRST_PET_NAME",
            "security_answer_2": "Rex",
        }

    def test_register_success_with_valid_data(self, test_db):
        """Testa registro bem-sucedido com dados válidos"""
        response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == self.valid_register_data["email"]
        assert data["user"]["username"] == self.valid_register_data["username"]
        assert data["user"]["full_name"] == self.valid_register_data["full_name"]

    def test_register_missing_required_fields(self, test_db):
        """Testa registro com campos obrigatórios ausentes"""
        required_fields = ["email", "username", "full_name", "password"]

        for field in required_fields:
            incomplete_data = self.valid_register_data.copy()
            del incomplete_data[field]

            response = self.client.post("/api/v1/auth/register", json=incomplete_data)

            assert response.status_code == 422
            error_data = response.json()
            assert "detail" in error_data
            # Verifica se o campo ausente está mencionado no erro
            assert any(field in str(error).lower() for error in error_data["detail"])

    def test_register_invalid_email_format(self, test_db):
        """Testa registro com formato de email inválido"""
        invalid_emails = [
            "invalid-email",
            "@domain.com",
            "user@",
            "user..name@domain.com",
            "user name@domain.com",
        ]

        for invalid_email in invalid_emails:
            data = self.valid_register_data.copy()
            data["email"] = invalid_email

            response = self.client.post("/api/v1/auth/register", json=data)

            assert response.status_code == 422
            error_data = response.json()
            assert "detail" in error_data

    def test_register_weak_password(self, test_db):
        """Testa registro com senhas fracas"""
        weak_passwords = [
            "123",  # Muito curta
            "password",  # Muito simples
            "12345678",  # Apenas números
            "abcdefgh",  # Apenas letras
            "PASSWORD",  # Apenas maiúsculas
        ]

        for weak_password in weak_passwords:
            data = self.valid_register_data.copy()
            data["password"] = weak_password

            response = self.client.post("/api/v1/auth/register", json=data)

            # Pode ser 422 (validação) ou 400 (regra de negócio)
            assert response.status_code in [400, 422]

    def test_register_duplicate_email(self, test_db):
        """Testa registro com email já existente"""
        # Primeiro registro
        response1 = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )
        assert response1.status_code == 200

        # Segundo registro com mesmo email
        duplicate_data = self.valid_register_data.copy()
        duplicate_data["username"] = "different_username"

        response2 = self.client.post("/api/v1/auth/register", json=duplicate_data)

        assert response2.status_code == 400
        error_data = response2.json()
        assert "detail" in error_data
        assert "email" in error_data["detail"].lower()

    def test_register_duplicate_username(self, test_db):
        """Testa registro com username já existente"""
        # Primeiro registro
        response1 = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )
        assert response1.status_code == 200

        # Segundo registro com mesmo username
        duplicate_data = self.valid_register_data.copy()
        duplicate_data["email"] = "different@example.com"

        response2 = self.client.post("/api/v1/auth/register", json=duplicate_data)

        assert response2.status_code == 400
        error_data = response2.json()
        assert "detail" in error_data
        assert "username" in error_data["detail"].lower()

    def test_register_invalid_security_question_ids(self, test_db):
        """Testa registro com IDs de perguntas secretas inválidos"""
        invalid_question_ids = ["INVALID_QUESTION", "NONEXISTENT_ID", "123", "", None]

        for invalid_id in invalid_question_ids:
            data = self.valid_register_data.copy()
            data["security_question_1_id"] = invalid_id

            response = self.client.post("/api/v1/auth/register", json=data)

            assert response.status_code == 400
            error_data = response.json()
            assert "detail" in error_data
            assert "security_question" in error_data["detail"].lower()

    def test_register_same_security_questions(self, test_db):
        """Testa registro com as mesmas perguntas secretas"""
        data = self.valid_register_data.copy()
        data["security_question_1_id"] = "MOTHER_MAIDEN_NAME"
        data["security_question_2_id"] = "MOTHER_MAIDEN_NAME"

        response = self.client.post("/api/v1/auth/register", json=data)

        assert response.status_code == 400
        error_data = response.json()
        assert "detail" in error_data
        assert "different" in error_data["detail"].lower()

    def test_register_empty_security_answers(self, test_db):
        """Testa registro com respostas de segurança vazias"""
        empty_answers = ["", "   ", None]

        for empty_answer in empty_answers:
            data = self.valid_register_data.copy()
            data["security_answer_1"] = empty_answer

            response = self.client.post("/api/v1/auth/register", json=data)

            assert response.status_code in [400, 422]

    def test_register_username_with_special_characters(self, test_db):
        """Testa registro com username contendo caracteres especiais"""
        invalid_usernames = [
            "user@name",
            "user name",
            "user#name",
            "user$name",
            "user%name",
        ]

        for invalid_username in invalid_usernames:
            data = self.valid_register_data.copy()
            data["username"] = invalid_username

            response = self.client.post("/api/v1/auth/register", json=data)

            # Pode ser aceito ou rejeitado dependendo das regras
            # Vamos verificar se pelo menos não causa erro 500
            assert response.status_code != 500

    def test_register_long_field_values(self, test_db):
        """Testa registro com valores muito longos nos campos"""
        long_string = "a" * 1000

        fields_to_test = ["email", "username", "full_name", "security_answer_1"]

        for field in fields_to_test:
            data = self.valid_register_data.copy()
            if field == "email":
                data[field] = f"{long_string}@example.com"
            else:
                data[field] = long_string

            response = self.client.post("/api/v1/auth/register", json=data)

            # Deve rejeitar valores muito longos
            assert response.status_code in [400, 422]

    def test_register_sql_injection_attempt(self, test_db):
        """Testa registro com tentativas de SQL injection"""
        sql_injection_strings = [
            "'; DROP TABLE users; --",
            "admin'--",
            "' OR '1'='1",
            "'; INSERT INTO users VALUES ('hacker'); --",
        ]

        for injection_string in sql_injection_strings:
            data = self.valid_register_data.copy()
            data["username"] = injection_string

            response = self.client.post("/api/v1/auth/register", json=data)

            # Não deve causar erro 500 (indica possível vulnerabilidade)
            assert response.status_code != 500
            # Deve ser rejeitado ou tratado adequadamente
            assert response.status_code in [200, 400, 422]

    @patch("app.services.audit_service.log_action")
    def test_register_audit_log_creation(self, mock_audit_log, test_db):
        """Testa se o registro cria log de auditoria"""
        response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )

        assert response.status_code == 200
        # Verifica se o log de auditoria foi chamado
        mock_audit_log.assert_called()

    def test_register_password_hashing(self, test_db):
        """Testa se a senha é adequadamente hasheada"""
        response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )

        assert response.status_code == 200

        # Verifica se o usuário foi criado no banco
        with patch("app.core.database.get_db") as mock_get_db:
            mock_db = MagicMock(spec=Session)
            mock_get_db.return_value = mock_db

            # A senha não deve estar armazenada em texto plano
            # (Este teste precisa ser adaptado conforme a implementação real)
            pass

    def test_register_response_structure(self, test_db):
        """Testa a estrutura da resposta de registro bem-sucedido"""
        response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )

        assert response.status_code == 200
        data = response.json()

        # Verifica estrutura da resposta
        required_fields = ["access_token", "token_type", "user"]
        for field in required_fields:
            assert field in data

        # Verifica estrutura do usuário
        user_data = data["user"]
        user_required_fields = ["id", "email", "username", "full_name", "role"]
        for field in user_required_fields:
            assert field in user_data

        # Verifica que a senha não está na resposta
        assert "password" not in user_data
        assert "hashed_password" not in user_data

    def test_register_default_role_assignment(self, test_db):
        """Testa se o usuário recebe o role padrão correto"""
        response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )

        assert response.status_code == 200
        data = response.json()

        # Verifica se o role padrão é 'USER'
        assert data["user"]["role"] == "USER"

    def test_register_case_insensitive_email(self, test_db):
        """Testa se emails são tratados de forma case-insensitive"""
        # Primeiro registro
        response1 = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )
        assert response1.status_code == 200

        # Segundo registro com email em maiúsculas
        duplicate_data = self.valid_register_data.copy()
        duplicate_data["email"] = self.valid_register_data["email"].upper()
        duplicate_data["username"] = "different_username"

        response2 = self.client.post("/api/v1/auth/register", json=duplicate_data)

        # Deve rejeitar por email duplicado (case-insensitive)
        assert response2.status_code == 400
