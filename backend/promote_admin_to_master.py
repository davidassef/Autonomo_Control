#!/usr/bin/env python3
"""
Script para promover o usuário admin@autonomocontrol.com para MASTER
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from datetime import datetime


def promote_admin_to_master():
    """Promove o usuário admin@autonomocontrol.com para MASTER"""
    db: Session = SessionLocal()

    try:
        print("🔄 PROMOVENDO USUÁRIO ADMIN PARA MASTER")
        print("=" * 50)

        # Buscar o usuário admin
        admin_user = (
            db.query(User).filter(User.email == "admin@autonomocontrol.com").first()
        )

        if not admin_user:
            print("❌ Usuário admin@autonomocontrol.com não encontrado")
            return False

        print(f"✅ Usuário encontrado: {admin_user.name}")
        print(f"   📧 Email: {admin_user.email}")
        print(f"   🎭 Role atual: {admin_user.role}")

        # Promover para MASTER
        admin_user.role = "MASTER"
        admin_user.can_view_admins = True  # MASTERs podem ver outros admins
        admin_user.updated_at = datetime.utcnow()

        db.commit()

        print(f"\n🎉 Usuário promovido com sucesso!")
        print(f"   🎭 Novo role: {admin_user.role}")
        print(f"   👁️ Pode ver admins: {admin_user.can_view_admins}")

        return True

    except Exception as e:
        print(f"❌ Erro ao promover usuário: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = promote_admin_to_master()
    if success:
        print("\n✅ Promoção concluída com sucesso!")
        print(
            "🔐 Agora o usuário admin@autonomocontrol.com pode acessar todas as funcionalidades administrativas."
        )
    else:
        print("\n❌ Falha na promoção do usuário.")
