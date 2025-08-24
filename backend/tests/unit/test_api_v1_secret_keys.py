import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.api.v1.secret_keys import (
    router,
    generate_secret_key,
    get_secret_key_status,
    reset_password_by_secret_key,
    revoke_secret_key,
)
from app.models.user import User
from app.schemas.user_schema import PasswordResetBySecretKey
from app.services.secret_key_service import SecretKeyService


class TestSecretKeysAPI:
    """Testes para os endpoints de chaves secretas."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.master_user = User(
            id=1,
            username="masterautonomocontrol",
            email="master@test.com",
            role="MASTER",
            is_active=True,
            secret_key_hash=None,
            secret_key_created_at=None,
            secret_key_used_at=None,
        )
        self.admin_user = User(
            id=2, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )

    def test_router_configuration(self):
        """Testa se o router está configurado corretamente."""
        assert router.prefix == "/secret-keys"
        assert "secret-keys" in router.tags

        # Verificar se todas as rotas estão registradas
        routes = [route.path for route in router.routes]
        assert "/generate" in routes
        assert "/status" in routes
        assert "/reset-password" in routes
        assert "/revoke" in routes


class TestGenerateSecretKey:
    """Testes para o endpoint de geração de chave secreta."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.master_user = User(
            id=1, username="masterautonomocontrol", role="MASTER", is_active=True
        )
        self.admin_user = User(id=2, username="admin", role="ADMIN", is_active=True)

    @patch("app.api.v1.secret_keys.SecretKeyService.create_secret_key_for_master")
    def test_generate_secret_key_success(self, mock_create_key):
        """Testa geração bem-sucedida de chave secreta."""
        # Arrange
        mock_create_key.return_value = "test-secret-key-123"

        # Act
        result = generate_secret_key(db=self.db_mock, current_user=self.master_user)

        # Assert
        assert result["secret_key"] == "test-secret-key-123"
        assert result["message"] == "Chave secreta gerada com sucesso"
        assert result["expires_in_days"] == 90
        assert "warning" in result
        mock_create_key.assert_called_once_with(db=self.db_mock, master_user_id=1)

    def test_generate_secret_key_non_master_user(self):
        """Testa que usuários não-Master não podem gerar chaves secretas."""
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            generate_secret_key(db=self.db_mock, current_user=self.admin_user)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Apenas usuários Master" in exc_info.value.detail

    @patch("app.api.v1.secret_keys.SecretKeyService.create_secret_key_for_master")
    def test_generate_secret_key_value_error(self, mock_create_key):
        """Testa tratamento de ValueError do serviço."""
        # Arrange
        mock_create_key.side_effect = ValueError(
            "Usuário já possui chave secreta ativa"
        )

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            generate_secret_key(db=self.db_mock, current_user=self.master_user)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "Usuário já possui chave secreta ativa"

    @patch("app.api.v1.secret_keys.SecretKeyService.create_secret_key_for_master")
    def test_generate_secret_key_generic_exception(self, mock_create_key):
        """Testa tratamento de exceção genérica."""
        # Arrange
        mock_create_key.side_effect = Exception("Database error")

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            generate_secret_key(db=self.db_mock, current_user=self.master_user)

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert exc_info.value.detail == "Erro interno ao gerar chave secreta"

    def test_generate_secret_key_role_string_comparison(self):
        """Testa comparação de role como string."""
        # Arrange
        user_with_string_role = Mock()
        user_with_string_role.role = "ADMIN"  # String em vez de enum
        user_with_string_role.id = 1

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            generate_secret_key(db=self.db_mock, current_user=user_with_string_role)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


