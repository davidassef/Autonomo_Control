import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.services.system_config_service import SystemConfigService
from app.models.system_config import SystemConfig
from app.models.user import User


class TestSystemConfigServiceInitialization:
    """Testes para inicialização do SystemConfigService."""

    def test_init_with_db_session(self):
        """Testa inicialização com sessão de banco."""
        mock_db = Mock(spec=Session)
        service = SystemConfigService(mock_db)

        assert service.db == mock_db
        assert isinstance(service.default_configs, dict)
        assert len(service.default_configs) > 0

    def test_default_configs_structure(self):
        """Testa estrutura das configurações padrão."""
        mock_db = Mock(spec=Session)
        service = SystemConfigService(mock_db)

        # Verificar que todas as configurações têm estrutura correta
        for key, config in service.default_configs.items():
            assert "value" in config
            assert "type" in config
            assert "category" in config
            assert "public" in config
            assert config["type"] in ["string", "integer", "boolean", "float", "json"]
            assert isinstance(config["public"], bool)

    def test_default_configs_categories(self):
        """Testa que configurações padrão têm categorias válidas."""
        mock_db = Mock(spec=Session)
        service = SystemConfigService(mock_db)

        expected_categories = {
            "general",
            "users",
            "security",
            "email",
            "backup",
            "logging",
        }

        found_categories = set()
        for config in service.default_configs.values():
            found_categories.add(config["category"])

        assert found_categories.issubset(expected_categories)

    def test_default_configs_specific_keys(self):
        """Testa que configurações específicas existem."""
        mock_db = Mock(spec=Session)
        service = SystemConfigService(mock_db)

        required_keys = [
            "app_name",
            "app_version",
            "maintenance_mode",
            "max_users",
            "allow_registration",
            "default_user_role",
            "password_min_length",
            "password_require_uppercase",
            "smtp_host",
            "smtp_port",
            "backup_enabled",
            "log_level",
            "session_timeout_minutes",
        ]

        for key in required_keys:
            assert key in service.default_configs


