#!/usr/bin/env python3
"""
Teste simples para verificar o endpoint de registro.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"


def test_register():
    """Testa o endpoint de registro."""
    print("=== Testando Registro ===")

    register_data = {
        "email": "test@example.com",
        "name": "Test User",
        "password": "test123",
        "username": "testuser",
        "full_name": "Test User Full",
    }

    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            data = response.json()
            print(f"Token: {data.get('access_token', 'N/A')[:20]}...")
            return data.get("access_token")
        else:
            print(f"Erro no registro: {response.text}")
            return None

    except Exception as e:
        print(f"Exceção: {e}")
        return None


def test_login():
    """Testa o endpoint de login."""
    print("\n=== Testando Login ===")

    login_data = {"username": "test@example.com", "password": "test123"}

    try:
        response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            data = response.json()
            print(f"Token: {data.get('access_token', 'N/A')[:20]}...")
            return data.get("access_token")
        else:
            print(f"Erro no login: {response.text}")
            return None

    except Exception as e:
        print(f"Exceção: {e}")
        return None


def test_system_config(token=None):
    """Testa os endpoints de configuração do sistema."""
    print("\n=== Testando Configurações do Sistema ===")

    # Teste público
    try:
        response = requests.get(f"{BASE_URL}/system-config/public")
        print(f"Config pública - Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Config pública: {response.json()}")
    except Exception as e:
        print(f"Erro config pública: {e}")

    # Teste com autenticação
    if token:
        headers = {"Authorization": f"Bearer {token}"}
        try:
            response = requests.get(f"{BASE_URL}/system-config/", headers=headers)
            print(f"Todas configs - Status: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Erro todas configs: {e}")


def main():
    """Função principal."""
    print("Iniciando testes simples...")

    # Teste de registro
    token = test_register()

    # Teste de login
    if not token:
        token = test_login()

    # Teste de configurações
    test_system_config(token)

    print("\nTestes concluídos.")


if __name__ == "__main__":
    main()
