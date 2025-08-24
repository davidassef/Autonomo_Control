import pytest
from unittest.mock import patch, MagicMock

from app.core.master_protection import (
    is_original_master,
    can_delete_user,
    can_disable_user,
    can_block_user,
)
from app.models.user import User


class TestIsOriginalMaster:
    """Testes para a função is_original_master."""

    def create_mock_user(self, email: str, role: str) -> MagicMock:
        """Cria um mock de usuário com email e role específicos."""
        user = MagicMock(spec=User)
        user.email = email
        user.role = role
        return user

    @patch("app.core.master_protection.settings")
    def test_is_original_master_true(self, mock_settings):
        """Testa se identifica corretamente o Master original."""
        mock_settings.MASTER_EMAIL = "master@test.com"

        user = self.create_mock_user("master@test.com", "MASTER")

        result = is_original_master(user)
        assert result is True

    @patch("app.core.master_protection.settings")
    def test_is_original_master_wrong_email(self, mock_settings):
        """Testa se retorna False para email diferente."""
        mock_settings.MASTER_EMAIL = "master@test.com"

        user = self.create_mock_user("other@test.com", "MASTER")

        result = is_original_master(user)
        assert result is False

    @patch("app.core.master_protection.settings")
    def test_is_original_master_wrong_role(self, mock_settings):
        """Testa se retorna False para role diferente de MASTER."""
        mock_settings.MASTER_EMAIL = "master@test.com"

        user = self.create_mock_user("master@test.com", "ADMIN")

        result = is_original_master(user)
        assert result is False

    @patch("app.core.master_protection.settings")
    def test_is_original_master_no_master_email_configured(self, mock_settings):
        """Testa se retorna False quando MASTER_EMAIL não está
        configurado."""
        mock_settings.MASTER_EMAIL = None

        user = self.create_mock_user("master@test.com", "MASTER")

        result = is_original_master(user)
        assert result is False

    @patch("app.core.master_protection.settings")
    def test_is_original_master_empty_master_email(self, mock_settings):
        """Testa se retorna False quando MASTER_EMAIL vazio."""
        mock_settings.MASTER_EMAIL = ""

        user = self.create_mock_user("master@test.com", "MASTER")

        result = is_original_master(user)
        assert result is False

    @patch("app.core.master_protection.settings")
    def test_is_original_master_user_role(self, mock_settings):
        """Testa se retorna False para usuário comum com
        email correto."""
        mock_settings.MASTER_EMAIL = "master@test.com"

        user = self.create_mock_user("master@test.com", "USER")

        result = is_original_master(user)
        assert result is False


