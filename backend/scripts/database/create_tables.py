#!/usr/bin/env python3
"""
Script para criar todas as tabelas do banco de dados
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
from app.models.user import User
from app.models.category import Category
from app.models.entry import Entry
from sqlalchemy import text

def create_all_tables():
    """Cria todas as tabelas do banco de dados"""
    try:
        print("Criando todas as tabelas...")
        
        # Importar todos os modelos para garantir que estejam registrados
        from app.models import user, category, entry
        
        # Criar todas as tabelas
        User.metadata.create_all(bind=engine)
        
        print("✅ Tabelas criadas com sucesso!")
        
        # Verificar se as tabelas foram criadas
        with engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            tables = result.fetchall()
            
            print("\nTabelas criadas:")
            for table in tables:
                print(f"- {table[0]}")
                
            # Verificar estrutura da tabela users
            print("\nEstrutura da tabela users:")
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = result.fetchall()
            
            for col in columns:
                print(f"  {col[1]} ({col[2]})")
                
    except Exception as e:
        print(f"❌ Erro ao criar tabelas: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = create_all_tables()
    if not success:
        sys.exit(1)