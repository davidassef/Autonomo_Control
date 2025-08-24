"""
Mock para o serviço de autenticação do Google
"""

from typing import Dict, Optional

# Dados simulados para testes
mock_user_data = {
    "email": "teste@exemplo.com",
    "name": "Usuário Teste",
    "picture": "https://exemplo.com/foto.jpg",
    "google_id": "123456789",
}

mock_invalid_token = "invalid_token"
mock_valid_token = "valid_google_token"
mock_expired_token = "expired_token"


def verify_google_token(token: str) -> Optional[Dict]:
    """
    Mock da função verify_google_token para testes
    """
    if token == mock_valid_token:
        return mock_user_data
    elif token == mock_expired_token:
        return None
    elif token == mock_invalid_token:
        return None
    else:
        return None


async def get_authorization_url() -> str:
    """
    Mock da função get_authorization_url
    """
    return "https://accounts.google.com/o/oauth2/auth?mock=true"


async def get_token(code: str) -> Optional[Dict]:
    """
    Mock da função get_token
    """
    if code == "valid_code":
        return {
            "access_token": mock_valid_token,
            "refresh_token": "refresh_token",
            "id_token": "id_token",
            "expires_in": 3600,
        }
    return None


async def get_user_info(access_token: str) -> Optional[Dict]:
    """
    Mock da função get_user_info
    """
    if access_token == mock_valid_token:
        return mock_user_data
    return None
