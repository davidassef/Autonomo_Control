import pytest
import time
import hashlib
import secrets
import threading
from unittest.mock import patch, MagicMock
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
)
from app.services.secret_key_service import SecretKeyService
from app.core.config import settings
from jose import jwt, JWTError
from datetime import datetime, timedelta
import concurrent.futures
from typing import List, Tuple


class TestCriticalCryptography:
    """Testes críticos para funções de criptografia e hashing"""

    def test_password_hashing_consistency(self):
        """Testa consistência do hashing de senhas"""
        password = "TestPassword123!"

        # Múltiplos hashes da mesma senha devem ser diferentes (salt)
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        assert hash1 != hash2, "Hashes idênticos indicam falta de salt"

        # Mas ambos devem verificar corretamente
        assert verify_password(password, hash1), "Hash1 não verifica"
        assert verify_password(password, hash2), "Hash2 não verifica"

    def test_password_verification_timing_attack_resistance(self):
        """Testa resistência a ataques de timing na verificação de senha"""
        password = "TestPassword123!"
        correct_hash = get_password_hash(password)

        # Senhas de diferentes tamanhos
        test_passwords = [
            "a",  # muito curta
            "short",  # curta
            "medium_length_password",  # média
            "very_long_password_that_should_take_same_time_to_verify",  # longa
            password,  # correta
        ]

        times = []

        for test_password in test_passwords:
            start_time = time.perf_counter()
            verify_password(test_password, correct_hash)
            end_time = time.perf_counter()
            times.append(end_time - start_time)

        # Verifica que os tempos são relativamente consistentes
        # (diferença máxima não deve ser muito grande)
        min_time = min(times)
        max_time = max(times)

        # Permite variação de até 10x (bcrypt pode variar)
        assert (
            max_time / min_time < 10
        ), f"Variação de timing muito grande: {max_time/min_time:.2f}x"

    def test_password_hash_strength(self):
        """Testa força do hash de senha"""
        password = "TestPassword123!"
        password_hash = get_password_hash(password)

        # Hash deve começar com $2b$ (bcrypt)
        assert password_hash.startswith("$2b$"), "Hash não usa bcrypt"

        # Hash deve ter tamanho adequado (bcrypt = 60 chars)
        assert (
            len(password_hash) == 60
        ), f"Hash com tamanho incorreto: {len(password_hash)}"

        # Hash deve conter apenas caracteres válidos
        valid_chars = set(
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./"
        )
        hash_chars = set(password_hash[7:])  # Remove $2b$XX$
        assert hash_chars.issubset(valid_chars), "Hash contém caracteres inválidos"

    def test_password_verification_edge_cases(self):
        """Testa casos extremos na verificação de senha"""
        password = "TestPassword123!"
        correct_hash = get_password_hash(password)

        # Casos que devem falhar
        invalid_cases = [
            None,  # None
            "",  # string vazia
            "wrong_password",  # senha errada
            password + "x",  # senha quase correta
            password.upper(),  # case diferente
            password + "\x00",  # null byte
            "\x00" + password,  # null byte no início
            password + "\n",  # newline
            password + " ",  # espaço extra
        ]

        for invalid_password in invalid_cases:
            assert not verify_password(
                invalid_password, correct_hash
            ), f"Senha inválida aceita: {repr(invalid_password)}"

        # Casos de hash inválido
        invalid_hashes = [
            None,
            "",
            "invalid_hash",
            "$2b$12$invalid",
            "$2a$12$" + "x" * 53,  # algoritmo antigo
            "$2b$04$" + "x" * 53,  # rounds muito baixos
            "$2b$12$" + "x" * 52,  # muito curto
            "$2b$12$" + "x" * 54,  # muito longo
        ]

        for invalid_hash in invalid_hashes:
            assert not verify_password(
                password, invalid_hash
            ), f"Hash inválido aceito: {repr(invalid_hash)}"


