import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.hierarchy_service import HierarchyService
from app.models.user import User


class TestHierarchyServiceInit:
    """Testes para inicialização do HierarchyService."""

    def test_hierarchy_service_initialization(self):
        """Testa se o HierarchyService é inicializado corretamente."""
        mock_db = Mock(spec=Session)
        service = HierarchyService(mock_db)

        assert service.db == mock_db
        assert isinstance(service, HierarchyService)


class TestGetVisibleUsers:
    """Testes para get_visible_users."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = HierarchyService(self.mock_db)
        self.mock_query = Mock()
        self.mock_db.query.return_value = self.mock_query

    def create_mock_user(
        self,
        user_id: str,
        role: str,
        email: str = None,
        can_view_admins: bool = False,
        is_active: bool = True,
        blocked_at=None,
    ):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.id = user_id
        user.role = role
        user.email = email or f"user{user_id}@test.com"
        user.can_view_admins = can_view_admins
        user.is_active = is_active
        user.blocked_at = blocked_at
        return user

    def test_get_visible_users_master_sees_all(self):
        """Testa que MASTER pode ver todos os usuários."""
        master_user = self.create_mock_user("1", "MASTER")
        mock_users = [Mock(), Mock(), Mock()]
        self.mock_query.order_by.return_value.all.return_value = mock_users

        result = self.service.get_visible_users(master_user)

        # MASTER não deve ter filtros aplicados
        self.mock_db.query.assert_called_once_with(User)
        self.mock_query.order_by.assert_called_once()
        assert result == mock_users

    def test_get_visible_users_admin_with_view_admins_permission(self):
        """Testa ADMIN com permissão para ver outros ADMINs."""
        admin_user = self.create_mock_user("2", "ADMIN", can_view_admins=True)
        mock_users = [Mock(), Mock()]
        self.mock_query.filter.return_value.order_by.return_value.all.return_value = (
            mock_users
        )

        result = self.service.get_visible_users(admin_user)

        # Deve filtrar para USER e ADMIN
        self.mock_query.filter.assert_called_once()
        assert result == mock_users

    def test_get_visible_users_admin_without_view_admins_permission(self):
        """Testa ADMIN sem permissão para ver outros ADMINs."""
        admin_user = self.create_mock_user("2", "ADMIN", can_view_admins=False)
        mock_users = [Mock()]
        self.mock_query.filter.return_value.order_by.return_value.all.return_value = (
            mock_users
        )

        result = self.service.get_visible_users(admin_user)

        # Deve filtrar apenas para USER
        self.mock_query.filter.assert_called_once()
        assert result == mock_users

    def test_get_visible_users_regular_user_sees_only_self(self):
        """Testa que usuário comum vê apenas a si mesmo."""
        regular_user = self.create_mock_user("3", "USER")
        mock_users = [regular_user]
        self.mock_query.filter.return_value.order_by.return_value.all.return_value = (
            mock_users
        )

        result = self.service.get_visible_users(regular_user)

        # Deve filtrar apenas para o próprio usuário
        self.mock_query.filter.assert_called_once()
        assert result == mock_users

    def test_get_visible_users_with_role_filter(self):
        """Testa filtro por role."""
        master_user = self.create_mock_user("1", "MASTER")
        filters = {"role": "ADMIN"}
        mock_users = [Mock()]
        self.mock_query.filter.return_value.order_by.return_value.all.return_value = (
            mock_users
        )

        result = self.service.get_visible_users(master_user, filters)

        # Deve aplicar filtro de role
        self.mock_query.filter.assert_called_once()
        assert result == mock_users

    def test_get_visible_users_with_active_filter(self):
        """Testa filtro por status ativo."""
        master_user = self.create_mock_user("1", "MASTER")
        filters = {"active": True}
        mock_users = [Mock()]
        self.mock_query.filter.return_value.order_by.return_value.all.return_value = (
            mock_users
        )

        result = self.service.get_visible_users(master_user, filters)

        self.mock_query.filter.assert_called_once()
        assert result == mock_users

    def test_get_visible_users_with_blocked_filter(self):
        """Testa filtro por usuários bloqueados."""
        master_user = self.create_mock_user("1", "MASTER")
        filters = {"blocked": True}
        mock_users = [Mock()]
        self.mock_query.filter.return_value.order_by.return_value.all.return_value = (
            mock_users
        )

        result = self.service.get_visible_users(master_user, filters)

        self.mock_query.filter.assert_called_once()
        assert result == mock_users

    def test_get_visible_users_with_multiple_filters(self):
        """Testa múltiplos filtros aplicados simultaneamente."""
        master_user = self.create_mock_user("1", "MASTER")
        filters = {
            "role": "USER",
            "active": True,
            "blocked": False,
            "can_view_admins": False,
        }
        mock_users = [Mock()]

        # Mock mais detalhado para rastrear chamadas
        filter_mock = Mock()
        filter_mock.filter.return_value = filter_mock
        filter_mock.order_by.return_value.all.return_value = mock_users

        # Configurar o mock da query inicial
        self.mock_query.filter.return_value = filter_mock

        result = self.service.get_visible_users(master_user, filters)

        # Debug: verificar todas as chamadas de filter
        print(f"\nChamadas de filter: {filter_mock.filter.call_count}")
        print(f"Argumentos das chamadas: {filter_mock.filter.call_args_list}")

        # Verificar cada filtro individualmente
        call_args = [str(call) for call in filter_mock.filter.call_args_list]
        print(f"\nFiltros aplicados:")
        for i, arg in enumerate(call_args, 1):
            print(f"  {i}: {arg}")

        # Para MASTER com filtros adicionais, devemos ter exatamente 3 chamadas
        # active, blocked, can_view_admins (role não é aplicado para MASTER que vê todos)
        expected_calls = 3
        actual_calls = filter_mock.filter.call_count

        # Verificar se todos os filtros esperados foram aplicados
        assert (
            actual_calls == expected_calls
        ), f"Esperado {expected_calls} filtros, mas foram aplicados {actual_calls}. Filtros: {call_args}"
        assert result == mock_users


class TestCanManageUser:
    """Testes para can_manage_user."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = HierarchyService(self.mock_db)

    def create_mock_user(self, user_id: str, role: str):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.id = user_id
        user.role = role
        return user

    def test_master_can_manage_admin(self):
        """Testa que MASTER pode gerenciar ADMIN."""
        master = self.create_mock_user("1", "MASTER")
        admin = self.create_mock_user("2", "ADMIN")

        result = self.service.can_manage_user(master, admin)
        assert result is True

    def test_master_can_manage_user(self):
        """Testa que MASTER pode gerenciar USER."""
        master = self.create_mock_user("1", "MASTER")
        user = self.create_mock_user("2", "USER")

        result = self.service.can_manage_user(master, user)
        assert result is True

    def test_master_cannot_manage_other_master(self):
        """Testa que MASTER não pode gerenciar outro MASTER."""
        master1 = self.create_mock_user("1", "MASTER")
        master2 = self.create_mock_user("2", "MASTER")

        result = self.service.can_manage_user(master1, master2)
        assert result is False

    def test_master_can_manage_self(self):
        """Testa que MASTER pode gerenciar a si mesmo."""
        master = self.create_mock_user("1", "MASTER")

        result = self.service.can_manage_user(master, master)
        assert result is True

    def test_admin_can_manage_user(self):
        """Testa que ADMIN pode gerenciar USER."""
        admin = self.create_mock_user("1", "ADMIN")
        user = self.create_mock_user("2", "USER")

        result = self.service.can_manage_user(admin, user)
        assert result is True

    def test_admin_cannot_manage_admin(self):
        """Testa que ADMIN não pode gerenciar outro ADMIN."""
        admin1 = self.create_mock_user("1", "ADMIN")
        admin2 = self.create_mock_user("2", "ADMIN")

        result = self.service.can_manage_user(admin1, admin2)
        assert result is False

    def test_admin_cannot_manage_master(self):
        """Testa que ADMIN não pode gerenciar MASTER."""
        admin = self.create_mock_user("1", "ADMIN")
        master = self.create_mock_user("2", "MASTER")

        result = self.service.can_manage_user(admin, master)
        assert result is False

    def test_user_cannot_manage_anyone(self):
        """Testa que USER não pode gerenciar ninguém."""
        user1 = self.create_mock_user("1", "USER")
        user2 = self.create_mock_user("2", "USER")
        admin = self.create_mock_user("3", "ADMIN")
        master = self.create_mock_user("4", "MASTER")

        assert self.service.can_manage_user(user1, user2) is False
        assert self.service.can_manage_user(user1, admin) is False
        assert self.service.can_manage_user(user1, master) is False
        assert self.service.can_manage_user(user1, user1) is False


