#!/usr/bin/env python3
"""
Script para testar o sistema de hierarquia MASTER/ADMIN
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.models.user import User
from app.services.hierarchy_service import HierarchyService
from app.core.security import get_password_hash
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

def test_hierarchy_system():
    """Testa o sistema de hierarquia"""
    db = next(get_db())
    hierarchy_service = HierarchyService(db)
    
    try:
        print("🧪 Testando Sistema de Hierarquia MASTER/ADMIN")
        print("=" * 60)
        
        # Limpar dados de teste anteriores
        print("\n0. Limpando dados de teste anteriores...")
        db.query(User).filter(User.email.in_(['master@empresa.com', 'usuario@empresa.com', 'usuario2@empresa.com'])).delete(synchronize_session=False)
        db.commit()
        print("✅ Dados anteriores removidos")
        
        # 1. Criar usuário MASTER
        print("\n1. Criando usuário MASTER...")
        master_user = User(
            id=str(uuid.uuid4()),
            email="master@empresa.com",
            name="Master User",
            role="MASTER",
            is_active=True,
            can_view_admins=True,
            hashed_password=get_password_hash("master123"),
            created_at=datetime.utcnow()
        )
        db.add(master_user)
        db.commit()
        print(f"✅ MASTER criado: {master_user.email} (ID: {master_user.id})")
        
        # 2. Criar usuário comum
        print("\n2. Criando usuário comum...")
        common_user = User(
            id=str(uuid.uuid4()),
            email="usuario@empresa.com",
            name="Usuário Comum",
            role="USER",
            is_active=True,
            can_view_admins=False,
            hashed_password=get_password_hash("user123"),
            created_at=datetime.utcnow()
        )
        db.add(common_user)
        db.commit()
        print(f"✅ USER criado: {common_user.email} (ID: {common_user.id})")
        
        # 3. MASTER promove usuário comum para ADMIN
        print("\n3. MASTER promovendo usuário para ADMIN...")
        result = hierarchy_service.promote_to_admin(
            master_user=master_user,
            target_user=common_user,
            reason="Promoção para teste do sistema"
        )
        if result:
            print(f"✅ Usuário promovido para ADMIN com sucesso")
        else:
            print(f"❌ Falha ao promover usuário")
        
        # 4. Criar outro usuário comum
        print("\n4. Criando segundo usuário comum...")
        user2 = User(
            id=str(uuid.uuid4()),
            email="usuario2@empresa.com",
            name="Usuário Comum 2",
            role="USER",
            is_active=True,
            can_view_admins=False,
            hashed_password=get_password_hash("user2123"),
            created_at=datetime.utcnow()
        )
        db.add(user2)
        db.commit()
        print(f"✅ USER 2 criado: {user2.email} (ID: {user2.id})")
        
        # 5. Testar visibilidade - MASTER pode ver todos
        print("\n5. Testando visibilidade - MASTER vê todos os usuários:")
        visible_users = hierarchy_service.get_visible_users(master_user)
        print(f"   MASTER vê {len(visible_users)} usuários:")
        for user in visible_users:
            print(f"   - {user.email} ({user.role})")
        
        # 6. Testar visibilidade - ADMIN vê apenas USERs (não outros ADMINs)
        print("\n6. Testando visibilidade - ADMIN vê apenas USERs:")
        db.refresh(common_user)  # Atualizar dados do usuário
        visible_users_admin = hierarchy_service.get_visible_users(common_user)
        print(f"   ADMIN vê {len(visible_users_admin)} usuários:")
        for user in visible_users_admin:
            print(f"   - {user.email} ({user.role})")
        
        # 7. MASTER permite que ADMIN veja outros ADMINs
        print("\n7. MASTER permitindo que ADMIN veja outros ADMINs...")
        result = hierarchy_service.toggle_admin_visibility(
            master_user=master_user,
            target_admin=common_user,
            can_view=True
        )
        if result:
            print(f"✅ Permissão de visibilidade atualizada")
        
        # 8. Testar visibilidade novamente - ADMIN agora pode ver outros ADMINs
        print("\n8. Testando visibilidade - ADMIN agora vê outros ADMINs:")
        db.refresh(common_user)
        visible_users_admin2 = hierarchy_service.get_visible_users(common_user)
        print(f"   ADMIN vê {len(visible_users_admin2)} usuários:")
        for user in visible_users_admin2:
            print(f"   - {user.email} ({user.role})")
        
        # 9. MASTER rebaixa ADMIN para USER
        print("\n9. MASTER rebaixando ADMIN para USER...")
        result = hierarchy_service.demote_to_user(
            master_user=master_user,
            target_user=common_user,
            reason="Rebaixamento para teste do sistema"
        )
        if result:
            print(f"✅ Usuário rebaixado para USER com sucesso")
        
        # 10. Verificar estado final
        print("\n10. Estado final dos usuários:")
        all_users = db.query(User).all()
        for user in all_users:
            print(f"   - {user.email}: {user.role} (can_view_admins: {user.can_view_admins})")
        
        print("\n🎉 Teste do sistema de hierarquia concluído com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = test_hierarchy_system()
    if not success:
        sys.exit(1)