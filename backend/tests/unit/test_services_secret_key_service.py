import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.services.secret_key_service import SecretKeyService
from app.models.user import User


class TestSecretKeyServiceGeneration:
    """Testes para geração de chaves secretas."""

    def test_generate_secret_key_default_length(self):
        """Testa geração de chave com comprimento padrão."""
        key = SecretKeyService.generate_secret_key()

        assert len(key) == 16
        assert key.isalnum()
        assert key.isupper() or key.isdigit()

    def test_generate_secret_key_custom_length(self):
        """Testa geração de chave com comprimento personalizado."""
        lengths = [8, 12, 20, 32]

        for length in lengths:
            key = SecretKeyService.generate_secret_key(length)
            assert len(key) == length
            assert key.isalnum()

    def test_generate_secret_key_no_confusing_characters(self):
        """Testa que caracteres confusos não são incluídos."""
        # Gerar múltiplas chaves para aumentar probabilidade de detectar caracteres confusos
        for _ in range(100):
            key = SecretKeyService.generate_secret_key()

            # Não deve conter 0, O, I, 1
            assert "0" not in key
            assert "O" not in key
            assert "I" not in key
            assert "1" not in key

    def test_generate_secret_key_uniqueness(self):
        """Testa que chaves geradas são únicas."""
        keys = set()

        # Gerar 1000 chaves e verificar unicidade
        for _ in range(1000):
            key = SecretKeyService.generate_secret_key()
            keys.add(key)

        # Deve ter 1000 chaves únicas (ou muito próximo disso)
        assert len(keys) > 990  # Permitir pequena margem para colisões raras

    def test_generate_secret_key_valid_characters(self):
        """Testa que apenas caracteres válidos são usados."""
        key = SecretKeyService.generate_secret_key()
        valid_chars = set("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")

        for char in key:
            assert char in valid_chars

    def test_generate_secret_key_minimum_length(self):
        """Testa geração com comprimento mínimo."""
        key = SecretKeyService.generate_secret_key(1)
        assert len(key) == 1
        assert key.isalnum()

    def test_generate_secret_key_zero_length(self):
        """Testa geração com comprimento zero."""
        key = SecretKeyService.generate_secret_key(0)
        assert len(key) == 0
        assert key == ""

    @patch("app.services.secret_key_service.secrets.choice")
    def test_generate_secret_key_uses_secrets_module(self, mock_choice):
        """Testa que o módulo secrets é usado para geração segura."""
        mock_choice.return_value = "A"

        key = SecretKeyService.generate_secret_key(5)

        assert mock_choice.call_count == 5
        assert key == "AAAAA"


class TestSecretKeyServiceHashing:
    """Testes para hash de chaves secretas."""

    def test_hash_secret_key_creates_hash(self):
        """Testa que hash é criado corretamente."""
        secret_key = "TESTKEY123"
        hashed = SecretKeyService.hash_secret_key(secret_key)

        assert hashed != secret_key
        assert len(hashed) > 50  # Hash bcrypt é longo
        assert hashed.startswith("$2b$")  # Formato bcrypt

    def test_hash_secret_key_different_inputs_different_hashes(self):
        """Testa que entradas diferentes geram hashes diferentes."""
        key1 = "TESTKEY123"
        key2 = "TESTKEY456"

        hash1 = SecretKeyService.hash_secret_key(key1)
        hash2 = SecretKeyService.hash_secret_key(key2)

        assert hash1 != hash2

    def test_hash_secret_key_same_input_different_hashes(self):
        """Testa que a mesma entrada gera hashes diferentes (salt)."""
        secret_key = "TESTKEY123"

        hash1 = SecretKeyService.hash_secret_key(secret_key)
        hash2 = SecretKeyService.hash_secret_key(secret_key)

        # Devido ao salt, hashes devem ser diferentes
        assert hash1 != hash2

    def test_hash_secret_key_empty_string(self):
        """Testa hash de string vazia."""
        hashed = SecretKeyService.hash_secret_key("")

        assert hashed != ""
        assert hashed.startswith("$2b$")

    def test_hash_secret_key_special_characters(self):
        """Testa hash com caracteres especiais."""
        secret_key = "TEST@#$%^&*()KEY"
        hashed = SecretKeyService.hash_secret_key(secret_key)

        assert hashed != secret_key
        assert hashed.startswith("$2b$")

    def test_hash_secret_key_unicode_characters(self):
        """Testa hash com caracteres Unicode."""
        secret_key = "TESTKEY123çãoñ"
        hashed = SecretKeyService.hash_secret_key(secret_key)

        assert hashed != secret_key
        assert hashed.startswith("$2b$")