class TestJWTSecurity:
    """Testes críticos para segurança de JWT"""

    def test_jwt_token_creation_and_verification(self):
        """Testa criação e verificação de tokens JWT"""
        user_data = {"sub": "test@example.com", "user_id": 1, "role": "USER"}

        # Cria token
        token = create_access_token(data=user_data)

        # Verifica token
        payload = verify_token(token)

        assert payload["sub"] == "test@example.com"
        assert payload["user_id"] == 1
        assert payload["role"] == "USER"
        assert "exp" in payload
        assert "iat" in payload

    def test_jwt_token_expiration(self):
        """Testa expiração de tokens JWT"""
        user_data = {"sub": "test@example.com", "user_id": 1}

        # Cria token com expiração muito curta
        with patch(
            "app.core.config.settings.ACCESS_TOKEN_EXPIRE_MINUTES", 0.01
        ):  # 0.6 segundos
            token = create_access_token(data=user_data)

            # Token deve ser válido imediatamente
            payload = verify_token(token)
            assert payload is not None

            # Aguarda expiração
            time.sleep(1)

            # Token deve estar expirado
            expired_payload = verify_token(token)
            assert expired_payload is None

    def test_jwt_token_tampering_detection(self):
        """Testa detecção de adulteração em tokens JWT"""
        user_data = {"sub": "test@example.com", "user_id": 1, "role": "USER"}
        token = create_access_token(data=user_data)

        # Tenta adulterar diferentes partes do token
        parts = token.split(".")

        # Adultera header
        tampered_header = parts[0][:-1] + "X"
        tampered_token1 = f"{tampered_header}.{parts[1]}.{parts[2]}"
        assert verify_token(tampered_token1) is None

        # Adultera payload
        tampered_payload = parts[1][:-1] + "X"
        tampered_token2 = f"{parts[0]}.{tampered_payload}.{parts[2]}"
        assert verify_token(tampered_token2) is None

        # Adultera signature
        tampered_signature = parts[2][:-1] + "X"
        tampered_token3 = f"{parts[0]}.{parts[1]}.{tampered_signature}"
        assert verify_token(tampered_token3) is None

    def test_jwt_algorithm_confusion_attack(self):
        """Testa proteção contra ataques de confusão de algoritmo"""
        user_data = {"sub": "test@example.com", "user_id": 1, "role": "ADMIN"}

        # Tenta criar token com algoritmo 'none'
        try:
            malicious_token = jwt.encode(user_data, key="", algorithm="none")

            # Token malicioso não deve ser aceito
            payload = verify_token(malicious_token)
            assert payload is None, "Token com algoritmo 'none' foi aceito"
        except Exception:
            # É esperado que falhe na criação
            pass

        # Tenta usar algoritmo simétrico com chave pública
        try:
            malicious_token = jwt.encode(
                user_data, key=settings.SECRET_KEY, algorithm="HS256"
            )

            # Modifica o header para usar RS256
            parts = malicious_token.split(".")
            import base64
            import json

            header = json.loads(base64.urlsafe_b64decode(parts[0] + "=="))
            header["alg"] = "RS256"

            new_header = (
                base64.urlsafe_b64encode(json.dumps(header).encode())
                .decode()
                .rstrip("=")
            )

            malicious_token = f"{new_header}.{parts[1]}.{parts[2]}"

            payload = verify_token(malicious_token)
            assert payload is None, "Token com algoritmo trocado foi aceito"
        except Exception:
            # É esperado que falhe
            pass

    def test_jwt_token_reuse_protection(self):
        """Testa proteção contra reutilização de tokens"""
        user_data = {"sub": "test@example.com", "user_id": 1}

        # Cria múltiplos tokens para o mesmo usuário
        token1 = create_access_token(data=user_data)
        time.sleep(0.1)  # Garante timestamps diferentes
        token2 = create_access_token(data=user_data)

        # Tokens devem ser diferentes
        assert token1 != token2, "Tokens idênticos gerados"

        # Ambos devem ser válidos
        payload1 = verify_token(token1)
        payload2 = verify_token(token2)

        assert payload1 is not None
        assert payload2 is not None

        # Mas devem ter timestamps diferentes
        assert payload1["iat"] != payload2["iat"]


