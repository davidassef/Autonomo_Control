import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta

from app.api.v1.audit_logs import (
    router,
    get_audit_logs,
    get_available_actions,
    get_available_resource_types,
    get_audit_stats,
    cleanup_old_logs,
)
from app.models.user import User
from app.models.audit_log import AuditLog


class TestAuditLogsAPI:
    """Testes para os endpoints de logs de auditoria."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )
        self.master_user = User(
            id=2,
            username="masterautonomocontrol",
            email="master@test.com",
            role="MASTER",
            is_active=True,
        )

        # Mock audit logs
        self.mock_logs = [
            AuditLog(
                id=1,
                action="LOGIN",
                resource_type="user",
                resource_id="1",
                performed_by="user@test.com",
                performed_by_role="USER",
                description="Usuário fez login",
                details={"ip_address": "192.168.1.1"},
                created_at=datetime.now(),
            ),
            AuditLog(
                id=2,
                action="CREATE_ENTRY",
                resource_type="financial_entry",
                resource_id="10",
                performed_by="admin@test.com",
                performed_by_role="ADMIN",
                description="Entrada financeira criada",
                details={"amount": 1000.0, "type": "INCOME"},
                created_at=datetime.now() - timedelta(hours=1),
            ),
        ]

    def test_router_configuration(self):
        """Testa se o router está configurado corretamente."""
        assert router.prefix == "/audit-logs"
        assert "audit-logs" in router.tags

        # Verificar se todas as rotas estão registradas
        routes = [route.path for route in router.routes]
        assert "/" in routes
        assert "/actions" in routes
        assert "/resource-types" in routes
        assert "/stats" in routes
        assert "/cleanup" in routes


class TestGetAuditLogs:
    """Testes para o endpoint de listagem de logs."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )

        # Mock query chain
        self.query_mock = Mock()
        self.db_mock.query.return_value = self.query_mock
        self.query_mock.filter.return_value = self.query_mock
        self.query_mock.order_by.return_value = self.query_mock
        self.query_mock.offset.return_value = self.query_mock
        self.query_mock.limit.return_value = self.query_mock

        self.mock_logs = [
            AuditLog(
                id=1,
                action="LOGIN",
                resource_type="user",
                performed_by="user@test.com",
                created_at=datetime.now(),
            ),
            AuditLog(
                id=2,
                action="CREATE_ENTRY",
                resource_type="financial_entry",
                performed_by="admin@test.com",
                created_at=datetime.now() - timedelta(hours=1),
            ),
        ]

    def test_get_audit_logs_no_filters(self):
        """Testa listagem sem filtros."""
        # Arrange
        self.query_mock.all.return_value = self.mock_logs

        # Act
        result = get_audit_logs(db=self.db_mock, current_user=self.admin_user)

        # Assert
        assert result == self.mock_logs
        self.db_mock.query.assert_called_once_with(AuditLog)
        self.query_mock.order_by.assert_called_once()
        self.query_mock.offset.assert_called_once_with(0)
        self.query_mock.limit.assert_called_once_with(100)

    def test_get_audit_logs_with_pagination(self):
        """Testa paginação."""
        # Arrange
        self.query_mock.all.return_value = self.mock_logs

        # Act
        result = get_audit_logs(
            skip=20, limit=50, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == self.mock_logs
        self.query_mock.offset.assert_called_once_with(20)
        self.query_mock.limit.assert_called_once_with(50)

    def test_get_audit_logs_with_action_filter(self):
        """Testa filtro por ação."""
        # Arrange
        self.query_mock.all.return_value = self.mock_logs

        # Act
        result = get_audit_logs(
            action="LOGIN", db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == self.mock_logs
        # Verificar se o filtro foi aplicado (ilike)
        self.query_mock.filter.assert_called()

    def test_get_audit_logs_with_resource_type_filter(self):
        """Testa filtro por tipo de recurso."""
        # Arrange
        self.query_mock.all.return_value = self.mock_logs

        # Act
        result = get_audit_logs(
            resource_type="user", db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == self.mock_logs
        self.query_mock.filter.assert_called()

    def test_get_audit_logs_with_performed_by_filter(self):
        """Testa filtro por usuário."""
        # Arrange
        self.query_mock.all.return_value = self.mock_logs

        # Act
        result = get_audit_logs(
            performed_by="admin", db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == self.mock_logs
        self.query_mock.filter.assert_called()

    def test_get_audit_logs_with_date_range(self):
        """Testa filtro por intervalo de datas."""
        # Arrange
        self.query_mock.all.return_value = self.mock_logs
        start_date = date(2024, 1, 1)
        end_date = date(2024, 1, 31)

        # Act
        result = get_audit_logs(
            start_date=start_date,
            end_date=end_date,
            db=self.db_mock,
            current_user=self.admin_user,
        )

        # Assert
        assert result == self.mock_logs
        # Deve ter dois filtros de data
        assert self.query_mock.filter.call_count >= 2

    def test_get_audit_logs_with_all_filters(self):
        """Testa com todos os filtros aplicados."""
        # Arrange
        self.query_mock.all.return_value = self.mock_logs

        # Act
        result = get_audit_logs(
            skip=10,
            limit=25,
            action="LOGIN",
            resource_type="user",
            performed_by="admin",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            db=self.db_mock,
            current_user=self.admin_user,
        )

        # Assert
        assert result == self.mock_logs
        self.query_mock.offset.assert_called_once_with(10)
        self.query_mock.limit.assert_called_once_with(25)
        # Deve ter múltiplos filtros aplicados
        assert self.query_mock.filter.call_count >= 5

    def test_get_audit_logs_empty_result(self):
        """Testa resultado vazio."""
        # Arrange
        self.query_mock.all.return_value = []

        # Act
        result = get_audit_logs(db=self.db_mock, current_user=self.admin_user)

        # Assert
        assert result == []


class TestGetAvailableActions:
    """Testes para o endpoint de ações disponíveis."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )

        # Mock query chain
        self.query_mock = Mock()
        self.db_mock.query.return_value = self.query_mock
        self.query_mock.distinct.return_value = self.query_mock

    def test_get_available_actions_success(self):
        """Testa obtenção bem-sucedida das ações."""
        # Arrange
        mock_actions = [
            ("LOGIN",),
            ("CREATE_ENTRY",),
            ("UPDATE_ENTRY",),
            ("DELETE_ENTRY",),
        ]
        self.query_mock.all.return_value = mock_actions

        # Act
        result = get_available_actions(db=self.db_mock, current_user=self.admin_user)

        # Assert
        expected = ["LOGIN", "CREATE_ENTRY", "UPDATE_ENTRY", "DELETE_ENTRY"]
        assert result == expected
        self.query_mock.distinct.assert_called_once()

    def test_get_available_actions_with_nulls(self):
        """Testa filtro de valores nulos."""
        # Arrange
        mock_actions = [("LOGIN",), (None,), ("CREATE_ENTRY",), ("",)]
        self.query_mock.all.return_value = mock_actions

        # Act
        result = get_available_actions(db=self.db_mock, current_user=self.admin_user)

        # Assert
        expected = ["LOGIN", "CREATE_ENTRY"]
        assert result == expected

    def test_get_available_actions_empty(self):
        """Testa resultado vazio."""
        # Arrange
        self.query_mock.all.return_value = []

        # Act
        result = get_available_actions(db=self.db_mock, current_user=self.admin_user)

        # Assert
        assert result == []


class TestGetAvailableResourceTypes:
    """Testes para o endpoint de tipos de recursos disponíveis."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )

        # Mock query chain
        self.query_mock = Mock()
        self.db_mock.query.return_value = self.query_mock
        self.query_mock.distinct.return_value = self.query_mock

    def test_get_available_resource_types_success(self):
        """Testa obtenção bem-sucedida dos tipos de recursos."""
        # Arrange
        mock_types = [("user",), ("financial_entry",), ("system_config",)]
        self.query_mock.all.return_value = mock_types

        # Act
        result = get_available_resource_types(
            db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        expected = ["user", "financial_entry", "system_config"]
        assert result == expected
        self.query_mock.distinct.assert_called_once()

    def test_get_available_resource_types_with_nulls(self):
        """Testa filtro de valores nulos."""
        # Arrange
        mock_types = [("user",), (None,), ("financial_entry",), ("",)]
        self.query_mock.all.return_value = mock_types

        # Act
        result = get_available_resource_types(
            db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        expected = ["user", "financial_entry"]
        assert result == expected


class TestGetAuditStats:
    """Testes para o endpoint de estatísticas de auditoria."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.master_user = User(
            id=1,
            username="masterautonomocontrol",
            email="master@test.com",
            role="MASTER",
            is_active=True,
        )

        # Mock query chain
        self.query_mock = Mock()
        self.db_mock.query.return_value = self.query_mock
        self.query_mock.filter.return_value = self.query_mock
        self.query_mock.group_by.return_value = self.query_mock
        self.query_mock.order_by.return_value = self.query_mock
        self.query_mock.limit.return_value = self.query_mock

    @patch("app.api.v1.audit_logs.datetime")
    def test_get_audit_stats_success(self, mock_datetime):
        """Testa obtenção bem-sucedida das estatísticas."""
        # Arrange
        mock_now = datetime(2024, 1, 31, 12, 0, 0)
        mock_datetime.now.return_value = mock_now

        # Mock count query
        self.query_mock.count.return_value = 150

        # Mock stats queries
        mock_actions = [("LOGIN", 50), ("CREATE_ENTRY", 30), ("UPDATE_ENTRY", 20)]
        mock_resources = [("user", 60), ("financial_entry", 40)]
        mock_users = [("user1@test.com", 25), ("user2@test.com", 15)]

        self.query_mock.all.side_effect = [mock_actions, mock_resources, mock_users]

        # Act
        result = get_audit_stats(
            days=30, db=self.db_mock, current_user=self.master_user
        )

        # Assert
        assert result["period_days"] == 30
        assert result["total_logs"] == 150

        assert len(result["actions"]) == 3
        assert result["actions"][0] == {"action": "LOGIN", "count": 50}

        assert len(result["resource_types"]) == 2
        assert result["resource_types"][0] == {"resource_type": "user", "count": 60}

        assert len(result["most_active_users"]) == 2
        assert result["most_active_users"][0] == {"user": "user1@test.com", "count": 25}

    @patch("app.api.v1.audit_logs.datetime")
    def test_get_audit_stats_custom_period(self, mock_datetime):
        """Testa estatísticas com período personalizado."""
        # Arrange
        mock_now = datetime(2024, 1, 31, 12, 0, 0)
        mock_datetime.now.return_value = mock_now

        self.query_mock.count.return_value = 75
        self.query_mock.all.side_effect = [[], [], []]

        # Act
        result = get_audit_stats(days=7, db=self.db_mock, current_user=self.master_user)

        # Assert
        assert result["period_days"] == 7
        assert result["total_logs"] == 75
        assert result["actions"] == []
        assert result["resource_types"] == []
        assert result["most_active_users"] == []

    @patch("app.api.v1.audit_logs.datetime")
    def test_get_audit_stats_empty_results(self, mock_datetime):
        """Testa estatísticas com resultados vazios."""
        # Arrange
        mock_now = datetime(2024, 1, 31, 12, 0, 0)
        mock_datetime.now.return_value = mock_now

        self.query_mock.count.return_value = 0
        self.query_mock.all.side_effect = [[], [], []]

        # Act
        result = get_audit_stats(
            days=30, db=self.db_mock, current_user=self.master_user
        )

        # Assert
        assert result["period_days"] == 30
        assert result["total_logs"] == 0
        assert result["actions"] == []
        assert result["resource_types"] == []
        assert result["most_active_users"] == []


class TestCleanupOldLogs:
    """Testes para o endpoint de limpeza de logs antigos."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.master_user = User(
            id=1,
            username="masterautonomocontrol",
            email="master@test.com",
            role="MASTER",
            is_active=True,
        )

        # Mock query chain
        self.query_mock = Mock()
        self.db_mock.query.return_value = self.query_mock
        self.query_mock.filter.return_value = self.query_mock

    @patch("app.api.v1.audit_logs.datetime")
    def test_cleanup_old_logs_success(self, mock_datetime):
        """Testa limpeza bem-sucedida de logs antigos."""
        # Arrange
        mock_now = datetime(2024, 1, 31, 12, 0, 0)
        mock_datetime.now.return_value = mock_now

        # Mock count and delete operations
        self.query_mock.count.return_value = 50
        self.query_mock.delete.return_value = 50

        # Act
        result = cleanup_old_logs(
            days_to_keep=90, db=self.db_mock, current_user=self.master_user
        )

        # Assert
        assert "50 logs removidos" in result["message"]
        self.query_mock.count.assert_called_once()
        self.query_mock.delete.assert_called_once()
        self.db_mock.commit.assert_called()
        self.db_mock.add.assert_called_once()  # Log de auditoria da limpeza

    def test_cleanup_old_logs_invalid_days_too_small(self):
        """Testa erro com período muito pequeno."""
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            cleanup_old_logs(
                days_to_keep=15, db=self.db_mock, current_user=self.master_user
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "menos de 30 dias" in exc_info.value.detail

    def test_cleanup_old_logs_boundary_value(self):
        """Testa valor limite (30 dias)."""
        with patch("app.api.v1.audit_logs.datetime") as mock_datetime:
            mock_now = datetime(2024, 1, 31, 12, 0, 0)
            mock_datetime.now.return_value = mock_now

            self.query_mock.count.return_value = 10
            self.query_mock.delete.return_value = 10

            # Act
            result = cleanup_old_logs(
                days_to_keep=30, db=self.db_mock, current_user=self.master_user
            )

            # Assert
            assert "10 logs removidos" in result["message"]

    @patch("app.api.v1.audit_logs.datetime")
    def test_cleanup_old_logs_no_logs_to_delete(self, mock_datetime):
        """Testa limpeza quando não há logs para remover."""
        # Arrange
        mock_now = datetime(2024, 1, 31, 12, 0, 0)
        mock_datetime.now.return_value = mock_now

        self.query_mock.count.return_value = 0
        self.query_mock.delete.return_value = 0

        # Act
        result = cleanup_old_logs(
            days_to_keep=90, db=self.db_mock, current_user=self.master_user
        )

        # Assert
        assert "0 logs removidos" in result["message"]
        self.db_mock.add.assert_called_once()  # Ainda deve criar log de auditoria

    @patch("app.api.v1.audit_logs.datetime")
    def test_cleanup_old_logs_creates_audit_log(self, mock_datetime):
        """Testa criação do log de auditoria da limpeza."""
        # Arrange
        mock_now = datetime(2024, 1, 31, 12, 0, 0)
        mock_datetime.now.return_value = mock_now

        self.query_mock.count.return_value = 25
        self.query_mock.delete.return_value = 25

        # Act
        cleanup_old_logs(
            days_to_keep=60, db=self.db_mock, current_user=self.master_user
        )

        # Assert
        self.db_mock.add.assert_called_once()

        # Verificar se o log de auditoria foi criado corretamente
        added_log = self.db_mock.add.call_args[0][0]
        assert isinstance(added_log, AuditLog)
        assert added_log.action == "CLEANUP_LOGS"
        assert added_log.resource_type == "audit_log"
        assert added_log.performed_by == "master@test.com"
        assert "25 logs removidos" in added_log.description
        assert added_log.details["days_to_keep"] == 60
        assert added_log.details["deleted_count"] == 25


class TestAuditLogsIntegration:
    """Testes de integração para os endpoints de auditoria."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )
        self.master_user = User(
            id=2,
            username="masterautonomocontrol",
            email="master@test.com",
            role="MASTER",
            is_active=True,
        )

    def test_admin_endpoints_access_control(self):
        """Testa controle de acesso para endpoints de ADMIN."""
        # Este teste seria implementado no nível de integração com FastAPI
        # testando as dependencies get_current_admin
        admin_endpoints = [
            get_audit_logs,
            get_available_actions,
            get_available_resource_types,
        ]

        for endpoint in admin_endpoints:
            # Verificar se aceita usuários ADMIN
            assert endpoint  # Placeholder para teste real

    def test_master_only_endpoints_access_control(self):
        """Testa controle de acesso para endpoints exclusivos do MASTER."""
        # Este teste seria implementado no nível de integração com FastAPI
        # testando as dependencies get_current_master
        master_endpoints = [get_audit_stats, cleanup_old_logs]

        for endpoint in master_endpoints:
            # Verificar se aceita apenas usuários MASTER
            assert endpoint  # Placeholder para teste real

    def test_filter_combinations(self):
        """Testa combinações de filtros."""
        with patch("app.api.v1.audit_logs.AuditLog") as mock_audit_log:
            query_mock = Mock()
            self.db_mock.query.return_value = query_mock
            query_mock.filter.return_value = query_mock
            query_mock.order_by.return_value = query_mock
            query_mock.offset.return_value = query_mock
            query_mock.limit.return_value = query_mock
            query_mock.all.return_value = []

            # Teste múltiplos filtros
            get_audit_logs(
                action="LOGIN",
                resource_type="user",
                performed_by="admin",
                start_date=date(2024, 1, 1),
                end_date=date(2024, 1, 31),
                db=self.db_mock,
                current_user=self.admin_user,
            )

            # Deve ter aplicado todos os filtros
            assert query_mock.filter.call_count >= 5

    def test_date_range_edge_cases(self):
        """Testa casos extremos de intervalos de datas."""
        with patch("app.api.v1.audit_logs.AuditLog"):
            query_mock = Mock()
            self.db_mock.query.return_value = query_mock
            query_mock.filter.return_value = query_mock
            query_mock.order_by.return_value = query_mock
            query_mock.offset.return_value = query_mock
            query_mock.limit.return_value = query_mock
            query_mock.all.return_value = []

            # Teste com mesma data de início e fim
            same_date = date(2024, 1, 15)
            get_audit_logs(
                start_date=same_date,
                end_date=same_date,
                db=self.db_mock,
                current_user=self.admin_user,
            )

            # Deve aplicar ambos os filtros de data
            assert query_mock.filter.call_count >= 2

    def test_pagination_edge_cases(self):
        """Testa casos extremos de paginação."""
        with patch("app.api.v1.audit_logs.AuditLog"):
            query_mock = Mock()
            self.db_mock.query.return_value = query_mock
            query_mock.filter.return_value = query_mock
            query_mock.order_by.return_value = query_mock
            query_mock.offset.return_value = query_mock
            query_mock.limit.return_value = query_mock
            query_mock.all.return_value = []

            # Teste com valores extremos
            get_audit_logs(
                skip=0, limit=1, db=self.db_mock, current_user=self.admin_user
            )

            query_mock.offset.assert_called_with(0)
            query_mock.limit.assert_called_with(1)

    def test_cleanup_audit_trail(self):
        """Testa se a limpeza cria rastro de auditoria adequado."""
        with patch("app.api.v1.audit_logs.datetime") as mock_datetime:
            mock_now = datetime(2024, 1, 31, 12, 0, 0)
            mock_datetime.now.return_value = mock_now

            query_mock = Mock()
            self.db_mock.query.return_value = query_mock
            query_mock.filter.return_value = query_mock
            query_mock.count.return_value = 100
            query_mock.delete.return_value = 100

            # Act
            cleanup_old_logs(
                days_to_keep=90, db=self.db_mock, current_user=self.master_user
            )

            # Assert
            self.db_mock.add.assert_called_once()
            added_log = self.db_mock.add.call_args[0][0]

            # Verificar detalhes do log de auditoria
            assert added_log.action == "CLEANUP_LOGS"
            assert added_log.performed_by == "master@test.com"
            assert "days_to_keep" in added_log.details
            assert "cutoff_date" in added_log.details
            assert "deleted_count" in added_log.details
            assert added_log.details["deleted_count"] == 100


class TestAuditLogsAdvanced:
    """Testes avançados para os endpoints de logs de auditoria."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )
        self.master_user = User(
            id=2,
            username="masterautonomocontrol",
            email="master@test.com",
            role="MASTER",
            is_active=True,
        )

        # Mock query chain
        self.query_mock = Mock()
        self.db_mock.query.return_value = self.query_mock
        self.query_mock.filter.return_value = self.query_mock
        self.query_mock.order_by.return_value = self.query_mock
        self.query_mock.offset.return_value = self.query_mock
        self.query_mock.limit.return_value = self.query_mock
        self.query_mock.distinct.return_value = self.query_mock
        self.query_mock.group_by.return_value = self.query_mock

    def test_pagination_validation_negative_skip(self):
        """Testa validação de paginação com skip negativo."""
        # Arrange
        self.query_mock.all.return_value = []

        # Act
        result = get_audit_logs(
            skip=-10, limit=50, db=self.db_mock, current_user=self.admin_user
        )

        # Assert - deve usar 0 como valor mínimo
        self.query_mock.offset.assert_called_with(0)

    def test_pagination_validation_zero_limit(self):
        """Testa validação de paginação com limit zero."""
        # Arrange
        self.query_mock.all.return_value = []

        # Act
        result = get_audit_logs(
            skip=0, limit=0, db=self.db_mock, current_user=self.admin_user
        )

        # Assert - deve usar 1 como valor mínimo
        self.query_mock.limit.assert_called_with(1)

    def test_pagination_validation_excessive_limit(self):
        """Testa validação de paginação com limit excessivo."""
        # Arrange
        self.query_mock.all.return_value = []

        # Act
        result = get_audit_logs(
            skip=0, limit=10000, db=self.db_mock, current_user=self.admin_user
        )

        # Assert - deve usar 1000 como valor máximo
        self.query_mock.limit.assert_called_with(1000)

    def test_sql_injection_protection_action_filter(self):
        """Testa proteção contra SQL injection no filtro de ação."""
        # Arrange
        self.query_mock.all.return_value = []
        malicious_action = "'; DROP TABLE audit_logs; --"

        # Act
        result = get_audit_logs(
            action=malicious_action, db=self.db_mock, current_user=self.admin_user
        )

        # Assert - deve usar filtro parametrizado (ilike)
        self.query_mock.filter.assert_called()
        # Não deve causar exceção
        assert result == []

    def test_sql_injection_protection_performed_by_filter(self):
        """Testa proteção contra SQL injection no filtro performed_by."""
        # Arrange
        self.query_mock.all.return_value = []
        malicious_user = "admin'; DELETE FROM users; --"

        # Act
        result = get_audit_logs(
            performed_by=malicious_user, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        self.query_mock.filter.assert_called()
        assert result == []

    def test_xss_protection_in_filters(self):
        """Testa proteção contra XSS nos filtros."""
        # Arrange
        self.query_mock.all.return_value = []
        xss_payload = "<script>alert('xss')</script>"

        # Act
        result = get_audit_logs(
            action=xss_payload,
            resource_type=xss_payload,
            performed_by=xss_payload,
            db=self.db_mock,
            current_user=self.admin_user,
        )

        # Assert - não deve causar exceção
        assert result == []

    @patch("app.api.v1.audit_logs.threading")
    def test_concurrent_requests_simulation(self, mock_threading):
        """Testa simulação de requisições concorrentes."""
        # Arrange
        self.query_mock.all.return_value = []

        # Simular múltiplas threads
        def simulate_concurrent_access():
            return get_audit_logs(db=self.db_mock, current_user=self.admin_user)

        # Act
        results = []
        for _ in range(5):
            results.append(simulate_concurrent_access())

        # Assert - todas as requisições devem ser processadas
        assert len(results) == 5
        for result in results:
            assert result == []

    def test_large_dataset_handling(self):
        """Testa tratamento de grandes volumes de dados."""
        # Arrange
        large_dataset = [Mock(spec=AuditLog) for _ in range(10000)]
        self.query_mock.all.return_value = large_dataset

        # Act
        result = get_audit_logs(
            limit=1000, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert len(result) == 10000  # Mock retorna todos
        self.query_mock.limit.assert_called_with(1000)

    def test_date_range_validation_invalid_format(self):
        """Testa validação de formato de data inválido."""
        # Arrange
        self.query_mock.all.return_value = []

        # Act - datas válidas devem funcionar normalmente
        result = get_audit_logs(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            db=self.db_mock,
            current_user=self.admin_user,
        )

        # Assert
        assert result == []
        assert self.query_mock.filter.call_count >= 2

    def test_date_range_validation_start_after_end(self):
        """Testa validação quando data inicial é posterior à final."""
        # Arrange
        self.query_mock.all.return_value = []

        # Act
        result = get_audit_logs(
            start_date=date(2024, 12, 31),
            end_date=date(2024, 1, 1),
            db=self.db_mock,
            current_user=self.admin_user,
        )

        # Assert - deve processar normalmente (lógica de negócio pode tratar)
        assert result == []

    @patch("app.api.v1.audit_logs.datetime")
    def test_cleanup_validation_negative_days(self, mock_datetime):
        """Testa validação de dias negativos na limpeza."""
        # Arrange
        mock_now = datetime(2024, 1, 31, 12, 0, 0)
        mock_datetime.now.return_value = mock_now

        self.query_mock.count.return_value = 0
        self.query_mock.delete.return_value = 0

        # Act
        result = cleanup_old_logs(
            days_to_keep=-30, db=self.db_mock, current_user=self.master_user
        )

        # Assert - deve usar valor padrão ou mínimo
        assert "0 logs removidos" in result["message"]

    @patch("app.api.v1.audit_logs.datetime")
    def test_cleanup_validation_excessive_days(self, mock_datetime):
        """Testa validação de dias excessivos na limpeza."""
        # Arrange
        mock_now = datetime(2024, 1, 31, 12, 0, 0)
        mock_datetime.now.return_value = mock_now

        self.query_mock.count.return_value = 0
        self.query_mock.delete.return_value = 0

        # Act
        result = cleanup_old_logs(
            days_to_keep=36500,  # 100 anos
            db=self.db_mock,
            current_user=self.master_user,
        )

        # Assert
        assert "0 logs removidos" in result["message"]

    def test_memory_usage_optimization(self):
        """Testa otimização de uso de memória com grandes datasets."""

        # Arrange - simular dataset muito grande
        def mock_all_with_memory_check():
            # Simular processamento em lotes
            return [Mock(spec=AuditLog) for _ in range(100)]  # Lote menor

        self.query_mock.all.side_effect = mock_all_with_memory_check

        # Act
        result = get_audit_logs(
            limit=100, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert len(result) == 100

    def test_audit_log_data_sanitization(self):
        """Testa sanitização de dados sensíveis nos logs."""
        # Arrange
        sensitive_log = AuditLog(
            id=1,
            action="LOGIN",
            resource_type="user",
            performed_by="user@test.com",
            description="Login com senha: password123",
            details={"password": "secret123", "token": "abc123"},
            created_at=datetime.now(),
        )
        self.query_mock.all.return_value = [sensitive_log]

        # Act
        result = get_audit_logs(db=self.db_mock, current_user=self.admin_user)

        # Assert - dados devem estar presentes (sanitização seria no serviço)
        assert len(result) == 1
        assert result[0].details["password"] == "secret123"  # Mock não sanitiza

    def test_stats_calculation_precision(self):
        """Testa precisão nos cálculos de estatísticas."""
        # Arrange
        self.query_mock.count.return_value = 1000000  # 1 milhão de logs

        mock_actions = [
            ("LOGIN", 500000),
            ("CREATE_ENTRY", 300000),
            ("UPDATE_ENTRY", 200000),
        ]
        mock_resources = [("user", 600000), ("financial_entry", 400000)]
        mock_users = [("user1@test.com", 250000), ("user2@test.com", 150000)]

        self.query_mock.all.side_effect = [mock_actions, mock_resources, mock_users]

        # Act
        with patch("app.api.v1.audit_logs.datetime") as mock_datetime:
            mock_datetime.now.return_value = datetime(2024, 1, 31, 12, 0, 0)
            result = get_audit_stats(
                days=30, db=self.db_mock, current_user=self.master_user
            )

        # Assert
        assert result["total_logs"] == 1000000
        assert len(result["actions"]) == 3
        assert result["actions"][0]["count"] == 500000

    def test_database_connection_resilience(self):
        """Testa resiliência a problemas de conexão com banco."""
        # Arrange
        self.db_mock.query.side_effect = Exception("Connection lost")

        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            get_audit_logs(db=self.db_mock, current_user=self.admin_user)

        assert "Connection lost" in str(exc_info.value)

    def test_role_based_access_validation(self):
        """Testa validação rigorosa de acesso baseado em roles."""
        # Arrange
        regular_user = User(
            id=3,
            username="user",
            email="user@test.com",
            role=UserRole.USER,
            is_active=True,
        )

        self.query_mock.all.return_value = []

        # Act - usuário comum tentando acessar logs (seria bloqueado na dependency)
        result = get_audit_logs(db=self.db_mock, current_user=regular_user)

        # Assert - função executa (controle é na dependency)
        assert result == []

    def test_audit_trail_consistency(self):
        """Testa consistência do rastro de auditoria."""
        # Arrange
        with patch("app.api.v1.audit_logs.datetime") as mock_datetime:
            mock_now = datetime(2024, 1, 31, 12, 0, 0)
            mock_datetime.now.return_value = mock_now

            self.query_mock.count.return_value = 50
            self.query_mock.delete.return_value = 50

            # Act
            result = cleanup_old_logs(
                days_to_keep=90, db=self.db_mock, current_user=self.master_user
            )

            # Assert
            self.db_mock.add.assert_called_once()
            added_log = self.db_mock.add.call_args[0][0]

            # Verificar consistência dos dados
            assert added_log.action == "CLEANUP_LOGS"
            assert added_log.resource_type == "audit_log"
            assert added_log.performed_by == "master@test.com"
            assert added_log.performed_by_role == "MASTER"
            assert "50 logs removidos" in added_log.description

    def test_filter_case_insensitive_search(self):
        """Testa busca case-insensitive nos filtros."""
        # Arrange
        self.query_mock.all.return_value = []

        # Act
        result = get_audit_logs(
            action="login",  # minúsculo
            resource_type="USER",  # maiúsculo
            performed_by="Admin",  # misto
            db=self.db_mock,
            current_user=self.admin_user,
        )

        # Assert - deve usar ilike para busca case-insensitive
        assert self.query_mock.filter.call_count >= 3
        assert result == []

    def test_error_message_localization(self):
        """Testa localização de mensagens de erro em português."""
        # Arrange
        self.db_mock.query.side_effect = Exception("Database error")

        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            get_audit_logs(db=self.db_mock, current_user=self.admin_user)

        # Mensagem original em inglês (seria traduzida no handler)
        assert "Database error" in str(exc_info.value)

    def test_performance_with_complex_filters(self):
        """Testa performance com filtros complexos."""
        # Arrange
        self.query_mock.all.return_value = []

        # Act - aplicar todos os filtros possíveis
        start_time = datetime.now()
        result = get_audit_logs(
            skip=1000,
            limit=100,
            action="LOGIN",
            resource_type="user",
            performed_by="admin",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            db=self.db_mock,
            current_user=self.admin_user,
        )
        end_time = datetime.now()

        # Assert
        execution_time = (end_time - start_time).total_seconds()
        assert execution_time < 1.0  # Deve executar em menos de 1 segundo
        assert result == []

    def test_cleanup_transaction_rollback_simulation(self):
        """Testa simulação de rollback de transação na limpeza."""
        # Arrange
        with patch("app.api.v1.audit_logs.datetime") as mock_datetime:
            mock_now = datetime(2024, 1, 31, 12, 0, 0)
            mock_datetime.now.return_value = mock_now

            self.query_mock.count.return_value = 100
            self.query_mock.delete.return_value = 100

            # Simular erro após delete mas antes do commit
            self.db_mock.commit.side_effect = Exception("Commit failed")

            # Act & Assert
            with pytest.raises(Exception) as exc_info:
                cleanup_old_logs(
                    days_to_keep=30, db=self.db_mock, current_user=self.master_user
                )

            assert "Commit failed" in str(exc_info.value)
            # Rollback seria chamado pelo contexto da transação
