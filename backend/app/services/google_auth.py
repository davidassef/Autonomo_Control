"""
Este módulo implementa a integração com a autenticação Google OAuth2.
"""
from typing import Dict, Optional
import httpx
from google.oauth2 import id_token
from google.auth.transport import requests

from app.core.config import settings


class GoogleAuthService:
    """
    Serviço para autenticação via Google OAuth2
    """

    @staticmethod
    async def get_authorization_url() -> str:
        """
        Retorna a URL de autorização do Google
        """
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }

        base_url = "https://accounts.google.com/o/oauth2/auth"
        query_string = "&".join(f"{key}={value}" for key, value in params.items())

        return f"{base_url}?{query_string}"

    @staticmethod
    async def get_token(code: str) -> Optional[Dict]:
        """
        Troca o código de autorização por um token de acesso
        """
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=data,
            )

            if response.status_code != 200:
                return None

            token_data = await response.json()
            return token_data

    @staticmethod
    async def get_user_info(access_token: str) -> Optional[Dict]:
        """
        Obtém informações do usuário a partir do token de acesso
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )

            if response.status_code != 200:
                return None

            user_info = await response.json()
            return {
                "email": user_info.get("email"),
                "name": user_info.get("name", user_info.get("email")),
                "picture": user_info.get("picture"),
                "google_id": user_info.get("id"),
            }


def verify_google_token(token: str) -> Optional[Dict]:
    """
    Verifica a validade de um token ID do Google
    """
    try:
        # Verificar o token ID
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), settings.GOOGLE_CLIENT_ID
        )

        # Verificar o emissor do token
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            return None

        # Retornar informações do usuário
        return {
            "email": idinfo.get("email"),
            "name": idinfo.get("name", idinfo.get("email")),
            "picture": idinfo.get("picture"),
            "google_id": idinfo.get("sub"),
        }
    except Exception:
        # Token inválido
        return None