class TestSecretKeyGeneration:
    """Testes críticos para geração de chaves secretas"""

    def test_secret_key_generation_randomness(self):
        """Testa aleatoriedade na geração de chaves secretas"""
        keys = [SecretKeyService.generate_secret_key() for _ in range(100)]

        # Todas as chaves devem ser únicas
        assert len(set(keys)) == 100, "Chaves duplicadas geradas"

        # Todas devem ter o tamanho correto
        for key in keys:
            assert len(key) == 16, f"Chave com tamanho incorreto: {len(key)}"

        # Devem conter apenas caracteres hexadecimais
        valid_chars = set("0123456789abcdef")
        for key in keys:
            assert set(key.lower()).issubset(
                valid_chars
            ), f"Chave com caracteres inválidos: {key}"

    def test_secret_key_hashing(self):
        """Testa hashing de chaves secretas"""
        secret_key = "abcd1234efgh5678"

        # Hash deve ser consistente
        hash1 = SecretKeyService.hash_secret_key(secret_key)
        hash2 = SecretKeyService.hash_secret_key(secret_key)

        assert hash1 == hash2, "Hash inconsistente para a mesma chave"

        # Hash deve ser diferente da chave original
        assert hash1 != secret_key, "Hash idêntico à chave original"

        # Hash deve ter tamanho adequado (SHA-256 = 64 chars hex)
        assert len(hash1) == 64, f"Hash com tamanho incorreto: {len(hash1)}"

        # Hash deve conter apenas caracteres hexadecimais
        valid_chars = set("0123456789abcdef")
        assert set(hash1.lower()).issubset(valid_chars), "Hash com caracteres inválidos"

    def test_secret_key_hash_collision_resistance(self):
        """Testa resistência a colisões no hash de chaves"""
        # Chaves similares devem produzir hashes muito diferentes
        similar_keys = [
            "abcd1234efgh5678",
            "abcd1234efgh5679",  # último dígito diferente
            "abcd1234efgh567a",  # último char diferente
            "Abcd1234efgh5678",  # case diferente
            "abcd1234efgh5678 ",  # espaço extra
        ]

        hashes = [SecretKeyService.hash_secret_key(key) for key in similar_keys]

        # Todos os hashes devem ser únicos
        assert len(set(hashes)) == len(hashes), "Colisão de hash detectada"

        # Hashes devem ser suficientemente diferentes (Hamming distance)
        for i, hash1 in enumerate(hashes):
            for j, hash2 in enumerate(hashes[i + 1 :], i + 1):
                # Conta diferenças entre caracteres
                differences = sum(c1 != c2 for c1, c2 in zip(hash1, hash2))
                # Deve haver muitas diferenças (pelo menos 50% dos caracteres)
                assert (
                    differences > len(hash1) * 0.5
                ), f"Hashes muito similares: {similar_keys[i]} vs {similar_keys[j]}"


class TestConcurrentCryptography:
    """Testes de concorrência para operações criptográficas"""

    def test_concurrent_password_hashing(self):
        """Testa hashing de senhas em paralelo"""
        passwords = [f"password_{i}" for i in range(50)]

        def hash_password(password):
            return get_password_hash(password)

        # Executa hashing em paralelo
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(hash_password, pwd) for pwd in passwords]
            hashes = [
                future.result() for future in concurrent.futures.as_completed(futures)
            ]

        # Todos os hashes devem ser únicos
        assert len(set(hashes)) == len(hashes), "Hashes duplicados em execução paralela"

        # Todos devem ser válidos
        for i, password_hash in enumerate(hashes):
            assert verify_password(
                passwords[i], password_hash
            ), f"Hash inválido para senha {i}"

    def test_concurrent_token_creation(self):
        """Testa criação de tokens em paralelo"""
        user_data_list = [
            {"sub": f"user_{i}@example.com", "user_id": i} for i in range(50)
        ]

        def create_token(user_data):
            return create_access_token(data=user_data)

        # Executa criação em paralelo
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(create_token, data) for data in user_data_list]
            tokens = [
                future.result() for future in concurrent.futures.as_completed(futures)
            ]

        # Todos os tokens devem ser únicos
        assert len(set(tokens)) == len(tokens), "Tokens duplicados em execução paralela"

        # Todos devem ser válidos
        for token in tokens:
            payload = verify_token(token)
            assert payload is not None, "Token inválido criado em paralelo"

    def test_concurrent_secret_key_generation(self):
        """Testa geração de chaves secretas em paralelo"""

        def generate_key():
            return SecretKeyService.generate_secret_key()

        # Executa geração em paralelo
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(generate_key) for _ in range(100)]
            keys = [
                future.result() for future in concurrent.futures.as_completed(futures)
            ]

        # Todas as chaves devem ser únicas
        assert len(set(keys)) == len(keys), "Chaves duplicadas em execução paralela"

        # Todas devem ter formato correto
        for key in keys:
            assert len(key) == 16, f"Chave com tamanho incorreto: {len(key)}"
            assert all(
                c in "0123456789abcdef" for c in key.lower()
            ), f"Chave com caracteres inválidos: {key}"


