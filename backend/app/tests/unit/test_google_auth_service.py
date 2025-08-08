"""
Testes para o serviço de autenticação Google
"""
from unittest.mock import patch, AsyncMock, MagicMock

import pytest

from app.services.google_auth import GoogleAuthService, verify_google_token


@pytest.mark.asyncio
@patch("app.services.google_auth.id_token.verify_oauth2_token")
async def test_verify_google_token_valid(mock_verify_oauth2_token):
    """
    Testa a verificação de um token Google válido
    """
    # Arrange
    mock_verify_oauth2_token.return_value = {
        "iss": "accounts.google.com",
        "sub": "123456789",
        "email": "teste@exemplo.com",
        "name": "Usuário Teste",
        "picture": "https://exemplo.com/foto.jpg",
    }

    # Act
    result = verify_google_token("valid_token")

    # Assert
    assert result is not None
    assert result["email"] == "teste@exemplo.com"
    assert result["name"] == "Usuário Teste"
    assert result["google_id"] == "123456789"
    mock_verify_oauth2_token.assert_called_once()


@pytest.mark.asyncio
@patch("app.services.google_auth.id_token.verify_oauth2_token")
async def test_verify_google_token_invalid(mock_verify_oauth2_token):
    """
    Testa a verificação de um token Google inválido
    """
    # Arrange
    mock_verify_oauth2_token.side_effect = ValueError("Invalid token")

    # Act
    result = verify_google_token("invalid_token")

    # Assert
    assert result is None
    mock_verify_oauth2_token.assert_called_once()


@pytest.mark.asyncio
@patch("app.services.google_auth.id_token.verify_oauth2_token")
async def test_verify_google_token_wrong_issuer(mock_verify_oauth2_token):
    """
    Testa a verificação de um token Google com emissor inválido
    """
    # Arrange
    mock_verify_oauth2_token.return_value = {
        "iss": "fake-issuer.com",
        "sub": "123456789",
        "email": "teste@exemplo.com",
    }

    # Act
    result = verify_google_token("token_with_wrong_issuer")

    # Assert
    assert result is None
    mock_verify_oauth2_token.assert_called_once()


@pytest.mark.asyncio
@patch("app.services.google_auth.settings", MagicMock(
    GOOGLE_CLIENT_ID="mock-client-id",
    GOOGLE_REDIRECT_URI="mock-redirect-uri",
))
async def test_get_authorization_url():
    """
    Testa a geração da URL de autorização do Google
    """
    # Act
    result = await GoogleAuthService.get_authorization_url()

    # Assert
    assert result.startswith("https://accounts.google.com/o/oauth2/auth?")
    assert "client_id=mock-client-id" in result
    assert "redirect_uri=mock-redirect-uri" in result
    assert "response_type=code" in result
    assert "scope=" in result


@pytest.mark.asyncio
async def test_get_token_success():
    """
    Testa a obtenção de um token do Google usando um código válido
    """
    # Arrange
    client_mock = AsyncMock()
    response_mock = AsyncMock()
    response_mock.status_code = 200
    response_mock.json.return_value = {
        "access_token": "test_access_token",
        "refresh_token": "test_refresh_token",
        "id_token": "test_id_token"
    }
    client_mock.post.return_value = response_mock

    # Act
    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value = client_mock
        result = await GoogleAuthService.get_token("valid_code")

    # Assert
    assert result is not None
    assert result["access_token"] == "test_access_token"
    assert result["refresh_token"] == "test_refresh_token"
    assert result["id_token"] == "test_id_token"
    client_mock.post.assert_called_once()


@pytest.mark.asyncio
async def test_get_token_failure():
    """
    Testa a obtenção de um token do Google usando um código inválido
    """
    # Arrange
    client_mock = AsyncMock()
    response_mock = AsyncMock()
    response_mock.status_code = 400
    client_mock.post.return_value = response_mock

    # Act
    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value = client_mock
        result = await GoogleAuthService.get_token("invalid_code")

    # Assert
    assert result is None
    client_mock.post.assert_called_once()


@pytest.mark.asyncio
async def test_get_user_info_success():
    """
    Testa a obtenção de informações do usuário usando um token válido
    """
    # Arrange
    client_mock = AsyncMock()
    response_mock = AsyncMock()
    response_mock.status_code = 200
    response_mock.json.return_value = {
        "email": "teste@exemplo.com",
        "name": "Usuário Teste",
        "picture": "https://exemplo.com/foto.jpg",
        "id": "123456789"
    }
    client_mock.get.return_value = response_mock

    # Act
    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value = client_mock
        result = await GoogleAuthService.get_user_info("valid_access_token")

    # Assert
    assert result is not None
    assert result["email"] == "teste@exemplo.com"
    assert result["name"] == "Usuário Teste"
    assert result["picture"] == "https://exemplo.com/foto.jpg"
    assert result["google_id"] == "123456789"
    client_mock.get.assert_called_once()


@pytest.mark.asyncio
async def test_get_user_info_failure():
    """
    Testa a obtenção de informações do usuário usando um token inválido
    """
    # Arrange
    client_mock = AsyncMock()
    response_mock = AsyncMock()
    response_mock.status_code = 401
    client_mock.get.return_value = response_mock

    # Act
    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value = client_mock
        result = await GoogleAuthService.get_user_info("invalid_access_token")

    # Assert
    assert result is None
    client_mock.get.assert_called_once()
