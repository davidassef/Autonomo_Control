import pytest
from datetime import date, datetime
from pydantic import ValidationError
from app.schemas.user_schema import (
    UserBase,
    UserCreate,
    UserUpdate,
    SecurityQuestionsUpdate,
)


class TestUserBaseSchema:
    """Testes para o schema base UserBase."""

    def test_valid_user_base(self):
        """Testa criação de UserBase com dados válidos."""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "name": "Test",
        }

        user = UserBase(**user_data)
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"
        assert user.name == "Test"

    def test_invalid_email_format(self):
        """Testa validação de email inválido."""
        invalid_emails = [
            "invalid-email",
            "@example.com",
            "test@",
            "test.example.com",
            "",
        ]

        for email in invalid_emails:
            with pytest.raises(ValidationError) as exc_info:
                UserBase(
                    username="testuser", email=email, full_name="Test User", name="Test"
                )
            assert "email" in str(exc_info.value)

    def test_required_fields(self):
        """Testa campos obrigatórios."""
        # Testando ausência de username
        with pytest.raises(ValidationError) as exc_info:
            UserBase(email="test@example.com", full_name="Test User", name="Test")
        assert "username" in str(exc_info.value)

        # Testando ausência de email
        with pytest.raises(ValidationError) as exc_info:
            UserBase(username="testuser", full_name="Test User", name="Test")
        assert "email" in str(exc_info.value)


class TestUserCreateSchema:
    """Testes para o schema UserCreate."""

    def test_valid_user_create_minimal(self):
        """Testa criação de usuário com campos mínimos."""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "name": "Test",
            "password": "SecurePass123!",
            "security_question_1": "Qual o nome da sua mãe?",
            "security_answer_1": "Maria",
            "security_question_2": "Qual sua cor favorita?",
            "security_answer_2": "Azul",
            "security_question_3": "Qual o nome do seu pet?",
            "security_answer_3": "Rex",
        }

        user = UserCreate(**user_data)
        assert user.username == "testuser"
        assert user.password == "SecurePass123!"
        assert user.cpf is None
        assert user.birth_date is None
        assert user.phone is None

    def test_valid_user_create_complete(self):
        """Testa criação de usuário com todos os campos."""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "name": "Test",
            "password": "SecurePass123!",
            "cpf": "11144477735",
            "birth_date": date(1990, 5, 15),
            "phone": "11987654321",
            "cep": "01310100",
            "street": "Rua Augusta",
            "number": "123",
            "complement": "Apto 45",
            "neighborhood": "Consolação",
            "city": "São Paulo",
            "state": "SP",
            "security_question_1": "Qual o nome da sua mãe?",
            "security_answer_1": "Maria",
            "security_question_2": "Qual sua cor favorita?",
            "security_answer_2": "Azul",
            "security_question_3": "Qual o nome do seu pet?",
            "security_answer_3": "Rex",
        }

        user = UserCreate(**user_data)
        assert user.cpf == "11144477735"
        assert user.birth_date == date(1990, 5, 15)
        assert user.phone == "11987654321"
        assert user.cep == "01310100"
        assert user.street == "Rua Augusta"
        assert user.state == "SP"

    def test_invalid_cpf_validation(self):
        """Testa validação de CPF inválido."""
        base_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "name": "Test",
            "password": "SecurePass123!",
            "security_question_1": "Qual o nome da sua mãe?",
            "security_answer_1": "Maria",
            "security_question_2": "Qual sua cor favorita?",
            "security_answer_2": "Azul",
            "security_question_3": "Qual o nome do seu pet?",
            "security_answer_3": "Rex",
        }

        invalid_cpfs = [
            "11111111111",  # Todos iguais
            "12345678901",  # Inválido
            "123456789",  # Muito curto
            "abcdefghijk",  # Não numérico
        ]

        for cpf in invalid_cpfs:
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**{**base_data, "cpf": cpf})
            assert "cpf" in str(exc_info.value).lower()

    def test_invalid_phone_validation(self):
        """Testa validação de telefone inválido."""
        base_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "name": "Test",
            "password": "SecurePass123!",
            "security_question_1": "Qual o nome da sua mãe?",
            "security_answer_1": "Maria",
            "security_question_2": "Qual sua cor favorita?",
            "security_answer_2": "Azul",
            "security_question_3": "Qual o nome do seu pet?",
            "security_answer_3": "Rex",
        }

        invalid_phones = [
            "123456789",  # Muito curto
            "00987654321",  # DDD inválido
            "abcdefghijk",  # Não numérico
        ]

        for phone in invalid_phones:
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**{**base_data, "phone": phone})
            assert "phone" in str(exc_info.value).lower()

    def test_invalid_birth_date_validation(self):
        """Testa validação de data de nascimento inválida."""
        base_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "name": "Test",
            "password": "SecurePass123!",
            "security_question_1": "Qual o nome da sua mãe?",
            "security_answer_1": "Maria",
            "security_question_2": "Qual sua cor favorita?",
            "security_answer_2": "Azul",
            "security_question_3": "Qual o nome do seu pet?",
            "security_answer_3": "Rex",
        }

        today = date.today()
        invalid_dates = [
            today,  # Hoje
            date(today.year - 15, today.month, today.day),  # Menor de 16 anos
            date(today.year + 1, 1, 1),  # Futuro
        ]

        for birth_date in invalid_dates:
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**{**base_data, "birth_date": birth_date})
            assert "birth_date" in str(exc_info.value).lower()

    def test_invalid_cep_validation(self):
        """Testa validação de CEP inválido."""
        base_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "name": "Test",
            "password": "SecurePass123!",
            "security_question_1": "Qual o nome da sua mãe?",
            "security_answer_1": "Maria",
            "security_question_2": "Qual sua cor favorita?",
            "security_answer_2": "Azul",
            "security_question_3": "Qual o nome do seu pet?",
            "security_answer_3": "Rex",
        }

        invalid_ceps = [
            "1234567",  # Muito curto
            "123456789",  # Muito longo
            "abcdefgh",  # Não numérico
        ]

        for cep in invalid_ceps:
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**{**base_data, "cep": cep})
            assert "cep" in str(exc_info.value).lower()

    def test_invalid_state_validation(self):
        """Testa validação de estado inválido."""
        base_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "name": "Test",
            "password": "SecurePass123!",
            "security_question_1": "Qual o nome da sua mãe?",
            "security_answer_1": "Maria",
            "security_question_2": "Qual sua cor favorita?",
            "security_answer_2": "Azul",
            "security_question_3": "Qual o nome do seu pet?",
            "security_answer_3": "Rex",
        }

        invalid_states = [
            "XX",  # Estado inexistente
            "sp",  # Minúscula
            "SAO",  # Muito longo
            "S",  # Muito curto
        ]

        for state in invalid_states:
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**{**base_data, "state": state})
            assert "state" in str(exc_info.value).lower()

    def test_security_questions_validation(self):
        """Testa validação das perguntas de segurança."""
        base_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "name": "Test",
            "password": "SecurePass123!",
        }

        # Testando perguntas duplicadas
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(
                **{
                    **base_data,
                    "security_question_1": "Pergunta igual",
                    "security_answer_1": "Resposta 1",
                    "security_question_2": "Pergunta igual",  # Duplicada
                    "security_answer_2": "Resposta 2",
                    "security_question_3": "Pergunta diferente",
                    "security_answer_3": "Resposta 3",
                }
            )
        assert "diferentes" in str(exc_info.value).lower()

        # Testando respostas muito curtas
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(
                **{
                    **base_data,
                    "security_question_1": "Pergunta 1",
                    "security_answer_1": "A",  # Muito curta
                    "security_question_2": "Pergunta 2",
                    "security_answer_2": "Resposta 2",
                    "security_question_3": "Pergunta 3",
                    "security_answer_3": "Resposta 3",
                }
            )
        assert "security_answer" in str(exc_info.value).lower()


