import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import datetime
from jose import jwt

from app.core.database import Base, get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.models.entry import Entry
from app.models.category import Category
from app.main import app


@pytest.fixture(scope="function")
def test_db():
    """
    Configuração de um banco de dados SQLite em memória para testes
    """
    # Configura banco em memória (não persiste entre testes)
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )

    # Cria tabelas do banco de dados
    Base.metadata.create_all(engine)

    # Cria sessão para testes
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    # Sobrescreve a dependência de banco de dados com nossa versão de teste
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    try:
        yield db
    finally:
        db.close()
        # Limpa as tabelas após o teste
        Base.metadata.drop_all(engine)
        # Limpa as sobrescritas de dependências
        app.dependency_overrides = {}


@pytest.fixture
def sample_user(test_db):
    """
    Fixture que cria um usuário de exemplo para testes
    """
    user = User(
        email="teste@exemplo.com",
        name="Usuário Teste",
        google_id="123456789"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def sample_category(test_db, sample_user):
    """
    Fixture que cria uma categoria de exemplo para testes
    """
    category = Category(
        name="Combustível",
        type="EXPENSE",
        user_id=sample_user.id
    )
    test_db.add(category)
    test_db.commit()
    test_db.refresh(category)
    return category


@pytest.fixture
def sample_entry(test_db, sample_user, sample_category):
    """
    Fixture que cria um lançamento financeiro de exemplo para testes
    """
    entry = Entry(
        amount=50.00,
        description="Abastecimento de combustível",
        date=datetime.datetime.now(),
        type="EXPENSE",
        category=sample_category.name,
        user_id=sample_user.id
    )
    test_db.add(entry)
    test_db.commit()
    test_db.refresh(entry)
    return entry


@pytest.fixture
def test_client():
    """
    Fixture que cria um cliente de teste para a API
    """
    return TestClient(app)


@pytest.fixture
def auth_token(sample_user):
    """
    Fixture que gera um token JWT válido para autenticação nos testes
    """
    # Cria um token de acesso para o usuário de exemplo
    access_token = create_access_token(
        data={"sub": sample_user.email, "user_id": sample_user.id},
        expires_delta=datetime.timedelta(minutes=30)
    )
    return access_token


@pytest.fixture
def auth_headers(auth_token):
    """
    Fixture que retorna os cabeçalhos de autenticação para uso nas requisições
    """
    return {"Authorization": f"Bearer {auth_token}"}