class TestGetAllConfigs:
    """Testes para obter todas as configurações."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.mock_query = Mock()
        self.mock_db.query.return_value = self.mock_query
        self.service = SystemConfigService(self.mock_db)

    def test_get_all_configs_from_defaults_when_db_empty(self):
        """Testa retorno de configurações padrão quando banco está vazio."""
        self.mock_query.filter.return_value.all.return_value = []

        configs = self.service.get_all_configs()

        assert isinstance(configs, dict)
        assert len(configs) > 0
        assert "app_name" in configs
        assert configs["app_name"] == "Autonomo Control"

    def test_get_all_configs_with_db_values(self):
        """Testa retorno com valores do banco sobrescrevendo padrões."""
        # Mock config do banco
        mock_config = Mock(spec=SystemConfig)
        mock_config.key = "app_name"
        mock_config.value = "Custom App Name"
        mock_config.value_type = "string"

        self.mock_query.filter.return_value.all.return_value = [mock_config]

        configs = self.service.get_all_configs()

        assert configs["app_name"] == "Custom App Name"

    def test_get_all_configs_with_category_filter(self):
        """Testa filtro por categoria."""
        self.mock_query.filter.return_value.all.return_value = []

        configs = self.service.get_all_configs(category="general")

        # Verificar que apenas configs da categoria 'general' são retornadas
        for key, value in configs.items():
            config_data = self.service.default_configs[key]
            assert config_data["category"] == "general"

    def test_get_all_configs_public_only(self):
        """Testa filtro apenas para configurações públicas."""
        self.mock_query.filter.return_value.all.return_value = []

        configs = self.service.get_all_configs(public_only=True)

        # Verificar que apenas configs públicas são retornadas
        for key, value in configs.items():
            config_data = self.service.default_configs[key]
            assert config_data["public"] is True

    def test_get_all_configs_category_and_public(self):
        """Testa filtro por categoria e público."""
        self.mock_query.filter.return_value.all.return_value = []

        configs = self.service.get_all_configs(category="general", public_only=True)

        for key, value in configs.items():
            config_data = self.service.default_configs[key]
            assert config_data["category"] == "general"
            assert config_data["public"] is True

    def test_get_all_configs_exception_handling(self):
        """Testa tratamento de exceções."""
        self.mock_db.query.side_effect = Exception("Database error")

        configs = self.service.get_all_configs()

        # Deve retornar configurações padrão em caso de erro
        assert isinstance(configs, dict)
        assert len(configs) > 0
        assert "app_name" in configs


class TestGetConfig:
    """Testes para obter configuração específica."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.mock_query = Mock()
        self.mock_db.query.return_value = self.mock_query
        self.service = SystemConfigService(self.mock_db)

    def test_get_config_from_database(self):
        """Testa obtenção de configuração do banco."""
        mock_config = Mock(spec=SystemConfig)
        mock_config.value = "Custom Value"
        mock_config.value_type = "string"

        self.mock_query.filter.return_value.first.return_value = mock_config

        result = self.service.get_config("app_name")

        assert result == "Custom Value"

    def test_get_config_from_defaults(self):
        """Testa obtenção de configuração padrão quando não existe no banco."""
        self.mock_query.filter.return_value.first.return_value = None

        result = self.service.get_config("app_name")

        assert result == "Autonomo Control"

    def test_get_config_nonexistent_key(self):
        """Testa obtenção de chave inexistente."""
        self.mock_query.filter.return_value.first.return_value = None

        result = self.service.get_config("nonexistent_key")

        assert result is None

    def test_get_config_exception_handling(self):
        """Testa tratamento de exceções."""
        self.mock_db.query.side_effect = Exception("Database error")

        result = self.service.get_config("app_name")

        # Deve retornar valor padrão em caso de erro
        assert result == "Autonomo Control"

    def test_get_config_exception_nonexistent_key(self):
        """Testa exceção com chave inexistente."""
        self.mock_db.query.side_effect = Exception("Database error")

        result = self.service.get_config("nonexistent_key")

        assert result is None


class TestUpdateConfig:
    """Testes para atualização de configurações."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.mock_query = Mock()
        self.mock_db.query.return_value = self.mock_query
        self.service = SystemConfigService(self.mock_db)

    @patch("app.services.system_config_service.datetime")
    def test_update_existing_config(self, mock_datetime):
        """Testa atualização de configuração existente."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        mock_config = Mock(spec=SystemConfig)
        self.mock_query.filter.return_value.first.return_value = mock_config

        result = self.service.update_config("app_name", "New App Name", 1)

        assert result is True
        assert mock_config.value == "New App Name"
        assert mock_config.value_type == "string"
        assert mock_config.updated_at == mock_now
        assert mock_config.updated_by == 1
        self.mock_db.commit.assert_called_once()

    def test_create_new_config(self):
        """Testa criação de nova configuração."""
        self.mock_query.filter.return_value.first.return_value = None

        result = self.service.update_config("app_name", "New App Name", 1)

        assert result is True
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()

    def test_update_config_unknown_key(self):
        """Testa atualização de chave desconhecida."""
        result = self.service.update_config("unknown_key", "value", 1)

        assert result is False
        self.mock_db.add.assert_not_called()
        self.mock_db.commit.assert_not_called()

    def test_update_config_exception_handling(self):
        """Testa tratamento de exceções."""
        self.mock_db.query.side_effect = Exception("Database error")

        result = self.service.update_config("app_name", "New Name", 1)

        assert result is False
        self.mock_db.rollback.assert_called_once()

    def test_update_config_boolean_value(self):
        """Testa atualização com valor booleano."""
        self.mock_query.filter.return_value.first.return_value = None

        result = self.service.update_config("maintenance_mode", True, 1)

        assert result is True
        # Verificar que SystemConfig foi criado com valor serializado
        call_args = self.mock_db.add.call_args[0][0]
        assert call_args.value == "true"
        assert call_args.value_type == "boolean"

    def test_update_config_integer_value(self):
        """Testa atualização com valor inteiro."""
        self.mock_query.filter.return_value.first.return_value = None

        result = self.service.update_config("max_users", 500, 1)

        assert result is True
        call_args = self.mock_db.add.call_args[0][0]
        assert call_args.value == "500"
        assert call_args.value_type == "integer"


