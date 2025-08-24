"""Testes para o modelo AuditLog."""

import pytest
from datetime import datetime
from uuid import uuid4
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.core.database import get_db


class TestAuditLogModel:
    """Testes para o modelo AuditLog."""

    def setup_method(self):
        """Configuração inicial para cada teste."""
        self.valid_audit_data = {
            "action": "user_created",
            "resource_type": "user",
            "resource_id": str(uuid4()),
            "performed_by": str(uuid4()),
            "performed_by_role": "ADMIN",
            "description": "Usuário criado com sucesso",
            "details": {"email": "test@example.com", "role": "USER"},
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }

    def test_audit_log_creation_success(self):
        """Testa criação de audit log com dados válidos."""
        audit_log = AuditLog(**self.valid_audit_data)

        assert audit_log.action == "user_created"
        assert audit_log.resource_type == "user"
        assert audit_log.resource_id == self.valid_audit_data["resource_id"]
        assert audit_log.performed_by == self.valid_audit_data["performed_by"]
        assert audit_log.performed_by_role == "ADMIN"
        assert audit_log.description == "Usuário criado com sucesso"
        assert audit_log.details == {"email": "test@example.com", "role": "USER"}
        assert audit_log.ip_address == "192.168.1.1"
        assert audit_log.user_agent.startswith("Mozilla/5.0")

    def test_audit_log_id_generation(self):
        """Testa geração automática de ID."""
        audit_log1 = AuditLog(**self.valid_audit_data)
        audit_log2 = AuditLog(**self.valid_audit_data)

        # IDs devem ser diferentes
        assert audit_log1.id != audit_log2.id
        # IDs devem ser strings válidas de UUID
        assert isinstance(audit_log1.id, str)
        assert len(audit_log1.id) == 36  # Formato UUID padrão
        assert "-" in audit_log1.id

    def test_audit_log_with_minimal_data(self):
        """Testa criação com dados mínimos obrigatórios."""
        minimal_data = {
            "action": "login_attempt",
            "resource_type": "auth",
            "performed_by": str(uuid4()),
            "performed_by_role": "USER",
        }

        audit_log = AuditLog(**minimal_data)

        assert audit_log.action == "login_attempt"
        assert audit_log.resource_type == "auth"
        assert audit_log.performed_by == minimal_data["performed_by"]
        assert audit_log.performed_by_role == "USER"
        assert audit_log.resource_id is None
        assert audit_log.description is None
        assert audit_log.details is None
        assert audit_log.ip_address is None
        assert audit_log.user_agent is None

    def test_audit_log_required_fields(self):
        """Testa campos obrigatórios do modelo."""
        # Teste sem action
        with pytest.raises((TypeError, IntegrityError)):
            audit_log = AuditLog(
                resource_type="user",
                performed_by=str(uuid4()),
                performed_by_role="ADMIN",
            )

        # Teste sem resource_type
        with pytest.raises((TypeError, IntegrityError)):
            audit_log = AuditLog(
                action="user_created",
                performed_by=str(uuid4()),
                performed_by_role="ADMIN",
            )

        # Teste sem performed_by
        with pytest.raises((TypeError, IntegrityError)):
            audit_log = AuditLog(
                action="user_created", resource_type="user", performed_by_role="ADMIN"
            )

        # Teste sem performed_by_role
        with pytest.raises((TypeError, IntegrityError)):
            audit_log = AuditLog(
                action="user_created", resource_type="user", performed_by=str(uuid4())
            )

    def test_audit_log_json_details(self):
        """Testa armazenamento de detalhes em JSON."""
        complex_details = {
            "old_values": {
                "name": "João Silva",
                "email": "joao@old.com",
                "role": "USER",
            },
            "new_values": {
                "name": "João Santos",
                "email": "joao@new.com",
                "role": "ADMIN",
            },
            "changed_fields": ["name", "email", "role"],
            "metadata": {
                "source": "admin_panel",
                "batch_operation": False,
                "validation_passed": True,
            },
        }

        audit_data = self.valid_audit_data.copy()
        audit_data["details"] = complex_details

        audit_log = AuditLog(**audit_data)

        assert audit_log.details == complex_details
        assert audit_log.details["old_values"]["name"] == "João Silva"
        assert audit_log.details["new_values"]["role"] == "ADMIN"
        assert len(audit_log.details["changed_fields"]) == 3

    def test_audit_log_common_actions(self):
        """Testa diferentes tipos de ações comuns."""
        common_actions = [
            "user_created",
            "user_updated",
            "user_deleted",
            "user_blocked",
            "user_unblocked",
            "password_reset",
            "login_success",
            "login_failed",
            "role_changed",
            "entry_created",
            "entry_updated",
            "entry_deleted",
            "category_created",
            "system_config_updated",
        ]

        for action in common_actions:
            audit_data = self.valid_audit_data.copy()
            audit_data["action"] = action

            audit_log = AuditLog(**audit_data)
            assert audit_log.action == action

    def test_audit_log_resource_types(self):
        """Testa diferentes tipos de recursos."""
        resource_types = [
            "user",
            "entry",
            "category",
            "auth",
            "system",
            "config",
            "report",
        ]

        for resource_type in resource_types:
            audit_data = self.valid_audit_data.copy()
            audit_data["resource_type"] = resource_type

            audit_log = AuditLog(**audit_data)
            assert audit_log.resource_type == resource_type

    def test_audit_log_user_roles(self):
        """Testa diferentes roles de usuário."""
        user_roles = ["MASTER", "ADMIN", "USER"]

        for role in user_roles:
            audit_data = self.valid_audit_data.copy()
            audit_data["performed_by_role"] = role

            audit_log = AuditLog(**audit_data)
            assert audit_log.performed_by_role == role

    def test_audit_log_long_description(self):
        """Testa descrições longas."""
        long_description = (
            "Esta é uma descrição muito longa que descreve em detalhes uma ação complexa realizada no sistema. "
            * 10
        )

        audit_data = self.valid_audit_data.copy()
        audit_data["description"] = long_description

        audit_log = AuditLog(**audit_data)
        assert audit_log.description == long_description
        assert len(audit_log.description) > 500

    def test_audit_log_ip_address_formats(self):
        """Testa diferentes formatos de endereço IP."""
        ip_addresses = [
            "192.168.1.1",
            "10.0.0.1",
            "172.16.0.1",
            "127.0.0.1",
            "2001:0db8:85a3:0000:0000:8a2e:0370:7334",  # IPv6
            "::1",  # IPv6 localhost
            None,  # IP não disponível
        ]

        for ip in ip_addresses:
            audit_data = self.valid_audit_data.copy()
            audit_data["ip_address"] = ip

            audit_log = AuditLog(**audit_data)
            assert audit_log.ip_address == ip

    def test_audit_log_user_agent_variations(self):
        """Testa diferentes user agents."""
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            "PostmanRuntime/7.28.4",
            "curl/7.68.0",
            "Python-requests/2.25.1",
            None,  # User agent não disponível
        ]

        for user_agent in user_agents:
            audit_data = self.valid_audit_data.copy()
            audit_data["user_agent"] = user_agent

            audit_log = AuditLog(**audit_data)
            assert audit_log.user_agent == user_agent

    def test_audit_log_table_name(self):
        """Testa nome da tabela."""
        assert AuditLog.__tablename__ == "audit_logs"

    def test_audit_log_indexes(self):
        """Testa se os campos têm índices apropriados."""
        # Verifica se os campos indexados estão definidos corretamente
        indexed_columns = [
            "id",
            "action",
            "resource_type",
            "resource_id",
            "performed_by",
            "performed_by_role",
            "created_at",
        ]

        for column_name in indexed_columns:
            column = getattr(AuditLog, column_name)
            assert hasattr(column.property, "columns")

    def test_audit_log_created_at_default(self):
        """Testa se created_at tem valor padrão."""
        audit_log = AuditLog(**self.valid_audit_data)

        # created_at deve ser definido automaticamente
        assert hasattr(audit_log, "created_at")
        # O valor padrão é definido pelo servidor, então pode ser None até ser salvo

    def test_audit_log_with_empty_details(self):
        """Testa com detalhes vazios."""
        audit_data = self.valid_audit_data.copy()
        audit_data["details"] = {}

        audit_log = AuditLog(**audit_data)
        assert audit_log.details == {}

    def test_audit_log_with_null_resource_id(self):
        """Testa com resource_id nulo (ações que não afetam recursos específicos)."""
        audit_data = self.valid_audit_data.copy()
        audit_data["resource_id"] = None
        audit_data["action"] = "system_backup"
        audit_data["resource_type"] = "system"

        audit_log = AuditLog(**audit_data)
        assert audit_log.resource_id is None
        assert audit_log.action == "system_backup"

    def test_audit_log_unicode_support(self):
        """Testa suporte a caracteres Unicode."""
        unicode_data = {
            "action": "usuário_criado",
            "resource_type": "usuário",
            "resource_id": str(uuid4()),
            "performed_by": str(uuid4()),
            "performed_by_role": "ADMIN",
            "description": "Usuário João da Silva criado com êxito. Configuração: ação realizada às 14h30min.",
            "details": {
                "nome": "José da Silva",
                "observações": "Usuário com caracteres especiais: ção, ã, é, ü",
            },
        }

        audit_log = AuditLog(**unicode_data)
        assert "ção" in audit_log.description
        assert "José" in audit_log.details["nome"]
        assert "observações" in audit_log.details

    def test_audit_log_field_lengths(self):
        """Testa limites de comprimento dos campos."""
        # Testa strings muito longas
        very_long_string = "x" * 1000

        audit_data = self.valid_audit_data.copy()
        audit_data["action"] = very_long_string
        audit_data["user_agent"] = very_long_string

        # Deve aceitar strings longas (dependendo da configuração do banco)
        audit_log = AuditLog(**audit_data)
        assert len(audit_log.action) == 1000
        assert len(audit_log.user_agent) == 1000

    def test_audit_log_model_representation(self):
        """Testa representação do modelo."""
        audit_log = AuditLog(**self.valid_audit_data)

        # Verifica se o objeto pode ser convertido para string
        str_repr = str(audit_log)
        assert isinstance(str_repr, str)

        # Verifica se contém informações relevantes
        assert "AuditLog" in str_repr or "user_created" in str_repr

    def test_audit_log_attribute_access(self):
        """Testa acesso aos atributos do modelo."""
        audit_log = AuditLog(**self.valid_audit_data)

        # Testa acesso direto aos atributos
        assert hasattr(audit_log, "id")
        assert hasattr(audit_log, "action")
        assert hasattr(audit_log, "resource_type")
        assert hasattr(audit_log, "resource_id")
        assert hasattr(audit_log, "performed_by")
        assert hasattr(audit_log, "performed_by_role")
        assert hasattr(audit_log, "description")
        assert hasattr(audit_log, "details")
        assert hasattr(audit_log, "ip_address")
        assert hasattr(audit_log, "user_agent")
        assert hasattr(audit_log, "created_at")

    def test_audit_log_edge_cases(self):
        """Testa casos extremos."""
        # Teste com valores extremos
        edge_cases = [
            {
                "action": "",  # String vazia
                "resource_type": "test",
                "performed_by": str(uuid4()),
                "performed_by_role": "USER",
            },
            {
                "action": "a",  # String de um caractere
                "resource_type": "b",
                "performed_by": str(uuid4()),
                "performed_by_role": "c",
            },
        ]

        for case in edge_cases:
            audit_log = AuditLog(**case)
            assert audit_log.action == case["action"]
            assert audit_log.resource_type == case["resource_type"]

    def test_audit_log_json_serialization(self):
        """Testa serialização JSON dos detalhes."""
        import json

        complex_details = {
            "numbers": [1, 2, 3, 4, 5],
            "nested": {"level1": {"level2": {"value": "deep_value"}}},
            "boolean": True,
            "null_value": None,
            "float": 3.14159,
        }

        audit_data = self.valid_audit_data.copy()
        audit_data["details"] = complex_details

        audit_log = AuditLog(**audit_data)

        # Verifica se os dados podem ser serializados/deserializados
        serialized = json.dumps(audit_log.details)
        deserialized = json.loads(serialized)

        assert deserialized == complex_details
        assert deserialized["nested"]["level1"]["level2"]["value"] == "deep_value"