class TestSecretKeyServiceVerification:
    """Testes para verificação de chaves secretas."""

    def test_verify_secret_key_correct_key(self):
        """Testa verificação com chave correta."""
        secret_key = "TESTKEY123"
        hashed = SecretKeyService.hash_secret_key(secret_key)

        result = SecretKeyService.verify_secret_key(secret_key, hashed)
        assert result is True

    def test_verify_secret_key_incorrect_key(self):
        """Testa verificação com chave incorreta."""
        secret_key = "TESTKEY123"
        wrong_key = "WRONGKEY456"
        hashed = SecretKeyService.hash_secret_key(secret_key)

        result = SecretKeyService.verify_secret_key(wrong_key, hashed)
        assert result is False

    def test_verify_secret_key_empty_key(self):
        """Testa verificação com chave vazia."""
        secret_key = "TESTKEY123"
        hashed = SecretKeyService.hash_secret_key(secret_key)

        result = SecretKeyService.verify_secret_key("", hashed)
        assert result is False

    def test_verify_secret_key_empty_hash(self):
        """Testa verificação com hash vazio."""
        secret_key = "TESTKEY123"

        result = SecretKeyService.verify_secret_key(secret_key, "")
        assert result is False

    def test_verify_secret_key_case_sensitive(self):
        """Testa que verificação é case-sensitive."""
        secret_key = "TESTKEY123"
        hashed = SecretKeyService.hash_secret_key(secret_key)

        result = SecretKeyService.verify_secret_key("testkey123", hashed)
        assert result is False

    def test_verify_secret_key_malformed_hash(self):
        """Testa verificação com hash malformado."""
        secret_key = "TESTKEY123"
        malformed_hash = "invalid_hash_format"

        result = SecretKeyService.verify_secret_key(secret_key, malformed_hash)
        assert result is False


class TestCreateSecretKeyForMaster:
    """Testes para criação de chave secreta para Master."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.mock_query = Mock()
        self.mock_db.query.return_value = self.mock_query

    def create_mock_user(self, user_id: str, role: str):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.id = user_id
        user.role = role
        user.secret_key_hash = None
        user.secret_key_created_at = None
        user.secret_key_used_at = None
        return user

    @patch("app.services.secret_key_service.datetime")
    def test_create_secret_key_for_master_success(self, mock_datetime):
        """Testa criação bem-sucedida de chave para Master."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        master_user = self.create_mock_user("1", "MASTER")
        self.mock_query.filter.return_value.first.return_value = master_user

        result = SecretKeyService.create_secret_key_for_master(self.mock_db, 1)

        # Verificar que chave foi gerada
        assert len(result) == 16
        assert result.isalnum()

        # Verificar que usuário foi atualizado
        assert master_user.secret_key_hash is not None
        assert master_user.secret_key_created_at == mock_now
        assert master_user.secret_key_used_at is None

        # Verificar commit e refresh
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(master_user)

    def test_create_secret_key_for_master_user_not_found(self):
        """Testa erro quando usuário não é encontrado."""
        self.mock_query.filter.return_value.first.return_value = None

        with pytest.raises(ValueError) as exc_info:
            SecretKeyService.create_secret_key_for_master(self.mock_db, 999)

        assert "Apenas usuários Master" in str(exc_info.value)

    def test_create_secret_key_for_master_user_not_master(self):
        """Testa erro quando usuário não é Master."""
        admin_user = self.create_mock_user("1", "ADMIN")
        self.mock_query.filter.return_value.first.return_value = admin_user

        with pytest.raises(ValueError) as exc_info:
            SecretKeyService.create_secret_key_for_master(self.mock_db, 1)

        assert "Apenas usuários Master" in str(exc_info.value)

    @patch("app.services.secret_key_service.SecretKeyService.generate_secret_key")
    @patch("app.services.secret_key_service.SecretKeyService.hash_secret_key")
    def test_create_secret_key_for_master_uses_service_methods(
        self, mock_hash, mock_generate
    ):
        """Testa que métodos do serviço são usados corretamente."""
        mock_generate.return_value = "TESTKEY123"
        mock_hash.return_value = "hashed_key"

        master_user = self.create_mock_user("1", "MASTER")
        self.mock_query.filter.return_value.first.return_value = master_user

        result = SecretKeyService.create_secret_key_for_master(self.mock_db, 1)

        mock_generate.assert_called_once()
        mock_hash.assert_called_once_with("TESTKEY123")
        assert result == "TESTKEY123"
        assert master_user.secret_key_hash == "hashed_key"


