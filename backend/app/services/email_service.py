import smtplib
import secrets
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


class EmailService:
    """Serviço para envio de emails do sistema."""

    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL

    def generate_temporary_password(self, length: int = 12) -> str:
        """Gera uma senha temporária aleatória."""
        characters = string.ascii_letters + string.digits + "!@#$%&*"
        return "".join(secrets.choice(characters) for _ in range(length))

    def send_temporary_password_email(
        self, to_email: str, user_name: str, temp_password: str
    ) -> bool:
        """Envia email com senha temporária para o usuário."""
        try:
            # Criar mensagem
            msg = MIMEMultipart()
            msg["From"] = self.from_email
            msg["To"] = to_email
            msg["Subject"] = "Nova Senha Temporária - Autônomo Control"

            # Corpo do email
            body = f"""
            Olá {user_name},
            
            Uma nova senha temporária foi gerada para sua conta no Autônomo Control.
            
            Senha temporária: {temp_password}
            
            Por favor, faça login com esta senha e altere-a imediatamente por uma de sua escolha.
            
            Esta senha é válida por 24 horas.
            
            Se você não solicitou esta alteração, entre em contato conosco imediatamente.
            
            Atenciosamente,
            Equipe Autônomo Control
            """

            msg.attach(MIMEText(body, "plain", "utf-8"))

            # Enviar email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            return True

        except Exception as e:
            print(f"Erro ao enviar email: {e}")
            return False

    def send_password_reset_notification(
        self, to_email: str, user_name: str, admin_name: str
    ) -> bool:
        """Envia notificação de que a senha foi resetada por um administrador."""
        try:
            msg = MIMEMultipart()
            msg["From"] = self.from_email
            msg["To"] = to_email
            msg["Subject"] = "Senha Resetada - Autônomo Control"

            body = f"""
            Olá {user_name},
            
            Sua senha foi resetada pelo administrador {admin_name}.
            
            Uma nova senha temporária foi enviada para este email.
            
            Por favor, faça login com a nova senha e altere-a imediatamente.
            
            Se você não solicitou esta alteração, entre em contato conosco imediatamente.
            
            Atenciosamente,
            Equipe Autônomo Control
            """

            msg.attach(MIMEText(body, "plain", "utf-8"))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            return True

        except Exception as e:
            print(f"Erro ao enviar notificação: {e}")
            return False


# Instância global do serviço de email
email_service = EmailService()
