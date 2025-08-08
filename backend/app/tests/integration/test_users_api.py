import pytest
from fastapi import status

from app.models.user import User


def test_get_users(test_client, auth_headers, test_db):
    """
    Testa o endpoint de listagem de usuários
    """
    # Arrange - cria um usuário adicional
    new_user = User(
        email="outro@exemplo.com",
        name="Outro Usuário",
        google_id="987654321"
    )
    test_db.add(new_user)
    test_db.commit()

    # Act - faz a requisição autenticada
    response = test_client.get("/api/v1/users/", headers=auth_headers)

    # Assert
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2  # Pelo menos dois usuários (o de teste e o adicional)

    # Verifica se o formato dos dados está correto
    for user in data:
        assert "id" in user
        assert "email" in user
        assert "name" in user
        assert "is_active" in user


def test_get_current_user(test_client, auth_headers, sample_user):
    """
    Testa o endpoint que retorna o usuário atual (autenticado)
    """
    # Act
    response = test_client.get("/api/v1/users/me", headers=auth_headers)

    # Assert
    assert response.status_code == status.HTTP_200_OK
    user_data = response.json()
    assert user_data["email"] == sample_user.email
    assert user_data["name"] == sample_user.name


def test_get_current_user_unauthorized(test_client):
    """
    Testa o endpoint de usuário atual sem autenticação (deve falhar)
    """
    # Act
    response = test_client.get("/api/v1/users/me")

    # Assert
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_user_by_id(test_client, auth_headers, sample_user):
    """
    Testa a busca de usuário por ID
    """
    # Act
    response = test_client.get(f"/api/v1/users/{sample_user.id}", headers=auth_headers)

    # Assert
    assert response.status_code == status.HTTP_200_OK
    user_data = response.json()
    assert user_data["id"] == sample_user.id
    assert user_data["email"] == sample_user.email


def test_update_user(test_client, auth_headers, sample_user):
    """
    Testa a atualização de dados do usuário
    """
    # Arrange
    update_data = {
        "name": "Nome Atualizado",
        "picture": "https://exemplo.com/foto.jpg"
    }

    # Act
    response = test_client.put(
        "/api/v1/users/me",
        json=update_data,
        headers=auth_headers
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    updated_user = response.json()
    assert updated_user["name"] == update_data["name"]
    assert updated_user["picture"] == update_data["picture"]
