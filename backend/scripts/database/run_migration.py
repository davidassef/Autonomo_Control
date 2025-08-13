#!/usr/bin/env python3
"""
Script para executar migrações SQL
"""

import sys
from app.core.database import engine
from sqlalchemy import text

def run_migration(migration_file=None):
    if not migration_file:
        migration_file = 'migrations/create_audit_logs_table.sql'
    
    try:
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        with engine.connect() as conn:
            # Remover comentários e dividir comandos SQL
            lines = sql_content.split('\n')
            clean_lines = []
            for line in lines:
                # Remover comentários que começam com --
                if '--' in line:
                    line = line[:line.index('--')]
                if line.strip():
                    clean_lines.append(line)
            
            clean_sql = '\n'.join(clean_lines)
            commands = [cmd.strip() for cmd in clean_sql.split(';') if cmd.strip()]
            
            for command in commands:
                if command:
                    print(f"Executando: {command[:50]}...")
                    try:
                        conn.execute(text(command))
                    except Exception as cmd_error:
                        print(f"Erro no comando: {cmd_error}")
                        # Continuar com próximo comando se for erro de tabela já existente
                        if "already exists" not in str(cmd_error):
                            raise
            
            conn.commit()
            print(f"Migração {migration_file} executada com sucesso!")
            
    except Exception as e:
        print(f"Erro na migração: {e}")
        raise

if __name__ == "__main__":
    migration_file = sys.argv[1] if len(sys.argv) > 1 else None
    run_migration(migration_file)