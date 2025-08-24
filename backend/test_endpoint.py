#!/usr/bin/env python3
"""
Script para testar endpoints da API
"""

import requests
import json

# Fazer login
login_data = {"username": "teste@master.com", "password": "Senhamestre123"}

print("=== TESTE DE ENDPOINTS ===")
print("1. Fazendo login...")

response = requests.post(
    "http://127.0.0.1:8000/api/v1/auth/token",
    data=login_data,
    headers={"Content-Type": "application/x-www-form-urlencoded"},
)

if response.status_code == 200:
    token_data = response.json()
    token = token_data["access_token"]
    print(f"✓ Login bem-sucedido")
    print(f"Token: {token[:50]}...")

    headers = {"Authorization": f"Bearer {token}"}

    # Testar endpoint audit-logs/stats
    print("\n2. Testando /api/v1/audit-logs/stats...")
    response = requests.get(
        "http://127.0.0.1:8000/api/v1/audit-logs/stats?days=30", headers=headers
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✓ Endpoint audit-logs/stats funcionando!")
    else:
        print(f"✗ Erro no endpoint audit-logs/stats: {response.text}")

    # Primeiro, obter lista de usuários para pegar um ID válido
    print("\n3. Obtendo lista de usuários...")
    response = requests.get("http://127.0.0.1:8000/api/v1/admin/users", headers=headers)

    if response.status_code == 200:
        users = response.json()
        if users:
            # Pegar o primeiro usuário que não seja MASTER
            test_user = None
            for user in users:
                if user.get("role") != "MASTER":
                    test_user = user
                    break

            if test_user:
                user_id = test_user["id"]
                print(
                    f"✓ Usuário de teste encontrado: {test_user['name']} (ID: {user_id})"
                )

                # Testar endpoint admin/users/{id}/status
                print(f"\n4. Testando /api/v1/admin/users/{user_id}/status...")

                # Primeiro fazer um GET para ver o status atual
                response = requests.get(
                    f"http://127.0.0.1:8000/api/v1/admin/users/{user_id}",
                    headers=headers,
                )

                if response.status_code == 200:
                    current_user = response.json()
                    current_status = current_user.get("is_active", True)
                    print(
                        f"Status atual do usuário: {'Ativo' if current_status else 'Inativo'}"
                    )

                    # Testar mudança de status (PATCH)
                    new_status = not current_status  # Inverter o status
                    status_data = {"is_active": new_status}

                    response = requests.patch(
                        f"http://127.0.0.1:8000/api/v1/admin/users/{user_id}/status",
                        json=status_data,
                        headers=headers,
                    )

                    print(f"Status da requisição PATCH: {response.status_code}")
                    if response.status_code == 200:
                        updated_user = response.json()
                        print(f"✓ Endpoint admin/users/{{id}}/status funcionando!")
                        print(
                            f"Novo status: {'Ativo' if updated_user.get('is_active') else 'Inativo'}"
                        )

                        # Reverter o status para o original
                        revert_data = {"is_active": current_status}
                        requests.patch(
                            f"http://127.0.0.1:8000/api/v1/admin/users/{user_id}/status",
                            json=revert_data,
                            headers=headers,
                        )
                        print("Status revertido para o original")
                    else:
                        print(
                            f"✗ Erro no endpoint admin/users/{{id}}/status: {response.text}"
                        )
                else:
                    print(f"✗ Erro ao obter usuário: {response.text}")
            else:
                print("✗ Nenhum usuário não-MASTER encontrado para teste")
        else:
            print("✗ Nenhum usuário encontrado")
    else:
        print(f"✗ Erro ao obter lista de usuários: {response.text}")

else:
    print(f"✗ Erro no login: {response.status_code}")
    print(f"Response: {response.text}")
