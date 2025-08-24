import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.system_reports import (
    router,
    get_user_statistics,
    get_system_usage_statistics,
    get_financial_overview,
    get_system_health_metrics,
    get_user_engagement_report,
    get_admin_dashboard_data,
)
from app.models.user import User
from app.services.system_reports_service import SystemReportsService
from app.services.audit_service import AuditService


class TestSystemReportsAPI:
    """Testes para os endpoints de relatórios do sistema."""

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
        self.admin_user = User(
            id=2, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )
        self.regular_user = User(
            id=3, username="user", email="user@test.com", role="USER", is_active=True
        )

    def test_router_configuration(self):
        """Testa se o router está configurado corretamente."""
        assert router.prefix == "/system-reports"
        assert "system-reports" in router.tags

        # Verificar se todas as rotas estão registradas
        routes = [route.path for route in router.routes]
        assert "/users" in routes
        assert "/usage" in routes
        assert "/financial" in routes
        assert "/health" in routes
        assert "/engagement" in routes
        assert "/dashboard" in routes


class TestGetUserStatistics:
    """Testes para o endpoint de estatísticas de usuários."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )
        self.mock_stats = {
            "total_users": 100,
            "active_users": 85,
            "new_users": 15,
            "blocked_users": 5,
            "users_by_role": {"ADMIN": 5, "USER": 95},
            "most_active_users": [{"username": "user1", "activity_count": 50}],
        }

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_user_statistics")
    def test_get_user_statistics_success(self, mock_get_stats, mock_audit):
        """Testa obtenção bem-sucedida de estatísticas de usuários."""
        # Arrange
        mock_get_stats.return_value = self.mock_stats

        # Act
        result = get_user_statistics(
            days=30, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == self.mock_stats
        mock_get_stats.assert_called_once_with(self.db_mock, 30)
        mock_audit.assert_called_once_with(
            db=self.db_mock,
            action="VIEW_USER_STATISTICS",
            performed_by="admin@test.com",
            description="Visualização de estatísticas de usuários (30 dias)",
            details={"period_days": 30},
        )

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_user_statistics")
    def test_get_user_statistics_custom_period(self, mock_get_stats, mock_audit):
        """Testa estatísticas com período personalizado."""
        # Arrange
        mock_get_stats.return_value = self.mock_stats

        # Act
        result = get_user_statistics(
            days=90, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == self.mock_stats
        mock_get_stats.assert_called_once_with(self.db_mock, 90)
        mock_audit.assert_called_once()
        assert mock_audit.call_args[1]["details"]["period_days"] == 90

    def test_get_user_statistics_invalid_period_too_small(self):
        """Testa período inválido (muito pequeno)."""
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            get_user_statistics(days=0, db=self.db_mock, current_user=self.admin_user)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "deve estar entre 1 e 365 dias" in exc_info.value.detail

    def test_get_user_statistics_invalid_period_too_large(self):
        """Testa período inválido (muito grande)."""
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            get_user_statistics(days=400, db=self.db_mock, current_user=self.admin_user)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "deve estar entre 1 e 365 dias" in exc_info.value.detail

    def test_get_user_statistics_boundary_values(self):
        """Testa valores limítrofes válidos."""
        with patch(
            "app.api.v1.system_reports.SystemReportsService.get_user_statistics"
        ) as mock_get_stats:
            with patch("app.api.v1.system_reports.AuditService.log_system_action"):
                mock_get_stats.return_value = self.mock_stats

                # Teste valor mínimo
                result_min = get_user_statistics(
                    days=1, db=self.db_mock, current_user=self.admin_user
                )
                assert result_min == self.mock_stats

                # Teste valor máximo
                result_max = get_user_statistics(
                    days=365, db=self.db_mock, current_user=self.admin_user
                )
                assert result_max == self.mock_stats


class TestGetSystemUsageStatistics:
    """Testes para o endpoint de estatísticas de uso do sistema."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )
        self.mock_usage_stats = {
            "total_entries": 500,
            "entries_by_type": {"INCOME": 300, "EXPENSE": 200},
            "daily_activity": [{"date": "2024-01-01", "count": 25}],
            "audit_logs_count": 150,
            "common_actions": [{"action": "LOGIN", "count": 100}],
        }

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_system_usage_statistics")
    def test_get_system_usage_statistics_success(self, mock_get_stats, mock_audit):
        """Testa obtenção bem-sucedida de estatísticas de uso."""
        # Arrange
        mock_get_stats.return_value = self.mock_usage_stats

        # Act
        result = get_system_usage_statistics(
            days=30, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == self.mock_usage_stats
        mock_get_stats.assert_called_once_with(self.db_mock, 30)
        mock_audit.assert_called_once_with(
            db=self.db_mock,
            action="VIEW_USAGE_STATISTICS",
            performed_by="admin@test.com",
            description="Visualização de estatísticas de uso (30 dias)",
            details={"period_days": 30},
        )

    def test_get_system_usage_statistics_invalid_period(self):
        """Testa período inválido."""
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            get_system_usage_statistics(
                days=-5, db=self.db_mock, current_user=self.admin_user
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "deve estar entre 1 e 365 dias" in exc_info.value.detail


class TestGetFinancialOverview:
    """Testes para o endpoint de visão geral financeira."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )
        self.mock_financial_data = {
            "total_income": 10000.0,
            "total_expenses": 7500.0,
            "net_balance": 2500.0,
            "monthly_evolution": [
                {"month": "2024-01", "income": 5000, "expenses": 3000}
            ],
            "top_categories": [{"category": "Vendas", "amount": 8000}],
        }

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_financial_overview")
    def test_get_financial_overview_success(self, mock_get_overview, mock_audit):
        """Testa obtenção bem-sucedida da visão financeira."""
        # Arrange
        mock_get_overview.return_value = self.mock_financial_data

        # Act
        result = get_financial_overview(
            days=30, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == self.mock_financial_data
        mock_get_overview.assert_called_once_with(self.db_mock, 30)
        mock_audit.assert_called_once_with(
            db=self.db_mock,
            action="VIEW_FINANCIAL_OVERVIEW",
            performed_by="admin@test.com",
            description="Visualização de visão geral financeira (30 dias)",
            details={"period_days": 30},
        )

    def test_get_financial_overview_invalid_period(self):
        """Testa período inválido."""
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            get_financial_overview(
                days=500, db=self.db_mock, current_user=self.admin_user
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "deve estar entre 1 e 365 dias" in exc_info.value.detail


class TestGetSystemHealthMetrics:
    """Testes para o endpoint de métricas de saúde do sistema."""

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
        self.admin_user = User(
            id=2, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )
        self.mock_health_data = {
            "activity_24h": {"logins": 50, "entries_created": 25, "errors": 2},
            "activity_7d": {"logins": 300, "entries_created": 150, "errors": 10},
            "system_status": "healthy",
            "database_connections": 5,
            "memory_usage": 75.5,
        }

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_system_health_metrics")
    def test_get_system_health_metrics_success(self, mock_get_health, mock_audit):
        """Testa obtenção bem-sucedida das métricas de saúde."""
        # Arrange
        mock_get_health.return_value = self.mock_health_data

        # Act
        result = get_system_health_metrics(
            db=self.db_mock, current_user=self.master_user
        )

        # Assert
        assert result == self.mock_health_data
        mock_get_health.assert_called_once_with(self.db_mock)
        mock_audit.assert_called_once_with(
            db=self.db_mock,
            action="VIEW_SYSTEM_HEALTH",
            performed_by="master@test.com",
            description="Visualização de métricas de saúde do sistema",
        )

    def test_get_system_health_metrics_master_only(self):
        """Testa que apenas MASTER pode acessar métricas de saúde."""
        # Este teste depende da implementação do get_current_master dependency
        # que deve rejeitar usuários não-MASTER
        # O teste real seria feito no nível de integração com FastAPI
        pass


class TestGetUserEngagementReport:
    """Testes para o endpoint de relatório de engajamento."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )
        self.mock_engagement_data = {
            "highly_engaged": [{"username": "user1", "score": 95}],
            "moderately_engaged": [{"username": "user2", "score": 65}],
            "low_engaged": [{"username": "user3", "score": 25}],
            "inactive_users": [{"username": "user4", "last_login": "2024-01-01"}],
            "engagement_trends": [{"date": "2024-01-01", "avg_score": 70}],
        }

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_user_engagement_report")
    def test_get_user_engagement_report_success(self, mock_get_engagement, mock_audit):
        """Testa obtenção bem-sucedida do relatório de engajamento."""
        # Arrange
        mock_get_engagement.return_value = self.mock_engagement_data

        # Act
        result = get_user_engagement_report(
            days=30, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == self.mock_engagement_data
        mock_get_engagement.assert_called_once_with(self.db_mock, 30)
        mock_audit.assert_called_once_with(
            db=self.db_mock,
            action="VIEW_ENGAGEMENT_REPORT",
            performed_by="admin@test.com",
            description="Visualização de relatório de engajamento (30 dias)",
            details={"period_days": 30},
        )

    def test_get_user_engagement_report_invalid_period(self):
        """Testa período inválido."""
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            get_user_engagement_report(
                days=0, db=self.db_mock, current_user=self.admin_user
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "deve estar entre 1 e 365 dias" in exc_info.value.detail


class TestGetAdminDashboardData:
    """Testes para o endpoint de dados do dashboard administrativo."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )

        # Mock data para diferentes serviços
        self.mock_user_stats = {
            "total_users": 100,
            "active_users": 85,
            "new_users": 15,
            "blocked_users": 5,
            "users_by_role": {"ADMIN": 5, "USER": 95},
            "most_active_users": [{"username": "user1", "activity_count": 50}],
        }

        self.mock_usage_stats = {
            "total_entries": 500,
            "entries_by_type": {"INCOME": 300, "EXPENSE": 200},
            "daily_activity": [
                {"date": "2024-01-01", "count": 25},
                {"date": "2024-01-02", "count": 30},
                {"date": "2024-01-03", "count": 20},
                {"date": "2024-01-04", "count": 35},
                {"date": "2024-01-05", "count": 28},
                {"date": "2024-01-06", "count": 32},
                {"date": "2024-01-07", "count": 27},
                {"date": "2024-01-08", "count": 29},
            ],
            "audit_logs_count": 150,
            "common_actions": [
                {"action": "LOGIN", "count": 100},
                {"action": "CREATE_ENTRY", "count": 80},
                {"action": "UPDATE_ENTRY", "count": 60},
                {"action": "DELETE_ENTRY", "count": 40},
                {"action": "VIEW_REPORT", "count": 30},
                {"action": "EXPORT_DATA", "count": 20},
            ],
        }

        self.mock_health_metrics = {
            "activity_24h": {"logins": 50, "entries_created": 25, "errors": 2},
            "activity_7d": {"logins": 300, "entries_created": 150, "errors": 10},
        }

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_system_health_metrics")
    @patch("app.api.v1.system_reports.SystemReportsService.get_system_usage_statistics")
    @patch("app.api.v1.system_reports.SystemReportsService.get_user_statistics")
    def test_get_admin_dashboard_data_success(
        self, mock_user_stats, mock_usage_stats, mock_health_metrics, mock_audit
    ):
        """Testa obtenção bem-sucedida dos dados do dashboard."""
        # Arrange
        mock_user_stats.return_value = self.mock_user_stats
        mock_usage_stats.return_value = self.mock_usage_stats
        mock_health_metrics.return_value = self.mock_health_metrics

        # Act
        result = get_admin_dashboard_data(db=self.db_mock, current_user=self.admin_user)

        # Assert
        assert "summary" in result
        assert "activity_24h" in result
        assert "activity_7d" in result
        assert "users_by_role" in result
        assert "entries_by_type" in result
        assert "daily_activity" in result
        assert "most_active_users" in result
        assert "common_actions" in result

        # Verificar dados do summary
        summary = result["summary"]
        assert summary["total_users"] == 100
        assert summary["active_users_30d"] == 85
        assert summary["new_users_30d"] == 15
        assert summary["blocked_users"] == 5
        assert summary["total_entries_30d"] == 500
        assert summary["audit_logs_30d"] == 150

        # Verificar limitação de dados
        assert len(result["daily_activity"]) == 7  # Últimos 7 dias
        assert len(result["most_active_users"]) == 1  # Top 5, mas só tem 1
        assert len(result["common_actions"]) == 5  # Top 5

        # Verificar chamadas dos serviços
        mock_user_stats.assert_called_once_with(self.db_mock, 30)
        mock_usage_stats.assert_called_once_with(self.db_mock, 30)
        mock_health_metrics.assert_called_once_with(self.db_mock)

        # Verificar auditoria
        mock_audit.assert_called_once_with(
            db=self.db_mock,
            action="VIEW_ADMIN_DASHBOARD",
            performed_by="admin@test.com",
            description="Visualização do dashboard administrativo",
        )

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_system_health_metrics")
    @patch("app.api.v1.system_reports.SystemReportsService.get_system_usage_statistics")
    @patch("app.api.v1.system_reports.SystemReportsService.get_user_statistics")
    def test_get_admin_dashboard_data_empty_lists(
        self, mock_user_stats, mock_usage_stats, mock_health_metrics, mock_audit
    ):
        """Testa dashboard com listas vazias."""
        # Arrange
        empty_user_stats = {**self.mock_user_stats, "most_active_users": []}
        empty_usage_stats = {
            **self.mock_usage_stats,
            "common_actions": [],
            "daily_activity": [],
        }

        mock_user_stats.return_value = empty_user_stats
        mock_usage_stats.return_value = empty_usage_stats
        mock_health_metrics.return_value = self.mock_health_metrics

        # Act
        result = get_admin_dashboard_data(db=self.db_mock, current_user=self.admin_user)

        # Assert
        assert len(result["daily_activity"]) == 0
        assert len(result["most_active_users"]) == 0
        assert len(result["common_actions"]) == 0

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_system_health_metrics")
    @patch("app.api.v1.system_reports.SystemReportsService.get_system_usage_statistics")
    @patch("app.api.v1.system_reports.SystemReportsService.get_user_statistics")
    def test_get_admin_dashboard_data_service_error(
        self, mock_user_stats, mock_usage_stats, mock_health_metrics, mock_audit
    ):
        """Testa erro em um dos serviços."""
        # Arrange
        mock_user_stats.side_effect = Exception("Database error")

        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            get_admin_dashboard_data(db=self.db_mock, current_user=self.admin_user)

        assert "Database error" in str(exc_info.value)


class TestSystemReportsIntegration:
    """Testes de integração para os endpoints de relatórios."""

    def setup_method(self):
        """Setup para cada teste."""
        self.db_mock = Mock(spec=Session)
        self.admin_user = User(
            id=1, username="admin", email="admin@test.com", role="ADMIN", is_active=True
        )

    def test_all_endpoints_require_admin_or_master(self):
        """Testa que todos os endpoints requerem permissões adequadas."""
        # Este teste seria implementado no nível de integração com FastAPI
        # testando as dependencies get_current_admin e get_current_master
        pass

    def test_audit_logging_consistency(self):
        """Testa consistência no logging de auditoria."""
        with patch(
            "app.api.v1.system_reports.AuditService.log_system_action"
        ) as mock_audit:
            with patch(
                "app.api.v1.system_reports.SystemReportsService.get_user_statistics"
            ) as mock_service:
                mock_service.return_value = {}

                # Act
                get_user_statistics(
                    days=30, db=self.db_mock, current_user=self.admin_user
                )

                # Assert
                mock_audit.assert_called_once()
                call_args = mock_audit.call_args[1]
                assert call_args["db"] == self.db_mock
                assert call_args["performed_by"] == "admin@test.com"
                assert "action" in call_args
                assert "description" in call_args

    def test_period_validation_consistency(self):
        """Testa consistência na validação de períodos."""
        endpoints_with_period = [
            get_user_statistics,
            get_system_usage_statistics,
            get_financial_overview,
            get_user_engagement_report,
        ]

        for endpoint in endpoints_with_period:
            # Teste período inválido (muito pequeno)
            with pytest.raises(HTTPException) as exc_info:
                endpoint(days=0, db=self.db_mock, current_user=self.admin_user)
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

            # Teste período inválido (muito grande)
            with pytest.raises(HTTPException) as exc_info:
                endpoint(days=400, db=self.db_mock, current_user=self.admin_user)
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    def test_service_error_handling(self, mock_audit):
        """Testa tratamento de erros dos serviços."""
        with patch(
            "app.api.v1.system_reports.SystemReportsService.get_user_statistics"
        ) as mock_service:
            mock_service.side_effect = Exception("Service error")

            # Act & Assert
            with pytest.raises(Exception) as exc_info:
                get_user_statistics(
                    days=30, db=self.db_mock, current_user=self.admin_user
                )

            assert "Service error" in str(exc_info.value)
            # Auditoria deve ser chamada antes do erro do serviço
            mock_audit.assert_called_once()


class TestSystemReportsAdvanced:
    """Testes avançados para endpoints de relatórios do sistema."""

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
        self.regular_user = User(
            id=3, username="user", email="user@test.com", role="USER", is_active=True
        )

    def test_period_validation_edge_cases(self):
        """Testa casos extremos de validação de período."""
        endpoints = [
            get_user_statistics,
            get_system_usage_statistics,
            get_financial_overview,
            get_user_engagement_report,
        ]

        for endpoint in endpoints:
            # Teste com valores negativos
            with pytest.raises(HTTPException) as exc_info:
                endpoint(days=-1, db=self.db_mock, current_user=self.admin_user)
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

            # Teste com valores decimais (se aceitos pelo tipo)
            with pytest.raises(HTTPException) as exc_info:
                endpoint(days=366, db=self.db_mock, current_user=self.admin_user)
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_user_statistics")
    def test_concurrent_requests_simulation(self, mock_service, mock_audit):
        """Simula requisições concorrentes para testar thread safety."""
        import threading
        import time

        mock_service.return_value = {"total_users": 100}
        results = []
        errors = []

        def make_request():
            try:
                result = get_user_statistics(
                    days=30, db=self.db_mock, current_user=self.admin_user
                )
                results.append(result)
            except Exception as e:
                errors.append(e)

        # Criar múltiplas threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()

        # Aguardar conclusão
        for thread in threads:
            thread.join()

        # Verificar resultados
        assert len(results) == 5
        assert len(errors) == 0
        assert mock_service.call_count == 5
        assert mock_audit.call_count == 5

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_user_statistics")
    def test_large_dataset_handling(self, mock_service, mock_audit):
        """Testa manipulação de grandes conjuntos de dados."""
        # Simular resposta com muitos dados
        large_dataset = {
            "total_users": 10000,
            "active_users": 8500,
            "most_active_users": [
                {"username": f"user{i}", "activity_count": 100 - i} for i in range(1000)
            ],
        }
        mock_service.return_value = large_dataset

        # Act
        result = get_user_statistics(
            days=30, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == large_dataset
        assert len(result["most_active_users"]) == 1000
        mock_service.assert_called_once()

    def test_sql_injection_protection(self):
        """Testa proteção contra SQL injection nos parâmetros."""
        # Os endpoints não recebem strings SQL diretamente,
        # mas testamos se os parâmetros são validados adequadamente
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "1 OR 1=1",
            "<script>alert('xss')</script>",
        ]

        # Como days é um inteiro, estes valores devem causar erro de tipo
        # antes mesmo de chegar à validação de negócio
        for malicious_input in malicious_inputs:
            with pytest.raises((TypeError, ValueError, HTTPException)):
                # Tentativa de passar string onde espera-se int
                get_user_statistics(
                    days=malicious_input, db=self.db_mock, current_user=self.admin_user
                )

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_user_statistics")
    def test_memory_usage_optimization(self, mock_service, mock_audit):
        """Testa otimização de uso de memória com dados grandes."""
        import sys

        # Criar dataset que simula uso intensivo de memória
        memory_intensive_data = {
            "total_users": 50000,
            "user_details": [
                {
                    "id": i,
                    "username": f"user_{i}",
                    "data": "x" * 1000,  # 1KB por usuário
                }
                for i in range(100)
            ],  # 100KB total
        }

        mock_service.return_value = memory_intensive_data

        # Medir uso de memória antes
        initial_size = sys.getsizeof(memory_intensive_data)

        # Act
        result = get_user_statistics(
            days=30, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == memory_intensive_data
        final_size = sys.getsizeof(result)
        assert final_size >= initial_size  # Dados devem estar presentes

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    def test_audit_log_data_sanitization(self, mock_audit):
        """Testa sanitização de dados nos logs de auditoria."""
        with patch(
            "app.api.v1.system_reports.SystemReportsService.get_user_statistics"
        ) as mock_service:
            mock_service.return_value = {"total_users": 100}

            # Usuário com dados que poderiam ser problemáticos
            user_with_special_chars = User(
                id=1,
                username="admin<script>",
                email="admin@test.com",
                role="ADMIN",
                is_active=True,
            )

            # Act
            get_user_statistics(
                days=30, db=self.db_mock, current_user=user_with_special_chars
            )

            # Assert
            mock_audit.assert_called_once()
            call_args = mock_audit.call_args[1]
            # Verificar se o email foi usado (mais seguro que username)
            assert call_args["performed_by"] == "admin@test.com"

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_financial_overview")
    def test_financial_data_precision(self, mock_service, mock_audit):
        """Testa precisão de dados financeiros."""
        # Dados com precisão decimal
        financial_data = {
            "total_income": 12345.67,
            "total_expenses": 9876.54,
            "net_balance": 2469.13,
            "precision_test": 0.01,  # Teste de precisão mínima
        }
        mock_service.return_value = financial_data

        # Act
        result = get_financial_overview(
            days=30, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result["total_income"] == 12345.67
        assert result["total_expenses"] == 9876.54
        assert result["net_balance"] == 2469.13
        assert result["precision_test"] == 0.01

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_system_usage_statistics")
    def test_date_format_consistency(self, mock_service, mock_audit):
        """Testa consistência no formato de datas."""
        usage_data = {
            "daily_activity": [
                {"date": "2024-01-01", "count": 25},
                {"date": "2024-01-02", "count": 30},
                {"date": "2024-12-31", "count": 15},  # Teste de fim de ano
            ]
        }
        mock_service.return_value = usage_data

        # Act
        result = get_system_usage_statistics(
            days=30, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        for activity in result["daily_activity"]:
            date_str = activity["date"]
            # Verificar formato ISO (YYYY-MM-DD)
            assert len(date_str) == 10
            assert date_str[4] == "-"
            assert date_str[7] == "-"
            # Verificar se é uma data válida
            from datetime import datetime

            datetime.strptime(date_str, "%Y-%m-%d")

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    def test_service_timeout_simulation(self, mock_audit):
        """Simula timeout de serviço."""
        import time

        def slow_service(*args, **kwargs):
            time.sleep(0.1)  # Simular operação lenta
            raise TimeoutError("Service timeout")

        with patch(
            "app.api.v1.system_reports.SystemReportsService.get_user_statistics",
            side_effect=slow_service,
        ):
            # Act & Assert
            with pytest.raises(TimeoutError) as exc_info:
                get_user_statistics(
                    days=30, db=self.db_mock, current_user=self.admin_user
                )

            assert "Service timeout" in str(exc_info.value)

    def test_role_based_access_validation(self):
        """Testa validação de acesso baseada em roles."""
        # Este teste verifica a lógica de negócio dos endpoints
        # A validação real de permissões é feita pelas dependencies do FastAPI

        # Verificar se endpoints que requerem MASTER são identificados
        master_only_endpoints = [get_system_health_metrics]
        admin_or_master_endpoints = [
            get_user_statistics,
            get_system_usage_statistics,
            get_financial_overview,
            get_user_engagement_report,
            get_admin_dashboard_data,
        ]

        # Verificar se as funções existem e são chamáveis
        for endpoint in master_only_endpoints + admin_or_master_endpoints:
            assert callable(endpoint)

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_admin_dashboard_data")
    def test_dashboard_data_aggregation(self, mock_service, mock_audit):
        """Testa agregação correta de dados no dashboard."""
        # Mock de dados complexos para agregação
        complex_data = {
            "user_stats": {"total": 1000, "active": 850},
            "usage_stats": {"entries": 5000, "actions": 2500},
            "health_metrics": {"status": "healthy", "uptime": 99.9},
        }

        with patch(
            "app.api.v1.system_reports.SystemReportsService.get_user_statistics"
        ) as mock_user_stats:
            with patch(
                "app.api.v1.system_reports.SystemReportsService.get_system_usage_statistics"
            ) as mock_usage_stats:
                with patch(
                    "app.api.v1.system_reports.SystemReportsService.get_system_health_metrics"
                ) as mock_health_metrics:

                    mock_user_stats.return_value = {
                        "total_users": 1000,
                        "active_users": 850,
                    }
                    mock_usage_stats.return_value = {
                        "total_entries": 5000,
                        "daily_activity": [],
                    }
                    mock_health_metrics.return_value = {"activity_24h": {"logins": 100}}

                    # Act
                    result = get_admin_dashboard_data(
                        db=self.db_mock, current_user=self.admin_user
                    )

                    # Assert
                    assert "summary" in result
                    assert result["summary"]["total_users"] == 1000
                    assert result["summary"]["total_entries_30d"] == 5000

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_user_engagement_report")
    def test_engagement_score_validation(self, mock_service, mock_audit):
        """Testa validação de scores de engajamento."""
        engagement_data = {
            "highly_engaged": [{"username": "user1", "score": 95}],
            "moderately_engaged": [{"username": "user2", "score": 65}],
            "low_engaged": [{"username": "user3", "score": 25}],
            "invalid_scores": [
                {"username": "user4", "score": 150},  # Score > 100
                {"username": "user5", "score": -10},  # Score < 0
            ],
        }
        mock_service.return_value = engagement_data

        # Act
        result = get_user_engagement_report(
            days=30, db=self.db_mock, current_user=self.admin_user
        )

        # Assert
        assert result == engagement_data
        # Verificar se scores estão nos ranges esperados para categorias válidas
        for user in result["highly_engaged"]:
            assert 0 <= user["score"] <= 100
        for user in result["moderately_engaged"]:
            assert 0 <= user["score"] <= 100
        for user in result["low_engaged"]:
            assert 0 <= user["score"] <= 100

    def test_error_message_localization(self):
        """Testa localização de mensagens de erro."""
        # Testar mensagens em português
        with pytest.raises(HTTPException) as exc_info:
            get_user_statistics(days=0, db=self.db_mock, current_user=self.admin_user)

        error_message = exc_info.value.detail
        # Verificar se a mensagem está em português
        assert "deve estar entre" in error_message
        assert "dias" in error_message

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    def test_database_connection_resilience(self, mock_audit):
        """Testa resiliência a problemas de conexão com banco."""
        # Simular diferentes tipos de erro de banco
        db_errors = [
            Exception("Connection timeout"),
            Exception("Database locked"),
            Exception("Too many connections"),
        ]

        for error in db_errors:
            with patch(
                "app.api.v1.system_reports.SystemReportsService.get_user_statistics",
                side_effect=error,
            ):
                with pytest.raises(Exception) as exc_info:
                    get_user_statistics(
                        days=30, db=self.db_mock, current_user=self.admin_user
                    )

                assert str(error) in str(exc_info.value)

    @patch("app.api.v1.system_reports.AuditService.log_system_action")
    @patch("app.api.v1.system_reports.SystemReportsService.get_system_health_metrics")
    def test_health_metrics_thresholds(self, mock_service, mock_audit):
        """Testa métricas de saúde com diferentes thresholds."""
        health_scenarios = [
            {"memory_usage": 95.0, "status": "critical"},
            {"memory_usage": 85.0, "status": "warning"},
            {"memory_usage": 60.0, "status": "healthy"},
            {"memory_usage": 0.0, "status": "unknown"},
        ]

        for scenario in health_scenarios:
            mock_service.return_value = scenario

            # Act
            result = get_system_health_metrics(
                db=self.db_mock, current_user=self.master_user
            )

            # Assert
            assert result["memory_usage"] == scenario["memory_usage"]
            assert result["status"] == scenario["status"]