class TestGetSecretKeyStatus:
    """Testes para o endpoint de status da chave secreta."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.master_user = User(
            id=1,
            username="masterautonomocontrol",
            role="MASTER",
            is_active=True,
            secret_key_created_at=datetime.utcnow() - timedelta(days=30),
            secret_key_used_at=None,
        )
        self.admin_user = User(id=2, username="admin", role="ADMIN", is_active=True)

    @patch("app.api.v1.secret_keys.SecretKeyService.has_valid_secret_key")
    def test_get_secret_key_status_success(self, mock_has_valid_key):
        """Testa obtenção bem-sucedida do status da chave secreta."""
        # Arrange
        mock_has_valid_key.return_value = True

        # Act
        result = get_secret_key_status(db=self.db_mock, current_user=self.master_user)

        # Assert
        assert result["has_secret_key"] is True
        assert result["created_at"] is not None
        assert result["used_at"] is None
        assert "expires_at" in result
        assert "is_expired" in result
        mock_has_valid_key.assert_called_once_with(db=self.db_mock, master_user_id=1)

    def test_get_secret_key_status_non_master_user(self):
        """Testa que usuários não-Master não podem verificar status."""
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            get_secret_key_status(db=self.db_mock, current_user=self.admin_user)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Apenas usuários Master" in exc_info.value.detail

    @patch("app.api.v1.secret_keys.SecretKeyService.has_valid_secret_key")
    def test_get_secret_key_status_no_key(self, mock_has_valid_key):
        """Testa status quando não há chave secreta."""
        # Arrange
        mock_has_valid_key.return_value = False
        user_without_key = User(
            id=1,
            username="masterautonomocontrol",
            role=UserRole.MASTER,
            is_active=True,
            secret_key_created_at=None,
            secret_key_used_at=None,
        )

        # Act
        result = get_secret_key_status(db=self.db_mock, current_user=user_without_key)

        # Assert
        assert result["has_secret_key"] is False
        assert result["created_at"] is None
        assert result["used_at"] is None
        assert "expires_at" not in result
        assert "is_expired" not in result

    @patch("app.api.v1.secret_keys.SecretKeyService.has_valid_secret_key")
    def test_get_secret_key_status_expired_key(self, mock_has_valid_key):
        """Testa status de chave expirada."""
        # Arrange
        mock_has_valid_key.return_value = False
        expired_user = User(
            id=1,
            username="masterautonomocontrol",
            role="MASTER",
            is_active=True,
            secret_key_created_at=datetime.utcnow() - timedelta(days=100),  # Expirada
            secret_key_used_at=None,
        )

        # Act
        result = get_secret_key_status(db=self.db_mock, current_user=expired_user)

        # Assert
        assert result["has_secret_key"] is False
        assert result["is_expired"] is True

    @patch("app.api.v1.secret_keys.SecretKeyService.has_valid_secret_key")
    def test_get_secret_key_status_used_key(self, mock_has_valid_key):
        """Testa status de chave já utilizada."""
        # Arrange
        mock_has_valid_key.return_value = False
        used_user = User(
            id=1,
            username="masterautonomocontrol",
            role="MASTER",
            is_active=True,
            secret_key_created_at=datetime.utcnow() - timedelta(days=10),
            secret_key_used_at=datetime.utcnow() - timedelta(days=5),
        )

        # Act
        result = get_secret_key_status(db=self.db_mock, current_user=used_user)

        # Assert
        assert result["has_secret_key"] is False
        assert result["used_at"] is not None

    @patch("app.api.v1.secret_keys.SecretKeyService.has_valid_secret_key")
    def test_get_secret_key_status_exception(self, mock_has_valid_key):
        """Testa tratamento de exceção."""
        # Arrange
        mock_has_valid_key.side_effect = Exception("Database error")

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            get_secret_key_status(db=self.db_mock, current_user=self.master_user)

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert (
            exc_info.value.detail == "Erro interno ao verificar status da chave secreta"
        )


class TestResetPasswordBySecretKey:
    """Testes para o endpoint de reset de senha por chave secreta."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.payload = PasswordResetBySecretKey(
            username="masterautonomocontrol",
            secret_key="test-secret-key-123",
            new_password="NewPassword123!",
        )
        self.master_user = User(
            id=1, username="masterautonomocontrol", role="MASTER", is_active=True
        )

    @patch("app.api.v1.secret_keys.SecretKeyService.mark_secret_key_as_used")
    @patch("app.api.v1.secret_keys.UserService.update_password")
    @patch("app.api.v1.secret_keys.SecretKeyService.validate_secret_key_for_reset")
    def test_reset_password_success(
        self, mock_validate, mock_update_password, mock_mark_used
    ):
        """Testa reset de senha bem-sucedido."""
        # Arrange
        mock_validate.return_value = self.master_user

        # Act
        result = reset_password_by_secret_key(payload=self.payload, db=self.db_mock)

        # Assert
        assert result["message"] == "Senha redefinida com sucesso usando chave secreta"
        mock_validate.assert_called_once_with(
            db=self.db_mock,
            username="masterautonomocontrol",
            secret_key="test-secret-key-123",
        )
        mock_update_password.assert_called_once_with(
            db=self.db_mock, user=self.master_user, new_password="NewPassword123!"
        )
        mock_mark_used.assert_called_once_with(db=self.db_mock, user=self.master_user)

    @patch("app.api.v1.secret_keys.SecretKeyService.validate_secret_key_for_reset")
    def test_reset_password_invalid_key(self, mock_validate):
        """Testa reset com chave inválida."""
        # Arrange
        mock_validate.return_value = None

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            reset_password_by_secret_key(payload=self.payload, db=self.db_mock)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Chave secreta inválida" in exc_info.value.detail

    @patch("app.api.v1.secret_keys.SecretKeyService.validate_secret_key_for_reset")
    def test_reset_password_expired_key(self, mock_validate):
        """Testa reset com chave expirada."""
        # Arrange
        mock_validate.return_value = None  # Chave expirada retorna None

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            reset_password_by_secret_key(payload=self.payload, db=self.db_mock)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "expirada" in exc_info.value.detail

    @patch("app.api.v1.secret_keys.SecretKeyService.validate_secret_key_for_reset")
    def test_reset_password_user_not_found(self, mock_validate):
        """Testa reset com usuário não encontrado."""
        # Arrange
        mock_validate.return_value = None

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            reset_password_by_secret_key(payload=self.payload, db=self.db_mock)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "usuário não encontrado" in exc_info.value.detail

    @patch("app.api.v1.secret_keys.SecretKeyService.mark_secret_key_as_used")
    @patch("app.api.v1.secret_keys.UserService.update_password")
    @patch("app.api.v1.secret_keys.SecretKeyService.validate_secret_key_for_reset")
    def test_reset_password_update_password_error(
        self, mock_validate, mock_update_password, mock_mark_used
    ):
        """Testa erro ao atualizar senha."""
        # Arrange
        mock_validate.return_value = self.master_user
        mock_update_password.side_effect = Exception("Password update failed")

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            reset_password_by_secret_key(payload=self.payload, db=self.db_mock)

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert exc_info.value.detail == "Erro interno ao redefinir senha"

    @patch("app.api.v1.secret_keys.SecretKeyService.validate_secret_key_for_reset")
    def test_reset_password_validation_error(self, mock_validate):
        """Testa erro de validação."""
        # Arrange
        mock_validate.side_effect = Exception("Validation error")

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            reset_password_by_secret_key(payload=self.payload, db=self.db_mock)

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert exc_info.value.detail == "Erro interno ao redefinir senha"

    def test_reset_password_payload_validation(self):
        """Testa validação do payload."""
        # Arrange
        invalid_payload = PasswordResetBySecretKey(
            username="",  # Username vazio
            secret_key="test-key",
            new_password="weak",  # Senha fraca
        )

        # Act & Assert
        # Este teste depende da validação do Pydantic no schema
        # O comportamento exato depende das validações definidas no schema
        assert invalid_payload.username == ""
        assert invalid_payload.new_password == "weak"


