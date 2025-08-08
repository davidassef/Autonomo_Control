#!/usr/bin/env python3
"""
Script para verificar se o usuário admin existe e tem senha configurada
"""

import sys
from pathlib import Path

# Adicionar o diretório raiz ao path para imports
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User

def check_admin_user():
    """Verifica se o usuário admin existe"""
    db: Session = SessionLocal()

    try:
        # Buscar o usuário admin
        admin_user = db.query(User).filter(User.email == "admin@autonomocontrol.com").first()

        print("🔍 VERIFICAÇÃO DO USUÁRIO ADMIN")
        print("=" * 50)

        if admin_user:
            print("✅ Usuário admin encontrado!")
            print(f"   📧 Email: {admin_user.email}")
            print(f"   🆔 ID: {admin_user.id}")
            print(f"   👤 Nome: {admin_user.name}")
            print(f"   🔑 Tem senha hash: {'Sim' if admin_user.hashed_password else 'Não'}")
            if admin_user.hashed_password:
                print(f"   🔐 Hash (primeiros 20 chars): {admin_user.hashed_password[:20]}...")
        else:
            print("❌ Usuário admin NÃO encontrado!")

            # Verificar quantos usuários existem
            total_users = db.query(User).count()
            print(f"📊 Total de usuários no banco: {total_users}")

            if total_users > 0:
                print("👥 Usuários existentes:")
                users = db.query(User).all()
                for user in users:
                    print(f"   - {user.email} (ID: {user.id})")

    except Exception as e:
        print(f"❌ Erro ao verificar usuário admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_admin_user()
