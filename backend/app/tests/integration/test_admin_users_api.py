import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.core.config import settings
import datetime

MASTER_EMAIL = "master@example.com"
MASTER_PASSWORD = "mastersecret"
MASTER_HEADER = {"X-Master-Key": MASTER_PASSWORD}


@pytest.fixture(autouse=True)
def override_master_password(monkeypatch):
    # Override settings master password for tests
    monkeypatch.setattr(settings, "MASTER_PASSWORD", MASTER_PASSWORD)


@pytest.fixture
def client(test_db):
    return TestClient(app)


@pytest.fixture
def master_user(test_db):
    user = User(
        email=MASTER_EMAIL,
        name="Master",
        role="MASTER",
        hashed_password=get_password_hash("pwd"),
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def admin_user(test_db):
    user = User(
        email="admin@example.com",
        name="Admin",
        role="ADMIN",
        hashed_password=get_password_hash("pwd"),
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def normal_user(test_db):
    user = User(email="user@example.com", name="User", role="USER")
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


def token_for(user):
    return create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role},
        expires_delta=datetime.timedelta(minutes=5),
    )


def auth_header(user):
    return {"Authorization": f"Bearer {token_for(user)}"}


def test_list_users_requires_admin(client, normal_user):
    r = client.get("/api/v1/admin/users/", headers=auth_header(normal_user))
    assert r.status_code == 403


def test_list_users_as_admin(client, admin_user):
    r = client.get("/api/v1/admin/users/", headers=auth_header(admin_user))
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_admin_requires_master_and_master_key(client, admin_user, master_user):
    # Try as ADMIN -> forbidden
    payload = {"email": "newadmin@example.com", "name": "New Admin"}
    r = client.post(
        "/api/v1/admin/users/?role=ADMIN", json=payload, headers=auth_header(admin_user)
    )
    assert r.status_code == 403
    # Try as MASTER without key -> 403 (master password middleware enforcement) or 403 custom
    r2 = client.post(
        "/api/v1/admin/users/?role=ADMIN",
        json=payload,
        headers=auth_header(master_user),
    )
    assert r2.status_code in (403, 401)  # depending on implementation detail
    # With master key succeeds
    headers = {**auth_header(master_user), **MASTER_HEADER}
    r3 = client.post("/api/v1/admin/users/?role=ADMIN", json=payload, headers=headers)
    assert r3.status_code == 201, r3.text
    data = r3.json()
    assert data["role"] == "ADMIN"


def test_change_role_master_only(client, admin_user, normal_user, master_user):
    # ADMIN tries to elevate USER -> forbidden
    r = client.patch(
        f"/api/v1/admin/users/{normal_user.id}/role",
        json={"role": "ADMIN"},
        headers=auth_header(admin_user),
    )
    assert r.status_code == 403
    # MASTER without master key -> expect 403/401
    r2 = client.patch(
        f"/api/v1/admin/users/{normal_user.id}/role",
        json={"role": "ADMIN"},
        headers=auth_header(master_user),
    )
    assert r2.status_code in (403, 401)
    # MASTER with key -> success
    headers = {**auth_header(master_user), **MASTER_HEADER}
    r3 = client.patch(
        f"/api/v1/admin/users/{normal_user.id}/role",
        json={"role": "ADMIN"},
        headers=headers,
    )
    assert r3.status_code == 200
    assert r3.json()["role"] == "ADMIN"


def test_change_status_rules(client, admin_user, normal_user, master_user):
    # ADMIN deactivates USER -> allowed
    r = client.patch(
        f"/api/v1/admin/users/{normal_user.id}/status",
        json={"is_active": False},
        headers=auth_header(admin_user),
    )
    assert r.status_code == 200
    assert r.json()["is_active"] is False
    # ADMIN tries deactivate ADMIN -> forbidden
    r2 = client.patch(
        f"/api/v1/admin/users/{admin_user.id}/status",
        json={"is_active": False},
        headers=auth_header(admin_user),
    )
    assert r2.status_code == 403
    # Attempt deactivate MASTER should be forbidden
    r3 = client.patch(
        f"/api/v1/admin/users/{master_user.id}/status",
        json={"is_active": False},
        headers=auth_header(admin_user),
    )
    assert r3.status_code == 400