class TestPromoteToAdmin:
    """Testes para promote_to_admin."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = HierarchyService(self.mock_db)

    def create_mock_user(self, user_id: int, role: str, email: str = None):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.id = user_id
        user.role = role
        user.email = email or f"user{user_id}@test.com"
        return user

    @patch("app.services.hierarchy_service.AuditService.log_user_action")
    @patch("app.services.hierarchy_service.datetime")
    def test_promote_to_admin_success(self, mock_datetime, mock_audit):
        """Testa promoção bem-sucedida de USER para ADMIN."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        master = self.create_mock_user("1", "MASTER")
        user = self.create_mock_user("2", "USER", "user@test.com")

        result = self.service.promote_to_admin(master, user, "Promoção merecida")

        # Verificar alterações no usuário
        assert user.role == "ADMIN"
        assert user.promoted_by == master.id
        assert user.updated_at == mock_now

        # Verificar auditoria
        mock_audit.assert_called_once()

        # Verificar commit e refresh
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(user)

        assert result == user

    def test_promote_to_admin_non_master_forbidden(self):
        """Testa que apenas MASTER pode promover usuários."""
        admin = self.create_mock_user("1", "ADMIN")
        user = self.create_mock_user("2", "USER")

        with pytest.raises(HTTPException) as exc_info:
            self.service.promote_to_admin(admin, user)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Apenas usuários MASTER" in exc_info.value.detail

    def test_promote_to_admin_non_user_bad_request(self):
        """Testa que apenas usuários USER podem ser promovidos."""
        master = self.create_mock_user("1", "MASTER")
        admin = self.create_mock_user("2", "ADMIN")

        with pytest.raises(HTTPException) as exc_info:
            self.service.promote_to_admin(master, admin)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Apenas usuários USER" in exc_info.value.detail

    @patch("app.services.hierarchy_service.AuditService.log_user_action")
    def test_promote_to_admin_audit_details(self, mock_audit):
        """Testa detalhes da auditoria na promoção."""
        master = self.create_mock_user("1", "MASTER")
        user = self.create_mock_user("2", "USER", "user@test.com")

        self.service.promote_to_admin(master, user, "Teste de promoção")

        mock_audit.assert_called_once_with(
            db=self.mock_db,
            action="PROMOTE_TO_ADMIN",
            target_user=user,
            performed_by=master,
            description="Usuário user@test.com promovido para ADMIN",
            details={
                "from_role": "USER",
                "to_role": "ADMIN",
                "reason": "Teste de promoção",
            },
        )


