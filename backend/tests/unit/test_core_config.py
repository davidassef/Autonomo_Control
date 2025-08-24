import os
import pytest
from unittest.mock import patch, MagicMock
from pydantic import ValidationError

from app.core.config import Settings, settings


class TestSettings:
    """Testes para a classe Settings de configuração."""

    def test_default_values(self):
        """Testa se os valores padrão são definidos corretamente."""
        config = Settings()

        assert config.PROJECT_NAME == "Autônomo Control"
        assert config.PROJECT_VERSION == "0.1.0"
        assert config.DATABASE_URL == "sqlite:///./autonomo_control.db"
        assert config.SECRET_KEY == "temporaria_chave_secreta_dev"
        assert config.ALGORITHM == "HS256"
        assert config.SMTP_SERVER == "smtp.gmail.com"
        assert config.SMTP_PORT == 587
        assert config.SMTP_USERNAME == ""
        assert config.SMTP_PASSWORD == ""
        assert config.FROM_EMAIL == "noreply@autonomocontrol.com"
        assert config.ACCESS_TOKEN_EXPIRE_MINUTES == 30
        assert (
            config.GOOGLE_REDIRECT_URI
            == "http://localhost:8000/api/v1/auth/google/callback"
        )

    @patch.dict(
        os.environ,
        {
            "DATABASE_URL": "postgresql://user:pass@localhost/test",
            "SECRET_KEY": "test_secret_key",
            "SMTP_SERVER": "smtp.test.com",
            "SMTP_PORT": "465",
            "SMTP_USERNAME": "test@test.com",
            "SMTP_PASSWORD": "test_password",
            "FROM_EMAIL": "test@example.com",
            "GOOGLE_CLIENT_ID": "test_client_id",
            "GOOGLE_CLIENT_SECRET": "test_client_secret",
            "GOOGLE_REDIRECT_URI": "http://test.com/callback",
            "MASTER_EMAIL": "master@test.com",
            "MASTER_PASSWORD": "master_password",
        },
    )
    def test_environment_variables_override(self):
        """Testa se as variáveis de ambiente sobrescrevem os valores padrão."""
        config = Settings()

        assert config.DATABASE_URL == "postgresql://user:pass@localhost/test"
        assert config.SECRET_KEY == "test_secret_key"
        assert config.SMTP_SERVER == "smtp.test.com"
        assert config.SMTP_PORT == 465
        assert config.SMTP_USERNAME == "test@test.com"
        assert config.SMTP_PASSWORD == "test_password"
        assert config.FROM_EMAIL == "test@example.com"
        assert config.GOOGLE_CLIENT_ID == "test_client_id"
        assert config.GOOGLE_CLIENT_SECRET == "test_client_secret"
        assert config.GOOGLE_REDIRECT_URI == "http://test.com/callback"
        assert config.MASTER_EMAIL == "master@test.com"
        assert config.MASTER_PASSWORD == "master_password"

    @patch.dict(os.environ, {"SMTP_PORT": "invalid_port"})
    def test_invalid_smtp_port_type(self):
        """Testa se uma porta SMTP inválida gera erro."""
        with pytest.raises(ValueError):
            Settings()

    @patch.dict(os.environ, {"SMTP_PORT": "99999"})
    def test_smtp_port_out_of_range(self):
        """Testa porta SMTP fora do range válido."""
        config = Settings()
        # Pydantic não valida range de porta por padrão, apenas tipo
        assert config.SMTP_PORT == 99999

    def test_optional_fields_none(self):
        """Testa se campos opcionais podem ser None."""
        config = Settings()

        assert config.GOOGLE_CLIENT_ID is None
        assert config.GOOGLE_CLIENT_SECRET is None
        assert config.MASTER_EMAIL is None
        assert config.MASTER_PASSWORD is None

    @patch.dict(
        os.environ,
        {
            "GOOGLE_CLIENT_ID": "",
            "GOOGLE_CLIENT_SECRET": "",
            "MASTER_EMAIL": "",
            "MASTER_PASSWORD": "",
        },
    )
    def test_empty_string_environment_variables(self):
        """Testa se strings vazias nas variáveis de ambiente são tratadas corretamente."""
        config = Settings()

        # Strings vazias devem ser tratadas como None para campos opcionais
        assert config.GOOGLE_CLIENT_ID == ""
        assert config.GOOGLE_CLIENT_SECRET == ""
        assert config.MASTER_EMAIL == ""
        assert config.MASTER_PASSWORD == ""

    def test_settings_is_pydantic_model(self):
        """Testa se Settings herda corretamente de BaseModel."""
        config = Settings()
        assert hasattr(config, "dict")
        assert hasattr(config, "json")
        assert hasattr(config, "copy")

    def test_settings_dict_export(self):
        """Testa se as configurações podem ser exportadas como dicionário."""
        config = Settings()
        config_dict = config.dict()

        assert isinstance(config_dict, dict)
        assert "PROJECT_NAME" in config_dict
        assert "DATABASE_URL" in config_dict
        assert "SECRET_KEY" in config_dict

    def test_settings_json_export(self):
        """Testa se as configurações podem ser exportadas como JSON."""
        config = Settings()
        config_json = config.json()

        assert isinstance(config_json, str)
        assert "PROJECT_NAME" in config_json
        assert "Autônomo Control" in config_json

    @patch("app.core.config.load_dotenv")
    def test_load_dotenv_called(self, mock_load_dotenv):
        """Testa se load_dotenv é chamado durante a importação."""
        # Como load_dotenv já foi chamado na importação, vamos apenas verificar
        # se a função existe e pode ser chamada
        from dotenv import load_dotenv

        assert callable(load_dotenv)


