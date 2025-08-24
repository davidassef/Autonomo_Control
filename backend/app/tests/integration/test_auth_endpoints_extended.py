import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_password_hash
import json


class TestAuthEndpointsExtended:
    """Testes para endpoints de autenticação com campos expandidos."""

    def setup_method(self):
        """Configuração para cada teste."""
        self.client = TestClient(app)
        self.base_user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "name": "Test User",
            "security_questions": [
                {"question_id": 1, "answer": "resposta1"},
                {"question_id": 2, "answer": "resposta2"},
                {"question_id": 3, "answer": "resposta3"},
            ],
        }

    def test_register_with_minimal_data(self):
        """Testa registro com dados mínimos obrigatórios."""
        with patch("app.core.database.get_db") as mock_db:
            mock_session = mock_db.return_value
            mock_session.query.return_value.filter.return_value.first.return_value = (
                None
            )
            mock_session.add = lambda x: None
            mock_session.commit = lambda: None
            mock_session.refresh = lambda x: setattr(x, "id", 1)

            response = self.client.post("/auth/register", json=self.base_user_data)

            assert response.status_code == 201
            data = response.json()
            assert "access_token" in data
            assert data["user"]["email"] == "test@example.com"
            assert data["user"]["name"] == "Test User"

    def test_register_with_full_optional_data(self):
        """Testa registro com todos os campos opcionais."""
        full_user_data = {
            **self.base_user_data,
            "cpf": "12345678901",
            "birth_date": "1990-01-01",
            "phone": "11987654321",
            "cep": "01310100",
            "street": "Rua Augusta",
            "number": "123",
            "complement": "Apto 45",
            "neighborhood": "Consolação",
            "city": "São Paulo",
            "state": "SP",
        }

        with patch("app.core.database.get_db") as mock_db:
            mock_session = mock_db.return_value
            mock_session.query.return_value.filter.return_value.first.return_value = (
                None
            )
            mock_session.add = lambda x: None
            mock_session.commit = lambda: None
            mock_session.refresh = lambda x: setattr(x, "id", 1)

            response = self.client.post("/auth/register", json=full_user_data)

            assert response.status_code == 201
            data = response.json()
            assert "access_token" in data
            assert data["user"]["email"] == "test@example.com"
            assert data["user"]["cpf"] == "123.456.789-01"
            assert data["user"]["phone"] == "(11) 98765-4321"
            assert data["user"]["cep"] == "01310-100"

    def test_register_with_invalid_cpf(self):
        """Testa registro com CPF inválido."""
        invalid_cpf_data = {**self.base_user_data, "cpf": "12345678900"}  # CPF inválido

        response = self.client.post("/auth/register", json=invalid_cpf_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any("CPF inválido" in str(error) for error in data["detail"])

    def test_register_with_invalid_phone(self):
        """Testa registro com telefone inválido."""
        invalid_phone_data = {
            **self.base_user_data,
            "phone": "123",  # Telefone muito curto
        }

        response = self.client.post("/auth/register", json=invalid_phone_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any("Telefone inválido" in str(error) for error in data["detail"])

    def test_register_with_invalid_birth_date(self):
        """Testa registro com data de nascimento inválida (menor de 16 anos)."""
        from datetime import date, timedelta

        # Data de nascimento de 10 anos atrás (menor que 16)
        recent_date = date.today() - timedelta(days=10 * 365)

        invalid_birth_data = {
            **self.base_user_data,
            "birth_date": recent_date.isoformat(),
        }

        response = self.client.post("/auth/register", json=invalid_birth_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any("16 anos" in str(error) for error in data["detail"])

    def test_register_with_invalid_cep(self):
        """Testa registro com CEP inválido."""
        invalid_cep_data = {**self.base_user_data, "cep": "123"}  # CEP muito curto

        response = self.client.post("/auth/register", json=invalid_cep_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any("CEP inválido" in str(error) for error in data["detail"])

    def test_register_with_invalid_state(self):
        """Testa registro com estado inválido."""
        invalid_state_data = {
            **self.base_user_data,
            "state": "XX",  # Estado inexistente
        }

        response = self.client.post("/auth/register", json=invalid_state_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any("Estado inválido" in str(error) for error in data["detail"])

    def test_register_duplicate_email(self):
        """Testa registro com email já existente."""
        with patch("app.core.database.get_db") as mock_db:
            mock_session = mock_db.return_value
            # Simula usuário existente
            existing_user = User(email="test@example.com")
            mock_session.query.return_value.filter.return_value.first.return_value = (
                existing_user
            )

            response = self.client.post("/auth/register", json=self.base_user_data)

            assert response.status_code == 400
            data = response.json()
            assert "detail" in data
            assert "já está em uso" in data["detail"]

    def test_register_duplicate_cpf(self):
        """Testa registro com CPF já existente."""
        cpf_data = {**self.base_user_data, "cpf": "12345678901"}

        with patch("app.core.database.get_db") as mock_db:
            mock_session = mock_db.return_value
            # Primeira consulta (email) retorna None
            # Segunda consulta (CPF) retorna usuário existente
            existing_user = User(cpf="12345678901")
            mock_session.query.return_value.filter.return_value.first.side_effect = [
                None,
                existing_user,
            ]

            response = self.client.post("/auth/register", json=cpf_data)

            assert response.status_code == 400
            data = response.json()
            assert "detail" in data
            assert "CPF já está em uso" in data["detail"]

    def test_register_with_partial_address(self):
        """Testa registro com endereço parcial."""
        partial_address_data = {
            **self.base_user_data,
            "cep": "01310100",
            "street": "Rua Augusta",
            "number": "123",
            # Sem complement, neighborhood, city, state
        }

        with patch("app.core.database.get_db") as mock_db:
            mock_session = mock_db.return_value
            mock_session.query.return_value.filter.return_value.first.return_value = (
                None
            )
            mock_session.add = lambda x: None
            mock_session.commit = lambda: None
            mock_session.refresh = lambda x: setattr(x, "id", 1)

            response = self.client.post("/auth/register", json=partial_address_data)

            assert response.status_code == 201
            data = response.json()
            assert data["user"]["cep"] == "01310-100"
            assert data["user"]["street"] == "Rua Augusta"
            assert data["user"]["number"] == "123"

    def test_register_missing_required_fields(self):
        """Testa registro sem campos obrigatórios."""
        incomplete_data = {
            "email": "test@example.com"
            # Faltam password, name, security_questions
        }

        response = self.client.post("/auth/register", json=incomplete_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

        # Verifica se os campos obrigatórios são mencionados nos erros
        error_fields = [
            error.get("loc", [])[-1] for error in data["detail"] if "loc" in error
        ]
        assert "password" in error_fields
        assert "name" in error_fields
        assert "security_questions" in error_fields

    def test_register_invalid_security_questions(self):
        """Testa registro com perguntas de segurança inválidas."""
        invalid_questions_data = {
            **self.base_user_data,
            "security_questions": [
                {"question_id": 1, "answer": "resposta1"},
                {"question_id": 1, "answer": "resposta2"},  # ID duplicado
            ],
        }

        response = self.client.post("/auth/register", json=invalid_questions_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any("diferentes" in str(error) for error in data["detail"])

    def test_register_insufficient_security_questions(self):
        """Testa registro com número insuficiente de perguntas de segurança."""
        insufficient_questions_data = {
            **self.base_user_data,
            "security_questions": [
                {"question_id": 1, "answer": "resposta1"}
                # Faltam 2 perguntas
            ],
        }

        response = self.client.post("/auth/register", json=insufficient_questions_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert any("3 perguntas" in str(error) for error in data["detail"])

    def test_register_with_formatted_inputs(self):
        """Testa registro com entradas já formatadas."""
        formatted_data = {
            **self.base_user_data,
            "cpf": "123.456.789-01",  # CPF formatado
            "phone": "(11) 98765-4321",  # Telefone formatado
            "cep": "01310-100",  # CEP formatado
        }

        with patch("app.core.database.get_db") as mock_db:
            mock_session = mock_db.return_value
            mock_session.query.return_value.filter.return_value.first.return_value = (
                None
            )
            mock_session.add = lambda x: None
            mock_session.commit = lambda: None
            mock_session.refresh = lambda x: setattr(x, "id", 1)

            response = self.client.post("/auth/register", json=formatted_data)

            assert response.status_code == 201
            data = response.json()
            # Deve manter a formatação na resposta
            assert data["user"]["cpf"] == "123.456.789-01"
            assert data["user"]["phone"] == "(11) 98765-4321"
            assert data["user"]["cep"] == "01310-100"

    def test_register_database_error(self):
        """Testa erro de banco de dados durante o registro."""
        with patch("app.core.database.get_db") as mock_db:
            mock_session = mock_db.return_value
            mock_session.query.return_value.filter.return_value.first.return_value = (
                None
            )
            mock_session.add = lambda x: None
            mock_session.commit.side_effect = Exception("Database error")

            response = self.client.post("/auth/register", json=self.base_user_data)

            assert response.status_code == 500
            data = response.json()
            assert "detail" in data

    def test_register_response_structure(self):
        """Testa estrutura da resposta de registro bem-sucedido."""
        with patch("app.core.database.get_db") as mock_db:
            mock_session = mock_db.return_value
            mock_session.query.return_value.filter.return_value.first.return_value = (
                None
            )
            mock_session.add = lambda x: None
            mock_session.commit = lambda: None
            mock_session.refresh = lambda x: setattr(x, "id", 1)

            response = self.client.post("/auth/register", json=self.base_user_data)

            assert response.status_code == 201
            data = response.json()

            # Verifica estrutura da resposta
            assert "access_token" in data
            assert "token_type" in data
            assert "user" in data

            # Verifica estrutura do usuário
            user_data = data["user"]
            assert "id" in user_data
            assert "email" in user_data
            assert "name" in user_data
            assert "is_active" in user_data
            assert "role" in user_data

            # Verifica que a senha não é retornada
            assert "password" not in user_data
            assert "hashed_password" not in user_data

    def test_register_password_hashing(self):
        """Testa se a senha é corretamente hasheada."""
        stored_user = None

        def mock_add(user):
            nonlocal stored_user
            stored_user = user

        with patch("app.core.database.get_db") as mock_db:
            mock_session = mock_db.return_value
            mock_session.query.return_value.filter.return_value.first.return_value = (
                None
            )
            mock_session.add = mock_add
            mock_session.commit = lambda: None
            mock_session.refresh = lambda x: setattr(x, "id", 1)

            response = self.client.post("/auth/register", json=self.base_user_data)

            assert response.status_code == 201
            assert stored_user is not None
            assert stored_user.hashed_password != self.base_user_data["password"]
            assert stored_user.hashed_password.startswith("$2b$")

    def test_register_default_role(self):
        """Testa se o usuário recebe o role padrão 'user'."""
        stored_user = None

        def mock_add(user):
            nonlocal stored_user
            stored_user = user

        with patch("app.core.database.get_db") as mock_db:
            mock_session = mock_db.return_value
            mock_session.query.return_value.filter.return_value.first.return_value = (
                None
            )
            mock_session.add = mock_add
            mock_session.commit = lambda: None
            mock_session.refresh = lambda x: setattr(x, "id", 1)

            response = self.client.post("/auth/register", json=self.base_user_data)

            assert response.status_code == 201
            assert stored_user is not None
            assert stored_user.role == "user"

    def test_register_case_insensitive_email(self):
        """Testa se emails são tratados de forma case-insensitive."""
        upper_email_data = {**self.base_user_data, "email": "TEST@EXAMPLE.COM"}

        with patch("app.core.database.get_db") as mock_db:
            mock_session = mock_db.return_value
            mock_session.query.return_value.filter.return_value.first.return_value = (
                None
            )
            mock_session.add = lambda x: None
            mock_session.commit = lambda: None
            mock_session.refresh = lambda x: setattr(x, "id", 1)

            response = self.client.post("/auth/register", json=upper_email_data)

            assert response.status_code == 201
            data = response.json()
            # Email deve ser normalizado para lowercase
            assert data["user"]["email"] == "test@example.com"
