#!/usr/bin/env python3
"""
Script para atualizar o usuário admin com senha hash
"""

import sys
from pathlib import Path

# Adicionar o diretório raiz ao path para imports
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash


def update_admin_password():
    """Atualiza a senha do usuário admin"""
    db: Session = SessionLocal()

    try:
        # Buscar o usuário admin
        admin_user = (
            db.query(User).filter(User.email == "admin@autonomocontrol.com").first()
        )
        if not admin_user:
            print("❌ Usuário admin não encontrado!")
            return False

        # Definir senha padrão
        admin_password = "admin123"
        hashed_password = get_password_hash(admin_password)

        # Atualizar a senha
        admin_user.hashed_password = hashed_password
        db.commit()
        db.refresh(admin_user)

        print("✅ Senha do usuário admin atualizada com sucesso!")
        print(f"   📧 Email: {admin_user.email}")
        print(f"   🔑 Senha: {admin_password}")
        print(f"   🆔 ID: {admin_user.id}")

        return True

    except Exception as e:
        print(f"❌ Erro ao atualizar senha do admin: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("🔐 Atualizando senha do usuário admin...")
    print("=" * 50)

    success = update_admin_password()

    if success:
        print("\n" + "=" * 50)
        print("✅ SENHA ADMIN ATUALIZADA COM SUCESSO!")
        print("=" * 50)
        print("📝 CREDENCIAIS DE ACESSO:")
        print("   📧 Email: admin@autonomocontrol.com")
        print("   🔑 Senha: admin123")
        print("=" * 50)
        print("🌟 Agora você pode fazer login na aplicação!")
        print("🔗 Frontend: http://localhost:3000")
    else:
        print("\n❌ Falha ao atualizar senha do admin!")
        sys.exit(1)
