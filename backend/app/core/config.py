import os
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env se existir
load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "Autônomo Control"
    PROJECT_VERSION: str = "0.1.0"

    # Configuração do banco de dados - SQLite para desenvolvimento
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./autonomo_control.db")

    # Segurança e autenticação
    SECRET_KEY: str = os.getenv("SECRET_KEY", "temporaria_chave_secreta_dev")
    ALGORITHM: str = "HS256"
    
    # Configurações de email SMTP
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@autonomocontrol.com")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Configuração Google OAuth2 (será implementada posteriormente)
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: Optional[str] = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback")

    # Admin / Master control
    MASTER_EMAIL: Optional[str] = os.getenv("MASTER_EMAIL")
    MASTER_PASSWORD: Optional[str] = os.getenv("MASTER_PASSWORD")

# Instância global de configurações
settings = Settings()
