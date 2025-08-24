import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, UTC
from jose import JWTError, jwt

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
    pwd_context,
)
from app.schemas.user_schema import TokenData


class TestPasswordHashing:
    """Testes para funções de hash de senha."""

    def test_get_password_hash_creates_hash(self):
        """Testa se get_password_hash cria um hash válido."""
        password = "test_password_123"
        hashed = get_password_hash(password)

        assert hashed is not None
        assert isinstance(hashed, str)
        assert len(hashed) > 0
        assert hashed != password  # Hash deve ser diferente da senha original

    def test_get_password_hash_different_passwords_different_hashes(self):
        """Testa se senhas diferentes geram hashes diferentes."""
        password1 = "password123"
        password2 = "password456"

        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)

        assert hash1 != hash2

    def test_get_password_hash_same_password_different_hashes(self):
        """Testa se a mesma senha gera hashes diferentes (salt)."""
        password = "same_password"

        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Devido ao salt, hashes devem ser diferentes
        assert hash1 != hash2

    def test_verify_password_correct_password(self):
        """Testa se verify_password funciona com senha correta."""
        password = "correct_password"
        hashed = get_password_hash(password)

        result = verify_password(password, hashed)
        assert result is True

    def test_verify_password_incorrect_password(self):
        """Testa se verify_password falha com senha incorreta."""
        correct_password = "correct_password"
        wrong_password = "wrong_password"
        hashed = get_password_hash(correct_password)

        result = verify_password(wrong_password, hashed)
        assert result is False

    def test_verify_password_empty_password(self):
        """Testa se verify_password lida com senha vazia."""
        password = "test_password"
        hashed = get_password_hash(password)

        result = verify_password("", hashed)
        assert result is False

    def test_verify_password_empty_hash(self):
        """Testa se verify_password lida com hash vazio."""
        password = "test_password"

        result = verify_password(password, "")
        assert result is False

    def test_password_hash_bcrypt_format(self):
        """Testa se o hash gerado está no formato bcrypt."""
        password = "test_password"
        hashed = get_password_hash(password)

        # Hash bcrypt começa com $2b$
        assert hashed.startswith("$2b$")

    def test_password_context_configuration(self):
        """Testa se o contexto de senha está configurado corretamente."""
        assert pwd_context is not None
        assert "bcrypt" in pwd_context.schemes()
        assert pwd_context.deprecated == "auto"

    def test_verify_password_with_special_characters(self):
        """Testa hash e verificação com caracteres especiais."""
        password = "p@ssw0rd!@#$%^&*()_+-=[]{}|;':,.<>?"
        hashed = get_password_hash(password)

        result = verify_password(password, hashed)
        assert result is True

    def test_verify_password_with_unicode(self):
        """Testa hash e verificação com caracteres Unicode."""
        password = "senha_com_acentos_çãõáéíóú"
        hashed = get_password_hash(password)

        result = verify_password(password, hashed)
        assert result is True


