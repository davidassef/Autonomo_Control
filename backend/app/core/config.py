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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Configuração Google OAuth2 (será implementada posteriormente)
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: Optional[str] = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback")

# Instância global de configurações
settings = Settings()
