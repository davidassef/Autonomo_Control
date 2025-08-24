#!/usr/bin/env python3
"""
Script para testar todas as funcionalidades administrativas implementadas.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"


class AdminTester:
    def __init__(self):
        self.token = None
        self.user_id = None

    def login_as_master(self):
        """Faz login como usuário MASTER para obter token."""
        print("\n=== Login como MASTER ===")
        try:
            # Primeiro, vamos tentar criar um usuário MASTER se não existir
            register_data = {
                "username": "master",
                "email": "master@autonomocontrol.com",
                "name": "Master User",
                "password": "master123",
                "full_name": "Master User",
            }

            response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
            print(f"Registro MASTER - Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Registro falhou: {response.text}")

            # Agora fazer login usando form data
            from requests.auth import HTTPBasicAuth

            login_data = {
                "username": "master@autonomocontrol.com",
                "password": "master123",
            }

            response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
            print(f"Login - Status: {response.status_code}")
            print(f"Login - Response: {response.text}")

            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.user_id = data.get("user_id")
                print(f"Token obtido: {self.token[:20]}...")
                return True
            return False

        except Exception as e:
            print(f"Erro no login: {e}")
            return False

    def get_headers(self):
        """Retorna headers com autenticação."""
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def test_user_management(self):
        """Testa funcionalidades de gerenciamento de usuários."""
        print("\n=== Testando Gerenciamento de Usuários ===")

        try:
            # Listar usuários
            response = requests.get(
                f"{BASE_URL}/admin/users", headers=self.get_headers()
            )
            print(f"Listar usuários - Status: {response.status_code}")
            if response.status_code == 200:
                users = response.json()
                print(f"Usuários encontrados: {len(users.get('data', []))}")
            else:
                print(f"Erro: {response.text}")

            # Criar usuário de teste
            test_user = {
                "username": "testuser",
                "email": "test@test.com",
                "password": "test123",
                "full_name": "Test User",
            }

            response = requests.post(f"{BASE_URL}/auth/register", json=test_user)
            print(f"Criar usuário teste - Status: {response.status_code}")

            if response.status_code == 200:
                test_user_data = response.json()
                test_user_id = test_user_data.get("user_id")

                # Testar bloqueio de usuário
                response = requests.post(
                    f"{BASE_URL}/admin/users/{test_user_id}/block",
                    headers=self.get_headers(),
                )
                print(f"Bloquear usuário - Status: {response.status_code}")

                # Testar desbloqueio de usuário
                response = requests.post(
                    f"{BASE_URL}/admin/users/{test_user_id}/unblock",
                    headers=self.get_headers(),
                )
                print(f"Desbloquear usuário - Status: {response.status_code}")

                # Testar reset de senha
                response = requests.post(
                    f"{BASE_URL}/admin/users/{test_user_id}/reset-password",
                    headers=self.get_headers(),
                )
                print(f"Reset senha - Status: {response.status_code}")

        except Exception as e:
            print(f"Erro no teste de usuários: {e}")

    def test_audit_logs(self):
        """Testa funcionalidades de logs de auditoria."""
        print("\n=== Testando Logs de Auditoria ===")

        try:
            # Listar logs de auditoria
            response = requests.get(
                f"{BASE_URL}/admin/audit-logs", headers=self.get_headers()
            )
            print(f"Listar logs - Status: {response.status_code}")
            if response.status_code == 200:
                logs = response.json()
                print(f"Logs encontrados: {len(logs.get('data', []))}")
            else:
                print(f"Erro: {response.text}")

            # Buscar logs por usuário
            if self.user_id:
                response = requests.get(
                    f"{BASE_URL}/admin/audit-logs?user_id={self.user_id}",
                    headers=self.get_headers(),
                )
                print(f"Logs por usuário - Status: {response.status_code}")

            # Buscar logs por ação
            response = requests.get(
                f"{BASE_URL}/admin/audit-logs?action=login", headers=self.get_headers()
            )
            print(f"Logs por ação - Status: {response.status_code}")

        except Exception as e:
            print(f"Erro no teste de logs: {e}")

    def test_system_reports(self):
        """Testa funcionalidades de relatórios do sistema."""
        print("\n=== Testando Relatórios do Sistema ===")

        try:
            # Relatório de uso
            response = requests.get(
                f"{BASE_URL}/admin/reports/usage", headers=self.get_headers()
            )
            print(f"Relatório de uso - Status: {response.status_code}")
            if response.status_code == 200:
                report = response.json()
                print(f"Dados do relatório: {json.dumps(report, indent=2)}")
            else:
                print(f"Erro: {response.text}")

            # Estatísticas do sistema
            response = requests.get(
                f"{BASE_URL}/admin/reports/stats", headers=self.get_headers()
            )
            print(f"Estatísticas - Status: {response.status_code}")
            if response.status_code == 200:
                stats = response.json()
                print(f"Estatísticas: {json.dumps(stats, indent=2)}")
            else:
                print(f"Erro: {response.text}")

        except Exception as e:
            print(f"Erro no teste de relatórios: {e}")

    def test_system_config(self):
        """Testa funcionalidades de configuração do sistema."""
        print("\n=== Testando Configurações do Sistema ===")

        try:
            # Configurações públicas (sem auth)
            response = requests.get(f"{BASE_URL}/system-config/public")
            print(f"Configurações públicas - Status: {response.status_code}")
            if response.status_code == 200:
                config = response.json()
                print(f"Config pública: {json.dumps(config, indent=2)}")

            # Todas as configurações (com auth)
            response = requests.get(
                f"{BASE_URL}/system-config/", headers=self.get_headers()
            )
            print(f"Todas configurações - Status: {response.status_code}")
            if response.status_code == 200:
                configs = response.json()
                print(f"Todas configs: {json.dumps(configs, indent=2)}")
            else:
                print(f"Erro: {response.text}")

            # Inicializar configurações padrão
            response = requests.post(
                f"{BASE_URL}/system-config/initialize", headers=self.get_headers()
            )
            print(f"Inicializar configs - Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"Inicialização: {json.dumps(result, indent=2)}")
            else:
                print(f"Erro: {response.text}")

            # Testar atualização de configuração
            config_data = {
                "key": "test_config",
                "value": "test_value",
                "category": "system",
                "description": "Configuração de teste",
            }

            response = requests.put(
                f"{BASE_URL}/system-config/",
                json=config_data,
                headers=self.get_headers(),
            )
            print(f"Atualizar config - Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"Config atualizada: {json.dumps(result, indent=2)}")
            else:
                print(f"Erro: {response.text}")

        except Exception as e:
            print(f"Erro no teste de configurações: {e}")

    def run_all_tests(self):
        """Executa todos os testes administrativos."""
        print("=" * 60)
        print("INICIANDO TESTES DAS FUNCIONALIDADES ADMINISTRATIVAS")
        print("=" * 60)

        # Login como MASTER
        if not self.login_as_master():
            print("❌ Falha no login como MASTER. Alguns testes podem falhar.")

        # Executar todos os testes
        self.test_user_management()
        self.test_audit_logs()
        self.test_system_reports()
        self.test_system_config()

        print("\n" + "=" * 60)
        print("TESTES CONCLUÍDOS")
        print("=" * 60)


def main():
    """Função principal."""
    tester = AdminTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
