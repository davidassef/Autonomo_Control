#!/usr/bin/env python3
"""
Testes específicos para validação de campos no endpoint /auth/register
Cobertura: validações de schema, regras de negócio, sanitização de dados
"""

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.user_schema import UserCreate
from app.core.security_questions import SECURITY_QUESTIONS


class TestFieldValidations:
    """Classe de testes para validações de campos"""

    def setup_method(self):
        """Configuração executada antes de cada teste"""
        self.client = TestClient(app)
        self.base_valid_data = {
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

    # ===== TESTES DE VALIDAÇÃO DE EMAIL =====

    def test_email_required(self, test_db):
        """Testa se o campo email é obrigatório"""
        data = self.base_valid_data.copy()
        del data["email"]

        response = self.client.post("/api/v1/auth/register", json=data)

        assert response.status_code == 422
        error_data = response.json()
        assert "detail" in error_data
        assert any("email" in str(error).lower() for error in error_data["detail"])

    def test_email_format_validation(self, test_db):
        """Testa validação de formato de email"""
        invalid_emails = [
            "invalid-email",
            "@domain.com",
            "user@",
            "user..name@domain.com",
            "user name@domain.com",
            "user@domain",
            "user@.com",
            "user@domain.",
            "",
            "   ",
            "user@domain..com",
        ]

        for invalid_email in invalid_emails:
            data = self.base_valid_data.copy()
            data["email"] = invalid_email

            response = self.client.post("/api/v1/auth/register", json=data)

            assert (
                response.status_code == 422
            ), f"Email '{invalid_email}' deveria ser inválido"
            error_data = response.json()
            assert "detail" in error_data

    def test_email_length_limits(self, test_db):
        """Testa limites de tamanho do email"""
        # Email muito longo
        long_email = "a" * 200 + "@example.com"
        data = self.base_valid_data.copy()
        data["email"] = long_email

        response = self.client.post("/api/v1/auth/register", json=data)
        assert response.status_code in [400, 422]

    def test_email_case_normalization(self, test_db):
        """Testa se emails são normalizados para minúsculas"""
        data = self.base_valid_data.copy()
        data["email"] = "TEST@EXAMPLE.COM"

        response = self.client.post("/api/v1/auth/register", json=data)

        if response.status_code == 200:
            user_data = response.json()["user"]
            assert user_data["email"] == "test@example.com"

    # ===== TESTES DE VALIDAÇÃO DE USERNAME =====

    def test_username_required(self, test_db):
        """Testa se o campo username é obrigatório"""
        data = self.base_valid_data.copy()
        del data["username"]

        response = self.client.post("/api/v1/auth/register", json=data)

        assert response.status_code == 422
        error_data = response.json()
        assert "detail" in error_data
        assert any("username" in str(error).lower() for error in error_data["detail"])

    def test_username_format_validation(self, test_db):
        """Testa validação de formato de username"""
        invalid_usernames = [
            "",
            "   ",
            "a",  # Muito curto
            "ab",  # Muito curto
            "user name",  # Espaços
            "user@name",  # Caracteres especiais
            "user#name",
            "user$name",
            "user%name",
            "user&name",
            "user*name",
            "user+name",
            "user=name",
            "user!name",
        ]

        for invalid_username in invalid_usernames:
            data = self.base_valid_data.copy()
            data["username"] = invalid_username
            data["email"] = f"test{len(invalid_username)}@example.com"  # Email único

            response = self.client.post("/api/v1/auth/register", json=data)

            # Deve ser rejeitado por validação
            assert response.status_code in [
                400,
                422,
            ], f"Username '{invalid_username}' deveria ser inválido"

    def test_username_valid_formats(self, test_db):
        """Testa formatos válidos de username"""
        valid_usernames = [
            "user123",
            "test_user",
            "user-name",
            "user.name",
            "123user",
            "user123test",
            "a" * 20,  # Username longo mas válido
        ]

        for i, valid_username in enumerate(valid_usernames):
            data = self.base_valid_data.copy()
            data["username"] = valid_username
            data["email"] = f"test{i}@example.com"  # Email único

            response = self.client.post("/api/v1/auth/register", json=data)

            # Deve ser aceito
            assert (
                response.status_code == 200
            ), f"Username '{valid_username}' deveria ser válido"

    def test_username_length_limits(self, test_db):
        """Testa limites de tamanho do username"""
        # Username muito longo
        long_username = "a" * 100
        data = self.base_valid_data.copy()
        data["username"] = long_username

        response = self.client.post("/api/v1/auth/register", json=data)
        assert response.status_code in [400, 422]

    # ===== TESTES DE VALIDAÇÃO DE FULL_NAME =====

    def test_full_name_required(self, test_db):
        """Testa se o campo full_name é obrigatório"""
        data = self.base_valid_data.copy()
        del data["full_name"]

        response = self.client.post("/api/v1/auth/register", json=data)

        assert response.status_code == 422
        error_data = response.json()
        assert "detail" in error_data
        assert any("full_name" in str(error).lower() for error in error_data["detail"])

    def test_full_name_format_validation(self, test_db):
        """Testa validação de formato de nome completo"""
        invalid_names = [
            "",
            "   ",
            "A",  # Muito curto
            "12345",  # Apenas números
            "@#$%",  # Apenas símbolos
        ]

        for invalid_name in invalid_names:
            data = self.base_valid_data.copy()
            data["full_name"] = invalid_name
            data["email"] = f"test{len(invalid_name)}@example.com"
            data["username"] = f"test{len(invalid_name)}"

            response = self.client.post("/api/v1/auth/register", json=data)

            assert response.status_code in [
                400,
                422,
            ], f"Nome '{invalid_name}' deveria ser inválido"

    def test_full_name_valid_formats(self, test_db):
        """Testa formatos válidos de nome completo"""
        valid_names = [
            "João Silva",
            "Maria da Silva Santos",
            "José Carlos",
            "Ana Beatriz",
            "Pedro Henrique dos Santos",
            "Ação Oliveira",  # Com acentos
            "José da Silva Jr.",  # Com pontuação
            "Mary O'Connor",  # Com apóstrofe
            "Jean-Pierre Dupont",  # Com hífen
        ]

        for i, valid_name in enumerate(valid_names):
            data = self.base_valid_data.copy()
            data["full_name"] = valid_name
            data["email"] = f"test{i}@example.com"
            data["username"] = f"test{i}"

            response = self.client.post("/api/v1/auth/register", json=data)

            assert (
                response.status_code == 200
            ), f"Nome '{valid_name}' deveria ser válido"

    def test_full_name_length_limits(self, test_db):
        """Testa limites de tamanho do nome completo"""
        # Nome muito longo
        long_name = "João " * 50  # Nome muito longo
        data = self.base_valid_data.copy()
        data["full_name"] = long_name

        response = self.client.post("/api/v1/auth/register", json=data)
        assert response.status_code in [400, 422]

    # ===== TESTES DE VALIDAÇÃO DE PASSWORD =====

    def test_password_required(self, test_db):
        """Testa se o campo password é obrigatório"""
        data = self.base_valid_data.copy()
        del data["password"]

        response = self.client.post("/api/v1/auth/register", json=data)

        assert response.status_code == 422
        error_data = response.json()
        assert "detail" in error_data
        assert any("password" in str(error).lower() for error in error_data["detail"])

    def test_password_strength_validation(self, test_db):
        """Testa validação de força da senha"""
        weak_passwords = [
            "",
            "123",
            "password",
            "12345678",
            "abcdefgh",
            "PASSWORD",
            "Password",  # Sem números ou símbolos
            "pass123",  # Muito curta
            "   ",  # Apenas espaços
        ]

        for weak_password in weak_passwords:
            data = self.base_valid_data.copy()
            data["password"] = weak_password
            data["email"] = f"test{len(weak_password)}@example.com"
            data["username"] = f"test{len(weak_password)}"

            response = self.client.post("/api/v1/auth/register", json=data)

            # Deve ser rejeitado por ser fraca
            assert response.status_code in [
                400,
                422,
            ], f"Senha '{weak_password}' deveria ser rejeitada"

    def test_password_valid_formats(self, test_db):
        """Testa formatos válidos de senha"""
        valid_passwords = [
            "SecurePass123!",
            "MyP@ssw0rd",
            "Str0ng#P@ss",
            "C0mpl3x$Pass",
            "V@lid123Pass",
            "S3cur3!P@ssw0rd",
        ]

        for i, valid_password in enumerate(valid_passwords):
            data = self.base_valid_data.copy()
            data["password"] = valid_password
            data["email"] = f"test{i}@example.com"
            data["username"] = f"test{i}"

            response = self.client.post("/api/v1/auth/register", json=data)

            assert (
                response.status_code == 200
            ), f"Senha '{valid_password}' deveria ser válida"

    # ===== TESTES DE VALIDAÇÃO DE PERGUNTAS SECRETAS =====

    def test_security_questions_required(self, test_db):
        """Testa se as perguntas secretas são obrigatórias"""
        required_fields = [
            "security_question_1_id",
            "security_answer_1",
            "security_question_2_id",
            "security_answer_2",
        ]

        for field in required_fields:
            data = self.base_valid_data.copy()
            del data[field]

            response = self.client.post("/api/v1/auth/register", json=data)

            assert (
                response.status_code == 422
            ), f"Campo '{field}' deveria ser obrigatório"
            error_data = response.json()
            assert "detail" in error_data

    def test_security_answers_not_empty(self, test_db):
        """Testa se as respostas de segurança não podem ser vazias"""
        empty_values = ["", "   ", "\t", "\n"]

        for empty_value in empty_values:
            data = self.base_valid_data.copy()
            data["security_answer_1"] = empty_value

            response = self.client.post("/api/v1/auth/register", json=data)

            assert response.status_code in [
                400,
                422,
            ], f"Resposta vazia '{repr(empty_value)}' deveria ser rejeitada"

    def test_security_answers_length_limits(self, test_db):
        """Testa limites de tamanho das respostas de segurança"""
        # Resposta muito longa
        long_answer = "A" * 500
        data = self.base_valid_data.copy()
        data["security_answer_1"] = long_answer

        response = self.client.post("/api/v1/auth/register", json=data)
        assert response.status_code in [400, 422]

    # ===== TESTES DE VALIDAÇÃO DE SCHEMA PYDANTIC =====

    def test_pydantic_schema_validation_direct(self):
        """Testa validação direta do schema Pydantic"""
        # Dados válidos
        valid_data = self.base_valid_data.copy()

        try:
            user_create = UserCreate(**valid_data)
            assert user_create.email == valid_data["email"]
            assert user_create.username == valid_data["username"]
            assert user_create.full_name == valid_data["full_name"]
        except ValidationError:
            pytest.fail("Dados válidos não deveriam falhar na validação do schema")

    def test_pydantic_schema_validation_invalid_data(self):
        """Testa validação do schema Pydantic com dados inválidos"""
        invalid_data = {
            "email": "invalid-email",
            "username": "",
            "full_name": "",
            "password": "123",
        }

        with pytest.raises(ValidationError):
            UserCreate(**invalid_data)

    # ===== TESTES DE SANITIZAÇÃO DE DADOS =====

    def test_data_sanitization_whitespace(self, test_db):
        """Testa se espaços em branco são removidos adequadamente"""
        data = {
            "email": "  test@example.com  ",
            "username": "  testuser  ",
            "full_name": "  Test User  ",
            "password": "SecurePass123!",
            "security_question_1_id": "MOTHER_MAIDEN_NAME",
            "security_answer_1": "  Silva  ",
            "security_question_2_id": "FIRST_PET_NAME",
            "security_answer_2": "  Rex  ",
        }

        response = self.client.post("/api/v1/auth/register", json=data)

        if response.status_code == 200:
            user_data = response.json()["user"]
            # Verifica se espaços foram removidos
            assert user_data["email"] == "test@example.com"
            assert user_data["username"] == "testuser"
            assert user_data["full_name"] == "Test User"

    def test_data_sanitization_case_sensitivity(self, test_db):
        """Testa tratamento de maiúsculas/minúsculas"""
        data = self.base_valid_data.copy()
        data["email"] = "TEST@EXAMPLE.COM"
        data["username"] = "TESTUSER"

        response = self.client.post("/api/v1/auth/register", json=data)

        if response.status_code == 200:
            user_data = response.json()["user"]
            # Email deve ser normalizado para minúsculas
            assert user_data["email"] == "test@example.com"
            # Username pode manter case original ou ser normalizado
            assert user_data["username"] in ["TESTUSER", "testuser"]

    # ===== TESTES DE VALIDAÇÃO CRUZADA =====

    def test_cross_field_validation_same_security_questions(self, test_db):
        """Testa se perguntas secretas iguais são rejeitadas"""
        data = self.base_valid_data.copy()
        data["security_question_1_id"] = "MOTHER_MAIDEN_NAME"
        data["security_question_2_id"] = "MOTHER_MAIDEN_NAME"

        response = self.client.post("/api/v1/auth/register", json=data)

        assert response.status_code == 400
        error_data = response.json()
        assert "detail" in error_data
        assert (
            "different" in error_data["detail"].lower()
            or "same" in error_data["detail"].lower()
        )

    def test_cross_field_validation_email_username_similarity(self, test_db):
        """Testa validação de similaridade entre email e username"""
        data = self.base_valid_data.copy()
        data["email"] = "testuser@example.com"
        data["username"] = "testuser"

        response = self.client.post("/api/v1/auth/register", json=data)

        # Deve ser aceito (similaridade é permitida)
        assert response.status_code == 200