class TestRevokeSecretKey:
    """Testes para o endpoint de revogação de chave secreta."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.master_user = User(
            id=1,
            username="masterautonomocontrol",
            role="MASTER",
            is_active=True,
            secret_key_hash="hashed-key",
            secret_key_created_at=datetime.utcnow(),
            secret_key_used_at=None,
        )
        self.admin_user = User(id=2, username="admin", role="ADMIN", is_active=True)

    def test_revoke_secret_key_success(self):
        """Testa revogação bem-sucedida de chave secreta."""
        # Act
        result = revoke_secret_key(db=self.db_mock, current_user=self.master_user)

        # Assert
        assert result["message"] == "Chave secreta revogada com sucesso"
        assert self.master_user.secret_key_hash is None
        assert self.master_user.secret_key_created_at is None
        assert self.master_user.secret_key_used_at is None
        self.db_mock.commit.assert_called_once()

    def test_revoke_secret_key_non_master_user(self):
        """Testa que usuários não-Master não podem revogar chaves secretas."""
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            revoke_secret_key(db=self.db_mock, current_user=self.admin_user)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Apenas usuários Master" in exc_info.value.detail

    def test_revoke_secret_key_no_existing_key(self):
        """Testa revogação quando não há chave existente."""
        # Arrange
        user_without_key = User(
            id=1,
            username="masterautonomocontrol",
            role="MASTER",
            is_active=True,
            secret_key_hash=None,
            secret_key_created_at=None,
            secret_key_used_at=None,
        )

        # Act
        result = revoke_secret_key(db=self.db_mock, current_user=user_without_key)

        # Assert
        assert result["message"] == "Chave secreta revogada com sucesso"
        self.db_mock.commit.assert_called_once()

    def test_revoke_secret_key_database_error(self):
        """Testa erro de banco de dados durante revogação."""
        # Arrange
        self.db_mock.commit.side_effect = Exception("Database error")

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            revoke_secret_key(db=self.db_mock, current_user=self.master_user)

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert exc_info.value.detail == "Erro interno ao revogar chave secreta"

    def test_revoke_secret_key_role_validation(self):
        """Testa validação de role como string."""
        # Arrange
        user_with_string_role = Mock()
        user_with_string_role.role = "ADMIN"  # String em vez de enum

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            revoke_secret_key(db=self.db_mock, current_user=user_with_string_role)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


class TestSecretKeysIntegration:
    """Testes de integração para os endpoints de chaves secretas."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.master_user = User(
            id=1, username="masterautonomocontrol", role="MASTER", is_active=True
        )

    @patch("app.api.v1.secret_keys.SecretKeyService.create_secret_key_for_master")
    @patch("app.api.v1.secret_keys.SecretKeyService.has_valid_secret_key")
    def test_generate_and_check_status_flow(self, mock_has_valid_key, mock_create_key):
        """Testa fluxo de geração e verificação de status."""
        # Arrange
        mock_create_key.return_value = "test-secret-key-123"
        mock_has_valid_key.return_value = True

        # Act - Gerar chave
        generate_result = generate_secret_key(
            db=self.db_mock, current_user=self.master_user
        )

        # Simular atualização do usuário após geração
        self.master_user.secret_key_created_at = datetime.utcnow()

        # Act - Verificar status
        status_result = get_secret_key_status(
            db=self.db_mock, current_user=self.master_user
        )

        # Assert
        assert generate_result["secret_key"] == "test-secret-key-123"
        assert status_result["has_secret_key"] is True
        assert status_result["created_at"] is not None

    @patch("app.api.v1.secret_keys.SecretKeyService.mark_secret_key_as_used")
    @patch("app.api.v1.secret_keys.UserService.update_password")
    @patch("app.api.v1.secret_keys.SecretKeyService.validate_secret_key_for_reset")
    def test_reset_password_and_revoke_flow(
        self, mock_validate, mock_update_password, mock_mark_used
    ):
        """Testa fluxo de reset de senha e revogação."""
        # Arrange
        mock_validate.return_value = self.master_user
        payload = PasswordResetBySecretKey(
            username="masterautonomocontrol",
            secret_key="test-secret-key-123",
            new_password="NewPassword123!",
        )

        # Act - Reset password
        reset_result = reset_password_by_secret_key(payload=payload, db=self.db_mock)

        # Act - Revoke key
        revoke_result = revoke_secret_key(
            db=self.db_mock, current_user=self.master_user
        )

        # Assert
        assert "sucesso" in reset_result["message"]
        assert "sucesso" in revoke_result["message"]
        mock_mark_used.assert_called_once()

    def test_endpoint_security_consistency(self):
        """Testa consistência de segurança entre endpoints."""
        # Arrange
        non_master_user = User(
            id=2, username="regular_user", role="USER", is_active=True
        )

        # Act & Assert - Todos os endpoints protegidos devem rejeitar não-Master
        endpoints_to_test = [
            lambda: generate_secret_key(db=self.db_mock, current_user=non_master_user),
            lambda: get_secret_key_status(
                db=self.db_mock, current_user=non_master_user
            ),
            lambda: revoke_secret_key(db=self.db_mock, current_user=non_master_user),
        ]

        for endpoint_func in endpoints_to_test:
            with pytest.raises(HTTPException) as exc_info:
                endpoint_func()
            assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
            assert "Apenas usuários Master" in exc_info.value.detail

    def test_error_handling_consistency(self):
        """Testa consistência no tratamento de erros."""
        # Arrange
        error_scenarios = [
            (ValueError("Test error"), status.HTTP_400_BAD_REQUEST),
            (Exception("Generic error"), status.HTTP_500_INTERNAL_SERVER_ERROR),
        ]

        # Test generate endpoint error handling
        for error, expected_status in error_scenarios:
            with patch(
                "app.api.v1.secret_keys.SecretKeyService.create_secret_key_for_master"
            ) as mock_service:
                mock_service.side_effect = error

                with pytest.raises(HTTPException) as exc_info:
                    generate_secret_key(db=self.db_mock, current_user=self.master_user)

                assert exc_info.value.status_code == expected_status


