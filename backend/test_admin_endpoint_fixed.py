#!/usr/bin/env python3
"""
Script para testar o endpoint /api/v1/admin/users/ após correção dos emails.
"""

import requests
import json
from pathlib import Path

def test_admin_endpoint():
    """Testar o endpoint de administração."""
    base_url = "http://127.0.0.1:8000"
    endpoint = f"{base_url}/api/v1/admin/users/"
    
    print(f"🔍 Testando endpoint: {endpoint}")
    
    try:
        # Fazer requisição GET para o endpoint
        response = requests.get(endpoint, timeout=10)
        
        print(f"\n📊 Resultado do teste:")
        print(f"  Status Code: {response.status_code}")
        print(f"  Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"  ✅ Resposta JSON válida recebida")
                print(f"  📝 Número de usuários retornados: {len(data)}")
                
                print(f"\n👥 Usuários retornados:")
                for i, user in enumerate(data, 1):
                    print(f"  {i}. ID: {user.get('id', 'N/A')}")
                    print(f"     Nome: {user.get('name', 'N/A')}")
                    print(f"     Email: {user.get('email', 'N/A')}")
                    print(f"     Role: {user.get('role', 'N/A')}")
                    print(f"     Ativo: {user.get('is_active', 'N/A')}")
                    print()
                    
            except json.JSONDecodeError as e:
                print(f"  ❌ Erro ao decodificar JSON: {e}")
                print(f"  📄 Conteúdo da resposta: {response.text[:500]}...")
                
        elif response.status_code == 401:
            print(f"  ⚠️  Acesso não autorizado (esperado sem token de autenticação)")
            print(f"  📄 Resposta: {response.text}")
            
        elif response.status_code == 500:
            print(f"  ❌ Erro interno do servidor (ainda há problemas)")
            print(f"  📄 Resposta: {response.text}")
            
        else:
            print(f"  ⚠️  Status inesperado: {response.status_code}")
            print(f"  📄 Resposta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"  ❌ Erro de conexão: Servidor não está rodando em {base_url}")
    except requests.exceptions.Timeout:
        print(f"  ❌ Timeout: Servidor demorou muito para responder")
    except Exception as e:
        print(f"  ❌ Erro inesperado: {e}")

def test_with_auth():
    """Testar endpoint com autenticação (se possível)."""
    print(f"\n🔐 Testando com autenticação...")
    
    # Tentar fazer login primeiro
    base_url = "http://127.0.0.1:8000"
    login_endpoint = f"{base_url}/api/v1/auth/token"
    
    # Credenciais de teste (usuário master)
    login_data = {
        "username": "teste@master.com",
        "password": "master123"
    }
    
    try:
        # Fazer login
        login_response = requests.post(login_endpoint, data=login_data, timeout=10)
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get("access_token")
            
            if access_token:
                print(f"  ✅ Login realizado com sucesso")
                
                # Testar endpoint admin com token
                headers = {"Authorization": f"Bearer {access_token}"}
                admin_response = requests.get(f"{base_url}/api/v1/admin/users/", headers=headers, timeout=10)
                
                print(f"  📊 Teste com autenticação:")
                print(f"    Status Code: {admin_response.status_code}")
                
                if admin_response.status_code == 200:
                    data = admin_response.json()
                    print(f"    ✅ Endpoint funcionando perfeitamente!")
                    print(f"    👥 {len(data)} usuários retornados")
                else:
                    print(f"    ❌ Erro: {admin_response.text}")
            else:
                print(f"  ❌ Token não encontrado na resposta")
        else:
            print(f"  ❌ Falha no login: {login_response.status_code}")
            print(f"  📄 Resposta: {login_response.text}")
            
    except Exception as e:
        print(f"  ❌ Erro no teste com autenticação: {e}")

def main():
    """Função principal."""
    print("🧪 Testando endpoint /api/v1/admin/users/ após correção de emails...\n")
    
    # Teste básico sem autenticação
    test_admin_endpoint()
    
    # Teste com autenticação
    test_with_auth()
    
    print("\n🎯 Teste concluído!")

if __name__ == "__main__":
    main()