class TestCanDeleteUser:
    """Testes para a função can_delete_user."""

    def create_mock_user(self, user_id: str, email: str, role: str) -> MagicMock:
        """Cria um mock de usuário com id, email e role
        específicos."""
        user = MagicMock(spec=User)
        user.id = user_id
        user.email = email
        user.role = role
        return user

    def test_can_delete_user_self_deletion(self):
        """Testa se impede auto-exclusão."""
        user = self.create_mock_user(1, "user@test.com", "USER")

        can_delete, message = can_delete_user(user, user)

        assert can_delete is False
        assert "própria conta" in message

    @patch("app.core.master_protection.is_original_master")
    def test_can_delete_original_master(self, mock_is_original_master):
        """Testa se protege o Master original."""
        mock_is_original_master.return_value = True

        target_user = self.create_mock_user("1", "master@test.com", "MASTER")
        current_user = self.create_mock_user("2", "admin@test.com", "ADMIN")

        can_delete, message = can_delete_user(target_user, current_user)

        assert can_delete is False
        assert "Master original" in message
        mock_is_original_master.assert_called_once_with(target_user)

    @patch("app.core.master_protection.is_original_master")
    def test_can_delete_other_master(self, mock_is_original_master):
        """Testa se impede exclusão de outros MASTERs."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "other_master@test.com", "MASTER")
        current_user = self.create_mock_user("2", "admin@test.com", "ADMIN")

        can_delete, message = can_delete_user(target_user, current_user)

        assert can_delete is False
        assert "MASTER" in message

    @patch("app.core.master_protection.is_original_master")
    def test_admin_cannot_delete_admin(self, mock_is_original_master):
        """Testa se ADMIN não pode excluir outro ADMIN."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "admin1@test.com", "ADMIN")
        current_user = self.create_mock_user("2", "admin2@test.com", "ADMIN")

        can_delete, message = can_delete_user(target_user, current_user)

        assert can_delete is False
        assert "ADMIN não pode excluir outro ADMIN" in message

    @patch("app.core.master_protection.is_original_master")
    def test_admin_can_delete_user(self, mock_is_original_master):
        """Testa se ADMIN pode excluir usuário comum."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "user@test.com", "USER")
        current_user = self.create_mock_user("2", "admin@test.com", "ADMIN")

        can_delete, message = can_delete_user(target_user, current_user)

        assert can_delete is True
        assert message == ""

    @patch("app.core.master_protection.is_original_master")
    def test_master_can_delete_admin(self, mock_is_original_master):
        """Testa se MASTER pode excluir ADMIN."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "admin@test.com", "ADMIN")
        current_user = self.create_mock_user("2", "master@test.com", "MASTER")

        can_delete, message = can_delete_user(target_user, current_user)

        assert can_delete is True
        assert message == ""

    @patch("app.core.master_protection.is_original_master")
    def test_master_can_delete_user(self, mock_is_original_master):
        """Testa se MASTER pode excluir usuário comum."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "user@test.com", "USER")
        current_user = self.create_mock_user("2", "master@test.com", "MASTER")

        can_delete, message = can_delete_user(target_user, current_user)

        assert can_delete is True
        assert message == ""


class TestCanDisableUser:
    """Testes para a função can_disable_user."""

    def create_mock_user(self, user_id: str, email: str, role: str) -> MagicMock:
        """Cria um mock de usuário com id, email e role
        específicos."""
        user = MagicMock(spec=User)
        user.id = user_id
        user.email = email
        user.role = role
        return user

    @patch("app.core.master_protection.is_original_master")
    def test_cannot_disable_original_master(self, mock_is_original_master):
        """Testa se protege o Master original de desabilitação."""
        mock_is_original_master.return_value = True

        target_user = self.create_mock_user("1", "master@test.com", "MASTER")
        current_user = self.create_mock_user("2", "admin@test.com", "ADMIN")

        can_disable, message = can_disable_user(target_user, current_user)

        assert can_disable is False
        assert "Master original" in message
        mock_is_original_master.assert_called_once_with(target_user)

    @patch("app.core.master_protection.is_original_master")
    def test_cannot_disable_other_master(self, mock_is_original_master):
        """Testa se impede desabilitação de outros MASTERs."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "other_master@test.com", "MASTER")
        current_user = self.create_mock_user("2", "admin@test.com", "ADMIN")

        can_disable, message = can_disable_user(target_user, current_user)

        assert can_disable is False
        assert "desativar MASTER" in message

    def test_cannot_disable_self(self):
        """Testa se usuário não pode desabilitar a própria conta."""
        user = self.create_mock_user("1", "user@test.com", "USER")

        can_disable, message = can_disable_user(user, user)

        assert can_disable is False
        assert "própria conta" in message

    @patch("app.core.master_protection.is_original_master")
    def test_admin_cannot_disable_admin(self, mock_is_original_master):
        """Testa se ADMIN não pode desabilitar outro ADMIN."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "admin1@test.com", "ADMIN")
        current_user = self.create_mock_user("2", "admin2@test.com", "ADMIN")

        can_disable, message = can_disable_user(target_user, current_user)

        assert can_disable is False
        assert "ADMIN não desativa ADMIN" in message

    @patch("app.core.master_protection.is_original_master")
    def test_admin_can_disable_user(self, mock_is_original_master):
        """Testa se ADMIN pode desabilitar usuário comum."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "user@test.com", "USER")
        current_user = self.create_mock_user("2", "admin@test.com", "ADMIN")

        can_disable, message = can_disable_user(target_user, current_user)

        assert can_disable is True
        assert message == ""

    @patch("app.core.master_protection.is_original_master")
    def test_master_can_disable_admin(self, mock_is_original_master):
        """Testa se MASTER pode desabilitar ADMIN."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "admin@test.com", "ADMIN")
        current_user = self.create_mock_user("2", "master@test.com", "MASTER")

        can_disable, message = can_disable_user(target_user, current_user)

        assert can_disable is True
        assert message == ""


class TestCanBlockUser:
    """Testes para a função can_block_user."""

    def create_mock_user(self, user_id: str, email: str, role: str) -> MagicMock:
        """Cria um mock de usuário com id, email e role
        específicos."""
        user = MagicMock(spec=User)
        user.id = user_id
        user.email = email
        user.role = role
        return user

    @patch("app.core.master_protection.is_original_master")
    def test_cannot_block_original_master(self, mock_is_original_master):
        """Testa se protege o Master original de bloqueio."""
        mock_is_original_master.return_value = True

        target_user = self.create_mock_user("1", "master@test.com", "MASTER")
        current_user = self.create_mock_user("2", "admin@test.com", "ADMIN")

        can_block, message = can_block_user(target_user, current_user)

        assert can_block is False
        assert "Master original" in message
        mock_is_original_master.assert_called_once_with(target_user)

    @patch("app.core.master_protection.is_original_master")
    def test_cannot_block_other_master(self, mock_is_original_master):
        """Testa se impede bloqueio de outros MASTERs."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "other_master@test.com", "MASTER")
        current_user = self.create_mock_user("2", "admin@test.com", "ADMIN")

        can_block, message = can_block_user(target_user, current_user)

        assert can_block is False
        assert "bloquear o MASTER" in message

    def test_cannot_block_self(self):
        """Testa se usuário não pode bloquear a própria conta."""
        user = self.create_mock_user("1", "user@test.com", "USER")

        can_block, message = can_block_user(user, user)

        assert can_block is False
        assert "própria conta" in message

    @patch("app.core.master_protection.is_original_master")
    def test_admin_cannot_block_admin(self, mock_is_original_master):
        """Testa se ADMIN não pode bloquear outro ADMIN."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "admin1@test.com", "ADMIN")
        current_user = self.create_mock_user("2", "admin2@test.com", "ADMIN")

        can_block, message = can_block_user(target_user, current_user)

        assert can_block is False
        assert "ADMIN não pode bloquear outro ADMIN" in message

    @patch("app.core.master_protection.is_original_master")
    def test_admin_can_block_user(self, mock_is_original_master):
        """Testa se ADMIN pode bloquear usuário comum."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "user@test.com", "USER")
        current_user = self.create_mock_user("2", "admin@test.com", "ADMIN")

        can_block, message = can_block_user(target_user, current_user)

        assert can_block is True
        assert message == ""

    @patch("app.core.master_protection.is_original_master")
    def test_master_can_block_admin(self, mock_is_original_master):
        """Testa se MASTER pode bloquear ADMIN."""
        mock_is_original_master.return_value = False

        target_user = self.create_mock_user("1", "admin@test.com", "ADMIN")
        current_user = self.create_mock_user("2", "master@test.com", "MASTER")

        can_block, message = can_block_user(target_user, current_user)

        assert can_block is True
        assert message == ""