class TestDemoteToUser:
    """Testes para demote_to_user."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = HierarchyService(self.mock_db)

    def create_mock_user(self, user_id: int, role: str, email: str = None):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.id = user_id
        user.role = role
        user.email = email or f"user{user_id}@test.com"
        return user

    @patch("app.services.hierarchy_service.AuditService.log_user_action")
    @patch("app.services.hierarchy_service.datetime")
    def test_demote_to_user_success(self, mock_datetime, mock_audit):
        """Testa rebaixamento bem-sucedido de ADMIN para USER."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        master = self.create_mock_user("1", "MASTER")
        admin = self.create_mock_user("2", "ADMIN", "admin@test.com")

        result = self.service.demote_to_user(master, admin, "Rebaixamento necessário")

        # Verificar alterações no usuário
        assert admin.role == "USER"
        assert admin.demoted_by == master.id
        assert admin.demoted_at == mock_now
        assert admin.can_view_admins is False
        assert admin.updated_at == mock_now

        # Verificar auditoria
        mock_audit.assert_called_once()

        # Verificar commit e refresh
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(admin)

        assert result == admin

    def test_demote_to_user_non_master_forbidden(self):
        """Testa que apenas MASTER pode rebaixar usuários."""
        admin1 = self.create_mock_user("1", "ADMIN")
        admin2 = self.create_mock_user("2", "ADMIN")

        with pytest.raises(HTTPException) as exc_info:
            self.service.demote_to_user(admin1, admin2)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Apenas usuários MASTER" in exc_info.value.detail

    def test_demote_to_user_non_admin_bad_request(self):
        """Testa que apenas usuários ADMIN podem ser rebaixados."""
        master = self.create_mock_user("1", "MASTER")
        user = self.create_mock_user("2", "USER")

        with pytest.raises(HTTPException) as exc_info:
            self.service.demote_to_user(master, user)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Apenas usuários ADMIN" in exc_info.value.detail


