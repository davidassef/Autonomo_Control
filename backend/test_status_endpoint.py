#!/usr/bin/env python3
"""
Script para testar o endpoint de status e identificar o problema do erro 403.
"""

import requests
import json


def test_status_endpoint():
    base_url = "http://127.0.0.1:8000/api/v1"

    # Primeiro, fazer login para obter token
    print("1. Fazendo login...")
    login_data = {"username": "admin@autonomocontrol.com", "password": "admin123"}

    try:
        login_response = requests.post(f"{base_url}/auth/token", data=login_data)
        print(f"Login status: {login_response.status_code}")

        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data.get("access_token")
            print(f"Token obtido: {token[:20]}...")

            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }

            # Obter informações do usuário atual
            print("\n2. Obtendo informações do usuário atual...")
            me_response = requests.get(f"{base_url}/auth/me", headers=headers)
            print(f"Me status: {me_response.status_code}")

            if me_response.status_code == 200:
                user_data = me_response.json()
                print(
                    f"Usuário atual: {user_data.get('name')} ({user_data.get('email')})"
                )
                print(f"Role: {user_data.get('role')}")

                # Listar usuários para encontrar um para testar
                print("\n3. Listando usuários...")
                users_response = requests.get(
                    f"{base_url}/admin/users", headers=headers
                )
                print(f"Users list status: {users_response.status_code}")

                if users_response.status_code == 200:
                    users = users_response.json()
                    print(f"Total de usuários: {len(users)}")

                    # Encontrar um usuário para testar (não MASTER)
                    test_user = None
                    for user in users:
                        if user.get("role") != "MASTER" and user.get(
                            "id"
                        ) != user_data.get("id"):
                            test_user = user
                            break

                    if test_user:
                        print(
                            f"\n4. Testando status do usuário: {test_user.get('name')} (Role: {test_user.get('role')})"
                        )
                        user_id = test_user["id"]

                        # Testar mudança de status
                        status_data = {
                            "is_active": not test_user.get("is_active", True)
                        }
                        status_response = requests.patch(
                            f"{base_url}/admin/users/{user_id}/status",
                            json=status_data,
                            headers=headers,
                        )

                        print(f"Status change response: {status_response.status_code}")
                        if status_response.status_code != 200:
                            print(f"Erro: {status_response.text}")

                            # Verificar detalhes do erro
                            try:
                                error_data = status_response.json()
                                print(f"Detalhes do erro: {error_data}")
                            except:
                                print("Não foi possível decodificar a resposta de erro")
                        else:
                            print("✅ Status alterado com sucesso!")
                            result = status_response.json()
                            print(
                                f"Novo status: {'Ativo' if result.get('is_active') else 'Inativo'}"
                            )
                    else:
                        print("❌ Nenhum usuário adequado encontrado para teste")
                else:
                    print(f"❌ Erro ao listar usuários: {users_response.text}")
            else:
                print(f"❌ Erro ao obter dados do usuário: {me_response.text}")
        else:
            print(f"❌ Erro no login: {login_response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão. Verifique se o servidor está rodando.")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")


if __name__ == "__main__":
    test_status_endpoint()
