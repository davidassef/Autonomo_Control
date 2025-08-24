import pytest
from unittest.mock import patch, MagicMock, call
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import string
import secrets

from app.services.email_service import EmailService, email_service


class TestEmailServiceInit:
    """Testes para inicialização do EmailService."""

    @patch("app.services.email_service.settings")
    def test_email_service_initialization(self, mock_settings):
        """Testa se o EmailService é inicializado corretamente com as configurações."""
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"
        mock_settings.FROM_EMAIL = "noreply@test.com"

        service = EmailService()

        assert service.smtp_server == "smtp.test.com"
        assert service.smtp_port == 587
        assert service.smtp_username == "test@example.com"
        assert service.smtp_password == "test_password"
        assert service.from_email == "noreply@test.com"

    def test_global_email_service_instance(self):
        """Testa se a instância global do email_service existe."""
        assert email_service is not None
        assert isinstance(email_service, EmailService)


class TestGenerateTemporaryPassword:
    """Testes para geração de senha temporária."""

    def test_generate_temporary_password_default_length(self):
        """Testa geração de senha temporária com comprimento padrão."""
        service = EmailService()
        password = service.generate_temporary_password()

        assert len(password) == 12
        assert isinstance(password, str)

    def test_generate_temporary_password_custom_length(self):
        """Testa geração de senha temporária com comprimento customizado."""
        service = EmailService()

        for length in [8, 16, 20, 32]:
            password = service.generate_temporary_password(length)
            assert len(password) == length

    def test_generate_temporary_password_character_set(self):
        """Testa se a senha gerada contém apenas caracteres válidos."""
        service = EmailService()
        valid_chars = string.ascii_letters + string.digits + "!@#$%&*"

        password = service.generate_temporary_password(100)  # Senha longa para testar

        for char in password:
            assert char in valid_chars

    def test_generate_temporary_password_uniqueness(self):
        """Testa se senhas geradas são únicas."""
        service = EmailService()
        passwords = [service.generate_temporary_password() for _ in range(100)]

        # Todas as senhas devem ser únicas
        assert len(set(passwords)) == 100

    def test_generate_temporary_password_minimum_length(self):
        """Testa geração de senha com comprimento mínimo."""
        service = EmailService()
        password = service.generate_temporary_password(1)

        assert len(password) == 1
        assert password in string.ascii_letters + string.digits + "!@#$%&*"

    def test_generate_temporary_password_zero_length(self):
        """Testa geração de senha com comprimento zero."""
        service = EmailService()
        password = service.generate_temporary_password(0)

        assert len(password) == 0
        assert password == ""

    @patch("app.services.email_service.secrets.choice")
    def test_generate_temporary_password_uses_secrets(self, mock_choice):
        """Testa se a geração usa o módulo secrets para segurança."""
        mock_choice.side_effect = ["a", "b", "c", "d"]

        service = EmailService()
        password = service.generate_temporary_password(4)

        assert password == "abcd"
        assert mock_choice.call_count == 4