class TestToggleAdminVisibility:
    """Testes para toggle_admin_visibility."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = HierarchyService(self.mock_db)

    def create_mock_user(self, user_id: int, role: str, email: str = None):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.id = user_id
        user.role = role
        user.email = email or f"user{user_id}@test.com"
        return user

    @patch("app.services.hierarchy_service.AuditService.log_user_action")
    @patch("app.services.hierarchy_service.datetime")
    def test_toggle_admin_visibility_success(self, mock_datetime, mock_audit):
        """Testa alteração bem-sucedida de visibilidade de ADMIN."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        master = self.create_mock_user("1", "MASTER")
        admin = self.create_mock_user("2", "ADMIN", "admin@test.com")

        result = self.service.toggle_admin_visibility(master, admin, True)

        # Verificar alterações no usuário
        assert admin.can_view_admins is True
        assert admin.updated_at == mock_now

        # Verificar auditoria
        mock_audit.assert_called_once()

        # Verificar commit e refresh
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(admin)

        assert result == admin

    def test_toggle_admin_visibility_non_master_forbidden(self):
        """Testa que apenas MASTER pode alterar visibilidade."""
        admin1 = self.create_mock_user("1", "ADMIN")
        admin2 = self.create_mock_user("2", "ADMIN")

        with pytest.raises(HTTPException) as exc_info:
            self.service.toggle_admin_visibility(admin1, admin2, True)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Apenas usuários MASTER" in exc_info.value.detail

    def test_toggle_admin_visibility_non_admin_bad_request(self):
        """Testa que apenas usuários ADMIN podem ter visibilidade alterada."""
        master = self.create_mock_user("1", "MASTER")
        user = self.create_mock_user("2", "USER")

        with pytest.raises(HTTPException) as exc_info:
            self.service.toggle_admin_visibility(master, user, True)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Apenas usuários ADMIN" in exc_info.value.detail