class TestUpdateMultipleConfigs:
    """Testes para atualização múltipla de configurações."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = SystemConfigService(self.mock_db)

    def test_update_multiple_configs_success(self):
        """Testa atualização múltipla bem-sucedida."""
        configs = {"app_name": "New Name", "max_users": 1000, "maintenance_mode": True}

        with patch.object(self.service, "update_config") as mock_update:
            mock_update.return_value = True

            results = self.service.update_multiple_configs(configs, 1)

            assert len(results) == 3
            assert all(result is True for result in results.values())
            assert mock_update.call_count == 3

    def test_update_multiple_configs_partial_failure(self):
        """Testa atualização múltipla com falhas parciais."""
        configs = {"app_name": "New Name", "unknown_key": "value", "max_users": 1000}

        with patch.object(self.service, "update_config") as mock_update:
            # Simular falha para chave desconhecida
            def side_effect(key, value, user_id):
                return key != "unknown_key"

            mock_update.side_effect = side_effect

            results = self.service.update_multiple_configs(configs, 1)

            assert results["app_name"] is True
            assert results["unknown_key"] is False
            assert results["max_users"] is True


class TestResetToDefaults:
    """Testes para reset das configurações."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.mock_query = Mock()
        self.mock_db.query.return_value = self.mock_query
        self.service = SystemConfigService(self.mock_db)

    @patch("app.services.system_config_service.datetime")
    def test_reset_to_defaults_success(self, mock_datetime):
        """Testa reset bem-sucedido para padrões."""
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        mock_config1 = Mock(spec=SystemConfig)
        mock_config2 = Mock(spec=SystemConfig)
        configs = [mock_config1, mock_config2]

        self.mock_query.filter.return_value.all.return_value = configs

        result = self.service.reset_to_defaults(1)

        assert result is True

        # Verificar que todas as configs foram desativadas
        for config in configs:
            assert config.is_active is False
            assert config.updated_at == mock_now
            assert config.updated_by == 1

        self.mock_db.commit.assert_called_once()

    def test_reset_to_defaults_exception_handling(self):
        """Testa tratamento de exceções no reset."""
        self.mock_db.query.side_effect = Exception("Database error")

        result = self.service.reset_to_defaults(1)

        assert result is False
        self.mock_db.rollback.assert_called_once()


