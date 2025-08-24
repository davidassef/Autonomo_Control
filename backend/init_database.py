#!/usr/bin/env python3
"""
Script para inicializar o banco de dados do zero
"""

import os
import sys
from pathlib import Path

# Adicionar o diretório app ao path
sys.path.append(str(Path(__file__).parent / "app"))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.user import Base
from app.core.database import engine
import uuid
from datetime import datetime
import bcrypt


def init_database():
    """Inicializa o banco de dados do zero"""

    print("🔄 Inicializando banco de dados...")

    # Remover banco existente se houver
    db_file = Path("autonomo_control.db")
    if db_file.exists():
        db_file.unlink()
        print("   • Banco existente removido")

    # Criar todas as tabelas
    Base.metadata.create_all(bind=engine)
    print("   • Tabelas criadas")

    # Criar conta Master única
    master_id = str(uuid.uuid4())
    now = datetime.utcnow()

    # Hash da senha 'Senhamaster123'
    password_hash = bcrypt.hashpw(
        "Senhamaster123".encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    with engine.connect() as connection:
        connection.execute(
            text(
                """
            INSERT INTO users (
                id, email, username, name, role, hashed_password, 
                is_active, can_view_admins, requires_complete_profile,
                created_at, updated_at
            ) VALUES (
                :id, :email, :username, :name, :role, :password_hash,
                :is_active, :can_view_admins, :requires_complete_profile,
                :created_at, :updated_at
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
                "can_view_admins": True,
                "requires_complete_profile": False,
                "created_at": now,
                "updated_at": now,
            },
        )
        connection.commit()

    print("   • Conta Master criada: masterautonomocontrol")
    print("✅ Banco de dados inicializado com sucesso!")
    print("")
    print("📋 Credenciais Master:")
    print("   • Username: masterautonomocontrol")
    print("   • Password: Senhamaster123")
    print("   • Email: master@autonomocontrol.system")


if __name__ == "__main__":
    init_database()