class TestBlockUser:
    """Testes para block_user."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = HierarchyService(self.mock_db)

    def create_mock_user(
        self, user_id: int, role: str, email: str = None, blocked_at=None
    ):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.id = user_id
        user.role = role
        user.email = email or f"user{user_id}@test.com"
        user.blocked_at = blocked_at
        return user

    @patch("app.services.hierarchy_service.AuditService.log_user_action")
    @patch("app.services.hierarchy_service.datetime")
    def test_block_user_success(self, mock_datetime, mock_audit):
        """Testa bloqueio bem-sucedido de usuário."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        admin = self.create_mock_user("1", "ADMIN")
        user = self.create_mock_user("2", "USER", "user@test.com")

        # Mock can_manage_user para retornar True
        self.service.can_manage_user = Mock(return_value=True)

        result = self.service.block_user(admin, user, "Comportamento inadequado")

        # Verificar alterações no usuário
        assert user.blocked_at == mock_now
        assert user.blocked_by == admin.id
        assert user.is_active is False
        assert user.updated_at == mock_now

        # Verificar auditoria
        mock_audit.assert_called_once()

        # Verificar commit e refresh
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(user)

        assert result == user

    def test_block_user_no_permission(self):
        """Testa bloqueio sem permissão."""
        user1 = self.create_mock_user("1", "USER")
        user2 = self.create_mock_user("2", "USER")

        # Mock can_manage_user para retornar False
        self.service.can_manage_user = Mock(return_value=False)

        with pytest.raises(HTTPException) as exc_info:
            self.service.block_user(user1, user2)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Você não tem permissão" in exc_info.value.detail

    def test_block_user_already_blocked(self):
        """Testa bloqueio de usuário já bloqueado."""
        admin = self.create_mock_user("1", "ADMIN")
        user = self.create_mock_user("2", "USER", blocked_at=datetime.utcnow())

        # Mock can_manage_user para retornar True
        self.service.can_manage_user = Mock(return_value=True)

        with pytest.raises(HTTPException) as exc_info:
            self.service.block_user(admin, user)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "já está bloqueado" in exc_info.value.detail


class TestUnblockUser:
    """Testes para unblock_user."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = HierarchyService(self.mock_db)

    def create_mock_user(
        self, user_id: int, role: str, email: str = None, blocked_at=None
    ):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.id = user_id
        user.role = role
        user.email = email or f"user{user_id}@test.com"
        user.blocked_at = blocked_at
        return user

    @patch("app.services.hierarchy_service.AuditService.log_user_action")
    @patch("app.services.hierarchy_service.datetime")
    def test_unblock_user_success(self, mock_datetime, mock_audit):
        """Testa desbloqueio bem-sucedido de usuário."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        admin = self.create_mock_user("1", "ADMIN")
        user = self.create_mock_user(
            "2", "USER", "user@test.com", blocked_at=datetime.utcnow()
        )

        # Mock can_manage_user para retornar True
        self.service.can_manage_user = Mock(return_value=True)

        result = self.service.unblock_user(admin, user, "Comportamento melhorado")

        # Verificar alterações no usuário
        assert user.blocked_at is None
        assert user.blocked_by is None
        assert user.is_active is True
        assert user.updated_at == mock_now

        # Verificar auditoria
        mock_audit.assert_called_once()

        # Verificar commit e refresh
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(user)

        assert result == user

    def test_unblock_user_no_permission(self):
        """Testa desbloqueio sem permissão."""
        user1 = self.create_mock_user("1", "USER")
        user2 = self.create_mock_user("2", "USER", blocked_at=datetime.utcnow())

        # Mock can_manage_user para retornar False
        self.service.can_manage_user = Mock(return_value=False)

        with pytest.raises(HTTPException) as exc_info:
            self.service.unblock_user(user1, user2)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Você não tem permissão" in exc_info.value.detail

    def test_unblock_user_not_blocked(self):
        """Testa desbloqueio de usuário não bloqueado."""
        admin = self.create_mock_user("1", "ADMIN")
        user = self.create_mock_user("2", "USER")

        # Mock can_manage_user para retornar True
        self.service.can_manage_user = Mock(return_value=True)

        with pytest.raises(HTTPException) as exc_info:
            self.service.unblock_user(admin, user)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "não está bloqueado" in exc_info.value.detail