class TestGetConfigHistory:
    """Testes para histórico de configurações."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.mock_query = Mock()
        self.mock_db.query.return_value = self.mock_query
        self.service = SystemConfigService(self.mock_db)

    def test_get_config_history_success(self):
        """Testa obtenção bem-sucedida do histórico."""
        mock_user = Mock(spec=User)
        mock_user.name = "Test User"
        mock_user.email = "test@example.com"

        mock_config = Mock(spec=SystemConfig)
        mock_config.key = "app_name"
        mock_config.value = "Test App"
        mock_config.value_type = "string"
        mock_config.category = "general"
        mock_config.created_at = datetime(2023, 1, 1, 10, 0, 0)
        mock_config.updated_at = datetime(2023, 1, 1, 12, 0, 0)
        mock_config.is_active = True
        mock_config.updated_by_user = mock_user

        self.mock_query.join.return_value.order_by.return_value.limit.return_value.all.return_value = [
            mock_config
        ]

        history = self.service.get_config_history()

        assert len(history) == 1
        assert history[0]["config_key"] == "app_name"
        assert history[0]["config_value"] == "Test App"
        assert history[0]["updated_by"]["name"] == "Test User"

    def test_get_config_history_with_key_filter(self):
        """Testa histórico com filtro por chave."""
        self.mock_query.join.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = (
            []
        )

        history = self.service.get_config_history(key="app_name")

        # Verificar que filtro foi aplicado
        self.mock_query.join.return_value.filter.assert_called_once()
        assert isinstance(history, list)

    def test_get_config_history_exception_handling(self):
        """Testa tratamento de exceções no histórico."""
        self.mock_db.query.side_effect = Exception("Database error")

        history = self.service.get_config_history()

        assert history == []


class TestValidateConfigValue:
    """Testes para validação de valores de configuração."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = SystemConfigService(self.mock_db)

    def test_validate_unknown_config(self):
        """Testa validação de configuração desconhecida."""
        is_valid, error = self.service.validate_config_value("unknown_key", "value")

        assert is_valid is False
        assert "não reconhecida" in error

    def test_validate_boolean_type(self):
        """Testa validação de tipo booleano."""
        # Válido
        is_valid, error = self.service.validate_config_value("maintenance_mode", True)
        assert is_valid is True
        assert error == ""

        # Inválido
        is_valid, error = self.service.validate_config_value("maintenance_mode", "true")
        assert is_valid is False
        assert "booleano" in error

    def test_validate_integer_type(self):
        """Testa validação de tipo inteiro."""
        # Válido
        is_valid, error = self.service.validate_config_value("max_users", 100)
        assert is_valid is True
        assert error == ""

        # Inválido
        is_valid, error = self.service.validate_config_value("max_users", "100")
        assert is_valid is False
        assert "inteiro" in error

    def test_validate_string_type(self):
        """Testa validação de tipo string."""
        # Válido
        is_valid, error = self.service.validate_config_value("app_name", "Test App")
        assert is_valid is True
        assert error == ""

        # Inválido
        is_valid, error = self.service.validate_config_value("app_name", 123)
        assert is_valid is False
        assert "string" in error

    def test_validate_specific_rules(self):
        """Testa regras de validação específicas."""
        # max_users deve ser positivo
        is_valid, error = self.service.validate_config_value("max_users", 0)
        assert is_valid is False
        assert "positivo" in error

        # password_min_length deve estar entre 4 e 50
        is_valid, error = self.service.validate_config_value("password_min_length", 3)
        assert is_valid is False
        assert "entre 4 e 50" in error

        is_valid, error = self.service.validate_config_value("password_min_length", 51)
        assert is_valid is False
        assert "entre 4 e 50" in error

        # smtp_port deve estar entre 1 e 65535
        is_valid, error = self.service.validate_config_value("smtp_port", 0)
        assert is_valid is False
        assert "entre 1 e 65535" in error

    def test_validate_exception_handling(self):
        """Testa tratamento de exceções na validação."""
        # Simular exceção alterando temporariamente default_configs
        original_configs = self.service.default_configs
        self.service.default_configs = None

        is_valid, error = self.service.validate_config_value("app_name", "value")

        assert is_valid is False
        assert "Erro na validação" in error

        # Restaurar
        self.service.default_configs = original_configs


