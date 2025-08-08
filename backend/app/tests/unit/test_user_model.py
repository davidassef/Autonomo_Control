"""
Testes unitários para o modelo User.

Este módulo contém testes para validar o comportamento do modelo User,
incluindo criação, atualização e validações de campos.
"""
from uuid import UUID

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.user import User


def test_create_user(test_db):
    """
    Testa a criação de um usuário com dados válidos
    """
    # Arrange
    email = "novo@usuario.com"
    name = "Novo Usuário"
    google_id = "googleid123456"
    hashed_password = "hash_da_senha_secreta"

    # Act
    user = User(
        email=email,
        name=name,
        google_id=google_id,
        hashed_password=hashed_password
    )
    test_db.add(user)
    test_db.commit()

    # Assert
    db_user = test_db.query(User).filter(User.email == email).first()
    assert db_user is not None
    assert db_user.email == email
    assert db_user.name == name
    assert db_user.google_id == google_id
    assert db_user.is_active is True
    # Verifica se o ID foi gerado como UUID válido em formato string
    assert db_user.id is not None
    try:
        UUID(db_user.id)
        is_valid_uuid = True
    except ValueError:
        is_valid_uuid = False
    assert is_valid_uuid is True    # Verifica timestamps automáticos
    assert db_user.created_at is not None
    assert db_user.hashed_password == hashed_password


def test_user_unique_email(test_db, sample_user):
    """
    Testa que não é possível criar dois usuários com o mesmo email
    """
    # Arrange
    duplicate_user = User(
        email=sample_user.email,  # Mesmo email
        name="Usuário Duplicado",
        google_id="diferente123"
    )    # Act/Assert
    test_db.add(duplicate_user)
    with pytest.raises(IntegrityError):
        test_db.commit()


def test_user_update(test_db, sample_user):
    """
    Testa a atualização de dados do usuário
    """
    # Arrange
    user_id = sample_user.id
    new_name = "Nome Atualizado"

    # Act
    db_user = test_db.query(User).filter(User.id == user_id).first()
    db_user.name = new_name
    test_db.commit()
    test_db.refresh(db_user)    # Assert
    updated_user = test_db.query(User).filter(User.id == user_id).first()
    assert updated_user.name == new_name


def test_user_soft_delete(test_db, sample_user):
    """
    Testa a desativação de um usuário (soft delete)
    """
    # Arrange
    user_id = sample_user.id    # Act
    db_user = test_db.query(User).filter(User.id == user_id).first()
    db_user.is_active = False
    test_db.commit()

    # Assert
    inactive_user = test_db.query(User).filter(User.id == user_id).first()
    assert inactive_user.is_active is False