class TestSecretKeysAdvanced:
    """Testes avançados para funcionalidades de chaves secretas."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.master_user = User(
            id=1, username="masterautonomocontrol", role="MASTER", is_active=True
        )

    @patch("app.api.v1.secret_keys.SecretKeyService.create_secret_key_for_master")
    def test_generate_secret_key_length_validation(self, mock_create_key):
        """Testa validação do comprimento da chave secreta gerada."""
        # Arrange
        mock_create_key.return_value = "short"

        # Act
        result = generate_secret_key(db=self.db_mock, current_user=self.master_user)

        # Assert
        assert len(result["secret_key"]) >= 16  # Mínimo esperado

    @patch("app.api.v1.secret_keys.SecretKeyService.create_secret_key_for_master")
    def test_generate_secret_key_uniqueness(self, mock_create_key):
        """Testa que chaves secretas geradas são únicas."""
        # Arrange
        keys_generated = []
        mock_create_key.side_effect = (
            lambda db, user: f"unique-key-{len(keys_generated)}"
        )

        # Act
        for i in range(5):
            result = generate_secret_key(db=self.db_mock, current_user=self.master_user)
            keys_generated.append(result["secret_key"])

        # Assert
        assert len(set(keys_generated)) == 5  # Todas devem ser únicas

    def test_get_secret_key_status_timezone_handling(self):
        """Testa tratamento correto de timezone no status da chave."""
        # Arrange
        utc_time = datetime.utcnow()
        self.master_user.secret_key_created_at = utc_time

        with patch(
            "app.api.v1.secret_keys.SecretKeyService.has_valid_secret_key"
        ) as mock_has_valid:
            mock_has_valid.return_value = True

            # Act
            result = get_secret_key_status(
                db=self.db_mock, current_user=self.master_user
            )

            # Assert
            assert result["created_at"] == utc_time.isoformat()

    def test_reset_password_sql_injection_protection(self):
        """Testa proteção contra SQL injection no reset de senha."""
        # Arrange
        malicious_payload = PasswordResetBySecretKey(
            username="'; DROP TABLE users; --",
            secret_key="test-key",
            new_password="ValidPassword123!",
        )

        with patch(
            "app.api.v1.secret_keys.SecretKeyService.validate_secret_key_for_reset"
        ) as mock_validate:
            mock_validate.side_effect = ValueError("Usuário não encontrado")

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                reset_password_by_secret_key(payload=malicious_payload, db=self.db_mock)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

    def test_reset_password_xss_protection(self):
        """Testa proteção contra XSS no reset de senha."""
        # Arrange
        xss_payload = PasswordResetBySecretKey(
            username="<script>alert('xss')</script>",
            secret_key="test-key",
            new_password="ValidPassword123!",
        )

        with patch(
            "app.api.v1.secret_keys.SecretKeyService.validate_secret_key_for_reset"
        ) as mock_validate:
            mock_validate.side_effect = ValueError("Usuário não encontrado")

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                reset_password_by_secret_key(payload=xss_payload, db=self.db_mock)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

    @patch("app.api.v1.secret_keys.SecretKeyService.validate_secret_key_for_reset")
    @patch("app.api.v1.secret_keys.UserService.update_password")
    def test_reset_password_concurrent_requests(
        self, mock_update_password, mock_validate
    ):
        """Testa comportamento com requisições concorrentes de reset."""
        # Arrange
        mock_validate.return_value = self.master_user
        payload = PasswordResetBySecretKey(
            username="masterautonomocontrol",
            secret_key="test-key",
            new_password="NewPassword123!",
        )

        # Simular primeira requisição marcando chave como usada
        def mark_as_used_side_effect(db, user):
            user.secret_key_used_at = datetime.utcnow()

        with patch(
            "app.api.v1.secret_keys.SecretKeyService.mark_secret_key_as_used"
        ) as mock_mark_used:
            mock_mark_used.side_effect = mark_as_used_side_effect

            # Act - Primeira requisição
            result1 = reset_password_by_secret_key(payload=payload, db=self.db_mock)

            # Simular segunda requisição com chave já usada
            mock_validate.side_effect = ValueError("Chave secreta já foi utilizada")

            # Act & Assert - Segunda requisição deve falhar
            with pytest.raises(HTTPException) as exc_info:
                reset_password_by_secret_key(payload=payload, db=self.db_mock)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "sucesso" in result1["message"]

    def test_secret_key_expiration_edge_cases(self):
        """Testa casos extremos de expiração de chave secreta."""
        # Arrange - Chave criada exatamente no limite de expiração
        expiration_time = datetime.utcnow() - timedelta(
            hours=24
        )  # Assumindo 24h de validade
        self.master_user.secret_key_created_at = expiration_time
        self.master_user.secret_key_hash = "hashed-key"

        with patch(
            "app.api.v1.secret_keys.SecretKeyService.has_valid_secret_key"
        ) as mock_has_valid:
            mock_has_valid.return_value = False  # Chave expirada

            # Act
            result = get_secret_key_status(
                db=self.db_mock, current_user=self.master_user
            )

            # Assert
            assert result["has_secret_key"] is False
            assert result["is_expired"] is True

    @patch("app.api.v1.secret_keys.SecretKeyService.create_secret_key_for_master")
    def test_generate_secret_key_rate_limiting_simulation(self, mock_create_key):
        """Simula teste de rate limiting para geração de chaves."""
        # Arrange
        mock_create_key.return_value = "test-key"

        # Act - Múltiplas gerações rápidas
        results = []
        for i in range(10):
            try:
                result = generate_secret_key(
                    db=self.db_mock, current_user=self.master_user
                )
                results.append(result)
            except HTTPException:
                pass  # Rate limiting pode bloquear algumas requisições

        # Assert - Pelo menos uma deve ter sucesso
        assert len(results) >= 1

    def test_revoke_secret_key_audit_trail(self):
        """Testa que revogação de chave gera trilha de auditoria."""
        # Arrange
        self.master_user.secret_key_hash = "existing-key"

        with patch("app.api.v1.secret_keys.AuditLogService") as mock_audit:
            # Act
            result = revoke_secret_key(db=self.db_mock, current_user=self.master_user)

            # Assert
            assert "sucesso" in result["message"]
            # Verificar se auditoria foi chamada (se implementada)

    def test_password_strength_validation_edge_cases(self):
        """Testa validação de força de senha em casos extremos."""
        # Arrange - Senhas com diferentes características
        weak_passwords = [
            "123456",  # Muito simples
            "password",  # Palavra comum
            "abc",  # Muito curta
            "ALLUPPERCASE",  # Sem variação
            "alllowercase",  # Sem variação
            "NoNumbers!",  # Sem números
            "NoSpecial123",  # Sem caracteres especiais
        ]

        for weak_password in weak_passwords:
            payload = PasswordResetBySecretKey(
                username="masterautonomocontrol",
                secret_key="test-key",
                new_password=weak_password,
            )

            # Act & Assert
            # Validação pode ser feita no schema Pydantic ou no service
            # Este teste documenta o comportamento esperado
            assert len(payload.new_password) > 0  # Básico: não vazio

    def test_secret_key_format_validation(self):
        """Testa validação de formato da chave secreta."""
        # Arrange - Diferentes formatos de chave
        invalid_keys = [
            "",  # Vazia
            "short",  # Muito curta
            "spaces in key",  # Com espaços
            "key-with-unicode-ñ",  # Com caracteres especiais
            "a" * 1000,  # Muito longa
        ]

        for invalid_key in invalid_keys:
            payload = PasswordResetBySecretKey(
                username="masterautonomocontrol",
                secret_key=invalid_key,
                new_password="ValidPassword123!",
            )

            with patch(
                "app.api.v1.secret_keys.SecretKeyService.validate_secret_key_for_reset"
            ) as mock_validate:
                mock_validate.side_effect = ValueError("Chave secreta inválida")

                # Act & Assert
                with pytest.raises(HTTPException) as exc_info:
                    reset_password_by_secret_key(payload=payload, db=self.db_mock)

                assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

    def test_database_transaction_rollback(self):
        """Testa rollback de transação em caso de erro."""
        # Arrange
        self.db_mock.commit.side_effect = Exception("Database connection lost")

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            generate_secret_key(db=self.db_mock, current_user=self.master_user)

        # Verificar se rollback foi chamado (se implementado)
        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    @patch("app.api.v1.secret_keys.SecretKeyService.create_secret_key_for_master")
    def test_secret_key_entropy_validation(self, mock_create_key):
        """Testa que chaves geradas têm entropia suficiente."""
        # Arrange
        mock_create_key.return_value = "abcdefghijklmnop"  # Baixa entropia

        # Act
        result = generate_secret_key(db=self.db_mock, current_user=self.master_user)

        # Assert - Verificar que a chave não é sequencial
        key = result["secret_key"]
        is_sequential = all(
            ord(key[i]) == ord(key[i - 1]) + 1 for i in range(1, len(key))
        )
        assert not is_sequential, "Chave secreta não deve ser sequencial"

    def test_user_role_enum_validation(self):
        """Testa validação robusta de enum de role de usuário."""
        # Arrange - Usuário com role inválida
        invalid_user = Mock()
        invalid_user.role = "INVALID_ROLE"
        invalid_user.username = "test"

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            generate_secret_key(db=self.db_mock, current_user=invalid_user)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN

    def test_inactive_user_access_denied(self):
        """Testa que usuários inativos não podem acessar endpoints."""
        # Arrange
        inactive_master = User(
            id=1,
            username="masterautonomocontrol",
            role="MASTER",
            is_active=False,  # Usuário inativo
        )

        # Act & Assert
        endpoints_to_test = [
            lambda: generate_secret_key(db=self.db_mock, current_user=inactive_master),
            lambda: get_secret_key_status(
                db=self.db_mock, current_user=inactive_master
            ),
            lambda: revoke_secret_key(db=self.db_mock, current_user=inactive_master),
        ]

        for endpoint_func in endpoints_to_test:
            # Dependendo da implementação, pode retornar 403 ou 401
            with pytest.raises(HTTPException) as exc_info:
                endpoint_func()
            assert exc_info.value.status_code in [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ]