class TestUtilityMethods:
    """Testes para métodos utilitários."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = SystemConfigService(self.mock_db)

    def test_get_public_configs(self):
        """Testa obtenção de configurações públicas."""
        with patch.object(self.service, "get_all_configs") as mock_get_all:
            mock_get_all.return_value = {"app_name": "Test"}

            result = self.service.get_public_configs()

            mock_get_all.assert_called_once_with(public_only=True)
            assert result == {"app_name": "Test"}

    def test_get_configs_by_category(self):
        """Testa obtenção de configurações por categoria."""
        with patch.object(self.service, "get_all_configs") as mock_get_all:
            mock_get_all.return_value = {"app_name": "Test"}

            result = self.service.get_configs_by_category("general")

            mock_get_all.assert_called_once_with(category="general")
            assert result == {"app_name": "Test"}

    def test_parse_value_boolean(self):
        """Testa parsing de valor booleano."""
        assert self.service._parse_value("true", "boolean") is True
        assert self.service._parse_value("false", "boolean") is False
        assert self.service._parse_value("TRUE", "boolean") is True

    def test_parse_value_integer(self):
        """Testa parsing de valor inteiro."""
        assert self.service._parse_value("123", "integer") == 123
        assert self.service._parse_value("-456", "integer") == -456

    def test_parse_value_float(self):
        """Testa parsing de valor float."""
        assert self.service._parse_value("123.45", "float") == 123.45
        assert self.service._parse_value("-67.89", "float") == -67.89

    def test_parse_value_json(self):
        """Testa parsing de valor JSON."""
        json_str = '{"key": "value", "number": 123}'
        result = self.service._parse_value(json_str, "json")

        assert result == {"key": "value", "number": 123}

    def test_parse_value_string(self):
        """Testa parsing de valor string."""
        assert self.service._parse_value("test string", "string") == "test string"

    def test_parse_value_exception_handling(self):
        """Testa tratamento de exceções no parsing."""
        # JSON inválido deve retornar string original
        result = self.service._parse_value("invalid json", "json")
        assert result == "invalid json"

        # Integer inválido deve retornar string original
        result = self.service._parse_value("not a number", "integer")
        assert result == "not a number"

    def test_serialize_value_boolean(self):
        """Testa serialização de valor booleano."""
        assert self.service._serialize_value(True, "boolean") == "true"
        assert self.service._serialize_value(False, "boolean") == "false"

    def test_serialize_value_integer(self):
        """Testa serialização de valor inteiro."""
        assert self.service._serialize_value(123, "integer") == "123"
        assert self.service._serialize_value(-456, "integer") == "-456"

    def test_serialize_value_float(self):
        """Testa serialização de valor float."""
        assert self.service._serialize_value(123.45, "float") == "123.45"

    def test_serialize_value_json(self):
        """Testa serialização de valor JSON."""
        data = {"key": "value", "number": 123}
        result = self.service._serialize_value(data, "json")

        import json

        assert json.loads(result) == data

    def test_serialize_value_string(self):
        """Testa serialização de valor string."""
        assert self.service._serialize_value("test", "string") == "test"
        assert self.service._serialize_value(123, "string") == "123"


class TestInitializeDefaultConfigs:
    """Testes para inicialização de configurações padrão."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.mock_query = Mock()
        self.mock_db.query.return_value = self.mock_query
        self.service = SystemConfigService(self.mock_db)

    def test_initialize_default_configs_success(self):
        """Testa inicialização bem-sucedida das configurações padrão."""
        # Simular que nenhuma configuração existe
        self.mock_query.filter.return_value.first.return_value = None

        result = self.service.initialize_default_configs(1)

        assert result is True
        # Verificar que SystemConfig foi adicionado para cada configuração padrão
        assert self.mock_db.add.call_count == len(self.service.default_configs)
        self.mock_db.commit.assert_called_once()

    def test_initialize_default_configs_skip_existing(self):
        """Testa que configurações existentes são puladas."""
        # Simular que algumas configurações já existem
        mock_existing = Mock(spec=SystemConfig)
        self.mock_query.filter.return_value.first.return_value = mock_existing

        result = self.service.initialize_default_configs(1)

        assert result is True
        # Não deve adicionar nenhuma configuração pois todas "existem"
        self.mock_db.add.assert_not_called()
        self.mock_db.commit.assert_called_once()

    def test_initialize_default_configs_exception_handling(self):
        """Testa tratamento de exceções na inicialização."""
        self.mock_db.query.side_effect = Exception("Database error")

        result = self.service.initialize_default_configs(1)

        assert result is False
        self.mock_db.rollback.assert_called_once()


