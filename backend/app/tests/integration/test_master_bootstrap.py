"""Testes para bootstrap_master garantindo promoção, criação e hash de senha.

Cobrem os ramos:
 - Usuário inexistente -> criação MASTER com hashed_password
 - Usuário existente sem role MASTER -> promoção + hash
 - Usuário MASTER sem hashed_password -> só aplica hash
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

from app.main import bootstrap_master
from app.models.user import User
from app.core.config import settings
from app.core.security import verify_password


@pytest.fixture()
def memory_session(monkeypatch):
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    from app.core.database import Base  # local import

    Base.metadata.create_all(engine)

    # monkeypatch SessionLocal usado em bootstrap_master
    import app.main as main_mod

    monkeypatch.setattr(main_mod, "SessionLocal", SessionLocal)
    return SessionLocal, engine


def _run_bootstrap_and_fetch(session_factory):
    bootstrap_master()
    db = session_factory()
    try:
        return db.query(User).filter(User.email == settings.MASTER_EMAIL).first()
    finally:
        db.close()


@pytest.mark.parametrize(
    "pre_state",
    ["absent", "present_user", "present_master_no_hash"],
)
def test_bootstrap_master_variants(pre_state, memory_session, monkeypatch):
    session_factory, _engine = memory_session
    monkeypatch.setattr(settings, "MASTER_EMAIL", "test.master@example.com")
    monkeypatch.setattr(settings, "MASTER_PASSWORD", "SuperSecret123")

    # Preparar estado prévio
    db = session_factory()
    if pre_state == "present_user":
        db.add(User(email=settings.MASTER_EMAIL, name="Temp", role="USER", is_active=True))  # type: ignore[arg-type]
        db.commit()
    elif pre_state == "present_master_no_hash":
        db.add(User(email=settings.MASTER_EMAIL, name="Master", role="MASTER", is_active=True))  # type: ignore[arg-type]
        db.commit()
    db.close()

    user = _run_bootstrap_and_fetch(session_factory)
    assert user is not None, "Bootstrap deve garantir existência do MASTER"
    assert user.role == "MASTER"
    assert (
        user.hashed_password
    ), "Deve gerar hashed_password quando MASTER_PASSWORD definido"
    assert settings.MASTER_PASSWORD is not None
    assert verify_password(settings.MASTER_PASSWORD, user.hashed_password) is True
