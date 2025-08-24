import sqlite3
import os

# Conectar ao banco de dados
db_path = "app.db"
if not os.path.exists(db_path):
    print(f"Banco de dados {db_path} não encontrado")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Verificar estrutura da tabela users
print("Estrutura da tabela users:")
print("=" * 50)
cursor.execute("PRAGMA table_info(users)")
columns = cursor.fetchall()

for col in columns:
    print(
        f"Coluna: {col[1]}, Tipo: {col[2]}, Não Nulo: {col[3]}, Padrão: {col[4]}, PK: {col[5]}"
    )

# Verificar se as colunas de hierarquia existem
hierarchy_columns = ["can_view_admins", "promoted_by", "demoted_by", "demoted_at"]
existing_columns = [col[1] for col in columns]

print("\nStatus das colunas de hierarquia:")
print("=" * 50)
for col in hierarchy_columns:
    status = "✓ Existe" if col in existing_columns else "✗ Não existe"
    print(f"{col}: {status}")

conn.close()
