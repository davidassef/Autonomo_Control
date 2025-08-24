#!/usr/bin/env python3
"""
Script para configurar a conta Master única no sistema.
Este script:
1. Aplica a migração do banco de dados
2. Converte contas Master existentes para Admin
3. Cria a conta Master única com username 'masterautonomocontrol'
4. Configura as permissões adequadas

Uso: python scripts/admin/setup_master_account.py
"""

import sys
import os
from pathlib import Path
from sqlalchemy import text
from passlib.context import CryptContext
from datetime import datetime
import uuid

# Adicionar o diretório raiz do projeto ao path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.core.database import get_db, engine
from app.models.user import User
from app.core.security import get_password_hash

# Configuração de hash de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def apply_migration():
    """Aplica a migração do banco de dados"""
    print("📊 Aplicando migração do banco de dados...")

    migration_file = project_root / "migrations" / "add_username_and_secret_keys.sql"

    if not migration_file.exists():
        print(f"❌ Arquivo de migração não encontrado: {migration_file}")
        return False

    try:
        with open(migration_file, "r", encoding="utf-8") as f:
            migration_sql = f.read()

        # Dividir em comandos individuais (remover comentários e linhas vazias)
        commands = []
        for line in migration_sql.split(";"):
            line = line.strip()
            if line and not line.startswith("--") and not line.startswith("COMMENT"):
                commands.append(line)

        with engine.connect() as conn:
            for command in commands:
                if command.strip():
                    try:
                        conn.execute(text(command))
                        conn.commit()
                    except Exception as e:
                        if (
                            "already exists" in str(e).lower()
                            or "duplicate column" in str(e).lower()
                        ):
                            print(f"⚠️  Coluna já existe (ignorando): {e}")
                        else:
                            raise e

        print("✅ Migração aplicada com sucesso!")
        return True

    except Exception as e:
        print(f"❌ Erro ao aplicar migração: {e}")
        return False


def setup_master_account():
    """Configura a conta Master única"""
    print("👑 Configurando conta Master única...")

    try:
        db = next(get_db())

        # 1. Converter todas as contas Master existentes para Admin
        print("🔄 Convertendo contas Master existentes para Admin...")
        existing_masters = db.query(User).filter(User.role == "MASTER").all()

        converted_count = 0
        for master in existing_masters:
            master.role = "ADMIN"
            converted_count += 1
            print(f"   📝 Convertido: {master.email} -> ADMIN")

        if converted_count > 0:
            db.commit()
            print(f"✅ {converted_count} conta(s) Master convertida(s) para Admin")

        # 2. Verificar se a conta Master única já existe
        master_account = (
            db.query(User).filter(User.username == "masterautonomocontrol").first()
        )

        if master_account:
            print("⚠️  Conta Master única já existe, atualizando...")
            master_account.role = "MASTER"
            master_account.hashed_password = get_password_hash("Senhamaster123")
            master_account.is_active = True
            master_account.updated_at = datetime.utcnow()
        else:
            print("🆕 Criando nova conta Master única...")
            master_account = User(
                id=str(uuid.uuid4()),
                email="master@autonomocontrol.system",
                username="masterautonomocontrol",
                name="Master do Sistema",
                role="MASTER",
                hashed_password=get_password_hash("Senhamaster123"),
                is_active=True,
                created_at=datetime.utcnow(),
            )
            db.add(master_account)

        db.commit()
        print("✅ Conta Master única configurada com sucesso!")
        print(f"   📧 Email: {master_account.email}")
        print(f"   👤 Username: {master_account.username}")
        print(f"   🔑 Senha: Senhamaster123")

        return True

    except Exception as e:
        print(f"❌ Erro ao configurar conta Master: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def main():
    """Função principal"""
    print("🚀 Iniciando configuração da conta Master única...")
    print("=" * 50)

    # 1. Aplicar migração
    if not apply_migration():
        print("❌ Falha na migração. Abortando.")
        return False

    print()

    # 2. Configurar conta Master
    if not setup_master_account():
        print("❌ Falha na configuração da conta Master. Abortando.")
        return False

    print()
    print("=" * 50)
    print("🎉 Configuração concluída com sucesso!")
    print()
    print("📋 INFORMAÇÕES IMPORTANTES:")
    print("   • Apenas UMA conta Master existe no sistema")
    print("   • Login: masterautonomocontrol")
    print("   • Senha: Senhamaster123")
    print("   • Todas as outras contas Master foram convertidas para Admin")
    print("   • O sistema agora impede a criação de novas contas Master")
    print()
    print("⚠️  ATENÇÃO: Guarde essas credenciais em local seguro!")

    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
