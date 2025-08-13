#!/usr/bin/env python3
"""
Script para testar o endpoint de login da API
"""

import requests
import json

def test_login_api():
    """Testa o endpoint de login da API"""

    print("🔐 TESTE DO ENDPOINT DE LOGIN")
    print("=" * 50)

    # URL do endpoint
    url = "http://localhost:8000/api/v1/auth/token"

    # Dados do login
    data = {
        "username": "admin@autonomocontrol.com",
        "password": "admin123"
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    try:
        print(f"📍 URL: {url}")
        print(f"📧 Email: {data['username']}")
        print(f"🔑 Senha: {data['password']}")
        print("\n🔄 Enviando requisição...")

        response = requests.post(url, data=data, headers=headers, timeout=10)

        print(f"📊 Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            result = response.json()
            print("✅ LOGIN SUCESSO!")
            print(f"🎫 Token Type: {result.get('token_type')}")
            token = result.get('access_token', '')
            print(f"🔐 Access Token (primeiros 50 chars): {token[:50]}...")

            # Testar endpoint /me
            print("\n🔄 Testando endpoint /me...")
            me_url = "http://localhost:8000/api/v1/auth/me"
            me_headers = {"Authorization": f"Bearer {token}"}

            me_response = requests.get(me_url, headers=me_headers, timeout=10)
            print(f"📊 /me Status Code: {me_response.status_code}")

            if me_response.status_code == 200:
                user_data = me_response.json()
                print("✅ DADOS DO USUÁRIO:")
                print(f"   📧 Email: {user_data.get('email')}")
                print(f"   👤 Nome: {user_data.get('name')}")
                print(f"   🆔 ID: {user_data.get('id')}")
            else:
                print(f"❌ Erro no /me: {me_response.text}")

        else:
            print("❌ LOGIN FALHOU!")
            print(f"📄 Response Text: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Não foi possível conectar ao backend!")
        print("🔧 Verifique se o backend está rodando em http://localhost:8000")
    except Exception as e:
        print(f"❌ ERRO INESPERADO: {e}")

if __name__ == "__main__":
    test_login_api()
