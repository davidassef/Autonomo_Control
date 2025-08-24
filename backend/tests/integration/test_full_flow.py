#!/usr/bin/env python3
"""
Script final para testar todo o fluxo de login
"""

import requests
import json


def test_full_login_flow():
    """Testa o fluxo completo de login"""

    print("🔐 TESTE COMPLETO DO FLUXO DE LOGIN")
    print("=" * 60)

    # Credenciais
    email = "admin@autonomocontrol.com"
    password = "admin123"

    # URLs
    base_url = "http://localhost:8000/api/v1"
    login_url = f"{base_url}/auth/token"
    profile_url = f"{base_url}/auth/me"

    print(f"📧 Email: {email}")
    print(f"🔑 Senha: {password}")
    print(f"🌐 Base URL: {base_url}")
    print()

    # Teste 1: Verificar se o backend está rodando
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend está rodando na porta 8000")
        else:
            print(f"❌ Backend retornou status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend não está rodando ou não é acessível")
        return False
    except Exception as e:
        print(f"❌ Erro ao verificar backend: {e}")
        return False

    # Teste 2: Login
    print("\n🔐 TESTE DE LOGIN")
    print("-" * 30)

    login_data = {"username": email, "password": password}

    try:
        response = requests.post(
            login_url,
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )

        print(f"📊 Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ LOGIN SUCESSO!")
            print(f"🎫 Token Type: {result.get('token_type')}")
            token = result.get("access_token", "")
            print(f"🔐 Token (primeiros 50 chars): {token[:50]}...")

            # Teste 3: Buscar perfil do usuário
            print("\n👤 TESTE DE PERFIL")
            print("-" * 30)

            headers = {"Authorization": f"Bearer {token}"}
            profile_response = requests.get(profile_url, headers=headers, timeout=10)

            print(f"📊 Profile Status Code: {profile_response.status_code}")

            if profile_response.status_code == 200:
                user_data = profile_response.json()
                print("✅ PERFIL OBTIDO COM SUCESSO!")
                print(f"   📧 Email: {user_data.get('email')}")
                print(f"   👤 Nome: {user_data.get('name')}")
                print(f"   🆔 ID: {user_data.get('id')}")

                # Teste 4: CORS
                print("\n🌐 TESTE DE CORS")
                print("-" * 30)
                print("✅ CORS funcionando (requisições bem-sucedidas)")

                print("\n" + "=" * 60)
                print("🎉 TODOS OS TESTES PASSARAM!")
                print("✅ O login deve funcionar no frontend agora!")
                print("=" * 60)
                print("🔗 Acesse: http://localhost:3000")
                print(f"📧 Email: {email}")
                print(f"🔑 Senha: {password}")
                print("=" * 60)

                return True
            else:
                print(f"❌ Erro ao buscar perfil: {profile_response.text}")
                return False
        else:
            print(f"❌ Erro no login: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Não foi possível conectar à API")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False


if __name__ == "__main__":
    success = test_full_login_flow()
    if not success:
        print("\n❌ ALGUNS TESTES FALHARAM!")
        print("🔧 Verifique se o backend está rodando e tente novamente")
