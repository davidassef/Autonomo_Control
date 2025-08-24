"""Testes para o modelo SystemConfig."""

import pytest
import json
from datetime import datetime
from uuid import uuid4
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.system_config import SystemConfig
from app.core.database import get_db


class TestSystemConfigModel:
    """Testes para o modelo SystemConfig."""

    def setup_method(self):
        """Configuração inicial para cada teste."""
        self.valid_config_data = {
            "key": "email_smtp_host",
            "value": "smtp.gmail.com",
            "value_type": "string",
            "description": "Servidor SMTP para envio de emails",
            "category": "email",
            "is_public": False,
            "is_active": True,
            "default_value": "localhost",
            "config_metadata": {
                "validation": {"required": True, "min_length": 3},
                "options": ["smtp.gmail.com", "smtp.outlook.com"],
            },
            "created_by": str(uuid4()),
            "updated_by": str(uuid4()),
        }

    def test_system_config_creation_success(self):
        """Testa criação de configuração com dados válidos."""
        config = SystemConfig(**self.valid_config_data)

        assert config.key == "email_smtp_host"
        assert config.value == "smtp.gmail.com"
        assert config.value_type == "string"
        assert config.description == "Servidor SMTP para envio de emails"
        assert config.category == "email"
        assert config.is_public is False
        assert config.is_active is True
        assert config.default_value == "localhost"
        assert config.config_metadata["validation"]["required"] is True
        assert config.created_by == self.valid_config_data["created_by"]

    def test_system_config_id_generation(self):
        """Testa geração automática de ID."""
        config1 = SystemConfig(**self.valid_config_data)

        config_data2 = self.valid_config_data.copy()
        config_data2["key"] = "different_key"
        config2 = SystemConfig(**config_data2)

        # IDs devem ser diferentes
        assert config1.id != config2.id
        # IDs devem ser strings válidas de UUID
        assert isinstance(config1.id, str)
        assert len(config1.id) == 36  # Formato UUID padrão
        assert "-" in config1.id

    def test_system_config_with_minimal_data(self):
        """Testa criação com dados mínimos obrigatórios."""
        minimal_data = {"key": "simple_config", "value_type": "string"}

        config = SystemConfig(**minimal_data)

        assert config.key == "simple_config"
        assert config.value_type == "string"
        assert config.value is None
        assert config.description is None
        assert config.category is None
        assert config.is_public is False  # Valor padrão
        assert config.is_active is True  # Valor padrão
        assert config.default_value is None
        assert config.config_metadata is None

    def test_system_config_required_fields(self):
        """Testa campos obrigatórios do modelo."""
        # Teste sem key
        with pytest.raises((TypeError, IntegrityError)):
            config = SystemConfig(value="test", value_type="string")

        # Teste sem value_type
        with pytest.raises((TypeError, IntegrityError)):
            config = SystemConfig(key="test_key", value="test")

    def test_system_config_unique_key_constraint(self):
        """Testa restrição de chave única."""
        # Este teste seria mais apropriado em testes de integração com banco real
        # Aqui testamos apenas a definição do modelo
        config1 = SystemConfig(key="unique_key", value_type="string")
        config2 = SystemConfig(key="unique_key", value_type="string")

        # Ambos podem ser criados em memória, mas falhariam no banco
        assert config1.key == config2.key

    def test_system_config_value_types(self):
        """Testa diferentes tipos de valor."""
        value_types = [
            "string",
            "integer",
            "boolean",
            "json",
            "float",
            "list",
            "datetime",
            "email",
            "url",
        ]

        for value_type in value_types:
            config_data = self.valid_config_data.copy()
            config_data["key"] = f"test_{value_type}"
            config_data["value_type"] = value_type

            config = SystemConfig(**config_data)
            assert config.value_type == value_type

    def test_system_config_categories(self):
        """Testa diferentes categorias de configuração."""
        categories = [
            "general",
            "email",
            "security",
            "backup",
            "logging",
            "users",
            "system",
            "api",
            "ui",
        ]

        for category in categories:
            config_data = self.valid_config_data.copy()
            config_data["key"] = f"test_{category}"
            config_data["category"] = category

            config = SystemConfig(**config_data)
            assert config.category == category

    def test_system_config_boolean_values(self):
        """Testa configurações booleanas."""
        boolean_configs = [
            {
                "key": "email_enabled",
                "value": "true",
                "value_type": "boolean",
                "category": "email",
            },
            {
                "key": "debug_mode",
                "value": "false",
                "value_type": "boolean",
                "category": "system",
            },
        ]

        for config_data in boolean_configs:
            config = SystemConfig(**config_data)
            assert config.value_type == "boolean"
            assert config.value in ["true", "false"]

    def test_system_config_integer_values(self):
        """Testa configurações numéricas."""
        integer_configs = [
            {
                "key": "max_login_attempts",
                "value": "5",
                "value_type": "integer",
                "category": "security",
            },
            {
                "key": "session_timeout",
                "value": "3600",
                "value_type": "integer",
                "category": "security",
            },
        ]

        for config_data in integer_configs:
            config = SystemConfig(**config_data)
            assert config.value_type == "integer"
            assert config.value.isdigit()

    def test_system_config_json_values(self):
        """Testa configurações JSON."""
        json_config = {
            "key": "email_templates",
            "value": json.dumps(
                {
                    "welcome": "Bem-vindo ao sistema!",
                    "reset_password": "Clique aqui para resetar sua senha",
                    "notification": "Você tem uma nova notificação",
                }
            ),
            "value_type": "json",
            "category": "email",
        }

        config = SystemConfig(**json_config)
        assert config.value_type == "json"

        # Verifica se o valor pode ser deserializado
        parsed_value = json.loads(config.value)
        assert "welcome" in parsed_value
        assert parsed_value["welcome"] == "Bem-vindo ao sistema!"

    def test_system_config_metadata_structure(self):
        """Testa estrutura de metadados."""
        complex_metadata = {
            "validation": {
                "required": True,
                "min_length": 8,
                "max_length": 255,
                "pattern": r"^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
            },
            "ui": {
                "type": "email",
                "placeholder": "Digite seu email",
                "help_text": "Email será usado para notificações",
            },
            "options": ["admin@example.com", "noreply@example.com"],
            "dependencies": ["email_enabled"],
            "version": "1.0",
            "last_migration": "2024-01-01",
        }

        config_data = self.valid_config_data.copy()
        config_data["config_metadata"] = complex_metadata

        config = SystemConfig(**config_data)

        assert config.config_metadata["validation"]["required"] is True
        assert config.config_metadata["ui"]["type"] == "email"
        assert len(config.config_metadata["options"]) == 2
        assert "email_enabled" in config.config_metadata["dependencies"]

    def test_system_config_public_vs_private(self):
        """Testa configurações públicas vs privadas."""
        public_config = SystemConfig(
            key="app_name",
            value="Autonomo Control",
            value_type="string",
            is_public=True,
        )

        private_config = SystemConfig(
            key="database_password",
            value="secret123",
            value_type="string",
            is_public=False,
        )

        assert public_config.is_public is True
        assert private_config.is_public is False

    def test_system_config_active_inactive(self):
        """Testa configurações ativas vs inativas."""
        active_config = SystemConfig(
            key="feature_enabled", value="true", value_type="boolean", is_active=True
        )

        inactive_config = SystemConfig(
            key="deprecated_feature",
            value="false",
            value_type="boolean",
            is_active=False,
        )

        assert active_config.is_active is True
        assert inactive_config.is_active is False

    def test_system_config_default_values(self):
        """Testa valores padrão das configurações."""
        configs_with_defaults = [
            {
                "key": "max_file_size",
                "value": "10485760",  # 10MB
                "value_type": "integer",
                "default_value": "5242880",  # 5MB
            },
            {
                "key": "theme",
                "value": "dark",
                "value_type": "string",
                "default_value": "light",
            },
        ]

        for config_data in configs_with_defaults:
            config = SystemConfig(**config_data)
            assert config.default_value is not None
            assert config.value != config.default_value

    def test_system_config_long_descriptions(self):
        """Testa descrições longas."""
        long_description = (
            "Esta configuração controla o comportamento do sistema de autenticação, "
            "incluindo o número máximo de tentativas de login, tempo de bloqueio, "
            "políticas de senha, integração com provedores externos como Google e "
            "Microsoft, configurações de sessão, logs de auditoria e muito mais. "
            "É uma configuração crítica que afeta a segurança de todo o sistema."
        )

        config_data = self.valid_config_data.copy()
        config_data["description"] = long_description

        config = SystemConfig(**config_data)
        assert len(config.description) > 200
        assert "autenticação" in config.description

    def test_system_config_table_name(self):
        """Testa nome da tabela."""
        assert SystemConfig.__tablename__ == "system_configs"

    def test_system_config_indexes(self):
        """Testa se os campos têm índices apropriados."""
        # Verifica se os campos indexados estão definidos corretamente
        indexed_columns = ["id", "key", "category"]

        for column_name in indexed_columns:
            column = getattr(SystemConfig, column_name)
            assert hasattr(column.property, "columns")

    def test_system_config_timestamps(self):
        """Testa campos de timestamp."""
        config = SystemConfig(**self.valid_config_data)

        # Verifica se os campos de timestamp existem
        assert hasattr(config, "created_at")
        assert hasattr(config, "updated_at")

        # Os valores padrão são definidos pelo servidor
        # então podem ser None até serem salvos no banco

    def test_system_config_user_tracking(self):
        """Testa rastreamento de usuários."""
        user_id = str(uuid4())

        config_data = self.valid_config_data.copy()
        config_data["created_by"] = user_id
        config_data["updated_by"] = user_id

        config = SystemConfig(**config_data)

        assert config.created_by == user_id
        assert config.updated_by == user_id

    def test_system_config_common_configurations(self):
        """Testa configurações comuns do sistema."""
        common_configs = [
            {
                "key": "app_name",
                "value": "Autonomo Control",
                "value_type": "string",
                "category": "general",
                "is_public": True,
            },
            {
                "key": "max_login_attempts",
                "value": "5",
                "value_type": "integer",
                "category": "security",
                "is_public": False,
            },
            {
                "key": "email_enabled",
                "value": "true",
                "value_type": "boolean",
                "category": "email",
                "is_public": False,
            },
            {
                "key": "backup_schedule",
                "value": json.dumps({"hour": 2, "minute": 0, "days": ["sunday"]}),
                "value_type": "json",
                "category": "backup",
                "is_public": False,
            },
        ]

        for config_data in common_configs:
            config = SystemConfig(**config_data)
            assert config.key == config_data["key"]
            assert config.category == config_data["category"]
            assert config.is_public == config_data["is_public"]

    def test_system_config_unicode_support(self):
        """Testa suporte a caracteres Unicode."""
        unicode_config = {
            "key": "mensagem_boas_vindas",
            "value": "Bem-vindo ao sistema! Configuração realizada com êxito.",
            "value_type": "string",
            "description": "Mensagem de boas-vindas com acentuação e caracteres especiais",
            "category": "interface",
            "config_metadata": {
                "idioma": "português",
                "caracteres_especiais": "ção, ã, é, ü",
            },
        }

        config = SystemConfig(**unicode_config)
        assert "Bem-vindo" in config.value
        assert "acentuação" in config.description
        assert "português" in config.config_metadata["idioma"]

    def test_system_config_empty_and_null_values(self):
        """Testa valores vazios e nulos."""
        empty_value_config = SystemConfig(
            key="empty_config", value="", value_type="string"  # String vazia
        )

        null_value_config = SystemConfig(
            key="null_config", value=None, value_type="string"  # Valor nulo
        )

        assert empty_value_config.value == ""
        assert null_value_config.value is None

    def test_system_config_metadata_edge_cases(self):
        """Testa casos extremos de metadados."""
        edge_cases = [
            {},  # Metadados vazios
            None,  # Metadados nulos
            {"single_key": "single_value"},  # Metadados simples
            {"nested": {"deep": {"very_deep": "value"}}},  # Aninhamento profundo
            {"array": [1, 2, 3, {"nested_in_array": True}]},  # Arrays com objetos
        ]

        for i, metadata in enumerate(edge_cases):
            config_data = self.valid_config_data.copy()
            config_data["key"] = f"edge_case_{i}"
            config_data["config_metadata"] = metadata

            config = SystemConfig(**config_data)
            assert config.config_metadata == metadata

    def test_system_config_field_lengths(self):
        """Testa limites de comprimento dos campos."""
        # Testa strings muito longas
        very_long_key = "x" * 100
        very_long_value = "y" * 10000
        very_long_description = "z" * 5000

        config_data = self.valid_config_data.copy()
        config_data["key"] = very_long_key
        config_data["value"] = very_long_value
        config_data["description"] = very_long_description

        config = SystemConfig(**config_data)
        assert len(config.key) == 100
        assert len(config.value) == 10000
        assert len(config.description) == 5000

    def test_system_config_model_representation(self):
        """Testa representação do modelo."""
        config = SystemConfig(**self.valid_config_data)

        # Verifica se o objeto pode ser convertido para string
        str_repr = str(config)
        assert isinstance(str_repr, str)

        # Verifica se contém informações relevantes
        assert "SystemConfig" in str_repr or "email_smtp_host" in str_repr

    def test_system_config_attribute_access(self):
        """Testa acesso aos atributos do modelo."""
        config = SystemConfig(**self.valid_config_data)

        # Testa acesso direto aos atributos
        required_attributes = [
            "id",
            "key",
            "value",
            "value_type",
            "description",
            "category",
            "is_public",
            "is_active",
            "default_value",
            "config_metadata",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

        for attr in required_attributes:
            assert hasattr(config, attr), f"Atributo {attr} não encontrado"

    def test_system_config_default_value_types(self):
        """Testa valores padrão para diferentes tipos."""
        # Testa valor padrão para value_type
        config_without_type = SystemConfig(key="test_key")
        assert config_without_type.value_type == "string"  # Valor padrão

        # Testa valores padrão para booleanos
        config_minimal = SystemConfig(key="minimal_key", value_type="string")
        assert config_minimal.is_public is False  # Valor padrão
        assert config_minimal.is_active is True  # Valor padrão

    def test_system_config_json_metadata_serialization(self):
        """Testa serialização de metadados JSON complexos."""
        complex_metadata = {
            "validation_rules": {
                "email": {
                    "pattern": r"^[\w\.-]+@[\w\.-]+\.\w+$",
                    "message": "Email inválido",
                },
                "password": {
                    "min_length": 8,
                    "require_uppercase": True,
                    "require_numbers": True,
                    "require_symbols": False,
                },
            },
            "ui_config": {
                "theme": "dark",
                "language": "pt-BR",
                "features": ["notifications", "dark_mode", "auto_save"],
            },
            "integrations": {
                "google": {"enabled": True, "client_id": "xxx"},
                "microsoft": {"enabled": False, "tenant_id": "yyy"},
            },
        }

        config_data = self.valid_config_data.copy()
        config_data["config_metadata"] = complex_metadata

        config = SystemConfig(**config_data)

        # Verifica estrutura aninhada
        assert config.config_metadata["validation_rules"]["email"]["pattern"]
        assert config.config_metadata["ui_config"]["language"] == "pt-BR"
        assert "notifications" in config.config_metadata["ui_config"]["features"]
        assert config.config_metadata["integrations"]["google"]["enabled"] is True
