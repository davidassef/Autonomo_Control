"""
Testes unitários para schemas de usuários (user_schema.py)
"""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.user_schema import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserInDB,
    User,
    Token,
    TokenData,
)


class TestUserBase:
    """Testes para o schema UserBase"""

    def test_user_base_valid(self):
        """Testa criação de usuário base válido"""
        user_data = {"email": "test@example.com", "name": "João Silva"}
        user = UserBase(**user_data)

        assert user.email == "test@example.com"
        assert user.name == "João Silva"

    def test_user_base_valid_email_formats(self):
        """Testa diferentes formatos válidos de email"""
        valid_emails = [
            "user@domain.com",
            "user.name@domain.com",
            "user+tag@domain.co.uk",
            "123@domain.org",
            "user@sub.domain.com",
        ]

        for email in valid_emails:
            user_data = {"email": email, "name": "Teste"}
            user = UserBase(**user_data)
            assert user.email == email

    def test_user_base_invalid_email(self):
        """Testa validação de email inválido"""
        invalid_emails = [
            "invalid-email",
            "@domain.com",
            "user@",
            "user.domain.com",
            "",
            "user@domain",
        ]

        for email in invalid_emails:
            user_data = {"email": email, "name": "Teste"}
            with pytest.raises(ValidationError):
                UserBase(**user_data)

    def test_user_base_missing_required_fields(self):
        """Testa validação de campos obrigatórios"""
        # Sem email
        with pytest.raises(ValidationError):
            UserBase(name="João Silva")

        # Sem nome
        with pytest.raises(ValidationError):
            UserBase(email="test@example.com")


class TestUserCreate:
    """Testes para o schema UserCreate"""

    def test_user_create_inheritance(self):
        """Testa que UserCreate herda de UserBase"""
        assert issubclass(UserCreate, UserBase)

    def test_user_create_valid(self):
        """Testa criação de usuário válida"""
        user_data = {
            "email": "newuser@example.com",
            "name": "Novo Usuário",
            "username": "testuser",
            "full_name": "Test User",
            "password": "SecurePass123!",
            "security_question_1_id": "MOTHER_MAIDEN_NAME",
            "security_answer_1": "Silva",
            "security_question_2_id": "FIRST_PET_NAME",
            "security_answer_2": "Rex",
            "security_question_3_id": "CHILDHOOD_FRIEND",
            "security_answer_3": "João",
        }
        user = UserCreate(**user_data)

        assert user.email == "newuser@example.com"
        assert user.name == "Novo Usuário"


class TestUserUpdate:
    """Testes para o schema UserUpdate"""

    def test_user_update_valid(self):
        """Testa atualização de usuário válida"""
        update_data = {
            "name": "Nome Atualizado",
            "picture": "https://example.com/avatar.jpg",
        }
        user_update = UserUpdate(**update_data)

        assert user_update.name == "Nome Atualizado"
        assert user_update.picture == "https://example.com/avatar.jpg"

    def test_user_update_empty(self):
        """Testa atualização vazia"""
        user_update = UserUpdate()

        assert user_update.name is None
        assert user_update.picture is None


class TestUserInDB:  # pylint: disable=too-few-public-methods
    """Testes para o schema UserInDB"""

    def test_user_in_db_valid_complete(self):
        """Testa criação de usuário do banco completo"""
        user_data = {
            "id": "user123",
            "email": "user@example.com",
            "name": "Usuário Banco",
            "google_id": "google123456",
            "is_active": True,
            "created_at": datetime(2025, 5, 24, 10, 0, 0),
            "updated_at": datetime(2025, 5, 24, 11, 0, 0),
            "picture": "https://avatar.com/user.jpg",
        }
        user = UserInDB(**user_data)

        assert user.id == "user123"
        assert user.email == "user@example.com"
        assert user.name == "Usuário Banco"
        assert user.google_id == "google123456"
        assert user.is_active is True


class TestUser:  # pylint: disable=too-few-public-methods
    """Testes para o schema User"""

    def test_user_inheritance(self):
        """Testa que User herda de UserInDB"""
        assert issubclass(User, UserInDB)


class TestToken:  # pylint: disable=too-few-public-methods
    """Testes para o schema Token"""

    def test_token_valid(self):
        """Testa criação de token válido"""
        token_data = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token",
            "token_type": "bearer",
        }
        token = Token(**token_data)

        expected_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token"
        assert token.access_token == expected_token
        assert token.token_type == "bearer"


class TestTokenData:
    """Testes para o schema TokenData"""

    def test_token_data_valid_complete(self):
        """Testa criação de dados de token válidos e completos"""
        token_data = {"email": "token@example.com", "user_id": "token_user123"}
        data = TokenData(**token_data)

        assert data.email == "token@example.com"
        assert data.user_id == "token_user123"

    def test_token_data_minimal(self):
        """Testa dados de token com campo mínimo obrigatório"""
        token_data = {"user_id": "minimal_user"}
        data = TokenData(**token_data)

        assert data.email is None
        assert data.user_id == "minimal_user"
