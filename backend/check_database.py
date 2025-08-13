import sqlite3
import os

# Verificar se o banco existe
db_path = 'app.db'
print(f"Verificando banco de dados: {db_path}")
print(f"Arquivo existe: {os.path.exists(db_path)}")

if os.path.exists(db_path):
    print(f"Tamanho do arquivo: {os.path.getsize(db_path)} bytes")
    
    # Conectar e listar tabelas
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("\nTabelas no banco de dados:")
    print("=" * 30)
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    if tables:
        for table in tables:
            print(f"- {table[0]}")
            
            # Mostrar estrutura de cada tabela
            cursor.execute(f"PRAGMA table_info({table[0]})")
            columns = cursor.fetchall()
            print(f"  Colunas ({len(columns)}):")
            for col in columns:
                print(f"    {col[1]} ({col[2]})")
            print()
    else:
        print("Nenhuma tabela encontrada")
    
    conn.close()
else:
    print("Banco de dados não existe. Precisa ser criado.")
    
    # Verificar se existe algum arquivo de banco alternativo
    possible_db_files = ['database.db', 'sqlite.db', 'data.db']
    for db_file in possible_db_files:
        if os.path.exists(db_file):
            print(f"Encontrado arquivo alternativo: {db_file}")