class TestMasterProtectionIntegration:
    """Testes de integração para as funções de proteção do Master."""

    def create_mock_user(self, user_id: str, email: str, role: str) -> MagicMock:
        """Cria um mock de usuário com id, email e role específicos."""
        user = MagicMock(spec=User)
        user.id = user_id
        user.email = email
        user.role = role
        return user

    @patch("app.core.master_protection.settings")
    def test_complete_master_protection_workflow(self, mock_settings):
        """Testa o fluxo completo de proteção do Master original."""
        mock_settings.MASTER_EMAIL = "master@test.com"

        # Master original
        master_user = self.create_mock_user("1", "master@test.com", "MASTER")
        # Admin tentando fazer ações
        admin_user = self.create_mock_user("2", "admin@test.com", "ADMIN")

        # Verifica se é Master original
        assert is_original_master(master_user) is True

        # Testa todas as proteções
        can_delete, _ = can_delete_user(master_user, admin_user)
        assert can_delete is False

        can_disable, _ = can_disable_user(master_user, admin_user)
        assert can_disable is False

        can_block, _ = can_block_user(master_user, admin_user)
        assert can_block is False

    @patch("app.core.master_protection.settings")
    def test_non_master_user_operations(self, mock_settings):
        """Testa operações com usuários não-Master."""
        mock_settings.MASTER_EMAIL = "master@test.com"

        # Usuário comum
        regular_user = self.create_mock_user("1", "user@test.com", "USER")
        # Admin fazendo ações
        admin_user = self.create_mock_user("2", "admin@test.com", "ADMIN")

        # Verifica se não é Master original
        assert is_original_master(regular_user) is False

        # Testa se admin pode fazer ações com usuário comum
        can_delete, _ = can_delete_user(regular_user, admin_user)
        assert can_delete is True

        can_disable, _ = can_disable_user(regular_user, admin_user)
        assert can_disable is True

        can_block, _ = can_block_user(regular_user, admin_user)
        assert can_block is True

    def test_role_hierarchy_enforcement(self):
        """Testa se a hierarquia de roles é respeitada."""
        # Diferentes usuários
        admin1 = self.create_mock_user("2", "admin1@test.com", "ADMIN")
        admin2 = self.create_mock_user("3", "admin2@test.com", "ADMIN")
        master = self.create_mock_user("4", "master@test.com", "MASTER")

        # Admin não pode afetar outro Admin
        can_delete, _ = can_delete_user(admin2, admin1)
        assert can_delete is False

        can_disable, _ = can_disable_user(admin2, admin1)
        assert can_disable is False

        can_block, _ = can_block_user(admin2, admin1)
        assert can_block is False

        # Master pode afetar Admin
        can_delete, _ = can_delete_user(admin1, master)
        assert can_delete is True

        can_disable, _ = can_disable_user(admin1, master)
        assert can_disable is True

        can_block, _ = can_block_user(admin1, master)
        assert can_block is True