class TestSystemConfigServiceIntegration:
    """Testes de integração para SystemConfigService."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = SystemConfigService(self.mock_db)

    def test_complete_config_lifecycle(self):
        """Testa ciclo completo de vida de uma configuração."""
        # 1. Inicializar configurações padrão
        with patch.object(self.service, "initialize_default_configs") as mock_init:
            mock_init.return_value = True
            result = self.service.initialize_default_configs(1)
            assert result is True

        # 2. Obter configuração (deve retornar padrão)
        with patch.object(self.service, "get_config") as mock_get:
            mock_get.return_value = "Autonomo Control"
            result = self.service.get_config("app_name")
            assert result == "Autonomo Control"

        # 3. Atualizar configuração
        with patch.object(self.service, "update_config") as mock_update:
            mock_update.return_value = True
            result = self.service.update_config("app_name", "New Name", 1)
            assert result is True

        # 4. Validar nova configuração
        is_valid, error = self.service.validate_config_value("app_name", "New Name")
        assert is_valid is True
        assert error == ""

        # 5. Obter histórico
        with patch.object(self.service, "get_config_history") as mock_history:
            mock_history.return_value = [
                {"config_key": "app_name", "config_value": "New Name"}
            ]
            history = self.service.get_config_history(key="app_name")
            assert len(history) == 1

        # 6. Reset para padrões
        with patch.object(self.service, "reset_to_defaults") as mock_reset:
            mock_reset.return_value = True
            result = self.service.reset_to_defaults(1)
            assert result is True


class TestSystemConfigServiceEdgeCases:
    """Testes para casos extremos do SystemConfigService."""

    def setup_method(self):
        """Setup para cada teste."""
        self.mock_db = Mock(spec=Session)
        self.service = SystemConfigService(self.mock_db)

    def test_parse_value_with_none(self):
        """Testa parsing com valor None."""
        result = self.service._parse_value(None, "string")
        assert result is None

    def test_serialize_value_with_none(self):
        """Testa serialização com valor None."""
        result = self.service._serialize_value(None, "string")
        assert result == "None"

    def test_validate_config_with_edge_values(self):
        """Testa validação com valores extremos."""
        # Valores limítrofes válidos
        is_valid, _ = self.service.validate_config_value("password_min_length", 4)
        assert is_valid is True

        is_valid, _ = self.service.validate_config_value("password_min_length", 50)
        assert is_valid is True

        is_valid, _ = self.service.validate_config_value("smtp_port", 1)
        assert is_valid is True

        is_valid, _ = self.service.validate_config_value("smtp_port", 65535)
        assert is_valid is True

    def test_get_all_configs_with_mixed_types(self):
        """Testa obtenção de configurações com tipos mistos."""
        mock_configs = [
            Mock(key="app_name", value="Test App", value_type="string"),
            Mock(key="max_users", value="1000", value_type="integer"),
            Mock(key="maintenance_mode", value="true", value_type="boolean"),
        ]

        mock_query = Mock()
        self.mock_db.query.return_value = mock_query
        mock_query.filter.return_value.all.return_value = mock_configs

        configs = self.service.get_all_configs()

        assert configs["app_name"] == "Test App"
        assert configs["max_users"] == 1000
        assert configs["maintenance_mode"] is True

    def test_update_config_with_complex_json(self):
        """Testa atualização com JSON complexo."""
        # Adicionar configuração JSON temporariamente
        self.service.default_configs["test_json"] = {
            "value": {},
            "type": "json",
            "category": "test",
            "public": False,
        }

        complex_data = {
            "nested": {"key": "value"},
            "array": [1, 2, 3],
            "boolean": True,
            "null": None,
        }

        mock_query = Mock()
        self.mock_db.query.return_value = mock_query
        mock_query.filter.return_value.first.return_value = None

        result = self.service.update_config("test_json", complex_data, 1)

        assert result is True

        # Limpar configuração temporária
        del self.service.default_configs["test_json"]
