"""
Testes consolidados para a API de autenticação
Consolida todos os testes de auth_api, auth_api_coverage, auth_api_extended
"""

import datetime
from unittest.mock import patch

import pytest
from fastapi import HTTPException, status
from jose import jwt  # type: ignore

from app.models.user import User
from app.core.config import settings
from app.core.security import (
    create_access_token,
    verify_password,
    verify_token,
    get_password_hash,
)

# Dados simulados para testes
MOCK_USER_DATA = {
    "email": "google_user@exemplo.com",
    "name": "Usuário Google",
    "picture": "https://exemplo.com/foto.jpg",
    "google_id": "123456789",
}

MOCK_VALID_TOKEN = "valid_google_token"
MOCK_INVALID_TOKEN = "invalid_token"


@pytest.fixture
def test_user_with_password(test_db):
    """Fixture para usuário com senha hash"""
    user = User(
        email="test_user@example.com",
        name="Test User",
        is_active=True,
        password_hash=get_password_hash("password123"),
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


def test_token_generation():
    """
    Testa a geração direta de token JWT
    """
    # Arrange
    email = "teste@exemplo.com"
    user_id = "123456"

    # Act
    token = create_access_token(
        data={"sub": email, "user_id": user_id},
        expires_delta=datetime.timedelta(minutes=30),
    )  # Assert
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload.get("sub") == email
    assert payload.get("user_id") == user_id
    assert "exp" in payload


def test_get_current_user(test_client, auth_headers, sample_user):
    """
    Testa a obtenção do usuário atual usando o token JWT
    """
    # Act
    response = test_client.get("/api/v1/users/me", headers=auth_headers)

    # Assert
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == sample_user.email
    assert data["name"] == sample_user.name
    assert data["id"] == str(sample_user.id)


def test_get_current_user_invalid_token(test_client):
    """
    Testa o acesso com token inválido
    """
    # Arrange
    headers = {"Authorization": "Bearer invalid_token"}

    # Act
    response = test_client.get("/api/v1/users/me", headers=headers)

    # Assert
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@patch("app.api.v1.auth.verify_google_token")
def test_google_auth_success(mock_verify_token, test_client, test_db):
    """
    Testa autenticação Google bem-sucedida para novo usuário
    """
    # Arrange
    mock_verify_token.return_value = MOCK_USER_DATA

    # Act
    response = test_client.post(
        "/api/v1/auth/google", params={"token": MOCK_VALID_TOKEN}
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Verificar se usuário foi criado
    user = test_db.query(User).filter(User.email == MOCK_USER_DATA["email"]).first()
    assert user is not None
    assert user.name == MOCK_USER_DATA["name"]
    assert user.google_id == MOCK_USER_DATA["google_id"]


@patch("app.api.v1.auth.verify_google_token")
def test_google_auth_existing_user(mock_verify_token, test_client, test_db):
    """
    Testa autenticação Google para usuário existente
    """
    # Arrange
    existing_user = User(
        email="existing@gmail.com",
        name="Usuário Existente",
        google_id="987654321",
        is_active=True,
    )
    test_db.add(existing_user)
    test_db.commit()

    mock_verify_token.return_value = {
        "email": "existing@gmail.com",
        "name": "Nome Atualizado Google",
        "picture": "https://exemplo.com/nova_foto.jpg",
        "google_id": "987654321",
    }

    # Act
    response = test_client.post(
        "/api/v1/auth/google", params={"token": "valid_google_token"}
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Verificar que usuário mantém dados originais
    updated_user = (
        test_db.query(User).filter(User.email == "existing@gmail.com").first()
    )
    assert updated_user.name == "Usuário Existente"


@patch("app.api.v1.auth.verify_google_token")
def test_google_auth_invalid_token(mock_verify_token, test_client):
    """
    Testa autenticação Google com token inválido
    """
    # Arrange
    mock_verify_token.side_effect = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido"
    )

    # Act
    response = test_client.post(
        "/api/v1/auth/google", params={"token": MOCK_INVALID_TOKEN}
    )

    # Assert
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@patch("app.api.v1.auth.verify_google_token")
def test_google_auth_without_google_id(mock_verify_token, test_client):
    """
    Testa autenticação Google sem google_id no payload
    """
    # Arrange
    mock_verify_token.return_value = {
        "email": "user@gmail.com",
        "name": "User Name",
        "picture": "https://example.com/photo.jpg",
        # google_id ausente
    }

    # Act
    response = test_client.post(
        "/api/v1/auth/google", params={"token": MOCK_VALID_TOKEN}
    )

    # Assert
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_verify_password_correct():
    """Testa verificação de senha correta"""
    password = "test_password"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True


def test_verify_password_incorrect():
    """Testa verificação de senha incorreta"""
    password = "test_password"
    wrong_password = "wrong_password"
    hashed = get_password_hash(password)
    assert verify_password(wrong_password, hashed) is False


def test_verify_token_valid(sample_user):
    """Testa verificação de token válido"""
    token = create_access_token(
        data={"sub": sample_user.email, "user_id": str(sample_user.id)}
    )
    payload = verify_token(token)
    assert payload is not None
    assert payload.email == sample_user.email
    assert payload.user_id == str(sample_user.id)


def test_verify_token_invalid():
    """Token inválido retorna None"""
    assert verify_token("invalid_token") is None


def test_verify_token_expired():
    """Token expirado retorna None"""
    expired_token = create_access_token(
        data={"sub": "test@example.com", "user_id": "123"},
        expires_delta=datetime.timedelta(seconds=-1),
    )
    assert verify_token(expired_token) is None


def test_get_password_hash():
    """Testa geração de hash de senha"""
    password = "test_password"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True


def test_create_access_token_default_expiry():
    """Testa criação de token com expiração padrão"""
    data = {"sub": "test@example.com", "user_id": "123"}
    token = create_access_token(data=data)

    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "test@example.com"
    assert payload["user_id"] == "123"
    assert "exp" in payload


def test_create_access_token_custom_expiry():
    """Testa criação de token com expiração customizada"""
    data = {"sub": "test@example.com", "user_id": "123"}
    expires_delta = datetime.timedelta(hours=2)
    token = create_access_token(data=data, expires_delta=expires_delta)

    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "test@example.com"
    assert "exp" in payload


@patch("app.api.v1.auth.verify_google_token")
def test_google_auth_database_error(mock_verify_token, test_client, test_db):
    """Testa tratamento de erro de banco de dados"""
    mock_verify_token.return_value = MOCK_USER_DATA

    # Simular erro de banco fechando a sessão
    test_db.close()

    response = test_client.post(
        "/api/v1/auth/google", params={"token": MOCK_VALID_TOKEN}
    )

    # Com sessão fechada, dependência reabre conexão e retorna 200
    assert response.status_code == status.HTTP_200_OK
    assert "access_token" in response.json()


def test_auth_endpoint_without_token(test_client):
    """Testa endpoint de auth sem fornecer token"""
    response = test_client.post("/api/v1/auth/google")

    # Deve retornar erro de parâmetro obrigatório
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@patch("app.api.v1.auth.verify_google_token")
def test_google_auth_missing_email(mock_verify_token, test_client):
    """Testa autenticação Google sem email no payload"""
    mock_verify_token.return_value = {
        "name": "User Name",
        "picture": "https://example.com/photo.jpg",
        "google_id": "123456789",
        # email ausente
    }

    response = test_client.post(
        "/api/v1/auth/google", params={"token": MOCK_VALID_TOKEN}
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@patch("app.api.v1.auth.verify_google_token")
def test_google_auth_empty_email(mock_verify_token, test_client):
    """Testa autenticação Google com email vazio"""
    mock_verify_token.return_value = {
        "email": "",
        "name": "User Name",
        "picture": "https://example.com/photo.jpg",
        "google_id": "123456789",
    }

    response = test_client.post(
        "/api/v1/auth/google", params={"token": MOCK_VALID_TOKEN}
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_protected_endpoint_without_auth(test_client):
    """Testa acesso a endpoint protegido sem autenticação"""
    response = test_client.get("/api/v1/users/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_protected_endpoint_with_malformed_header(test_client):
    """Testa acesso com header de autorização malformado"""
    headers = {"Authorization": "InvalidToken"}
    response = test_client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_protected_endpoint_with_empty_token(test_client):
    """Testa acesso com token vazio"""
    headers = {"Authorization": "Bearer "}
    response = test_client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
