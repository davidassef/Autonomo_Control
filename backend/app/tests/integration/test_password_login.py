"""Testes para login tradicional /auth/token cobrindo sucesso e falha."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import get_password_hash
from app.models.user import User


@pytest.fixture()
def client(test_db):
    return TestClient(app)


def _create_login_user(
    db, email="pwd.user@example.com", password="Pass12345", role="USER"
):
    user = User(email=email, name="Pwd User", role=role, is_active=True, hashed_password=get_password_hash(password))  # type: ignore[arg-type]
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, password


def test_password_login_success(client, test_db):
    user, plain = _create_login_user(test_db)
    data = {"username": user.email, "password": plain}
    r = client.post("/api/v1/auth/token", data=data)
    assert r.status_code == 200, r.text
    payload = r.json()
    assert "access_token" in payload
    assert payload["token_type"] == "bearer"


def test_password_login_wrong_password(client, test_db):
    user, _plain = _create_login_user(test_db)
    data = {"username": user.email, "password": "WrongPass"}
    r = client.post("/api/v1/auth/token", data=data)
    assert r.status_code == 401
    assert r.json()["detail"] == "Email ou senha incorretos"


def test_password_login_inactive_user(client, test_db):
    user, plain = _create_login_user(test_db)
    user.is_active = False  # type: ignore[assignment]
    test_db.commit()
    data = {"username": user.email, "password": plain}
    r = client.post("/api/v1/auth/token", data=data)
    # Login ainda retorna token, bloqueio ocorre ao consultar /auth/me
    assert r.status_code == 200
    token = r.json()["access_token"]
    r2 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    # Esperado 403 (Usuário inativo) ou 401 dependendo da ordem de validação
    assert r2.status_code in (401, 403)