class TestSendTemporaryPasswordEmail:
    """Testes para envio de email com senha temporária."""

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_send_temporary_password_email_success(self, mock_settings, mock_smtp):
        """Testa envio bem-sucedido de email com senha temporária."""
        # Configurar mocks
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"
        mock_settings.FROM_EMAIL = "noreply@test.com"

        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        service = EmailService()
        result = service.send_temporary_password_email(
            "user@example.com", "João Silva", "temp123"
        )

        assert result is True
        mock_smtp.assert_called_once_with("smtp.test.com", 587)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("test@example.com", "test_password")
        mock_server.send_message.assert_called_once()

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_send_temporary_password_email_message_content(
        self, mock_settings, mock_smtp
    ):
        """Testa se o conteúdo da mensagem está correto."""
        mock_settings.FROM_EMAIL = "noreply@test.com"
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"

        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        service = EmailService()
        service.send_temporary_password_email(
            "user@example.com", "Maria Santos", "temp456"
        )

        # Verificar se send_message foi chamado
        mock_server.send_message.assert_called_once()

        # Obter a mensagem enviada
        sent_message = mock_server.send_message.call_args[0][0]

        assert sent_message["From"] == "noreply@test.com"
        assert sent_message["To"] == "user@example.com"
        assert sent_message["Subject"] == "Nova Senha Temporária - Autônomo Control"

        # Verificar conteúdo do corpo
        body = sent_message.get_payload()[0].get_payload()
        assert "Maria Santos" in body
        assert "temp456" in body
        assert "Autônomo Control" in body

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_send_temporary_password_email_smtp_error(self, mock_settings, mock_smtp):
        """Testa tratamento de erro SMTP."""
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"
        mock_settings.FROM_EMAIL = "noreply@test.com"

        mock_smtp.side_effect = smtplib.SMTPException("SMTP Error")

        service = EmailService()
        result = service.send_temporary_password_email(
            "user@example.com", "João Silva", "temp123"
        )

        assert result is False

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_send_temporary_password_email_connection_error(
        self, mock_settings, mock_smtp
    ):
        """Testa tratamento de erro de conexão."""
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"
        mock_settings.FROM_EMAIL = "noreply@test.com"

        mock_server = MagicMock()
        mock_server.starttls.side_effect = Exception("Connection failed")
        mock_smtp.return_value.__enter__.return_value = mock_server

        service = EmailService()
        result = service.send_temporary_password_email(
            "user@example.com", "João Silva", "temp123"
        )

        assert result is False

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_send_temporary_password_email_auth_error(self, mock_settings, mock_smtp):
        """Testa tratamento de erro de autenticação."""
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "wrong_password"
        mock_settings.FROM_EMAIL = "noreply@test.com"

        mock_server = MagicMock()
        mock_server.login.side_effect = smtplib.SMTPAuthenticationError(
            535, "Authentication failed"
        )
        mock_smtp.return_value.__enter__.return_value = mock_server

        service = EmailService()
        result = service.send_temporary_password_email(
            "user@example.com", "João Silva", "temp123"
        )

        assert result is False

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_send_temporary_password_email_special_characters(
        self, mock_settings, mock_smtp
    ):
        """Testa envio de email com caracteres especiais."""
        mock_settings.FROM_EMAIL = "noreply@test.com"
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"

        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        service = EmailService()
        result = service.send_temporary_password_email(
            "usuário@exemplo.com", "José da Silva", "temp@123#"
        )

        assert result is True

        # Verificar se a mensagem foi enviada
        sent_message = mock_server.send_message.call_args[0][0]
        body = sent_message.get_payload()[0].get_payload()
        assert "José da Silva" in body
        assert "temp@123#" in body


class TestSendPasswordResetNotification:
    """Testes para envio de notificação de reset de senha."""

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_send_password_reset_notification_success(self, mock_settings, mock_smtp):
        """Testa envio bem-sucedido de notificação de reset."""
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"
        mock_settings.FROM_EMAIL = "noreply@test.com"

        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        service = EmailService()
        result = service.send_password_reset_notification(
            "user@example.com", "João Silva", "Admin Master"
        )

        assert result is True
        mock_smtp.assert_called_once_with("smtp.test.com", 587)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("test@example.com", "test_password")
        mock_server.send_message.assert_called_once()

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_send_password_reset_notification_message_content(
        self, mock_settings, mock_smtp
    ):
        """Testa se o conteúdo da notificação está correto."""
        mock_settings.FROM_EMAIL = "noreply@test.com"
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"

        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        service = EmailService()
        service.send_password_reset_notification(
            "user@example.com", "Maria Santos", "Admin João"
        )

        # Obter a mensagem enviada
        sent_message = mock_server.send_message.call_args[0][0]

        assert sent_message["From"] == "noreply@test.com"
        assert sent_message["To"] == "user@example.com"
        assert sent_message["Subject"] == "Senha Resetada - Autônomo Control"

        # Verificar conteúdo do corpo
        body = sent_message.get_payload()[0].get_payload()
        assert "Maria Santos" in body
        assert "Admin João" in body
        assert "resetada pelo administrador" in body

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_send_password_reset_notification_error(self, mock_settings, mock_smtp):
        """Testa tratamento de erro na notificação."""
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"
        mock_settings.FROM_EMAIL = "noreply@test.com"

        mock_smtp.side_effect = Exception("Network error")

        service = EmailService()
        result = service.send_password_reset_notification(
            "user@example.com", "João Silva", "Admin Master"
        )

        assert result is False


