import sqlite3
import os
from datetime import datetime

# Conectar ao banco de dados
db_path = "app.db"
if not os.path.exists(db_path):
    print(f"Banco de dados {db_path} não encontrado")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Adicionando colunas de hierarquia...")

    # Verificar se a tabela users existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        print("Tabela users não encontrada!")
        exit(1)

    # Lista de colunas para adicionar
    columns_to_add = [
        ("can_view_admins", "BOOLEAN DEFAULT 0 NOT NULL"),
        ("promoted_by", "TEXT NULL"),
        ("demoted_by", "TEXT NULL"),
        ("demoted_at", "TEXT NULL"),
    ]

    # Verificar quais colunas já existem
    cursor.execute("PRAGMA table_info(users)")
    existing_columns = [col[1] for col in cursor.fetchall()]

    # Adicionar apenas colunas que não existem
    for col_name, col_definition in columns_to_add:
        if col_name not in existing_columns:
            sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_definition}"
            print(f"Executando: {sql}")
            cursor.execute(sql)
            print(f"✓ Coluna {col_name} adicionada com sucesso")
        else:
            print(f"⚠ Coluna {col_name} já existe")

    # Criar índices
    indices = [
        "CREATE INDEX IF NOT EXISTS idx_users_can_view_admins ON users(can_view_admins)",
        "CREATE INDEX IF NOT EXISTS idx_users_promoted_by ON users(promoted_by)",
        "CREATE INDEX IF NOT EXISTS idx_users_demoted_by ON users(demoted_by)",
        "CREATE INDEX IF NOT EXISTS idx_users_demoted_at ON users(demoted_at)",
    ]

    for index_sql in indices:
        print(f"Executando: {index_sql}")
        cursor.execute(index_sql)
        print("✓ Índice criado")

    # Atualizar usuários MASTER existentes
    cursor.execute("UPDATE users SET can_view_admins = 1 WHERE role = 'MASTER'")
    updated_rows = cursor.rowcount
    print(f"✓ {updated_rows} usuários MASTER atualizados")

    # Commit das alterações
    conn.commit()
    print("\n✅ Migração concluída com sucesso!")

    # Verificar estrutura final
    print("\nEstrutura final da tabela users:")
    print("=" * 50)
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()

    for col in columns:
        print(f"Coluna: {col[1]}, Tipo: {col[2]}, Não Nulo: {col[3]}, Padrão: {col[4]}")

except Exception as e:
    print(f"❌ Erro durante a migração: {e}")
    conn.rollback()
finally:
    conn.close()