class TestEdgeCases:
    """Testes para casos extremos e validações de entrada."""

    def create_mock_user(self, user_id: str, email: str, role: str) -> MagicMock:
        """Cria um mock de usuário com id, email e role específicos."""
        user = MagicMock(spec=User)
        user.id = user_id
        user.email = email
        user.role = role
        return user

    @patch("app.core.master_protection.settings")
    def test_case_sensitive_email_comparison(self, mock_settings):
        """Testa se a comparação de email é
        case-sensitive."""
        mock_settings.MASTER_EMAIL = "master@test.com"

        # Email com case diferente
        user = self.create_mock_user("1", "MASTER@TEST.COM", "MASTER")

        result = is_original_master(user)
        assert result is False  # Deve ser case-sensitive

    @patch("app.core.master_protection.settings")
    def test_whitespace_in_email(self, mock_settings):
        """Testa se espaços em branco afetam a comparação."""
        mock_settings.MASTER_EMAIL = "master@test.com"

        # Email com espaços
        user = self.create_mock_user("1", " master@test.com ", "MASTER")

        result = is_original_master(user)
        assert result is False  # Deve falhar com espaços

    def test_none_user_handling(self):
        """Testa como as funções lidam com usuários None."""
        with pytest.raises(AttributeError):
            can_delete_user(None, self.create_mock_user("1", "user@test.com", "USER"))

        with pytest.raises(AttributeError):
            can_delete_user(self.create_mock_user("1", "user@test.com", "USER"), None)

    def test_same_id_different_objects(self):
        """Testa se usuários com mesmo ID mas objetos
        diferentes
        são tratados como iguais."""
        user1 = self.create_mock_user("1", "user1@test.com", "USER")
        user2 = self.create_mock_user("1", "user2@test.com", "ADMIN")  # Mesmo ID

        can_delete, message = can_delete_user(user1, user2)

        assert can_delete is False
        assert "própria conta" in message
