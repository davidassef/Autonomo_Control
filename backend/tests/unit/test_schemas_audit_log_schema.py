import pytest
from datetime import datetime, date, timedelta
from pydantic import ValidationError
from app.schemas.audit_log_schema import (
    AuditLogBase,
    AuditLogCreate,
    AuditLogResponse,
    AuditLogFilter,
    AuditLogStats,
)


class TestAuditLogBase:
    """Testes para o schema base AuditLogBase."""

    def test_create_with_valid_data(self):
        """Testa criação com dados válidos."""
        data = {
            "action": "CREATE",
            "resource_type": "user",
            "description": "Usuário criado com sucesso",
            "details": {"user_id": "123", "email": "test@example.com"},
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0",
        }

        audit_log = AuditLogBase(**data)

        assert audit_log.action == "CREATE"
        assert audit_log.resource_type == "user"
        assert audit_log.description == "Usuário criado com sucesso"
        assert audit_log.details == {"user_id": "123", "email": "test@example.com"}
        assert audit_log.ip_address == "192.168.1.1"
        assert audit_log.user_agent == "Mozilla/5.0"

    def test_create_with_minimal_data(self):
        """Testa criação com dados mínimos obrigatórios."""
        data = {
            "action": "LOGIN",
            "resource_type": "auth",
            "description": "Login realizado",
        }

        audit_log = AuditLogBase(**data)

        assert audit_log.action == "LOGIN"
        assert audit_log.resource_type == "auth"
        assert audit_log.description == "Login realizado"
        assert audit_log.details is None
        assert audit_log.ip_address is None
        assert audit_log.user_agent is None

    def test_required_fields_validation(self):
        """Testa validação de campos obrigatórios."""
        # Sem action
        with pytest.raises(ValidationError) as exc_info:
            AuditLogBase(resource_type="user", description="Test")
        assert "action" in str(exc_info.value)

        # Sem resource_type
        with pytest.raises(ValidationError) as exc_info:
            AuditLogBase(action="CREATE", description="Test")
        assert "resource_type" in str(exc_info.value)

        # Sem description
        with pytest.raises(ValidationError) as exc_info:
            AuditLogBase(action="CREATE", resource_type="user")
        assert "description" in str(exc_info.value)

    def test_details_json_validation(self):
        """Testa validação de detalhes JSON."""
        data = {
            "action": "UPDATE",
            "resource_type": "user",
            "description": "Usuário atualizado",
            "details": {
                "old_values": {"name": "João", "age": 30},
                "new_values": {"name": "João Silva", "age": 31},
                "nested": {"deep": {"value": "test"}},
            },
        }

        audit_log = AuditLogBase(**data)

        assert audit_log.details["old_values"]["name"] == "João"
        assert audit_log.details["new_values"]["name"] == "João Silva"
        assert audit_log.details["nested"]["deep"]["value"] == "test"

    def test_ip_address_formats(self):
        """Testa diferentes formatos de endereço IP."""
        base_data = {"action": "LOGIN", "resource_type": "auth", "description": "Login"}

        # IPv4
        audit_log = AuditLogBase(**{**base_data, "ip_address": "192.168.1.1"})
        assert audit_log.ip_address == "192.168.1.1"

        # IPv6
        audit_log = AuditLogBase(
            **{**base_data, "ip_address": "2001:0db8:85a3:0000:0000:8a2e:0370:7334"}
        )
        assert audit_log.ip_address == "2001:0db8:85a3:0000:0000:8a2e:0370:7334"

        # Localhost
        audit_log = AuditLogBase(**{**base_data, "ip_address": "127.0.0.1"})
        assert audit_log.ip_address == "127.0.0.1"

    def test_user_agent_variations(self):
        """Testa diferentes user agents."""
        base_data = {
            "action": "VIEW",
            "resource_type": "page",
            "description": "Página visualizada",
        }

        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            "PostmanRuntime/7.28.4",
            "curl/7.68.0",
        ]

        for user_agent in user_agents:
            audit_log = AuditLogBase(**{**base_data, "user_agent": user_agent})
            assert audit_log.user_agent == user_agent

    def test_unicode_support(self):
        """Testa suporte a caracteres Unicode."""
        data = {
            "action": "CRIAR",
            "resource_type": "usuário",
            "description": "Usuário criado com acentuação: João, José, María",
            "details": {
                "nome": "José da Silva",
                "emoji": "🚀✨",
                "chinese": "你好",
                "arabic": "مرحبا",
            },
        }

        audit_log = AuditLogBase(**data)

        assert audit_log.action == "CRIAR"
        assert audit_log.resource_type == "usuário"
        assert "acentuação" in audit_log.description
        assert audit_log.details["emoji"] == "🚀✨"
        assert audit_log.details["chinese"] == "你好"


