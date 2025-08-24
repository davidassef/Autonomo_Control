#!/usr/bin/env python3
"""
Script para configurar a conta Master única no sistema.
Este script:
1. Adiciona campos faltantes na tabela users
2. Converte contas Master existentes para Admin
3. Cria a conta Master única com username 'masterautonomocontrol'
4. Configura as permissões adequadas

Uso: python setup_master_account.py
"""

import sys
from sqlalchemy import text, inspect
from datetime import datetime
import uuid
from passlib.context import CryptContext

from app.core.database import engine
from app.core.security import get_password_hash

# Configuração de hash de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def check_and_add_missing_columns():
    """Verifica e adiciona colunas faltantes na tabela users"""
    print("📊 Verificando colunas da tabela users...")

    with engine.connect() as conn:
        # Verificar colunas existentes
        result = conn.execute(text("PRAGMA table_info(users)"))
        existing_columns = [row[1] for row in result]

        # Colunas necessárias
        required_columns = {
            "secret_key_hash": "VARCHAR(255)",
        }

        # Adicionar colunas faltantes
        for column_name, column_type in required_columns.items():
            if column_name not in existing_columns:
                print(f"   ➕ Adicionando coluna: {column_name}")
                conn.execute(
                    text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")
                )
                conn.commit()
            else:
                print(f"   ✅ Coluna já existe: {column_name}")

        # Verificar se índice username existe
        try:
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users(username)"
                )
            )
            conn.commit()
            print("   ✅ Índice único para username criado/verificado")
        except Exception as e:
            print(f"   ⚠️  Aviso sobre índice username: {e}")

    print("✅ Verificação de colunas concluída!")


def setup_master_account():
    """Configura a conta Master única"""
    print("👑 Configurando conta Master única...")

    try:
        with engine.connect() as conn:
            # 1. Converter todas as contas Master existentes para Admin
            print("🔄 Convertendo contas Master existentes para Admin...")
            result = conn.execute(
                text("SELECT email, role FROM users WHERE role = 'MASTER'")
            )
            existing_masters = result.fetchall()

            converted_count = 0
            for master in existing_masters:
                print(f"   📝 Convertendo: {master[0]} -> ADMIN")
                converted_count += 1

            if converted_count > 0:
                conn.execute(
                    text("UPDATE users SET role = 'ADMIN' WHERE role = 'MASTER'")
                )
                conn.commit()
                print(f"✅ {converted_count} conta(s) Master convertida(s) para Admin")
            else:
                print("ℹ️  Nenhuma conta Master existente encontrada")

            # 2. Verificar se a conta Master única já existe
            result = conn.execute(
                text(
                    "SELECT id, email, username FROM users WHERE username = 'masterautonomocontrol'"
                )
            )
            master_account = result.fetchone()

            if master_account:
                print("⚠️  Conta Master única já existe, atualizando...")
                conn.execute(
                    text(
                        """
                    UPDATE users 
                    SET role = 'MASTER', 
                        hashed_password = :password_hash, 
                        is_active = 1, 
                        updated_at = :updated_at
                    WHERE username = 'masterautonomocontrol'
                """
                    ),
                    {
                        "password_hash": get_password_hash("Senhamaster123"),
                        "updated_at": datetime.utcnow(),
                    },
                )
                print(f"   📧 Email: {master_account[1]}")
                print(f"   👤 Username: {master_account[2]}")
            else:
                print("🆕 Criando nova conta Master única...")
                master_id = str(uuid.uuid4())
                now = datetime.utcnow()

                conn.execute(
                    text(
                        """
                    INSERT INTO users (
                        id, email, username, name, role, hashed_password, 
                        is_active, can_view_admins, requires_complete_profile, created_at, updated_at
                    ) VALUES (
                        :id, :email, :username, :name, :role, :password_hash,
                        :is_active, :can_view_admins, :requires_complete_profile, :created_at, :updated_at
                    )
                """
                    ),
                    {
                        "id": master_id,
                        "email": "master@autonomocontrol.system",
                        "username": "masterautonomocontrol",
                        "name": "Master do Sistema",
                        "role": "MASTER",
                        "password_hash": get_password_hash("Senhamaster123"),
                        "is_active": True,
                        "can_view_admins": True,
                        "requires_complete_profile": False,
                        "created_at": now,
                        "updated_at": now,
                    },
                )
                print(f"   📧 Email: master@autonomocontrol.system")
                print(f"   👤 Username: masterautonomocontrol")

            conn.commit()
            print("✅ Conta Master única configurada com sucesso!")
            print(f"   🔑 Senha: Senhamaster123")

            return True

    except Exception as e:
        print(f"❌ Erro ao configurar conta Master: {e}")
        return False


def main():
    """Função principal"""
    print("🚀 Iniciando configuração da conta Master única...")
    print("=" * 50)

    # 1. Verificar e adicionar colunas faltantes
    check_and_add_missing_columns()
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
