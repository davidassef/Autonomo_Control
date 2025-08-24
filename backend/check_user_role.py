#!/usr/bin/env python3
"""
Script para verificar o role do usuário admin e identificar o problema de permissão.
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.config import settings


def check_user_roles():
    """Verifica os roles dos usuários no sistema"""
    db: Session = SessionLocal()

    try:
        print("🔍 VERIFICAÇÃO DE ROLES DOS USUÁRIOS")
        print("=" * 50)

        # Verificar o usuário admin@autonomocontrol.com
        admin_user = (
            db.query(User).filter(User.email == "admin@autonomocontrol.com").first()
        )

        if admin_user:
            print(f"✅ Usuário admin encontrado:")
            print(f"   📧 Email: {admin_user.email}")
            print(f"   👤 Nome: {admin_user.name}")
            print(f"   🎭 Role: {admin_user.role}")
            print(f"   🆔 ID: {admin_user.id}")
            print(f"   ✅ Ativo: {admin_user.is_active}")
        else:
            print("❌ Usuário admin@autonomocontrol.com não encontrado")

        print("\n" + "=" * 50)
        print("📊 TODOS OS USUÁRIOS NO SISTEMA:")

        all_users = db.query(User).all()
        for user in all_users:
            status = "✅" if user.is_active else "❌"
            print(f"   {status} {user.email} - {user.role} - {user.name}")

        print(f"\n📈 Total de usuários: {len(all_users)}")

        # Verificar configuração MASTER_EMAIL
        print("\n" + "=" * 50)
        print("⚙️ CONFIGURAÇÃO MASTER_EMAIL:")
        print(f"   MASTER_EMAIL: {settings.MASTER_EMAIL}")

        # Verificar se existe usuário MASTER
        master_users = db.query(User).filter(User.role == "MASTER").all()
        print(f"\n👑 USUÁRIOS MASTER ({len(master_users)}):")
        for master in master_users:
            is_original = master.email == settings.MASTER_EMAIL
            original_mark = " (ORIGINAL)" if is_original else ""
            status = "✅" if master.is_active else "❌"
            print(f"   {status} {master.email} - {master.name}{original_mark}")

        # Verificar usuários ADMIN
        admin_users = db.query(User).filter(User.role == "ADMIN").all()
        print(f"\n🛡️ USUÁRIOS ADMIN ({len(admin_users)}):")
        for admin in admin_users:
            status = "✅" if admin.is_active else "❌"
            print(f"   {status} {admin.email} - {admin.name}")

    except Exception as e:
        print(f"❌ Erro ao verificar usuários: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    check_user_roles()