class TestAuditLogCreate:
    """Testes para o schema AuditLogCreate."""

    def test_create_with_valid_data(self):
        """Testa criação com dados válidos."""
        data = {
            "action": "CREATE",
            "resource_type": "user",
            "description": "Usuário criado",
            "performed_by": "admin@example.com",
            "details": {"user_id": "123"},
            "ip_address": "192.168.1.1",
        }

        audit_log = AuditLogCreate(**data)

        assert audit_log.performed_by == "admin@example.com"
        assert audit_log.action == "CREATE"
        assert audit_log.resource_type == "user"

    def test_performed_by_required(self):
        """Testa que performed_by é obrigatório."""
        data = {
            "action": "CREATE",
            "resource_type": "user",
            "description": "Usuário criado",
        }

        with pytest.raises(ValidationError) as exc_info:
            AuditLogCreate(**data)
        assert "performed_by" in str(exc_info.value)

    def test_email_formats(self):
        """Testa diferentes formatos de email."""
        base_data = {
            "action": "LOGIN",
            "resource_type": "auth",
            "description": "Login realizado",
        }

        emails = [
            "user@example.com",
            "test.user@domain.co.uk",
            "user+tag@example.org",
            "123@numbers.com",
            "user_name@example-domain.com",
        ]

        for email in emails:
            audit_log = AuditLogCreate(**{**base_data, "performed_by": email})
            assert audit_log.performed_by == email


class TestAuditLogResponse:
    """Testes para o schema AuditLogResponse."""

    def test_create_with_valid_data(self):
        """Testa criação com dados válidos."""
        now = datetime.now()
        data = {
            "id": "audit-123",
            "action": "DELETE",
            "resource_type": "user",
            "description": "Usuário removido",
            "performed_by": "admin@example.com",
            "created_at": now,
            "details": {"deleted_user_id": "456"},
        }

        audit_log = AuditLogResponse(**data)

        assert audit_log.id == "audit-123"
        assert audit_log.performed_by == "admin@example.com"
        assert audit_log.created_at == now

    def test_required_response_fields(self):
        """Testa campos obrigatórios da resposta."""
        base_data = {
            "action": "VIEW",
            "resource_type": "report",
            "description": "Relatório visualizado",
        }

        # Sem id
        with pytest.raises(ValidationError) as exc_info:
            AuditLogResponse(
                **{
                    **base_data,
                    "performed_by": "user@example.com",
                    "created_at": datetime.now(),
                }
            )
        assert "id" in str(exc_info.value)

        # Sem performed_by
        with pytest.raises(ValidationError) as exc_info:
            AuditLogResponse(
                **{**base_data, "id": "audit-123", "created_at": datetime.now()}
            )
        assert "performed_by" in str(exc_info.value)

        # Sem created_at
        with pytest.raises(ValidationError) as exc_info:
            AuditLogResponse(
                **{**base_data, "id": "audit-123", "performed_by": "user@example.com"}
            )
        assert "created_at" in str(exc_info.value)

    def test_datetime_handling(self):
        """Testa manipulação de datetime."""
        base_data = {
            "id": "audit-123",
            "action": "UPDATE",
            "resource_type": "config",
            "description": "Configuração atualizada",
            "performed_by": "admin@example.com",
        }

        # Datetime atual
        now = datetime.now()
        audit_log = AuditLogResponse(**{**base_data, "created_at": now})
        assert audit_log.created_at == now

        # Datetime no passado
        past = datetime.now() - timedelta(days=30)
        audit_log = AuditLogResponse(**{**base_data, "created_at": past})
        assert audit_log.created_at == past


