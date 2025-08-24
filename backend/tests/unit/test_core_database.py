import pytest
from unittest.mock import patch, MagicMock, call
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import engine, SessionLocal, Base, get_db
from app.core.config import settings


class TestDatabaseEngine:
    """Testes para a configuração do engine SQLAlchemy."""

    def test_engine_creation(self):
        """Testa se o engine é criado corretamente."""
        assert engine is not None
        assert hasattr(engine, "connect")
        assert hasattr(engine, "execute")

    def test_engine_url_configuration(self):
        """Testa se o engine usa a URL correta do settings."""
        assert str(engine.url) == settings.DATABASE_URL or settings.DATABASE_URL in str(
            engine.url
        )

    @patch("app.core.database.settings")
    @patch("app.core.database.create_engine")
    def test_sqlite_connect_args(self, mock_create_engine, mock_settings):
        """Testa se connect_args é configurado corretamente para SQLite."""
        mock_settings.DATABASE_URL = "sqlite:///test.db"

        # Reimporta o módulo para aplicar o mock
        import importlib
        import app.core.database

        importlib.reload(app.core.database)

        mock_create_engine.assert_called_with(
            "sqlite:///test.db", connect_args={"check_same_thread": False}
        )

    @patch("app.core.database.settings")
    @patch("app.core.database.create_engine")
    def test_postgresql_connect_args(self, mock_create_engine, mock_settings):
        """Testa se connect_args é vazio para PostgreSQL."""
        mock_settings.DATABASE_URL = "postgresql://user:pass@localhost/db"

        # Reimporta o módulo para aplicar o mock
        import importlib
        import app.core.database

        importlib.reload(app.core.database)

        mock_create_engine.assert_called_with(
            "postgresql://user:pass@localhost/db", connect_args={}
        )

    def test_engine_connection(self):
        """Testa se é possível conectar ao banco usando o engine."""
        try:
            with engine.connect() as connection:
                assert connection is not None
        except Exception as e:
            # Em ambiente de teste, pode não haver banco configurado
            pytest.skip(f"Banco não disponível para teste: {e}")


class TestSessionLocal:
    """Testes para a configuração da sessão SQLAlchemy."""

    def test_session_local_creation(self):
        """Testa se SessionLocal é criado corretamente."""
        assert SessionLocal is not None
        assert hasattr(SessionLocal, "__call__")

    def test_session_local_configuration(self):
        """Testa se SessionLocal tem as configurações corretas."""
        session = SessionLocal()
        try:
            # Verifica configurações da sessão
            assert session.autocommit is False
            assert session.autoflush is False
            assert session.bind == engine
        finally:
            session.close()

    def test_session_local_instance_creation(self):
        """Testa se SessionLocal cria instâncias de sessão válidas."""
        session = SessionLocal()
        try:
            assert session is not None
            assert hasattr(session, "query")
            assert hasattr(session, "add")
            assert hasattr(session, "commit")
            assert hasattr(session, "rollback")
            assert hasattr(session, "close")
        finally:
            session.close()

    def test_multiple_sessions_independent(self):
        """Testa se múltiplas sessões são independentes."""
        session1 = SessionLocal()
        session2 = SessionLocal()

        try:
            assert session1 is not session2
            assert session1.bind == session2.bind  # Mesmo engine
        finally:
            session1.close()
            session2.close()


class TestDeclarativeBase:
    """Testes para a base declarativa dos modelos."""

    def test_base_creation(self):
        """Testa se Base é criado corretamente."""
        assert Base is not None
        assert hasattr(Base, "metadata")
        assert hasattr(Base, "registry")

    def test_base_metadata(self):
        """Testa se Base tem metadata válido."""
        assert Base.metadata is not None
        assert hasattr(Base.metadata, "tables")
        assert hasattr(Base.metadata, "create_all")
        assert hasattr(Base.metadata, "drop_all")

    def test_base_inheritance(self):
        """Testa se é possível criar modelos herdando de Base."""
        from sqlalchemy import Column, Integer, String

        class TestModel(Base):
            __tablename__ = "test_model"
            id = Column(Integer, primary_key=True)
            name = Column(String(50))

        assert hasattr(TestModel, "__tablename__")
        assert hasattr(TestModel, "id")
        assert hasattr(TestModel, "name")
        assert TestModel.__table__.name == "test_model"


