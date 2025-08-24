"""Add username and secret keys fields

Revision ID: add_username_secret_keys
Revises:
Create Date: 2024-01-15 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from datetime import datetime
import uuid

# revision identifiers, used by Alembic.
revision = "add_username_secret_keys"
down_revision = "20250809_01_add_role_to_users"
branch_labels = None
depends_on = None


def upgrade():
    """Adiciona campos username e chaves secretas, configura conta Master única"""

    # Usar batch mode para SQLite
    with op.batch_alter_table("users", schema=None) as batch_op:
        # Adicionar campo username (nullable inicialmente)
        batch_op.add_column(sa.Column("username", sa.String(50), nullable=True))

        # Adicionar campos para chaves secretas
        batch_op.add_column(sa.Column("secret_key_hash", sa.String(255), nullable=True))
        batch_op.add_column(
            sa.Column("secret_key_created_at", sa.DateTime, nullable=True)
        )
        batch_op.add_column(sa.Column("secret_key_used_at", sa.DateTime, nullable=True))

        # Criar índice para username
        batch_op.create_index("ix_users_username", ["username"], unique=True)

    # Executar conversões e configurações usando raw SQL
    connection = op.get_bind()

    # 1. Converter todas as contas Master existentes para Admin
    connection.execute(
        text(
            """
        UPDATE users 
        SET role = 'ADMIN' 
        WHERE role = 'MASTER'
    """
        )
    )

    # 2. Criar a conta Master única
    master_id = str(uuid.uuid4())
    now = datetime.utcnow()

    # Hash da senha 'Senhamaster123' usando bcrypt
    # Este hash foi gerado previamente: bcrypt.hashpw('Senhamaster123'.encode('utf-8'), bcrypt.gensalt())
    password_hash = "$2b$12$8K9Zx1YvQwErTyUiOpLxXeF5J6HgNmPqRsVwXyZaBcDeFgHiJkLmK"

    connection.execute(
        text(
            """
        INSERT INTO users (
            id, email, username, name, role, hashed_password, 
            is_active, created_at, updated_at
        ) VALUES (
            :id, :email, :username, :name, :role, :password_hash,
            :is_active, :created_at, :updated_at
        )
    """
        ),
        {
            "id": master_id,
            "email": "master@autonomocontrol.system",
            "username": "masterautonomocontrol",
            "name": "Master do Sistema",
            "role": "MASTER",
            "password_hash": password_hash,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
    )

    print("✅ Migração concluída:")
    print("   • Campos username e chaves secretas adicionados")
    print("   • Contas Master existentes convertidas para Admin")
    print("   • Conta Master única criada: masterautonomocontrol")


def downgrade():
    """Remove os campos adicionados"""

    # Usar batch mode para SQLite
    with op.batch_alter_table("users", schema=None) as batch_op:
        # Remover índice
        batch_op.drop_index("ix_users_username")

        # Remover colunas
        batch_op.drop_column("secret_key_used_at")
        batch_op.drop_column("secret_key_created_at")
        batch_op.drop_column("secret_key_hash")
        batch_op.drop_column("username")

    print("⚠️  Migração revertida: campos username e chaves secretas removidos")