class TestAuditLogFilter:
    """Testes para o schema AuditLogFilter."""

    def test_create_empty_filter(self):
        """Testa criação de filtro vazio."""
        filter_obj = AuditLogFilter()

        assert filter_obj.action is None
        assert filter_obj.resource_type is None
        assert filter_obj.performed_by is None
        assert filter_obj.start_date is None
        assert filter_obj.end_date is None
        assert filter_obj.skip == 0
        assert filter_obj.limit == 100

    def test_create_with_all_filters(self):
        """Testa criação com todos os filtros."""
        start_date = date(2024, 1, 1)
        end_date = date(2024, 12, 31)

        filter_obj = AuditLogFilter(
            action="CREATE",
            resource_type="user",
            performed_by="admin@example.com",
            start_date=start_date,
            end_date=end_date,
            skip=10,
            limit=50,
        )

        assert filter_obj.action == "CREATE"
        assert filter_obj.resource_type == "user"
        assert filter_obj.performed_by == "admin@example.com"
        assert filter_obj.start_date == start_date
        assert filter_obj.end_date == end_date
        assert filter_obj.skip == 10
        assert filter_obj.limit == 50

    def test_pagination_validation(self):
        """Testa validação de paginação."""
        # Skip negativo
        with pytest.raises(ValidationError) as exc_info:
            AuditLogFilter(skip=-1)
        assert "greater than or equal to 0" in str(exc_info.value)

        # Limit zero
        with pytest.raises(ValidationError) as exc_info:
            AuditLogFilter(limit=0)
        assert "greater than or equal to 1" in str(exc_info.value)

        # Limit muito alto
        with pytest.raises(ValidationError) as exc_info:
            AuditLogFilter(limit=1001)
        assert "less than or equal to 1000" in str(exc_info.value)

    def test_date_range_validation(self):
        """Testa validação de intervalo de datas."""
        # Datas válidas
        start_date = date(2024, 1, 1)
        end_date = date(2024, 12, 31)

        filter_obj = AuditLogFilter(start_date=start_date, end_date=end_date)

        assert filter_obj.start_date == start_date
        assert filter_obj.end_date == end_date

    def test_boundary_values(self):
        """Testa valores limítrofes."""
        # Skip mínimo
        filter_obj = AuditLogFilter(skip=0)
        assert filter_obj.skip == 0

        # Limit mínimo
        filter_obj = AuditLogFilter(limit=1)
        assert filter_obj.limit == 1

        # Limit máximo
        filter_obj = AuditLogFilter(limit=1000)
        assert filter_obj.limit == 1000


