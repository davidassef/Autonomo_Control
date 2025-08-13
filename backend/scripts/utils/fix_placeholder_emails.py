#!/usr/bin/env python3
"""
Script para corrigir emails com domínio '@placeholder.local' no banco de dados.
Esses emails são considerados inválidos pelo validador Pydantic.
"""

import sqlite3
import os
import sys
from pathlib import Path

# Adicionar o diretório do app ao path
sys.path.append(str(Path(__file__).parent / "app"))

def get_db_path():
    """Obter o caminho do banco de dados SQLite."""
    db_path = Path(__file__).parent / "autonomo_control.db"
    if not db_path.exists():
        print(f"❌ Banco de dados não encontrado: {db_path}")
        return None
    return str(db_path)

def identify_placeholder_emails():
    """Identificar todos os emails com domínio '@placeholder.local'."""
    db_path = get_db_path()
    if not db_path:
        return []
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Buscar usuários com emails '@placeholder.local'
        cursor.execute("""
            SELECT id, username, email, role 
            FROM users 
            WHERE email LIKE '%@placeholder.local'
        """)
        
        users = cursor.fetchall()
        conn.close()
        
        print(f"\n📊 Encontrados {len(users)} usuários com emails '@placeholder.local':")
        for user in users:
            print(f"  - ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Role: {user[3]}")
        
        return users
        
    except Exception as e:
        print(f"❌ Erro ao identificar emails: {e}")
        return []

def fix_placeholder_emails():
    """Corrigir emails com domínio '@placeholder.local' substituindo por '@example.com'."""
    db_path = get_db_path()
    if not db_path:
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Atualizar emails '@placeholder.local' para '@example.com'
        cursor.execute("""
            UPDATE users 
            SET email = REPLACE(email, '@placeholder.local', '@example.com')
            WHERE email LIKE '%@placeholder.local'
        """)
        
        affected_rows = cursor.rowcount
        conn.commit()
        conn.close()
        
        print(f"\n✅ Corrigidos {affected_rows} emails com domínio '@placeholder.local'")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao corrigir emails: {e}")
        return False

def verify_fixes():
    """Verificar se ainda existem emails com domínios inválidos."""
    db_path = get_db_path()
    if not db_path:
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar emails restantes com domínios problemáticos
        cursor.execute("""
            SELECT id, username, email, role 
            FROM users 
            WHERE email LIKE '%@placeholder.local' 
               OR email LIKE '%@seed' 
               OR email = ''
               OR email IS NULL
        """)
        
        problematic_users = cursor.fetchall()
        conn.close()
        
        if problematic_users:
            print(f"\n⚠️  Ainda existem {len(problematic_users)} usuários com emails problemáticos:")
            for user in problematic_users:
                print(f"  - ID: {user[0]}, Username: {user[1]}, Email: '{user[2]}', Role: {user[3]}")
        else:
            print("\n✅ Todos os emails estão com formato válido!")
        
    except Exception as e:
        print(f"❌ Erro ao verificar correções: {e}")

def main():
    """Função principal."""
    print("🔧 Iniciando correção de emails com domínio '@placeholder.local'...")
    
    # 1. Identificar emails problemáticos
    users_with_placeholder = identify_placeholder_emails()
    
    if not users_with_placeholder:
        print("\n✅ Nenhum email com domínio '@placeholder.local' encontrado.")
        return
    
    # 2. Corrigir emails
    if fix_placeholder_emails():
        print("\n🔍 Verificando correções...")
        verify_fixes()
    else:
        print("\n❌ Falha ao corrigir emails.")

if __name__ == "__main__":
    main()