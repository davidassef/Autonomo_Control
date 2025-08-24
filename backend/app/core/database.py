from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import SQLAlchemyError
from contextlib import contextmanager
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Configurar logging
logger = logging.getLogger(__name__)

# Configuração do banco de dados
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./autonomo_control.db")

# Criar engine com configurações otimizadas (Solução A1)
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,  # Desabilitado para reduzir logs em produção
        pool_pre_ping=True,  # Verificar conexões antes de usar
        pool_recycle=3600,  # Reciclar conexões a cada hora
    )
else:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=10,
        max_overflow=20,
    )

# Criar SessionLocal com configurações robustas (Solução A1)
SessionLocal = sessionmaker(
    autocommit=False,  # Explicitamente definido como False
    autoflush=False,  # Controle manual de flush
    bind=engine,
    expire_on_commit=False,  # Evitar problemas com objetos após commit
)

# Base para os modelos
Base = declarative_base()


# Context manager para sessões de banco (Solução A1)
@contextmanager
def get_db_session():
    """Context manager para gerenciar sessões de banco de dados com rollback automático"""
    db = SessionLocal()
    try:
        logger.debug("Sessão de banco de dados criada")
        yield db
        db.commit()
        logger.debug("Transação commitada com sucesso")
    except SQLAlchemyError as e:
        logger.error(f"Erro SQLAlchemy, fazendo rollback: {str(e)}")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Erro inesperado, fazendo rollback: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()
        logger.debug("Sessão de banco de dados fechada")


# Dependency para obter sessão do banco (compatibilidade com FastAPI)
def get_db():
    """Dependency para FastAPI com rollback automático em falhas (Solução A1)"""
    db = SessionLocal()
    try:
        logger.debug("Dependency get_db: Sessão criada")
        yield db
    except SQLAlchemyError as e:
        logger.error(
            f"Erro SQLAlchemy na dependency get_db, fazendo rollback: {str(e)}"
        )
        db.rollback()
        raise
    except Exception as e:
        logger.error(
            f"Erro inesperado na dependency get_db, fazendo rollback: {str(e)}"
        )
        db.rollback()
        raise
    finally:
        db.close()
        logger.debug("Dependency get_db: Sessão fechada")