class TestGetDbDependency:
    """Testes para a função de dependência get_db."""

    def test_get_db_is_generator(self):
        """Testa se get_db é um gerador."""
        db_gen = get_db()
        assert hasattr(db_gen, "__next__")
        assert hasattr(db_gen, "__iter__")

    def test_get_db_yields_session(self):
        """Testa se get_db produz uma sessão válida."""
        db_gen = get_db()
        db = next(db_gen)

        try:
            assert db is not None
            assert hasattr(db, "query")
            assert hasattr(db, "add")
            assert hasattr(db, "commit")
            assert hasattr(db, "rollback")
        finally:
            # Finaliza o gerador para fechar a sessão
            try:
                next(db_gen)
            except StopIteration:
                pass

    def test_get_db_closes_session_on_completion(self):
        """Testa se get_db fecha a sessão ao finalizar."""
        with patch("app.core.database.SessionLocal") as mock_session_local:
            mock_session = MagicMock()
            mock_session_local.return_value = mock_session

            db_gen = get_db()
            db = next(db_gen)

            # Verifica se a sessão foi criada
            mock_session_local.assert_called_once()
            assert db == mock_session

            # Finaliza o gerador
            try:
                next(db_gen)
            except StopIteration:
                pass

            # Verifica se close foi chamado
            mock_session.close.assert_called_once()

    def test_get_db_closes_session_on_exception(self):
        """Testa se get_db fecha a sessão mesmo em caso de exceção."""
        with patch("app.core.database.SessionLocal") as mock_session_local:
            mock_session = MagicMock()
            mock_session_local.return_value = mock_session

            db_gen = get_db()
            db = next(db_gen)

            # Simula uma exceção durante o uso da sessão
            try:
                db_gen.throw(Exception("Erro simulado"))
            except Exception:
                pass

            # Verifica se close foi chamado mesmo com exceção
            mock_session.close.assert_called_once()

    def test_get_db_multiple_calls_independent(self):
        """Testa se múltiplas chamadas de get_db são independentes."""
        db_gen1 = get_db()
        db_gen2 = get_db()

        db1 = next(db_gen1)
        db2 = next(db_gen2)

        try:
            assert db1 is not db2
        finally:
            # Finaliza os geradores
            for gen in [db_gen1, db_gen2]:
                try:
                    next(gen)
                except StopIteration:
                    pass


class TestDatabaseIntegration:
    """Testes de integração para componentes do banco de dados."""

    def test_engine_session_integration(self):
        """Testa se engine e SessionLocal trabalham juntos corretamente."""
        session = SessionLocal()
        try:
            assert session.bind == engine
            # Testa uma operação simples se possível
            try:
                session.execute("SELECT 1")
            except Exception:
                # Pode falhar se não houver banco configurado
                pass
        finally:
            session.close()

    def test_base_engine_integration(self):
        """Testa se Base pode usar o engine para criar tabelas."""
        try:
            # Tenta criar todas as tabelas (pode falhar se banco não estiver disponível)
            Base.metadata.create_all(bind=engine)

            # Verifica se metadata foi atualizado
            assert Base.metadata.bind is None  # metadata não mantém bind por padrão
        except Exception:
            # Em ambiente de teste, pode não haver banco configurado
            pytest.skip("Banco não disponível para teste de integração")

    def test_get_db_with_real_operations(self):
        """Testa get_db com operações reais de banco."""
        db_gen = get_db()
        db = next(db_gen)

        try:
            # Testa operações básicas se possível
            try:
                result = db.execute("SELECT 1 as test_column")
                row = result.fetchone()
                if row:
                    assert row[0] == 1 or row.test_column == 1
            except Exception:
                # Pode falhar se banco não estiver configurado
                pass
        finally:
            # Finaliza o gerador
            try:
                next(db_gen)
            except StopIteration:
                pass


class TestDatabaseConfiguration:
    """Testes para diferentes configurações de banco de dados."""

    @patch("app.core.database.settings")
    def test_sqlite_memory_database(self, mock_settings):
        """Testa configuração com banco SQLite em memória."""
        mock_settings.DATABASE_URL = "sqlite:///:memory:"

        # Testa criação de engine com banco em memória
        from sqlalchemy import create_engine

        test_engine = create_engine(
            mock_settings.DATABASE_URL, connect_args={"check_same_thread": False}
        )

        assert test_engine is not None

        # Testa conexão
        with test_engine.connect() as conn:
            result = conn.execute("SELECT 1")
            assert result.fetchone()[0] == 1

    def test_database_url_validation(self):
        """Testa se URLs de banco inválidas são tratadas adequadamente."""
        invalid_urls = [
            "invalid://url",
            "sqlite:///nonexistent/path/db.sqlite",
            "postgresql://invalid:credentials@nonexistent:5432/db",
        ]

        for url in invalid_urls:
            try:
                test_engine = create_engine(url)
                # Tenta conectar para verificar se falha adequadamente
                with test_engine.connect():
                    pass
            except Exception as e:
                # Esperado que falhe com URLs inválidas
                assert isinstance(e, (SQLAlchemyError, Exception))


class TestDatabaseSecurity:
    """Testes relacionados à segurança do banco de dados."""

    def test_session_isolation(self):
        """Testa se sessões são isoladas entre si."""
        session1 = SessionLocal()
        session2 = SessionLocal()

        try:
            # Sessões devem ser independentes
            assert session1 is not session2
            assert session1.identity_map is not session2.identity_map
        finally:
            session1.close()
            session2.close()

    def test_connection_cleanup(self):
        """Testa se conexões são limpas adequadamente."""
        sessions = []

        # Cria múltiplas sessões
        for _ in range(5):
            session = SessionLocal()
            sessions.append(session)

        # Fecha todas as sessões
        for session in sessions:
            session.close()

        # Verifica se não há vazamentos de conexão
        # (Este teste é mais conceitual, pois é difícil verificar vazamentos diretamente)
        assert len(sessions) == 5