class TestUserUpdateSchema:
    """Testes para o schema UserUpdate."""

    def test_valid_user_update_partial(self):
        """Testa atualização parcial de usuário."""
        update_data = {"full_name": "Updated Name", "cpf": "11144477735"}

        user_update = UserUpdate(**update_data)
        assert user_update.full_name == "Updated Name"
        assert user_update.cpf == "11144477735"
        assert user_update.phone is None

    def test_valid_user_update_complete(self):
        """Testa atualização completa de usuário."""
        update_data = {
            "username": "newusername",
            "email": "new@example.com",
            "full_name": "New Full Name",
            "name": "New Name",
            "cpf": "11144477735",
            "birth_date": date(1985, 10, 20),
            "phone": "21987654321",
            "cep": "20040020",
            "street": "Rua Nova",
            "number": "456",
            "complement": "Casa",
            "neighborhood": "Copacabana",
            "city": "Rio de Janeiro",
            "state": "RJ",
        }

        user_update = UserUpdate(**update_data)
        assert user_update.username == "newusername"
        assert user_update.cpf == "11144477735"
        assert user_update.state == "RJ"

    def test_invalid_update_validations(self):
        """Testa validações em atualizações inválidas."""
        # CPF inválido
        with pytest.raises(ValidationError):
            UserUpdate(cpf="11111111111")

        # Telefone inválido
        with pytest.raises(ValidationError):
            UserUpdate(phone="123456789")

        # Data de nascimento inválida
        with pytest.raises(ValidationError):
            UserUpdate(birth_date=date.today())

        # Estado inválido
        with pytest.raises(ValidationError):
            UserUpdate(state="XX")


class TestSecurityQuestionsUpdateSchema:
    """Testes para o schema SecurityQuestionsUpdate."""

    def test_valid_security_questions_update(self):
        """Testa atualização válida de perguntas de segurança."""
        update_data = {
            "security_question_1": "Nova pergunta 1?",
            "security_answer_1": "Nova resposta 1",
            "security_question_2": "Nova pergunta 2?",
            "security_answer_2": "Nova resposta 2",
            "security_question_3": "Nova pergunta 3?",
            "security_answer_3": "Nova resposta 3",
        }

        security_update = SecurityQuestionsUpdate(**update_data)
        assert security_update.security_question_1 == "Nova pergunta 1?"
        assert security_update.security_answer_1 == "Nova resposta 1"

    def test_invalid_duplicate_questions(self):
        """Testa validação de perguntas duplicadas."""
        with pytest.raises(ValidationError) as exc_info:
            SecurityQuestionsUpdate(
                security_question_1="Pergunta igual",
                security_answer_1="Resposta 1",
                security_question_2="Pergunta igual",  # Duplicada
                security_answer_2="Resposta 2",
                security_question_3="Pergunta diferente",
                security_answer_3="Resposta 3",
            )
        assert "diferentes" in str(exc_info.value).lower()

    def test_invalid_short_answers(self):
        """Testa validação de respostas muito curtas."""
        with pytest.raises(ValidationError):
            SecurityQuestionsUpdate(
                security_question_1="Pergunta 1",
                security_answer_1="A",  # Muito curta
                security_question_2="Pergunta 2",
                security_answer_2="Resposta válida",
                security_question_3="Pergunta 3",
                security_answer_3="Resposta válida",
            )