class TestEmailServiceIntegration:
    """Testes de integração para EmailService."""

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_complete_password_reset_workflow(self, mock_settings, mock_smtp):
        """Testa fluxo completo de reset de senha."""
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"
        mock_settings.FROM_EMAIL = "noreply@test.com"

        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        service = EmailService()

        # 1. Gerar senha temporária
        temp_password = service.generate_temporary_password()
        assert len(temp_password) == 12

        # 2. Enviar email com senha temporária
        result1 = service.send_temporary_password_email(
            "user@example.com", "João Silva", temp_password
        )
        assert result1 is True

        # 3. Enviar notificação de reset
        result2 = service.send_password_reset_notification(
            "user@example.com", "João Silva", "Admin Master"
        )
        assert result2 is True

        # Verificar que ambos os emails foram enviados
        assert mock_server.send_message.call_count == 2

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_email_service_with_different_configurations(
        self, mock_settings, mock_smtp
    ):
        """Testa EmailService com diferentes configurações SMTP."""
        configurations = [
            {
                "server": "smtp.gmail.com",
                "port": 587,
                "username": "test@gmail.com",
                "password": "gmail_password",
                "from_email": "noreply@gmail.com",
            },
            {
                "server": "smtp.outlook.com",
                "port": 587,
                "username": "test@outlook.com",
                "password": "outlook_password",
                "from_email": "noreply@outlook.com",
            },
        ]

        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        for config in configurations:
            mock_settings.SMTP_SERVER = config["server"]
            mock_settings.SMTP_PORT = config["port"]
            mock_settings.SMTP_USERNAME = config["username"]
            mock_settings.SMTP_PASSWORD = config["password"]
            mock_settings.FROM_EMAIL = config["from_email"]

            service = EmailService()
            result = service.send_temporary_password_email(
                "user@example.com", "Test User", "temp123"
            )

            assert result is True
            assert service.smtp_server == config["server"]
            assert service.smtp_port == config["port"]
            assert service.from_email == config["from_email"]


class TestEmailServiceEdgeCases:
    """Testes para casos extremos do EmailService."""

    def test_generate_password_large_length(self):
        """Testa geração de senha com comprimento muito grande."""
        service = EmailService()
        password = service.generate_temporary_password(1000)

        assert len(password) == 1000
        assert isinstance(password, str)

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_send_email_with_empty_values(self, mock_settings, mock_smtp):
        """Testa envio de email com valores vazios."""
        mock_settings.FROM_EMAIL = "noreply@test.com"
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"

        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        service = EmailService()
        result = service.send_temporary_password_email("", "", "")

        # Deve tentar enviar mesmo com valores vazios
        assert result is True

    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_send_email_with_unicode_content(self, mock_settings, mock_smtp):
        """Testa envio de email com conteúdo Unicode."""
        mock_settings.FROM_EMAIL = "noreply@test.com"
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"

        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        service = EmailService()
        result = service.send_temporary_password_email(
            "usuário@domínio.com", "José da Conceição", "sênha123"
        )

        assert result is True

        # Verificar encoding UTF-8
        sent_message = mock_server.send_message.call_args[0][0]
        body_part = sent_message.get_payload()[0]
        assert body_part.get_charset() == "utf-8"

    @patch("builtins.print")
    @patch("app.services.email_service.smtplib.SMTP")
    @patch("app.services.email_service.settings")
    def test_error_logging(self, mock_settings, mock_smtp, mock_print):
        """Testa se erros são logados corretamente."""
        mock_settings.SMTP_SERVER = "smtp.test.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "test@example.com"
        mock_settings.SMTP_PASSWORD = "test_password"
        mock_settings.FROM_EMAIL = "noreply@test.com"

        error_message = "Test SMTP Error"
        mock_smtp.side_effect = Exception(error_message)

        service = EmailService()
        result = service.send_temporary_password_email(
            "user@example.com", "Test User", "temp123"
        )

        assert result is False
        mock_print.assert_called_with(f"Erro ao enviar email: {error_message}")
