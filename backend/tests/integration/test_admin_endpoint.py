"""Script para testar o endpoint /api/v1/admin/users/ após correção dos emails.
Executar: python test_admin_endpoint.py
"""

import requests
import json
from app.core.config import settings


def test_admin_users_endpoint():
    """Testa o endpoint /api/v1/admin/users/ para verificar se o erro foi corrigido."""
    base_url = "http://127.0.0.1:8000"
    endpoint = f"{base_url}/api/v1/admin/users/"

    print(f"Testando endpoint: {endpoint}")

    try:
        # Fazer requisição GET para o endpoint
        response = requests.get(endpoint, timeout=10)

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            print("✅ Sucesso! O endpoint está funcionando corretamente.")

            # Tentar parsear o JSON
            try:
                data = response.json()
                print(f"Número de usuários retornados: {len(data)}")

                # Mostrar alguns detalhes dos usuários (sem dados sensíveis)
                print("\nUsuários encontrados:")
                for i, user in enumerate(data[:3]):  # Mostrar apenas os primeiros 3
                    print(
                        f"  {i+1}. Email: {user.get('email', 'N/A')}, Nome: {user.get('name', 'N/A')}"
                    )

                if len(data) > 3:
                    print(f"  ... e mais {len(data) - 3} usuários")

            except json.JSONDecodeError as e:
                print(f"⚠️  Resposta não é um JSON válido: {e}")
                print(f"Conteúdo da resposta: {response.text[:200]}...")

        elif response.status_code == 500:
            print("❌ Erro 500 ainda persiste!")
            print(f"Resposta: {response.text[:500]}...")

        elif response.status_code == 401:
            print("⚠️  Erro 401 - Não autorizado. Endpoint requer autenticação.")

        elif response.status_code == 403:
            print("⚠️  Erro 403 - Acesso negado. Endpoint requer permissões de admin.")

        else:
            print(f"⚠️  Status inesperado: {response.status_code}")
            print(f"Resposta: {response.text[:200]}...")

    except requests.exceptions.ConnectionError:
        print(
            "❌ Erro de conexão. Verifique se o servidor está rodando em http://127.0.0.1:8000"
        )

    except requests.exceptions.Timeout:
        print("❌ Timeout na requisição.")

    except Exception as e:
        print(f"❌ Erro inesperado: {e}")


if __name__ == "__main__":
    print("=== Teste do Endpoint Admin Users ===")
    test_admin_users_endpoint()
    print("\n=== Teste concluído ===")