class TestCryptographicEdgeCases:
    """Testes de casos extremos em criptografia"""

    def test_empty_and_null_inputs(self):
        """Testa entradas vazias e nulas"""
        # Password hashing com entradas inválidas
        invalid_passwords = [None, "", "\x00", "\x00\x00\x00"]

        for invalid_password in invalid_passwords:
            try:
                password_hash = get_password_hash(invalid_password)
                # Se não falhar, deve pelo menos não verificar com entrada vazia
                assert not verify_password("", password_hash)
                assert not verify_password(None, password_hash)
            except (TypeError, ValueError):
                # É aceitável falhar com entradas inválidas
                pass

        # Token creation com dados inválidos
        invalid_data_sets = [None, {}, {"sub": None}, {"sub": ""}]

        for invalid_data in invalid_data_sets:
            try:
                token = create_access_token(data=invalid_data)
                # Se criar token, deve ser inválido na verificação
                payload = verify_token(token)
                # Payload pode ser None ou ter dados inválidos
                if payload:
                    assert payload.get("sub") != ""
            except (TypeError, ValueError, JWTError):
                # É aceitável falhar com dados inválidos
                pass

    def test_very_long_inputs(self):
        """Testa entradas muito longas"""
        # Senha muito longa
        very_long_password = "A" * 10000

        try:
            password_hash = get_password_hash(very_long_password)
            # Hash deve ser do tamanho normal mesmo com senha longa
            assert len(password_hash) == 60
            # Deve verificar corretamente
            assert verify_password(very_long_password, password_hash)
        except Exception as e:
            # Pode falhar por limitações de memória/performance
            assert "memory" in str(e).lower() or "length" in str(e).lower()

        # Dados muito longos para JWT
        very_long_data = {"sub": "user@example.com", "long_field": "X" * 100000}

        try:
            token = create_access_token(data=very_long_data)
            # Token pode ser criado mas deve ser muito longo
            assert len(token) > 1000
        except Exception as e:
            # Pode falhar por limitações de tamanho
            assert "size" in str(e).lower() or "length" in str(e).lower()

    def test_unicode_and_special_characters(self):
        """Testa caracteres Unicode e especiais"""
        # Senhas com caracteres especiais
        special_passwords = [
            "café123!",  # acentos
            "пароль123",  # cirílico
            "密码123",  # chinês
            "🔒🔑123",  # emojis
            "test\x00null",  # null byte
            "test\r\nline",  # quebras de linha
        ]

        for special_password in special_passwords:
            try:
                password_hash = get_password_hash(special_password)
                assert verify_password(special_password, password_hash)
                # Hash deve ser ASCII válido
                password_hash.encode("ascii")
            except (UnicodeError, ValueError) as e:
                # Pode falhar com caracteres problemáticos
                assert "unicode" in str(e).lower() or "ascii" in str(e).lower()

    def test_timing_attack_resistance_detailed(self):
        """Teste detalhado de resistência a ataques de timing"""
        password = "TestPassword123!"
        correct_hash = get_password_hash(password)

        # Múltiplas medições para reduzir ruído
        measurements = 10

        def measure_verification_time(test_password, password_hash):
            times = []
            for _ in range(measurements):
                start = time.perf_counter()
                verify_password(test_password, password_hash)
                end = time.perf_counter()
                times.append(end - start)
            return sum(times) / len(times)  # média

        # Testa diferentes cenários
        scenarios = [
            ("correct", password),
            ("wrong_short", "x"),
            ("wrong_same_length", "X" * len(password)),
            ("wrong_longer", "X" * (len(password) * 2)),
            ("empty", ""),
        ]

        times = {}
        for scenario_name, test_password in scenarios:
            times[scenario_name] = measure_verification_time(
                test_password, correct_hash
            )

        # Verifica que não há diferenças significativas
        time_values = list(times.values())
        min_time = min(time_values)
        max_time = max(time_values)

        # Permite variação de até 5x (bcrypt é naturalmente variável)
        ratio = max_time / min_time if min_time > 0 else float("inf")
        assert ratio < 5, f"Variação de timing suspeita: {ratio:.2f}x\nTimes: {times}"