class TestHierarchyServiceIntegration:
    """Testes de integração para HierarchyService."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = HierarchyService(self.mock_db)

    def create_mock_user(
        self,
        user_id: int,
        role: str,
        email: str = None,
        can_view_admins: bool = False,
        blocked_at=None,
    ):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.id = user_id
        user.role = role
        user.email = email or f"user{user_id}@test.com"
        user.can_view_admins = can_view_admins
        user.blocked_at = blocked_at
        return user

    @patch("app.services.hierarchy_service.AuditService.log_user_action")
    def test_complete_user_lifecycle(self, mock_audit):
        """Testa ciclo completo de vida do usuário."""
        master = self.create_mock_user("1", "MASTER")
        user = self.create_mock_user("2", "USER", "user@test.com")

        # 1. Promover para ADMIN
        promoted_user = self.service.promote_to_admin(master, user, "Promoção")
        assert promoted_user.role == "ADMIN"

        # 2. Dar permissão para ver outros ADMINs
        updated_user = self.service.toggle_admin_visibility(master, promoted_user, True)
        assert updated_user.can_view_admins is True

        # 3. Remover permissão
        updated_user = self.service.toggle_admin_visibility(master, updated_user, False)
        assert updated_user.can_view_admins is False

        # 4. Rebaixar para USER
        demoted_user = self.service.demote_to_user(master, updated_user, "Rebaixamento")
        assert demoted_user.role == "USER"
        assert demoted_user.can_view_admins is False

        # Verificar que todas as ações foram auditadas
        assert mock_audit.call_count == 4

    def test_hierarchy_permissions_matrix(self):
        """Testa matriz completa de permissões de hierarquia."""
        master = self.create_mock_user("1", "MASTER")
        admin = self.create_mock_user("2", "ADMIN")
        user = self.create_mock_user("3", "USER")

        # MASTER pode gerenciar ADMIN e USER
        assert self.service.can_manage_user(master, admin) is True
        assert self.service.can_manage_user(master, user) is True

        # ADMIN pode gerenciar apenas USER
        assert self.service.can_manage_user(admin, user) is True
        assert self.service.can_manage_user(admin, admin) is False
        assert self.service.can_manage_user(admin, master) is False

        # USER não pode gerenciar ninguém
        assert self.service.can_manage_user(user, user) is False
        assert self.service.can_manage_user(user, admin) is False
        assert self.service.can_manage_user(user, master) is False


class TestHierarchyServiceEdgeCases:
    """Testes para casos extremos do HierarchyService."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = HierarchyService(self.mock_db)

    def create_mock_user(self, user_id: int, role: str):
        """Cria um usuário mock para testes."""
        user = Mock(spec=User)
        user.id = user_id
        user.role = role
        return user

    def test_get_visible_users_empty_filters(self):
        """Testa get_visible_users com filtros vazios."""
        master = self.create_mock_user("1", "MASTER")
        mock_query = Mock()
        self.mock_db.query.return_value = mock_query
        mock_query.order_by.return_value.all.return_value = []

        result = self.service.get_visible_users(master, {})

        # Filtros vazios não devem afetar a query
        assert result == []

    def test_can_manage_user_same_user_different_roles(self):
        """Testa can_manage_user com mesmo usuário em roles diferentes."""
        # Simular mudança de role do mesmo usuário
        user_as_user = self.create_mock_user("1", "USER")
        user_as_admin = self.create_mock_user("1", "ADMIN")
        user_as_master = self.create_mock_user("1", "MASTER")

        # Mesmo ID, roles diferentes
        assert self.service.can_manage_user(user_as_master, user_as_admin) is True
        assert self.service.can_manage_user(user_as_admin, user_as_user) is True
        assert self.service.can_manage_user(user_as_user, user_as_master) is False

    @patch("app.services.hierarchy_service.AuditService.log_user_action")
    def test_operations_with_none_reason(self, mock_audit):
        """Testa operações com reason None."""
        master = self.create_mock_user("1", "MASTER")
        user = self.create_mock_user("2", "USER")

        # Promover sem reason
        self.service.promote_to_admin(master, user, None)

        # Verificar que reason None foi passado para auditoria
        call_args = mock_audit.call_args[1]
        assert call_args["details"]["reason"] is None
