#!/usr/bin/env python3
"""
Script para verificar todos os emails no banco de dados e identificar possíveis problemas.
"""

import sqlite3
import re
from pathlib import Path


def get_db_path():
    """Obter o caminho do banco de dados SQLite."""
    db_path = Path(__file__).parent / "autonomo_control.db"
    if not db_path.exists():
        print(f"❌ Banco de dados não encontrado: {db_path}")
        return None
    return str(db_path)


def is_valid_email(email):
    """Verificar se um email tem formato válido básico."""
    if not email or email.strip() == "":
        return False, "Email vazio"

    # Regex básica para validação de email
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    if not re.match(pattern, email):
        return False, "Formato inválido"

    # Verificar domínios problemáticos conhecidos
    problematic_domains = [
        "@placeholder.local",
        "@seed",
        "@localhost",
        "@test",
        "@example",  # sem .com
        "@invalid",
    ]

    for domain in problematic_domains:
        if domain in email:
            return False, f"Domínio problemático: {domain}"

    return True, "Válido"


def check_all_emails():
    """Verificar todos os emails no banco de dados."""
    db_path = get_db_path()
    if not db_path:
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Buscar todos os usuários
        cursor.execute(
            """
            SELECT id, name, email, role 
            FROM users 
            ORDER BY id
        """
        )

        users = cursor.fetchall()
        conn.close()

        print(f"\n📊 Verificando {len(users)} usuários no banco de dados:\n")

        valid_count = 0
        invalid_count = 0
        invalid_users = []

        for user in users:
            user_id, name, email, role = user
            is_valid, reason = is_valid_email(email)

            status = "✅" if is_valid else "❌"
            name_display = name if name else "N/A"
            email_display = email if email else "N/A"
            role_display = role if role else "N/A"
            print(
                f"{status} ID: {str(user_id):>2s} | Name: {name_display:15s} | Email: {email_display:35s} | Role: {role_display:10s} | {reason}"
            )

            if is_valid:
                valid_count += 1
            else:
                invalid_count += 1
                invalid_users.append(user)

        print(f"\n📈 Resumo:")
        print(f"  ✅ Emails válidos: {valid_count}")
        print(f"  ❌ Emails inválidos: {invalid_count}")

        if invalid_users:
            print(f"\n🔧 Usuários que precisam de correção:")
            for user in invalid_users:
                print(f"  - ID {user[0]}: {user[1]} ({user[2]})")

        return invalid_users

    except Exception as e:
        print(f"❌ Erro ao verificar emails: {e}")
        return []


def main():
    """Função principal."""
    print("🔍 Verificando todos os emails no banco de dados...")
    check_all_emails()


if __name__ == "__main__":
    main()