class TestJWTTokens:
    """Testes para funções de token JWT."""

    @patch("app.core.security.settings")
    def test_create_access_token_basic(self, mock_settings):
        """Testa criação básica de token de acesso."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30

        data = {"sub": "test@example.com", "user_id": 1}
        token = create_access_token(data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    @patch("app.core.security.settings")
    def test_create_access_token_with_custom_expiry(self, mock_settings):
        """Testa criação de token com expiração customizada."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"

        data = {"sub": "test@example.com", "user_id": 1}
        custom_expiry = timedelta(hours=2)
        token = create_access_token(data, expires_delta=custom_expiry)

        # Decodifica para verificar expiração
        payload = jwt.decode(
            token, mock_settings.SECRET_KEY, algorithms=[mock_settings.ALGORITHM]
        )
        exp_timestamp = payload["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp, UTC)

        # Verifica se a expiração está aproximadamente 2 horas no futuro
        expected_exp = datetime.now(UTC) + custom_expiry
        time_diff = abs((exp_datetime - expected_exp).total_seconds())
        assert time_diff < 60  # Tolerância de 1 minuto

    @patch("app.core.security.settings")
    def test_create_access_token_default_expiry(self, mock_settings):
        """Testa criação de token com expiração padrão."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 45

        data = {"sub": "test@example.com", "user_id": 1}
        token = create_access_token(data)

        # Decodifica para verificar expiração
        payload = jwt.decode(
            token, mock_settings.SECRET_KEY, algorithms=[mock_settings.ALGORITHM]
        )
        exp_timestamp = payload["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp, UTC)

        # Verifica se a expiração está aproximadamente 45 minutos no futuro
        expected_exp = datetime.now(UTC) + timedelta(minutes=45)
        time_diff = abs((exp_datetime - expected_exp).total_seconds())
        assert time_diff < 60  # Tolerância de 1 minuto

    @patch("app.core.security.settings")
    def test_create_access_token_preserves_data(self, mock_settings):
        """Testa se o token preserva os dados originais."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30

        data = {
            "sub": "test@example.com",
            "user_id": 123,
            "role": "ADMIN",
            "custom_field": "custom_value",
        }
        token = create_access_token(data)

        # Decodifica para verificar dados
        payload = jwt.decode(
            token, mock_settings.SECRET_KEY, algorithms=[mock_settings.ALGORITHM]
        )

        assert payload["sub"] == data["sub"]
        assert payload["user_id"] == data["user_id"]
        assert payload["role"] == data["role"]
        assert payload["custom_field"] == data["custom_field"]
        assert "exp" in payload

    @patch("app.core.security.settings")
    def test_verify_token_valid_token(self, mock_settings):
        """Testa verificação de token válido."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30

        data = {"sub": "test@example.com", "user_id": 123, "role": "USER"}
        token = create_access_token(data)

        token_data = verify_token(token)

        assert token_data is not None
        assert isinstance(token_data, TokenData)
        assert token_data.email == "test@example.com"
        assert token_data.user_id == 123
        assert token_data.role == "USER"

    @patch("app.core.security.settings")
    def test_verify_token_invalid_signature(self, mock_settings):
        """Testa verificação de token com assinatura inválida."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30

        # Cria token com uma chave
        data = {"sub": "test@example.com", "user_id": 123}
        token = create_access_token(data)

        # Tenta verificar com chave diferente
        mock_settings.SECRET_KEY = "different_secret_key"

        token_data = verify_token(token)
        assert token_data is None

    @patch("app.core.security.settings")
    def test_verify_token_malformed_token(self, mock_settings):
        """Testa verificação de token malformado."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"

        malformed_token = "invalid.token.format"

        token_data = verify_token(malformed_token)
        assert token_data is None

    @patch("app.core.security.settings")
    def test_verify_token_expired_token(self, mock_settings):
        """Testa verificação de token expirado."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"

        # Cria token já expirado
        data = {"sub": "test@example.com", "user_id": 123}
        expired_delta = timedelta(minutes=-10)  # 10 minutos no passado
        token = create_access_token(data, expires_delta=expired_delta)

        token_data = verify_token(token)
        assert token_data is None

    @patch("app.core.security.settings")
    def test_verify_token_missing_required_fields(self, mock_settings):
        """Testa verificação de token sem campos obrigatórios."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"

        # Token sem 'sub'
        data_no_sub = {"user_id": 123}
        token_no_sub = create_access_token(data_no_sub)
        token_data = verify_token(token_no_sub)
        assert token_data is None

        # Token sem 'user_id'
        data_no_user_id = {"sub": "test@example.com"}
        token_no_user_id = create_access_token(data_no_user_id)
        token_data = verify_token(token_no_user_id)
        assert token_data is None

    @patch("app.core.security.settings")
    def test_verify_token_optional_role(self, mock_settings):
        """Testa verificação de token sem role (campo opcional)."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30

        data = {"sub": "test@example.com", "user_id": 123}
        token = create_access_token(data)

        token_data = verify_token(token)

        assert token_data is not None
        assert token_data.email == "test@example.com"
        assert token_data.user_id == 123
        assert token_data.role is None

    def test_verify_token_empty_token(self):
        """Testa verificação de token vazio."""
        token_data = verify_token("")
        assert token_data is None

    def test_verify_token_none_token(self):
        """Testa verificação de token None."""
        with pytest.raises(AttributeError):
            verify_token(None)


class TestSecurityIntegration:
    """Testes de integração para funcionalidades de segurança."""

    @patch("app.core.security.settings")
    def test_complete_auth_workflow(self, mock_settings):
        """Testa fluxo completo de autenticação."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30

        # 1. Hash da senha
        password = "user_password_123"
        hashed_password = get_password_hash(password)

        # 2. Verificação da senha
        is_valid = verify_password(password, hashed_password)
        assert is_valid is True

        # 3. Criação do token
        user_data = {"sub": "user@example.com", "user_id": 456, "role": "USER"}
        token = create_access_token(user_data)

        # 4. Verificação do token
        token_data = verify_token(token)
        assert token_data is not None
        assert token_data.email == "user@example.com"
        assert token_data.user_id == 456
        assert token_data.role == "USER"

    @patch("app.core.security.settings")
    def test_token_roundtrip_with_different_data_types(self, mock_settings):
        """Testa criação e verificação de token com diferentes tipos de dados."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30

        data = {
            "sub": "test@example.com",
            "user_id": 789,
            "role": "ADMIN",
            "permissions": ["read", "write", "delete"],
            "metadata": {"department": "IT", "level": 5},
        }

        token = create_access_token(data)
        token_data = verify_token(token)

        assert token_data is not None
        assert token_data.email == "test@example.com"
        assert token_data.user_id == 789
        assert token_data.role == "ADMIN"


class TestSecurityEdgeCases:
    """Testes para casos extremos e validações de segurança."""

    def test_password_hash_very_long_password(self):
        """Testa hash de senha muito longa."""
        long_password = "a" * 1000  # Senha de 1000 caracteres
        hashed = get_password_hash(long_password)

        assert hashed is not None
        result = verify_password(long_password, hashed)
        assert result is True

    def test_password_hash_empty_string(self):
        """Testa hash de string vazia."""
        empty_password = ""
        hashed = get_password_hash(empty_password)

        assert hashed is not None
        result = verify_password(empty_password, hashed)
        assert result is True

    @patch("app.core.security.settings")
    def test_token_with_very_large_payload(self, mock_settings):
        """Testa criação de token com payload muito grande."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_settings.ALGORITHM = "HS256"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30

        large_data = {
            "sub": "test@example.com",
            "user_id": 123,
            "large_field": "x" * 10000,  # Campo muito grande
        }

        token = create_access_token(large_data)
        assert token is not None

        token_data = verify_token(token)
        assert token_data is not None
        assert token_data.email == "test@example.com"

    @patch("app.core.security.settings")
    def test_token_security_different_algorithms(self, mock_settings):
        """Testa se tokens criados com algoritmos diferentes são rejeitados."""
        mock_settings.SECRET_KEY = "test_secret_key"

        data = {"sub": "test@example.com", "user_id": 123}

        # Cria token com HS256
        mock_settings.ALGORITHM = "HS256"
        token = create_access_token(data)

        # Tenta verificar com HS512
        mock_settings.ALGORITHM = "HS512"
        token_data = verify_token(token)
        assert token_data is None

    @patch("app.core.security.jwt")
    def test_jwt_error_handling(self, mock_jwt):
        """Testa tratamento de erros JWT."""
        mock_jwt.decode.side_effect = JWTError("Token error")

        token_data = verify_token("any_token")
        assert token_data is None

    def test_password_context_thread_safety(self):
        """Testa se o contexto de senha é thread-safe."""
        import threading
        import time

        results = []

        def hash_password(password, results_list):
            hashed = get_password_hash(password)
            results_list.append(hashed)

        threads = []
        for i in range(10):
            thread = threading.Thread(
                target=hash_password, args=(f"password_{i}", results)
            )
            threads.append(thread)
            thread.start()

        for thread in threads:
            thread.join()

        # Todos os hashes devem ser únicos
        assert len(results) == 10
        assert len(set(results)) == 10  # Todos diferentes
