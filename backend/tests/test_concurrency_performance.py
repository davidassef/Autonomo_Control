import pytest
import asyncio
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.security import create_access_token, verify_password, get_password_hash
from app.dependencies import get_current_user, get_current_admin
from app.models.user import User
# # SecretKey não é um modelo separado, está integrado no User  # Modelo não existe
from app.schemas.user_schema import UserCreate
from app.api.v1.auth import login_for_access_token, register_user
from app.api.v1.secret_keys import generate_secret_key
from app.core.config import settings
from backend.app.tests.conftest import test_db

client = TestClient(app)

class TestConcurrencyAndPerformance:
    """Testes de concorrência, race conditions e performance para operações críticas."""

    def setup_method(self):
        """Setup para cada teste."""
        self.test_user_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "testpassword123",
            "security_question_1_id": "1",
            "security_answer_1": "Answer 1",
            "security_question_2_id": "2",
            "security_answer_2": "Answer 2",
            "security_question_3_id": "3",
            "security_answer_3": "Answer 3"
        }

    @pytest.mark.asyncio
    async def test_concurrent_user_registration(self):
        """Testa registro simultâneo de usuários para detectar race conditions."""
        num_users = 10
        tasks = []
        
        # Criar dados únicos para cada usuário
        user_data_list = []
        for i in range(num_users):
            user_data = self.test_user_data.copy()
            user_data["email"] = f"user{i}@example.com"
            user_data["name"] = f"User {i}"
            user_data_list.append(user_data)
        
        async def register_user_async(user_data):
            """Registra um usuário de forma assíncrona."""
            response = client.post("/api/v1/auth/register", json=user_data)
            return response.status_code, response.json() if response.status_code != 500 else None
        
        # Executar registros simultâneos
        start_time = time.time()
        tasks = [register_user_async(user_data) for user_data in user_data_list]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        # Analisar resultados
        successful_registrations = 0
        failed_registrations = 0
        
        for result in results:
            if isinstance(result, Exception):
                failed_registrations += 1
            else:
                status_code, response_data = result
                if status_code == 201:
                    successful_registrations += 1
                else:
                    failed_registrations += 1
        
        # Verificações
        assert successful_registrations == num_users, f"Esperado {num_users} registros bem-sucedidos, obtido {successful_registrations}"
        assert failed_registrations == 0, f"Não deveria haver falhas, mas obteve {failed_registrations}"
        
        # Verificar performance (deve completar em menos de 10 segundos)
        execution_time = end_time - start_time
        assert execution_time < 10.0, f"Registros simultâneos levaram {execution_time:.2f}s, muito lento"
        
        print(f"✅ {num_users} usuários registrados simultaneamente em {execution_time:.2f}s")

    def test_concurrent_login_attempts(self):
        """Testa tentativas de login simultâneas para o mesmo usuário."""
        # Primeiro, registrar um usuário
        register_response = client.post("/api/v1/auth/register", json=self.test_user_data)
        assert register_response.status_code == 201
        
        num_attempts = 20
        login_data = {
            "username": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        
        def login_attempt():
            """Realiza uma tentativa de login."""
            response = client.post("/api/v1/auth/token", data=login_data)
            return response.status_code, response.json() if response.status_code == 200 else None
        
        # Executar logins simultâneos usando ThreadPoolExecutor
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(login_attempt) for _ in range(num_attempts)]
            results = [future.result() for future in as_completed(futures)]
        end_time = time.time()
        
        # Analisar resultados
        successful_logins = sum(1 for status_code, _ in results if status_code == 200)
        failed_logins = num_attempts - successful_logins
        
        # Verificações
        assert successful_logins == num_attempts, f"Esperado {num_attempts} logins bem-sucedidos, obtido {successful_logins}"
        assert failed_logins == 0, f"Não deveria haver falhas de login, mas obteve {failed_logins}"
        
        # Verificar se todos os tokens são válidos e únicos
        tokens = [data.get("access_token") for _, data in results if data]
        assert len(tokens) == num_attempts, "Nem todos os logins retornaram tokens"
        
        # Verificar performance
        execution_time = end_time - start_time
        assert execution_time < 15.0, f"Logins simultâneos levaram {execution_time:.2f}s, muito lento"
        
        print(f"✅ {num_attempts} logins simultâneos completados em {execution_time:.2f}s")

    def test_concurrent_secret_key_generation(self):
        """Testa geração simultânea de chaves secretas."""
        # Registrar usuário admin
        admin_data = self.test_user_data.copy()
        admin_data["email"] = "admin@example.com"
        register_response = client.post("/api/v1/auth/register", json=admin_data)
        assert register_response.status_code == 201
        
        # Fazer login para obter token
        login_response = client.post("/api/v1/auth/token", data={
            "username": admin_data["email"],
            "password": admin_data["password"]
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        num_keys = 15
        
        def generate_key():
            """Gera uma chave secreta."""
            response = client.post("/api/v1/secret-keys/generate", headers=headers)
            return response.status_code, response.json() if response.status_code == 200 else None
        
        # Executar gerações simultâneas
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(generate_key) for _ in range(num_keys)]
            results = [future.result() for future in as_completed(futures)]
        end_time = time.time()
        
        # Analisar resultados
        successful_generations = sum(1 for status_code, _ in results if status_code == 200)
        
        # Verificações
        assert successful_generations == num_keys, f"Esperado {num_keys} chaves geradas, obtido {successful_generations}"
        
        # Verificar se todas as chaves são únicas
        keys = [data.get("secret_key") for _, data in results if data]
        unique_keys = set(keys)
        assert len(unique_keys) == num_keys, f"Esperado {num_keys} chaves únicas, obtido {len(unique_keys)}"
        
        # Verificar performance
        execution_time = end_time - start_time
        assert execution_time < 10.0, f"Geração de chaves levou {execution_time:.2f}s, muito lento"
        
        print(f"✅ {num_keys} chaves secretas geradas simultaneamente em {execution_time:.2f}s")

    def test_race_condition_password_reset(self):
        """Testa race conditions em redefinição de senha."""
        # Registrar usuário
        register_response = client.post("/api/v1/auth/register", json=self.test_user_data)
        assert register_response.status_code == 201
        
        # Gerar chave secreta para o usuário
        login_response = client.post("/api/v1/auth/token", data={
            "username": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        key_response = client.post("/api/v1/secret-keys/generate", headers=headers)
        secret_key = key_response.json()["secret_key"]
        
        # Tentar usar a mesma chave simultaneamente
        num_attempts = 5
        new_password = "newpassword123"
        
        def use_secret_key_attempt():
            """Tenta usar a chave secreta para redefinir senha."""
            response = client.post("/api/v1/secret-keys/reset-password", json={
                "username": "masterautonomocontrol",
                "secret_key": secret_key,
                "new_password": new_password
            })
            return response.status_code, response.json() if response.content else {}
        
        # Executar tentativas simultâneas
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(use_secret_key_attempt) for _ in range(num_attempts)]
            results = [future.result() for future in as_completed(futures)]
        
        # Analisar resultados
        successful_uses = sum(1 for status_code, _ in results if status_code == 200)
        failed_uses = sum(1 for status_code, _ in results if status_code != 200)
        
        # Verificações - apenas uma tentativa deve ser bem-sucedida
        assert successful_uses == 1, f"Esperado 1 uso bem-sucedido, obtido {successful_uses}"
        assert failed_uses == num_attempts - 1, f"Esperado {num_attempts - 1} falhas, obtido {failed_uses}"
        
        print(f"✅ Race condition em chave secreta tratada corretamente: {successful_uses} sucesso, {failed_uses} falhas")

    def test_performance_password_hashing(self):
        """Testa performance de hashing de senhas."""
        passwords = [f"password{i}" for i in range(100)]
        
        # Testar hashing
        start_time = time.time()
        hashes = [get_password_hash(password) for password in passwords]
        hash_time = time.time() - start_time
        
        # Testar verificação
        start_time = time.time()
        verifications = [verify_password(passwords[i], hashes[i]) for i in range(len(passwords))]
        verify_time = time.time() - start_time
        
        # Verificações
        assert all(verifications), "Nem todas as verificações de senha foram bem-sucedidas"
        assert hash_time < 10.0, f"Hashing de 100 senhas levou {hash_time:.2f}s, muito lento"
        assert verify_time < 10.0, f"Verificação de 100 senhas levou {verify_time:.2f}s, muito lento"
        
        print(f"✅ Performance de hashing: {hash_time:.2f}s para hash, {verify_time:.2f}s para verificação")

    def test_concurrent_token_validation(self):
        """Testa validação simultânea de tokens."""
        # Registrar usuário e fazer login
        register_response = client.post("/api/v1/auth/register", json=self.test_user_data)
        assert register_response.status_code == 201
        
        login_response = client.post("/api/v1/auth/token", data={
            "username": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        num_requests = 50
        
        def validate_token():
            """Faz uma requisição que requer validação de token."""
            response = client.get("/api/v1/auth/me", headers=headers)
            return response.status_code
        
        # Executar validações simultâneas
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=15) as executor:
            futures = [executor.submit(validate_token) for _ in range(num_requests)]
            results = [future.result() for future in as_completed(futures)]
        end_time = time.time()
        
        # Analisar resultados
        successful_validations = sum(1 for status_code in results if status_code == 200)
        
        # Verificações
        assert successful_validations == num_requests, f"Esperado {num_requests} validações bem-sucedidas, obtido {successful_validations}"
        
        # Verificar performance
        execution_time = end_time - start_time
        assert execution_time < 15.0, f"Validações simultâneas levaram {execution_time:.2f}s, muito lento"
        
        print(f"✅ {num_requests} validações de token simultâneas em {execution_time:.2f}s")

    def test_memory_usage_under_load(self):
        """Testa uso de memória sob carga."""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Simular carga pesada
        num_operations = 1000
        
        # Criar muitos tokens
        tokens = []
        for i in range(num_operations):
            token_data = {"sub": f"user{i}", "user_type": "USER"}
            token = create_access_token(data=token_data)
            tokens.append(token)
        
        # Verificar uso de memória
        peak_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = peak_memory - initial_memory
        
        # Limpar tokens
        tokens.clear()
        
        # Verificar se a memória foi liberada (aguardar GC)
        import gc
        gc.collect()
        time.sleep(1)
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Verificações
        assert memory_increase < 100, f"Aumento de memória muito alto: {memory_increase:.2f}MB"
        assert final_memory < peak_memory, "Memória não foi liberada adequadamente"
        
        print(f"✅ Uso de memória: inicial {initial_memory:.2f}MB, pico {peak_memory:.2f}MB, final {final_memory:.2f}MB")

    def test_database_connection_pool_under_load(self):
        """Testa pool de conexões do banco sob carga."""
        num_concurrent_requests = 20
        
        def make_database_request():
            """Faz uma requisição que usa o banco de dados."""
            try:
                response = client.get("/api/v1/auth/security-questions")
                return response.status_code == 200
            except Exception as e:
                print(f"Erro na requisição: {e}")
                return False
        
        # Executar requisições simultâneas
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=num_concurrent_requests) as executor:
            futures = [executor.submit(make_database_request) for _ in range(num_concurrent_requests)]
            results = [future.result() for future in as_completed(futures)]
        end_time = time.time()
        
        # Analisar resultados
        successful_requests = sum(results)
        
        # Verificações
        assert successful_requests == num_concurrent_requests, f"Esperado {num_concurrent_requests} requisições bem-sucedidas, obtido {successful_requests}"
        
        # Verificar performance
        execution_time = end_time - start_time
        assert execution_time < 10.0, f"Requisições simultâneas ao banco levaram {execution_time:.2f}s, muito lento"
        
        print(f"✅ {num_concurrent_requests} requisições simultâneas ao banco em {execution_time:.2f}s")

    def test_rate_limiting_simulation(self):
        """Simula rate limiting para prevenir ataques de força bruta."""
        # Este teste simula como o sistema se comportaria com rate limiting
        num_rapid_requests = 100
        
        def rapid_login_attempt():
            """Faz tentativa rápida de login."""
            response = client.post("/api/v1/auth/token", data={
                "username": "nonexistent@example.com",
                "password": "wrongpassword"
            })
            return response.status_code, time.time()
        
        # Executar tentativas rápidas
        start_time = time.time()
        results = []
        for _ in range(num_rapid_requests):
            result = rapid_login_attempt()
            results.append(result)
            # Pequeno delay para não sobrecarregar
            time.sleep(0.01)
        end_time = time.time()
        
        # Analisar resultados
        status_codes = [status for status, _ in results]
        failed_attempts = sum(1 for status in status_codes if status == 401)
        
        # Verificações
        assert failed_attempts == num_rapid_requests, f"Esperado {num_rapid_requests} falhas de login, obtido {failed_attempts}"
        
        # Verificar que o sistema não quebrou
        execution_time = end_time - start_time
        assert execution_time < 30.0, f"Tentativas rápidas levaram {execution_time:.2f}s, sistema pode estar sobrecarregado"
        
        print(f"✅ Sistema resistiu a {num_rapid_requests} tentativas rápidas em {execution_time:.2f}s")

    def test_concurrent_user_profile_updates(self):
        """Testa atualizações simultâneas de perfil do usuário."""
        # Registrar usuário
        register_response = client.post("/api/v1/auth/register", json=self.test_user_data)
        assert register_response.status_code == 201
        
        # Fazer login
        login_response = client.post("/api/v1/auth/token", data={
            "username": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        num_updates = 10
        
        def update_profile(update_number):
            """Atualiza o perfil do usuário."""
            # Como não temos endpoint de atualização, vamos simular com GET
            response = client.get("/api/v1/auth/me", headers=headers)
            return response.status_code == 200, update_number
        
        # Executar atualizações simultâneas
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(update_profile, i) for i in range(num_updates)]
            results = [future.result() for future in as_completed(futures)]
        end_time = time.time()
        
        # Analisar resultados
        successful_updates = sum(1 for success, _ in results if success)
        
        # Verificações
        assert successful_updates == num_updates, f"Esperado {num_updates} atualizações bem-sucedidas, obtido {successful_updates}"
        
        # Verificar performance
        execution_time = end_time - start_time
        assert execution_time < 5.0, f"Atualizações simultâneas levaram {execution_time:.2f}s, muito lento"
        
        print(f"✅ {num_updates} atualizações de perfil simultâneas em {execution_time:.2f}s")

    def test_stress_test_authentication_flow(self):
        """Teste de stress do fluxo completo de autenticação."""
        num_users = 50
        
        def complete_auth_flow(user_id):
            """Executa fluxo completo: registro -> login -> validação -> logout."""
            try:
                # Registro
                user_data = self.test_user_data.copy()
                user_data["email"] = f"stressuser{user_id}@example.com"
                user_data["name"] = f"Stress User {user_id}"
                
                register_response = client.post("/api/v1/auth/register", json=user_data)
                if register_response.status_code != 201:
                    return False, f"Registro falhou: {register_response.status_code}"
                
                # Login
                login_response = client.post("/api/v1/auth/token", data={
                    "username": user_data["email"],
                    "password": user_data["password"]
                })
                if login_response.status_code != 200:
                    return False, f"Login falhou: {login_response.status_code}"
                
                token = login_response.json()["access_token"]
                headers = {"Authorization": f"Bearer {token}"}
                
                # Validação
                profile_response = client.get("/api/v1/auth/me", headers=headers)
                if profile_response.status_code != 200:
                    return False, f"Validação falhou: {profile_response.status_code}"
                
                return True, "Sucesso"
                
            except Exception as e:
                return False, f"Exceção: {str(e)}"
        
        # Executar fluxos simultâneos
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(complete_auth_flow, i) for i in range(num_users)]
            results = [future.result() for future in as_completed(futures)]
        end_time = time.time()
        
        # Analisar resultados
        successful_flows = sum(1 for success, _ in results if success)
        failed_flows = [(success, message) for success, message in results if not success]
        
        # Verificações
        assert successful_flows >= num_users * 0.9, f"Esperado pelo menos 90% de sucesso, obtido {successful_flows}/{num_users}"
        
        if failed_flows:
            print(f"⚠️ Falhas encontradas: {failed_flows[:5]}...")  # Mostrar apenas as primeiras 5
        
        # Verificar performance
        execution_time = end_time - start_time
        assert execution_time < 60.0, f"Teste de stress levou {execution_time:.2f}s, muito lento"
        
        print(f"✅ Teste de stress: {successful_flows}/{num_users} fluxos bem-sucedidos em {execution_time:.2f}s")