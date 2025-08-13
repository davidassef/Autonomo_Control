"""Script para corrigir emails inválidos no banco de dados.
Executar: python fix_invalid_emails.py
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User


def fix_invalid_emails():
    """Corrige emails inválidos no banco de dados."""
    db = SessionLocal()
    try:
        # Buscar usuários com emails inválidos
        users = db.query(User).all()
        
        fixed_count = 0
        for user in users:
            original_email = user.email
            needs_fix = False
            
            # Verificar email 'system@seed' (sem domínio válido)
            if user.email == "system@seed":
                user.email = "system@seed.local"
                needs_fix = True
                print(f"Corrigindo email: {original_email} -> {user.email}")
            
            # Verificar email vazio
            elif not user.email or user.email.strip() == "":
                user.email = f"user{user.id}@placeholder.local"
                needs_fix = True
                print(f"Corrigindo email vazio para usuário ID {user.id}: -> {user.email}")
            
            # Verificar outros emails inválidos (sem @)
            elif "@" not in user.email:
                user.email = f"{user.email}@placeholder.local"
                needs_fix = True
                print(f"Corrigindo email sem @: {original_email} -> {user.email}")
            
            # Verificar emails com @ mas sem domínio válido (sem ponto após @)
            elif "@" in user.email and "." not in user.email.split("@")[1]:
                domain_part = user.email.split("@")[1]
                user.email = user.email.replace(f"@{domain_part}", f"@{domain_part}.local")
                needs_fix = True
                print(f"Corrigindo domínio inválido: {original_email} -> {user.email}")
            
            if needs_fix:
                fixed_count += 1
        
        if fixed_count > 0:
            db.commit()
            print(f"\nTotal de emails corrigidos: {fixed_count}")
        else:
            print("Nenhum email inválido encontrado.")
            
    except Exception as e:
        db.rollback()
        print(f"Erro ao corrigir emails: {e}")
    finally:
        db.close()


def list_all_users():
    """Lista todos os usuários para verificação."""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print("\nUsuários no banco de dados:")
        print("-" * 50)
        for user in users:
            print(f"ID: {user.id}, Email: '{user.email}', Nome: {user.name}")
        print(f"\nTotal: {len(users)} usuários")
    finally:
        db.close()


if __name__ == "__main__":
    print("=== Verificação e Correção de Emails Inválidos ===")
    
    print("\n1. Listando usuários antes da correção:")
    list_all_users()
    
    print("\n2. Corrigindo emails inválidos:")
    fix_invalid_emails()
    
    print("\n3. Listando usuários após a correção:")
    list_all_users()
    
    print("\n=== Correção concluída ===")