class TestValidateSecretKeyForReset:
    """Testes para validação de chave secreta para reset."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.mock_query = Mock()
        self.mock_db.query.return_value = self.mock_query

    def create_mock_user(
        self,
        username: str,
        role: str,
        secret_key_hash: str = None,
        created_at: datetime = None,
    ):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.username = username
        user.role = role
        user.secret_key_hash = secret_key_hash
        user.secret_key_created_at = created_at
        return user

    @patch("app.services.secret_key_service.SecretKeyService.verify_secret_key")
    @patch("app.services.secret_key_service.datetime")
    def test_validate_secret_key_for_reset_success(self, mock_datetime, mock_verify):
        """Testa validação bem-sucedida de chave para reset."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now
        mock_verify.return_value = True

        created_at = mock_now - timedelta(days=30)  # Chave criada há 30 dias
        master_user = self.create_mock_user(
            "masterautonomocontrol", "MASTER", "hashed_key", created_at
        )
        self.mock_query.filter.return_value.first.return_value = master_user

        result = SecretKeyService.validate_secret_key_for_reset(
            self.mock_db, "masterautonomocontrol", "TESTKEY123"
        )

        assert result == master_user
        mock_verify.assert_called_once_with("TESTKEY123", "hashed_key")

    def test_validate_secret_key_for_reset_user_not_found(self):
        """Testa validação quando usuário não é encontrado."""
        self.mock_query.filter.return_value.first.return_value = None

        result = SecretKeyService.validate_secret_key_for_reset(
            self.mock_db, "nonexistent", "TESTKEY123"
        )

        assert result is None

    def test_validate_secret_key_for_reset_no_secret_key_hash(self):
        """Testa validação quando usuário não tem chave secreta."""
        master_user = self.create_mock_user("masterautonomocontrol", "MASTER")
        self.mock_query.filter.return_value.first.return_value = master_user

        result = SecretKeyService.validate_secret_key_for_reset(
            self.mock_db, "masterautonomocontrol", "TESTKEY123"
        )

        assert result is None

    @patch("app.services.secret_key_service.SecretKeyService.verify_secret_key")
    def test_validate_secret_key_for_reset_wrong_key(self, mock_verify):
        """Testa validação com chave incorreta."""
        mock_verify.return_value = False

        master_user = self.create_mock_user(
            "masterautonomocontrol", "MASTER", "hashed_key"
        )
        self.mock_query.filter.return_value.first.return_value = master_user

        result = SecretKeyService.validate_secret_key_for_reset(
            self.mock_db, "masterautonomocontrol", "WRONGKEY"
        )

        assert result is None

    @patch("app.services.secret_key_service.SecretKeyService.verify_secret_key")
    @patch("app.services.secret_key_service.datetime")
    def test_validate_secret_key_for_reset_expired_key(
        self, mock_datetime, mock_verify
    ):
        """Testa validação com chave expirada."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now
        mock_verify.return_value = True

        # Chave criada há 100 dias (expirada)
        created_at = mock_now - timedelta(days=100)
        master_user = self.create_mock_user(
            "masterautonomocontrol", "MASTER", "hashed_key", created_at
        )
        self.mock_query.filter.return_value.first.return_value = master_user

        result = SecretKeyService.validate_secret_key_for_reset(
            self.mock_db, "masterautonomocontrol", "TESTKEY123"
        )

        assert result is None

    @patch("app.services.secret_key_service.SecretKeyService.verify_secret_key")
    def test_validate_secret_key_for_reset_no_created_at(self, mock_verify):
        """Testa validação quando não há data de criação."""
        mock_verify.return_value = True

        master_user = self.create_mock_user(
            "masterautonomocontrol", "MASTER", "hashed_key"
        )
        self.mock_query.filter.return_value.first.return_value = master_user

        result = SecretKeyService.validate_secret_key_for_reset(
            self.mock_db, "masterautonomocontrol", "TESTKEY123"
        )

        # Sem data de criação, deve ser válida
        assert result == master_user


class TestMarkSecretKeyAsUsed:
    """Testes para marcar chave secreta como usada."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)

    def create_mock_user(self):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.secret_key_used_at = None
        return user

    @patch("app.services.secret_key_service.datetime")
    def test_mark_secret_key_as_used(self, mock_datetime):
        """Testa marcação de chave como usada."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        user = self.create_mock_user()

        SecretKeyService.mark_secret_key_as_used(self.mock_db, user)

        assert user.secret_key_used_at == mock_now
        self.mock_db.commit.assert_called_once()


class TestGetMasterUser:
    """Testes para buscar usuário Master."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.mock_query = Mock()
        self.mock_db.query.return_value = self.mock_query

    def test_get_master_user_found(self):
        """Testa busca bem-sucedida do usuário Master."""
        master_user = Mock(spec=User)
        self.mock_query.filter.return_value.first.return_value = master_user

        result = SecretKeyService.get_master_user(self.mock_db)

        assert result == master_user
        self.mock_db.query.assert_called_once_with(User)

    def test_get_master_user_not_found(self):
        """Testa busca quando Master não é encontrado."""
        self.mock_query.filter.return_value.first.return_value = None

        result = SecretKeyService.get_master_user(self.mock_db)

        assert result is None


