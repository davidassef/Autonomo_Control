import secrets
import string
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models.user import User
from app.core.database import get_db

# Configuração para hash das chaves secretas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecretKeyService:
    """Serviço para gerenciar chaves secretas do Master."""

    @staticmethod
    def generate_secret_key(length: int = 16) -> str:
        """Gera uma chave secreta aleatória.

        Args:
            length: Comprimento da chave (padrão: 16)

        Returns:
            str: Chave secreta gerada
        """
        # Usar caracteres alfanuméricos (sem símbolos confusos)
        alphabet = string.ascii_uppercase + string.digits
        # Remover caracteres que podem ser confusos: 0, O, I, 1
        alphabet = (
            alphabet.replace("0", "").replace("O", "").replace("I", "").replace("1", "")
        )

        return "".join(secrets.choice(alphabet) for _ in range(length))

    @staticmethod
    def hash_secret_key(secret_key: str) -> str:
        """Cria hash da chave secreta.

        Args:
            secret_key: Chave secreta em texto plano

        Returns:
            str: Hash da chave secreta
        """
        return pwd_context.hash(secret_key)

    @staticmethod
    def verify_secret_key(secret_key: str, hashed_key: str) -> bool:
        """Verifica se a chave secreta corresponde ao hash.

        Args:
            secret_key: Chave secreta em texto plano
            hashed_key: Hash da chave secreta

        Returns:
            bool: True se a chave é válida
        """
        try:
            # Verificar se o hash não está vazio
            if not hashed_key or not hashed_key.strip():
                return False

            return pwd_context.verify(secret_key, hashed_key)
        except Exception:
            # Se houver qualquer erro na verificação (hash malformado, etc.)
            return False

    @staticmethod
    def create_secret_key_for_master(db: Session, master_user_id: int) -> str:
        """Cria uma nova chave secreta para o usuário Master.

        Args:
            db: Sessão do banco de dados
            master_user_id: ID do usuário Master

        Returns:
            str: Chave secreta gerada (texto plano)

        Raises:
            ValueError: Se o usuário não for Master
        """
        # Buscar o usuário Master
        master_user = db.query(User).filter(User.id == master_user_id).first()
        if not master_user or str(master_user.role) != "MASTER":
            raise ValueError("Apenas usuários Master podem ter chaves secretas")

        # Gerar nova chave secreta
        secret_key = SecretKeyService.generate_secret_key()

        # Criar hash da chave
        hashed_key = SecretKeyService.hash_secret_key(secret_key)

        # Atualizar o usuário com a nova chave
        master_user.secret_key_hash = hashed_key
        master_user.secret_key_created_at = datetime.utcnow()
        master_user.secret_key_used_at = None  # Reset uso anterior

        db.commit()
        db.refresh(master_user)

        return secret_key

    @staticmethod
    def validate_secret_key_for_reset(
        db: Session, username: str, secret_key: str
    ) -> Optional[User]:
        """Valida chave secreta para reset de senha.

        Args:
            db: Sessão do banco de dados
            username: Nome de usuário (deve ser Master)
            secret_key: Chave secreta fornecida

        Returns:
            Optional[User]: Usuário Master se válido, None caso contrário
        """
        # Buscar usuário Master pelo username
        user = (
            db.query(User)
            .filter(User.username == username, User.role == "MASTER")
            .first()
        )

        if not user:
            return None

        # Verificar se tem chave secreta configurada
        if not user.secret_key_hash:
            return None

        # Verificar se a chave secreta está correta
        if not SecretKeyService.verify_secret_key(secret_key, user.secret_key_hash):
            return None

        # Verificar se a chave não expirou (válida por 90 dias)
        if user.secret_key_created_at:
            expiry_date = user.secret_key_created_at + timedelta(days=90)
            if datetime.utcnow() > expiry_date:
                return None

        return user

    @staticmethod
    def mark_secret_key_as_used(db: Session, user: User) -> None:
        """Marca a chave secreta como usada.

        Args:
            db: Sessão do banco de dados
            user: Usuário que usou a chave
        """
        user.secret_key_used_at = datetime.utcnow()
        db.commit()

    @staticmethod
    def get_master_user(db: Session) -> Optional[User]:
        """Busca o usuário Master único do sistema.

        Args:
            db: Sessão do banco de dados

        Returns:
            Optional[User]: Usuário Master se encontrado
        """
        return db.query(User).filter(User.role == "MASTER").first()

    @staticmethod
    def has_valid_secret_key(db: Session, master_user_id: int) -> bool:
        """Verifica se o Master tem uma chave secreta válida.

        Args:
            db: Sessão do banco de dados
            master_user_id: ID do usuário Master

        Returns:
            bool: True se tem chave válida
        """
        user = db.query(User).filter(User.id == master_user_id).first()
        if not user or not user.secret_key_hash:
            return False

        # Verificar se não expirou
        if user.secret_key_created_at:
            expiry_date = user.secret_key_created_at + timedelta(days=90)
            if datetime.utcnow() > expiry_date:
                return False

        return True
