#!/usr/bin/env python3
"""
Script para criar um usuário administrador de exemplo no sistema Autônomo Control
"""

import asyncio
import sys
from pathlib import Path

# Adicionar o diretório raiz ao path para imports
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User
from app.models.category import Category
from app.models.entry import Entry, EntryType
from app.core.security import get_password_hash  # Agora usado para permitir login local
from datetime import datetime, date
import uuid

def create_admin_user():
    """Cria um usuário administrador de exemplo"""
    db: Session = SessionLocal()
    # Verificar se o usuário admin já existe
    existing_admin = db.query(User).filter(User.email == "admin@autonomocontrol.com").first()
    if existing_admin:
        print("✅ Usuário admin já existe!")
        print(f"   📧 Email: {existing_admin.email}")
        print(f"   👤 Nome: {existing_admin.name}")
        print(f"   🆔 ID: {existing_admin.id}")
        db.close()
        return existing_admin

    try:
        dev_password = "admin123"  # senha padrão dev
        admin_user = User(
            id=str(uuid.uuid4()),
            name="Administrador Sistema",
            email="admin@autonomocontrol.com",
            picture="https://via.placeholder.com/150/1f2937/ffffff?text=ADMIN",
            is_active=True,
            google_id="admin_google_id_example",
            hashed_password=get_password_hash(dev_password)
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print("🎉 Usuário admin criado com sucesso!")
        print(f"   📧 Email: {admin_user.email}")
        print(f"   👤 Nome: {admin_user.name}")
        print(f"   🆔 ID: {admin_user.id}")
        print(f"   🖼️ Avatar: {admin_user.picture}")
        create_default_categories(db, str(admin_user.id))
        create_sample_entries(db, str(admin_user.id))
        return admin_user
    except Exception as e:  # noqa: BLE001
        print(f"❌ Erro ao criar usuário admin: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def create_default_categories(db: Session, user_id: str):
    """Cria categorias padrão para o usuário admin"""

    default_categories = [
        # Categorias de Receita
        {"name": "Freelance", "type": "INCOME", "color": "#10B981", "icon": "💼"},
        {"name": "Consultoria", "type": "INCOME", "color": "#3B82F6", "icon": "🎯"},
        {"name": "Vendas", "type": "INCOME", "color": "#8B5CF6", "icon": "💰"},
        {"name": "Investimentos", "type": "INCOME", "color": "#F59E0B", "icon": "📈"},
        {"name": "Outros Recebimentos", "type": "INCOME", "color": "#06B6D4", "icon": "💎"},

        # Categorias de Despesa
        {"name": "Escritório", "type": "EXPENSE", "color": "#EF4444", "icon": "🏢"},
        {"name": "Marketing", "type": "EXPENSE", "color": "#F97316", "icon": "📢"},
        {"name": "Tecnologia", "type": "EXPENSE", "color": "#6366F1", "icon": "💻"},
        {"name": "Transporte", "type": "EXPENSE", "color": "#84CC16", "icon": "🚗"},
        {"name": "Alimentação", "type": "EXPENSE", "color": "#EC4899", "icon": "🍽️"},
        {"name": "Saúde", "type": "EXPENSE", "color": "#14B8A6", "icon": "🏥"},
        {"name": "Educação", "type": "EXPENSE", "color": "#A855F7", "icon": "📚"},
        {"name": "Impostos", "type": "EXPENSE", "color": "#DC2626", "icon": "🏛️"},
    ]

    created_categories = []

    for cat_data in default_categories:
        # Verificar se a categoria já existe
        existing_cat = db.query(Category).filter(
            Category.name == cat_data["name"],
            Category.user_id == user_id
        ).first()

        if not existing_cat:
            category = Category(
                id=str(uuid.uuid4()),
                name=cat_data["name"],
                type=cat_data["type"],
                color=cat_data["color"],
                icon=cat_data["icon"],
                user_id=user_id,
                created_at=datetime.utcnow()
            )
            db.add(category)
            created_categories.append(category)

    db.commit()
    print(f"📁 {len(created_categories)} categorias padrão criadas!")

    return created_categories

def create_sample_entries(db: Session, user_id: str):
    """Cria lançamentos de exemplo para o usuário admin"""

    # Buscar algumas categorias criadas
    income_categories = db.query(Category).filter(
        Category.user_id == user_id,
        Category.type == "INCOME"
    ).limit(3).all()

    expense_categories = db.query(Category).filter(
        Category.user_id == user_id,
        Category.type == "EXPENSE"
    ).limit(5).all()

    sample_entries = []

    if income_categories:
        # Receitas de exemplo
        sample_entries.extend([
            {
                "amount": 2500.00,
                "description": "Projeto de desenvolvimento web",
                "type": EntryType.INCOME,
                "category_id": income_categories[0].id,
                "date": date(2024, 12, 15)
            },
            {
                "amount": 1800.00,
                "description": "Consultoria em React",
                "type": EntryType.INCOME,
                "category_id": income_categories[1].id if len(income_categories) > 1 else income_categories[0].id,
                "date": date(2024, 12, 10)
            },
            {
                "amount": 3200.00,
                "description": "Desenvolvimento de API",
                "type": EntryType.INCOME,
                "category_id": income_categories[2].id if len(income_categories) > 2 else income_categories[0].id,
                "date": date(2024, 12, 5)
            }
        ])

    if expense_categories:
        # Despesas de exemplo
        sample_entries.extend([
            {
                "amount": 150.00,
                "description": "Hospedagem servidor",
                "type": EntryType.EXPENSE,
                "category_id": expense_categories[0].id,
                "date": date(2024, 12, 1)
            },
            {
                "amount": 89.90,
                "description": "Adobe Creative Suite",
                "type": EntryType.EXPENSE,
                "category_id": expense_categories[1].id if len(expense_categories) > 1 else expense_categories[0].id,
                "date": date(2024, 12, 3)
            },
            {
                "amount": 45.00,
                "description": "Transporte para cliente",
                "type": EntryType.EXPENSE,
                "category_id": expense_categories[2].id if len(expense_categories) > 2 else expense_categories[0].id,
                "date": date(2024, 12, 8)
            },
            {
                "amount": 120.00,
                "description": "Almoço com cliente",
                "type": EntryType.EXPENSE,
                "category_id": expense_categories[3].id if len(expense_categories) > 3 else expense_categories[0].id,
                "date": date(2024, 12, 12)
            }
        ])

    created_entries = []

    for entry_data in sample_entries:
        entry = Entry(
            id=str(uuid.uuid4()),
            amount=entry_data["amount"],
            description=entry_data["description"],
            type=entry_data["type"],
            category_id=entry_data["category_id"],
            date=entry_data["date"],
            user_id=user_id,
            created_at=datetime.utcnow()
        )
        db.add(entry)
        created_entries.append(entry)

    db.commit()
    print(f"💼 {len(created_entries)} lançamentos de exemplo criados!")

    return created_entries

if __name__ == "__main__":
    print("🚀 Criando usuário administrador de exemplo...")
    print("=" * 50)

    admin_user = create_admin_user()

    if admin_user:
        print("\n" + "=" * 50)
        print("✅ USUÁRIO ADMIN CRIADO COM SUCESSO!")
        print("=" * 50)
        print("📝 CREDENCIAIS DE ACESSO:")
        print("   📧 Email: admin@autonomocontrol.com")
        print("   🔑 Senha: admin123 (hash salva – login local habilitado)")
        print("=" * 50)
        print("🌟 Você pode agora fazer login na aplicação!")
        print("🔗 Frontend: http://localhost:3000")
        print("🔗 Backend API: http://localhost:8000/docs")
    else:
        print("\n❌ Falha ao criar usuário admin!")
        sys.exit(1)