class TestHasValidSecretKey:
    """Testes para verificar se Master tem chave secreta válida."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.mock_query = Mock()
        self.mock_db.query.return_value = self.mock_query

    def create_mock_user(
        self, secret_key_hash: str = None, created_at: datetime = None
    ):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.secret_key_hash = secret_key_hash
        user.secret_key_created_at = created_at
        return user

    @patch("app.services.secret_key_service.datetime")
    def test_has_valid_secret_key_true(self, mock_datetime):
        """Testa verificação com chave válida."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        created_at = mock_now - timedelta(days=30)
        user = self.create_mock_user("hashed_key", created_at)
        self.mock_query.filter.return_value.first.return_value = user

        result = SecretKeyService.has_valid_secret_key(self.mock_db, 1)

        assert result is True

    def test_has_valid_secret_key_user_not_found(self):
        """Testa verificação quando usuário não é encontrado."""
        self.mock_query.filter.return_value.first.return_value = None

        result = SecretKeyService.has_valid_secret_key(self.mock_db, 999)

        assert result is False

    def test_has_valid_secret_key_no_hash(self):
        """Testa verificação quando não há hash de chave."""
        user = self.create_mock_user()
        self.mock_query.filter.return_value.first.return_value = user

        result = SecretKeyService.has_valid_secret_key(self.mock_db, 1)

        assert result is False

    @patch("app.services.secret_key_service.datetime")
    def test_has_valid_secret_key_expired(self, mock_datetime):
        """Testa verificação com chave expirada."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        # Chave criada há 100 dias (expirada)
        created_at = mock_now - timedelta(days=100)
        user = self.create_mock_user("hashed_key", created_at)
        self.mock_query.filter.return_value.first.return_value = user

        result = SecretKeyService.has_valid_secret_key(self.mock_db, 1)

        assert result is False

    def test_has_valid_secret_key_no_created_at(self):
        """Testa verificação quando não há data de criação."""
        user = self.create_mock_user("hashed_key")
        self.mock_query.filter.return_value.first.return_value = user

        result = SecretKeyService.has_valid_secret_key(self.mock_db, 1)

        # Sem data de criação, deve ser válida
        assert result is True


class TestSecretKeyServiceIntegration:
    """Testes de integração para SecretKeyService."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)

    @patch("app.services.secret_key_service.datetime")
    def test_complete_secret_key_lifecycle(self, mock_datetime):
        """Testa ciclo completo de vida da chave secreta."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        # 1. Criar usuário Master mock
        master_user = Mock(spec=User)
        master_user.id = 1
        master_user.role = "MASTER"
        master_user.username = "masterautonomocontrol"
        master_user.secret_key_hash = None
        master_user.secret_key_created_at = None
        master_user.secret_key_used_at = None

        # Mock queries
        mock_query = Mock()
        self.mock_db.query.return_value = mock_query
        mock_query.filter.return_value.first.return_value = master_user

        # 2. Criar chave secreta
        secret_key = SecretKeyService.create_secret_key_for_master(self.mock_db, 1)

        # Verificar que chave foi criada
        assert len(secret_key) == 16
        assert master_user.secret_key_hash is not None
        assert master_user.secret_key_created_at == mock_now

        # 3. Validar chave para reset
        with patch(
            "app.services.secret_key_service.SecretKeyService.verify_secret_key"
        ) as mock_verify:
            mock_verify.return_value = True

            validated_user = SecretKeyService.validate_secret_key_for_reset(
                self.mock_db, "masterautonomocontrol", secret_key
            )

            assert validated_user == master_user

        # 4. Marcar como usada
        SecretKeyService.mark_secret_key_as_used(self.mock_db, master_user)
        assert master_user.secret_key_used_at == mock_now

        # 5. Verificar se tem chave válida
        result = SecretKeyService.has_valid_secret_key(self.mock_db, 1)
        assert result is True


class TestSecretKeyServiceEdgeCases:
    """Testes para casos extremos do SecretKeyService."""

    def test_generate_secret_key_large_length(self):
        """Testa geração de chave com comprimento muito grande."""
        key = SecretKeyService.generate_secret_key(1000)

        assert len(key) == 1000
        assert key.isalnum()

    def test_hash_and_verify_very_long_key(self):
        """Testa hash e verificação de chave muito longa."""
        long_key = "A" * 1000
        hashed = SecretKeyService.hash_secret_key(long_key)

        result = SecretKeyService.verify_secret_key(long_key, hashed)
        assert result is True

    def test_hash_and_verify_key_with_newlines(self):
        """Testa hash e verificação de chave com quebras de linha."""
        key_with_newlines = "TEST\nKEY\r\n123"
        hashed = SecretKeyService.hash_secret_key(key_with_newlines)

        result = SecretKeyService.verify_secret_key(key_with_newlines, hashed)
        assert result is True

    @patch("app.services.secret_key_service.datetime")
    def test_validate_secret_key_exactly_90_days(self, mock_datetime):
        """Testa validação de chave criada exatamente há 90 dias."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        # Chave criada exatamente há 90 dias
        created_at = mock_now - timedelta(days=90)

        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_db.query.return_value = mock_query

        master_user = Mock(spec=User)
        master_user.username = "masterautonomocontrol"
        master_user.role = "MASTER"
        master_user.secret_key_hash = "hashed_key"
        master_user.secret_key_created_at = created_at

        mock_query.filter.return_value.first.return_value = master_user

        with patch(
            "app.services.secret_key_service.SecretKeyService.verify_secret_key"
        ) as mock_verify:
            mock_verify.return_value = True

            result = SecretKeyService.validate_secret_key_for_reset(
                mock_db, "masterautonomocontrol", "TESTKEY123"
            )

            # Exatamente 90 dias deve ser válido
            assert result == master_user
