"""Testes para o módulo system_reports_service.py"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.services.system_reports_service import SystemReportsService


class TestSystemReportsService:
    """Testes para a classe SystemReportsService."""

    def setup_method(self):
        """Configuração inicial para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = SystemReportsService()

    def test_service_initialization(self):
        """Testa a inicialização do serviço."""
        service = SystemReportsService()
        assert service is not None

    def test_get_user_statistics_success(self):
        """Testa obtenção de estatísticas de usuários com sucesso."""
        # Mock dos dados de retorno
        mock_total_users = 100
        mock_active_users = 80
        mock_blocked_users = 5
        mock_new_users = 10
        mock_users_by_role = [("ADMIN", 5), ("USER", 95)]
        mock_recent_registrations = [
            (datetime.now() - timedelta(days=1), 3),
            (datetime.now() - timedelta(days=2), 2),
        ]

        # Configurar mocks da query
        self.mock_db.query.return_value.count.return_value = mock_total_users

        # Mock para usuários ativos
        mock_active_query = Mock()
        mock_active_query.filter.return_value.count.return_value = mock_active_users

        # Mock para usuários bloqueados
        mock_blocked_query = Mock()
        mock_blocked_query.filter.return_value.count.return_value = mock_blocked_users

        # Mock para novos usuários
        mock_new_query = Mock()
        mock_new_query.filter.return_value.count.return_value = mock_new_users

        # Mock para usuários por role
        mock_role_query = Mock()
        mock_role_query.group_by.return_value.all.return_value = mock_users_by_role

        # Mock para registros recentes
        mock_recent_query = Mock()
        (
            mock_recent_query.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value
        ) = mock_recent_registrations

        # Configurar retornos sequenciais do query
        self.mock_db.query.side_effect = [
            Mock(count=Mock(return_value=mock_total_users)),  # total_users
            mock_active_query,  # active_users
            mock_blocked_query,  # blocked_users
            mock_new_query,  # new_users
            mock_role_query,  # users_by_role
            mock_recent_query,  # recent_registrations
        ]

        result = SystemReportsService.get_user_statistics(self.mock_db, days=30)
        assert result["period_days"] == 30
        assert result["total_users"] == mock_total_users
        assert result["active_users"] == mock_active_users
        assert result["blocked_users"] == mock_blocked_users
        assert result["new_users"] == mock_new_users
        assert len(result["users_by_role"]) == 2
        assert result["users_by_role"][0]["role"] == "ADMIN"
        assert result["users_by_role"][0]["count"] == 5

    def test_get_user_statistics_with_different_days(self):
        """Testa obtenção de estatísticas com diferentes períodos."""
        self.mock_db.query.return_value.count.return_value = 50

        # Mock para outras queries
        mock_query = Mock()
        mock_query.filter.return_value.count.return_value = 0
        mock_query.group_by.return_value.all.return_value = []
        (
            mock_query.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value
        ) = []

        self.mock_db.query.side_effect = [Mock(count=Mock(return_value=50))] + [
            mock_query
        ] * 5

        result = SystemReportsService.get_user_statistics(self.mock_db, days=7)

        assert result["period_days"] == 7
        assert result["total_users"] == 50

    def test_get_user_statistics_database_error(self):
        """Testa tratamento de erro de banco de dados."""
        self.mock_db.query.side_effect = Exception("Database error")

        with pytest.raises(Exception, match="Database error"):
            SystemReportsService.get_user_statistics(self.mock_db)

    def test_get_system_usage_statistics_success(self):
        """Testa obtenção de estatísticas de uso do sistema com sucesso."""
        mock_total_entries = 1000
        mock_entries_by_type = [
            ("RECEITA", 600, 50000.0),
            ("DESPESA", 400, 30000.0),
        ]
        mock_daily_activity = [
            (datetime.now().date(), 50, 10),
            (datetime.now().date() - timedelta(days=1), 45, 8),
        ]
        mock_audit_logs_count = 200
        mock_common_actions = [("CREATE_ENTRY", 150), ("UPDATE_ENTRY", 100)]

        # Configurar mocks
        (self.mock_db.query.return_value.filter.return_value.count.return_value) = (
            mock_total_entries
        )

        # Mock para entries_by_type
        mock_type_query = Mock()
        (mock_type_query.filter.return_value.group_by.return_value.all.return_value) = (
            mock_entries_by_type
        )

        # Mock para daily_activity
        mock_daily_query = Mock()
        (
            mock_daily_query.filter.return_value.group_by.return_value.order_by.return_value.all.return_value
        ) = mock_daily_activity

        # Mock para audit_logs_count
        mock_audit_query = Mock()
        mock_audit_query.filter.return_value.count.return_value = mock_audit_logs_count

        # Mock para common_actions
        mock_actions_query = Mock()
        (
            mock_actions_query.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value
        ) = mock_common_actions

        self.mock_db.query.side_effect = [
            Mock(
                filter=Mock(
                    return_value=Mock(count=Mock(return_value=mock_total_entries))
                )
            ),
            mock_type_query,
            mock_daily_query,
            mock_audit_query,
            mock_actions_query,
        ]

        result = SystemReportsService.get_system_usage_statistics(self.mock_db, days=30)

        assert result["period_days"] == 30
        assert result["total_entries"] == mock_total_entries
        assert len(result["entries_by_type"]) == 2
        assert result["entries_by_type"][0]["type"] == "RECEITA"
        assert result["entries_by_type"][0]["count"] == 600
        assert result["entries_by_type"][0]["total_amount"] == 50000.0
        assert result["audit_logs_count"] == mock_audit_logs_count
        assert len(result["common_actions"]) == 2

    def test_get_financial_overview_success(self):
        """Testa obtenção de visão geral financeira com sucesso."""
        mock_financial_summary = [
            ("RECEITA", 100, 50000.0, 500.0, 100.0, 2000.0),
            ("DESPESA", 80, 30000.0, 375.0, 50.0, 1500.0),
        ]
        mock_monthly_evolution = [
            (2024, 1, "RECEITA", 10000.0, 20),
            (2024, 1, "DESPESA", 8000.0, 15),
        ]
        mock_top_categories = [
            ("Vendas", "RECEITA", 50, 25000.0),
            ("Compras", "DESPESA", 30, 15000.0),
        ]

        # Mock para financial_summary
        mock_summary_query = Mock()
        (
            mock_summary_query.filter.return_value.group_by.return_value.all.return_value
        ) = mock_financial_summary

        # Mock para monthly_evolution
        mock_evolution_query = Mock()
        (
            mock_evolution_query.filter.return_value.group_by.return_value.order_by.return_value.all.return_value
        ) = mock_monthly_evolution

        # Mock para top_categories
        mock_categories_query = Mock()
        (
            mock_categories_query.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value
        ) = mock_top_categories

        self.mock_db.query.side_effect = [
            mock_summary_query,
            mock_evolution_query,
            mock_categories_query,
        ]

        result = SystemReportsService.get_financial_overview(self.mock_db, days=30)

        assert result["period_days"] == 30
        assert len(result["financial_summary"]) == 2
        assert result["financial_summary"][0]["type"] == "RECEITA"
        assert result["financial_summary"][0]["total_amount"] == 50000.0
        assert result["financial_summary"][0]["avg_amount"] == 500.0
        assert len(result["monthly_evolution"]) == 2
        assert result["monthly_evolution"][0]["year"] == 2024
        assert result["monthly_evolution"][0]["month"] == 1
        assert len(result["top_categories"]) == 2

    def test_get_system_health_metrics_success(self):
        """Testa obtenção de métricas de saúde do sistema com sucesso."""
        with patch("app.services.system_reports_service.datetime") as mock_datetime:
            mock_now = datetime(2024, 1, 15, 12, 0, 0)
            mock_datetime.now.return_value = mock_now

            # Mock para atividade 24h
            mock_entries_24h = 50
            mock_users_24h = 10
            mock_audit_24h = 25

            # Mock para atividade 7d
            mock_entries_7d = 300
            mock_users_7d = 45
            mock_new_users_7d = 5
            mock_audit_7d = 150

            # Mock para estatísticas gerais
            mock_total_users = 100
            mock_total_entries = 2000
            mock_total_audit = 500
            mock_blocked_users = 3

            # Configurar mocks das queries
            query_results = [
                mock_entries_24h,  # new_entries 24h
                mock_users_24h,  # active_users 24h
                mock_audit_24h,  # audit_logs 24h
                mock_entries_7d,  # new_entries 7d
                mock_users_7d,  # active_users 7d
                mock_new_users_7d,  # new_users 7d
                mock_audit_7d,  # audit_logs 7d
                mock_total_users,  # total_users
                mock_total_entries,  # total_entries
                mock_total_audit,  # total_audit_logs
                mock_blocked_users,  # blocked_users
            ]

            def mock_query_side_effect(*args):
                mock_query = Mock()
                if query_results:
                    result = query_results.pop(0)
                    if hasattr(result, "__call__"):
                        mock_query.filter.return_value.scalar.return_value = result
                    else:
                        mock_query.filter.return_value.count.return_value = result
                        mock_query.count.return_value = result
                        mock_query.scalar.return_value = result
                return mock_query

            self.mock_db.query.side_effect = mock_query_side_effect

            result = SystemReportsService.get_system_health_metrics(self.mock_db)

            assert result["timestamp"] == mock_now.isoformat()
            assert result["activity_24h"]["new_entries"] == mock_entries_24h
            assert result["activity_7d"]["new_entries"] == mock_entries_7d
            assert result["general_stats"]["total_users"] == mock_total_users

    def test_get_user_engagement_report_success(self):
        """Testa obtenção de relatório de engajamento com sucesso."""
        mock_user_activity = [
            (
                1,
                "admin@test.com",
                "Admin User",
                25,
                datetime.now(),
                datetime.now() - timedelta(days=10),
            ),
            (
                2,
                "user1@test.com",
                "User One",
                10,
                datetime.now(),
                datetime.now() - timedelta(days=5),
            ),
            (
                3,
                "user2@test.com",
                "User Two",
                3,
                datetime.now(),
                datetime.now() - timedelta(days=2),
            ),
            (4, "inactive@test.com", "Inactive User", 0, None, None),
        ]

        mock_query = Mock()
        (mock_query.outerjoin.return_value.group_by.return_value.all.return_value) = (
            mock_user_activity
        )
        self.mock_db.query.return_value = mock_query
        result = SystemReportsService.get_user_engagement_report(self.mock_db, days=30)

        assert result["period_days"] == 30
        assert result["engagement_summary"]["highly_engaged"] == 1
        assert result["engagement_summary"]["moderately_engaged"] == 1
        assert result["engagement_summary"]["low_engaged"] == 1
        assert result["engagement_summary"]["inactive"] == 1
        assert len(result["highly_engaged_users"]) == 1
        assert result["highly_engaged_users"][0]["email"] == "admin@test.com"
        assert len(result["inactive_users"]) == 1
        assert result["inactive_users"][0]["email"] == "inactive@test.com"

    def test_get_user_engagement_report_with_none_values(self):
        """Testa relatório de engajamento com valores None."""
        mock_user_activity = [(1, "user@test.com", "Test User", None, None, None)]

        mock_query = Mock()
        mock_query.outerjoin.return_value.group_by.return_value.all.return_value = (
            mock_user_activity
        )

        self.mock_db.query.return_value = mock_query
        result = SystemReportsService.get_user_engagement_report(self.mock_db)
        assert result["engagement_summary"]["inactive"] == 1
        assert result["inactive_users"][0]["entries_count"] == 0
        assert result["inactive_users"][0]["last_entry"] is None
        assert result["inactive_users"][0]["first_entry"] is None

    def test_financial_overview_with_none_amounts(self):
        """Testa visão financeira com valores None."""
        mock_financial_summary = [("RECEITA", 10, None, None, None, None)]

        mock_summary_query = Mock()
        mock_summary_query.filter.return_value.group_by.return_value.all.return_value = (
            mock_financial_summary
        )

        self.mock_db.query.side_effect = [
            mock_summary_query,
            Mock(
                filter=Mock(
                    return_value=Mock(
                        group_by=Mock(
                            return_value=Mock(
                                order_by=Mock(
                                    return_value=Mock(all=Mock(return_value=()))
                                )
                            )
                        )
                    )
                )
            ),
            Mock(
                filter=Mock(
                    return_value=Mock(
                        group_by=Mock(
                            return_value=Mock(
                                order_by=Mock(
                                    return_value=Mock(
                                        limit=Mock(
                                            return_value=Mock(all=Mock(return_value=()))
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),
        ]

        result = SystemReportsService.get_financial_overview(self.mock_db)

        assert result["financial_summary"][0]["total_amount"] == 0.0
        assert result["financial_summary"][0]["avg_amount"] == 0.0
        assert result["financial_summary"][0]["min_amount"] == 0.0
        assert result["financial_summary"][0]["max_amount"] == 0.0

    def test_system_usage_statistics_with_none_amounts(self):
        """Testa estatísticas de uso com valores None."""
        mock_entries_by_type = [("RECEITA", 10, None)]

        self.mock_db.query.return_value.filter.return_value.count.return_value = 10

        mock_type_query = Mock()
        mock_type_query.filter.return_value.group_by.return_value.all.return_value = (
            mock_entries_by_type
        )

        self.mock_db.query.side_effect = [
            Mock(filter=Mock(return_value=Mock(count=Mock(return_value=10)))),
            mock_type_query,
            Mock(
                filter=Mock(
                    return_value=Mock(
                        group_by=Mock(
                            return_value=Mock(
                                order_by=Mock(
                                    return_value=Mock(all=Mock(return_value=()))
                                )
                            )
                        )
                    )
                )
            ),
            Mock(filter=Mock(return_value=Mock(count=Mock(return_value=0)))),
            Mock(
                filter=Mock(
                    return_value=Mock(
                        group_by=Mock(
                            return_value=Mock(
                                order_by=Mock(
                                    return_value=Mock(
                                        limit=Mock(
                                            return_value=Mock(all=Mock(return_value=()))
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),
        ]

        result = SystemReportsService.get_system_usage_statistics(self.mock_db)

        assert result["entries_by_type"][0]["total_amount"] == 0.0

    def test_all_methods_are_static(self):
        """Testa se todos os métodos são estáticos."""
        # Verifica se os métodos podem ser chamados sem instância
        assert hasattr(SystemReportsService.get_user_statistics, "__func__")
        assert hasattr(SystemReportsService.get_system_usage_statistics, "__func__")
        assert hasattr(SystemReportsService.get_financial_overview, "__func__")
        assert hasattr(SystemReportsService.get_system_health_metrics, "__func__")
        assert hasattr(SystemReportsService.get_user_engagement_report, "__func__")

    def test_date_calculations_accuracy(self):
        """Testa precisão dos cálculos de data."""
        with patch("app.services.system_reports_service.datetime") as mock_datetime:
            mock_now = datetime(2024, 1, 15, 12, 0, 0)
            mock_datetime.now.return_value = mock_now

            # Mock básico para evitar erros
            self.mock_db.query.return_value.count.return_value = 0
            mock_query = Mock()
            mock_query.filter.return_value.count.return_value = 0
            mock_query.group_by.return_value.all.return_value = []
            mock_query.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value = (
                []
            )
            self.mock_db.query.side_effect = [Mock(count=Mock(return_value=0))] + [
                mock_query
            ] * 10

            # Testa com diferentes períodos
            SystemReportsService.get_user_statistics(self.mock_db, days=1)
            SystemReportsService.get_user_statistics(self.mock_db, days=7)
            SystemReportsService.get_user_statistics(self.mock_db, days=30)
            SystemReportsService.get_user_statistics(self.mock_db, days=365)

            # Verifica se datetime.now foi chamado
            assert mock_datetime.now.called

    @pytest.mark.parametrize("days", [1, 7, 30, 90, 365])
    def test_different_time_periods(self, days):
        """Testa diferentes períodos de tempo."""
        # Mock básico
        self.mock_db.query.return_value.count.return_value = 100
        mock_query = Mock()
        mock_query.filter.return_value.count.return_value = 50
        mock_query.group_by.return_value.all.return_value = []
        mock_query.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value = (
            []
        )
        self.mock_db.query.side_effect = [Mock(count=Mock(return_value=100))] + [
            mock_query
        ] * 5

        result = SystemReportsService.get_user_statistics(self.mock_db, days=days)

        assert result["period_days"] == days
        assert "total_users" in result
        assert "active_users" in result

    def test_integration_all_reports_together(self):
        """Teste de integração executando todos os relatórios juntos."""

        # Configurar mocks básicos para todos os métodos
        def setup_basic_mocks():
            mock_query = Mock()
            mock_query.count.return_value = 10
            mock_query.filter.return_value.count.return_value = 5
            mock_query.filter.return_value.scalar.return_value = 3
            mock_query.scalar.return_value = 2
            mock_query.group_by.return_value.all.return_value = []
            mock_query.outerjoin.return_value.group_by.return_value.all.return_value = (
                []
            )
            mock_query.filter.return_value.group_by.return_value.all.return_value = []
            mock_query.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = (
                []
            )
            mock_query.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value = (
                []
            )
            return mock_query

        with patch("app.services.system_reports_service.datetime") as mock_datetime:
            mock_datetime.now.return_value = datetime(2024, 1, 15, 12, 0, 0)

            # Configurar mocks para cada método
            self.mock_db.query.side_effect = [setup_basic_mocks() for _ in range(50)]

            # Executar todos os relatórios
            user_stats = SystemReportsService.get_user_statistics(self.mock_db)
            usage_stats = SystemReportsService.get_system_usage_statistics(self.mock_db)
            financial = SystemReportsService.get_financial_overview(self.mock_db)
            health = SystemReportsService.get_system_health_metrics(self.mock_db)
            engagement = SystemReportsService.get_user_engagement_report(self.mock_db)

            # Verificar que todos retornaram dados válidos
            assert isinstance(user_stats, dict)
            assert isinstance(usage_stats, dict)
            assert isinstance(financial, dict)
            assert isinstance(health, dict)
            assert isinstance(engagement, dict)