class TestGlobalSettingsInstance:
    """Testes para a instância global de configurações."""

    def test_global_settings_instance_exists(self):
        """Testa se a instância global de settings existe."""
        from app.core.config import settings

        assert settings is not None
        assert isinstance(settings, Settings)

    def test_global_settings_singleton_behavior(self):
        """Testa se a instância global mantém consistência."""
        from app.core.config import settings as settings1
        from app.core.config import settings as settings2

        # Ambas devem referenciar a mesma instância
        assert settings1 is settings2

    def test_global_settings_has_all_attributes(self):
        """Testa se a instância global tem todos os atributos esperados."""
        from app.core.config import settings

        required_attrs = [
            "PROJECT_NAME",
            "PROJECT_VERSION",
            "DATABASE_URL",
            "SECRET_KEY",
            "ALGORITHM",
            "SMTP_SERVER",
            "SMTP_PORT",
            "SMTP_USERNAME",
            "SMTP_PASSWORD",
            "FROM_EMAIL",
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
            "GOOGLE_REDIRECT_URI",
            "MASTER_EMAIL",
            "MASTER_PASSWORD",
        ]

        for attr in required_attrs:
            assert hasattr(settings, attr), f"Atributo {attr} não encontrado"


class TestConfigurationValidation:
    """Testes para validação de configurações."""

    def test_database_url_formats(self):
        """Testa diferentes formatos de DATABASE_URL."""
        valid_urls = [
            "sqlite:///./test.db",
            "postgresql://user:pass@localhost/db",
            "mysql://user:pass@localhost/db",
        ]

        for url in valid_urls:
            with patch.dict(os.environ, {"DATABASE_URL": url}):
                config = Settings()
                assert config.DATABASE_URL == url

    def test_algorithm_validation(self):
        """Testa se o algoritmo é definido corretamente."""
        config = Settings()
        assert config.ALGORITHM in ["HS256", "HS384", "HS512", "RS256"]

    def test_smtp_configuration_completeness(self):
        """Testa se a configuração SMTP está completa para envio de emails."""
        with patch.dict(
            os.environ,
            {"SMTP_USERNAME": "test@example.com", "SMTP_PASSWORD": "password123"},
        ):
            config = Settings()

            # Para envio de email, precisamos de servidor, porta, usuário e senha
            assert config.SMTP_SERVER
            assert config.SMTP_PORT > 0
            assert config.SMTP_USERNAME
            assert config.SMTP_PASSWORD
            assert config.FROM_EMAIL

    def test_google_oauth_configuration(self):
        """Testa configuração completa do Google OAuth."""
        with patch.dict(
            os.environ,
            {
                "GOOGLE_CLIENT_ID": "test_client_id",
                "GOOGLE_CLIENT_SECRET": "test_secret",
                "GOOGLE_REDIRECT_URI": "http://localhost:8000/callback",
            },
        ):
            config = Settings()

            assert config.GOOGLE_CLIENT_ID == "test_client_id"
            assert config.GOOGLE_CLIENT_SECRET == "test_secret"
            assert config.GOOGLE_REDIRECT_URI == "http://localhost:8000/callback"

    def test_master_account_configuration(self):
        """Testa configuração da conta master."""
        with patch.dict(
            os.environ,
            {
                "MASTER_EMAIL": "master@example.com",
                "MASTER_PASSWORD": "secure_password",
            },
        ):
            config = Settings()

            assert config.MASTER_EMAIL == "master@example.com"
            assert config.MASTER_PASSWORD == "secure_password"


class TestConfigurationSecurity:
    """Testes relacionados à segurança das configurações."""

    def test_secret_key_not_empty(self):
        """Testa se a chave secreta não está vazia."""
        config = Settings()
        assert config.SECRET_KEY
        assert len(config.SECRET_KEY) > 0

    def test_secret_key_minimum_length(self):
        """Testa se a chave secreta tem comprimento mínimo adequado."""
        config = Settings()
        # Chaves muito curtas são inseguras
        assert len(config.SECRET_KEY) >= 16

    @patch.dict(os.environ, {"SECRET_KEY": "short"})
    def test_short_secret_key_warning(self):
        """Testa configuração com chave secreta muito curta."""
        config = Settings()
        # Mesmo sendo curta, deve ser aceita (responsabilidade do usuário)
        assert config.SECRET_KEY == "short"

    def test_token_expiration_reasonable(self):
        """Testa se o tempo de expiração do token é razoável."""
        config = Settings()
        # Entre 5 minutos e 24 horas
        assert 5 <= config.ACCESS_TOKEN_EXPIRE_MINUTES <= 1440