class TestAuditLogStats:
    """Testes para o schema AuditLogStats."""

    def test_create_with_valid_data(self):
        """Testa criação com dados válidos."""
        data = {
            "period_days": 30,
            "total_logs": 1500,
            "actions": [
                {"action": "CREATE", "count": 500},
                {"action": "UPDATE", "count": 300},
                {"action": "DELETE", "count": 100},
            ],
            "resource_types": [
                {"resource_type": "user", "count": 800},
                {"resource_type": "config", "count": 200},
            ],
            "most_active_users": [
                {"user": "admin@example.com", "count": 400},
                {"user": "user@example.com", "count": 200},
            ],
        }

        stats = AuditLogStats(**data)

        assert stats.period_days == 30
        assert stats.total_logs == 1500
        assert len(stats.actions) == 3
        assert stats.actions[0]["action"] == "CREATE"
        assert stats.actions[0]["count"] == 500
        assert len(stats.resource_types) == 2
        assert len(stats.most_active_users) == 2

    def test_empty_stats(self):
        """Testa estatísticas vazias."""
        data = {
            "period_days": 7,
            "total_logs": 0,
            "actions": [],
            "resource_types": [],
            "most_active_users": [],
        }

        stats = AuditLogStats(**data)

        assert stats.period_days == 7
        assert stats.total_logs == 0
        assert len(stats.actions) == 0
        assert len(stats.resource_types) == 0
        assert len(stats.most_active_users) == 0

    def test_complex_stats_data(self):
        """Testa dados complexos de estatísticas."""
        data = {
            "period_days": 365,
            "total_logs": 50000,
            "actions": [
                {"action": "LOGIN", "count": 20000, "percentage": 40.0},
                {"action": "VIEW", "count": 15000, "percentage": 30.0},
                {"action": "CREATE", "count": 8000, "percentage": 16.0},
                {"action": "UPDATE", "count": 5000, "percentage": 10.0},
                {"action": "DELETE", "count": 2000, "percentage": 4.0},
            ],
            "resource_types": [
                {"resource_type": "auth", "count": 20000, "avg_per_day": 54.8},
                {"resource_type": "user", "count": 15000, "avg_per_day": 41.1},
                {"resource_type": "config", "count": 10000, "avg_per_day": 27.4},
            ],
            "most_active_users": [
                {
                    "user": "admin@example.com",
                    "count": 5000,
                    "last_activity": "2024-01-15T10:30:00",
                    "most_common_action": "UPDATE",
                },
                {
                    "user": "manager@example.com",
                    "count": 3000,
                    "last_activity": "2024-01-14T15:45:00",
                    "most_common_action": "VIEW",
                },
            ],
        }

        stats = AuditLogStats(**data)

        assert stats.period_days == 365
        assert stats.total_logs == 50000
        assert stats.actions[0]["percentage"] == 40.0
        assert stats.resource_types[0]["avg_per_day"] == 54.8
        assert stats.most_active_users[0]["most_common_action"] == "UPDATE"


class TestSchemaIntegration:
    """Testes de integração entre schemas."""

    def test_create_to_response_conversion(self):
        """Testa conversão de Create para Response."""
        create_data = {
            "action": "CREATE",
            "resource_type": "user",
            "description": "Novo usuário criado",
            "performed_by": "admin@example.com",
            "details": {"user_id": "new-user-123"},
            "ip_address": "192.168.1.100",
        }

        create_log = AuditLogCreate(**create_data)

        # Simula dados que viriam do banco
        response_data = {"id": "audit-456", "created_at": datetime.now(), **create_data}

        response_log = AuditLogResponse(**response_data)

        assert response_log.action == create_log.action
        assert response_log.resource_type == create_log.resource_type
        assert response_log.description == create_log.description
        assert response_log.performed_by == create_log.performed_by
        assert response_log.details == create_log.details
        assert response_log.ip_address == create_log.ip_address

    def test_filter_with_stats_period(self):
        """Testa compatibilidade entre filtro e período de estatísticas."""
        # Filtro para últimos 30 dias
        end_date = date.today()
        start_date = end_date - timedelta(days=30)

        filter_obj = AuditLogFilter(
            start_date=start_date, end_date=end_date, limit=1000
        )

        # Estatísticas para o mesmo período
        stats = AuditLogStats(
            period_days=30,
            total_logs=500,
            actions=[{"action": "LOGIN", "count": 300}],
            resource_types=[{"resource_type": "auth", "count": 300}],
            most_active_users=[{"user": "user@example.com", "count": 150}],
        )

        # Verifica compatibilidade
        period_diff = (filter_obj.end_date - filter_obj.start_date).days
        assert period_diff <= stats.period_days
