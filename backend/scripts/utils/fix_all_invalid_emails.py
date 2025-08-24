#!/usr/bin/env python3
"""
Script para corrigir todos os emails inválidos no banco de dados.
Substitui domínios problemáticos por domínios válidos.
"""

import sqlite3
from pathlib import Path


def get_db_path():
    """Obter o caminho do banco de dados SQLite."""
    db_path = Path(__file__).parent / "autonomo_control.db"
    if not db_path.exists():
        print(f"❌ Banco de dados não encontrado: {db_path}")
        return None
    return str(db_path)


def fix_invalid_emails():
    """Corrigir todos os emails com domínios inválidos."""
    db_path = get_db_path()
    if not db_path:
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Mapeamento de correções
        corrections = [
            # Corrigir @placeholder.local para @example.com
            {
                "pattern": "@placeholder.local",
                "replacement": "@example.com",
                "description": "placeholder.local → example.com",
            },
            # Corrigir @seed.local para @seed.com
            {
                "pattern": "@seed.local",
                "replacement": "@seed.com",
                "description": "seed.local → seed.com",
            },
            # Corrigir @example (sem .com) para @example.com
            {
                "pattern": "@example.com",
                "replacement": "@example.com",
                "description": "Manter @example.com válido",
            },
            # Corrigir @teste.com para @test.com
            {
                "pattern": "@teste.com",
                "replacement": "@test.com",
                "description": "teste.com → test.com",
            },
        ]

        total_fixed = 0

        # Aplicar cada correção
        for correction in corrections:
            if correction["pattern"] == "@example.com":
                # Para @example.com, vamos corrigir apenas os que não têm .com
                cursor.execute(
                    """
                    UPDATE users 
                    SET email = REPLACE(email, '@example', '@example.com')
                    WHERE email LIKE '%@example' AND email NOT LIKE '%@example.com'
                """
                )
            else:
                cursor.execute(
                    """
                    UPDATE users 
                    SET email = REPLACE(email, ?, ?)
                    WHERE email LIKE ?
                """,
                    (
                        correction["pattern"],
                        correction["replacement"],
                        f"%{correction['pattern']}",
                    ),
                )

            affected = cursor.rowcount
            if affected > 0:
                print(f"✅ {correction['description']}: {affected} emails corrigidos")
                total_fixed += affected

        conn.commit()
        conn.close()

        print(f"\n🎉 Total de emails corrigidos: {total_fixed}")
        return True

    except Exception as e:
        print(f"❌ Erro ao corrigir emails: {e}")
        return False


def verify_corrections():
    """Verificar se as correções foram aplicadas corretamente."""
    db_path = get_db_path()
    if not db_path:
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Buscar todos os usuários após correção
        cursor.execute(
            """
            SELECT id, name, email, role 
            FROM users 
            ORDER BY name
        """
        )

        users = cursor.fetchall()
        conn.close()

        print(f"\n📊 Verificando {len(users)} usuários após correções:\n")

        for user in users:
            user_id, name, email, role = user
            name_display = name if name else "N/A"
            email_display = email if email else "N/A"
            role_display = role if role else "N/A"
            print(f"✅ {name_display:15s} | {email_display:35s} | {role_display}")

    except Exception as e:
        print(f"❌ Erro ao verificar correções: {e}")


def main():
    """Função principal."""
    print("🔧 Iniciando correção de todos os emails inválidos...\n")

    if fix_invalid_emails():
        print("\n🔍 Verificando resultado das correções...")
        verify_corrections()
    else:
        print("\n❌ Falha ao corrigir emails.")


if __name__ == "__main__":
    main()
