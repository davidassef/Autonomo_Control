#!/usr/bin/env python3
"""
Script para debugar o erro 403 no endpoint /admin/users/{id}/status
"""

import requests
import json


def test_403_error():
    base_url = "http://127.0.0.1:8000/api/v1"

    # 1. Fazer login para obter token
    print("1. Fazendo login...")
    login_data = {"username": "admin@autonomocontrol.com", "password": "admin123"}

    try:
        login_response = requests.post(
            f"{base_url}/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data["access_token"]
            print(
                f"✓ Login realizado com sucesso. Role: {token_data.get('role', 'N/A')}"
            )

            headers = {"Authorization": f"Bearer {token}"}

            # 2. Listar usuários
            print("\n2. Listando usuários...")
            users_response = requests.get(f"{base_url}/admin/users/", headers=headers)

            if users_response.status_code == 200:
                users = users_response.json()
                print(f"✓ Total de usuários: {len(users)}")

                # 3. Identificar usuário problemático do log
                target_user_id = "0ff584ca-b790-4871-b7fc-e8cac0ca4e93"
                target_user = None

                for user in users:
                    if user.get("id") == target_user_id:
                        target_user = user
                        break

                if target_user:
                    print(f"\n3. Usuário encontrado:")
                    print(f"   ID: {target_user['id']}")
                    print(f"   Nome: {target_user['name']}")
                    print(f"   Email: {target_user['email']}")
                    print(f"   Role: {target_user['role']}")
                    print(f"   Ativo: {target_user['is_active']}")

                    # 4. Testar endpoint problemático
                    print(
                        f"\n4. Testando endpoint /admin/users/{target_user_id}/status..."
                    )

                    status_data = {"is_active": not target_user["is_active"]}

                    status_response = requests.patch(
                        f"{base_url}/admin/users/{target_user_id}/status",
                        json=status_data,
                        headers=headers,
                    )

                    print(f"Status da resposta: {status_response.status_code}")

                    if status_response.status_code == 403:
                        print("❌ Erro 403 confirmado!")
                        try:
                            error_data = status_response.json()
                            print(f"Detalhes do erro: {error_data}")
                        except:
                            print(f"Texto do erro: {status_response.text}")
                    elif status_response.status_code == 200:
                        print("✓ Endpoint funcionando corretamente")
                        updated_user = status_response.json()
                        print(
                            f"Novo status: {'Ativo' if updated_user.get('is_active') else 'Inativo'}"
                        )
                    else:
                        print(f"❌ Erro inesperado: {status_response.status_code}")
                        print(f"Resposta: {status_response.text}")

                else:
                    print(f"❌ Usuário {target_user_id} não encontrado")
                    print("Usuários disponíveis:")
                    for user in users[:3]:  # Mostrar apenas os primeiros 3
                        print(
                            f"   - {user['name']} ({user['id']}) - Role: {user['role']}"
                        )

            else:
                print(f"❌ Erro ao listar usuários: {users_response.status_code}")
                print(f"Resposta: {users_response.text}")

        else:
            print(f"❌ Erro no login: {login_response.status_code}")
            print(f"Resposta: {login_response.text}")

    except Exception as e:
        print(f"❌ Erro na execução: {e}")


if __name__ == "__main__":
    test_403_error()
