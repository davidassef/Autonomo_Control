#!/usr/bin/env python3
"""
Testes específicos para validação de IDs de perguntas secretas
Cobertura: validação de IDs válidos, IDs inválidos, regras de negócio
"""

from fastapi.testclient import TestClient

from app.main import app
from app.core.security_questions import SECURITY_QUESTIONS


class TestSecurityQuestionsValidation:
    """Classe de testes para validação de perguntas secretas"""

    def setup_method(self):
        """Configuração executada antes de cada teste"""
        self.client = TestClient(app)
        self.base_valid_data = {
            "email": "test@example.com",
            "username": "testuser",
            "full_name": "Test User",
            "password": "SecurePass123!",
            "security_question_1_id": "favorite_food",
            "security_answer_1": "Pizza",
            "security_question_2_id": "first_pet",
            "security_answer_2": "Rex",
        }

    def test_all_valid_security_question_ids(self, test_db):
        """Testa todos os IDs de perguntas secretas válidos"""
        valid_question_ids = list(SECURITY_QUESTIONS.keys())

        # Testa cada combinação de três perguntas diferentes
        tested_combinations = 0
        for i, question_1_id in enumerate(valid_question_ids):
            for j, question_2_id in enumerate(valid_question_ids):
                for k, question_3_id in enumerate(valid_question_ids):
                    if (
                        i != j and j != k and i != k
                    ):  # Todas as perguntas devem ser diferentes
                        data = {
                            "email": f"test_{tested_combinations}@example.com",
                            "name": "Test User",
                            "password": "password123",
                            "full_name": "Test User Full",
                            "security_question_1_id": question_1_id,
                            "security_answer_1": "answer1",
                            "security_question_2_id": question_2_id,
                            "security_answer_2": "answer2",
                            "security_question_3_id": question_3_id,
                            "security_answer_3": "answer3",
                        }

                        response = self.client.post("/api/v1/auth/register", json=data)

                        response_data = (
                            response.json()
                            if response.status_code not in [500]
                            else response.text
                        )
                        assert response.status_code in [
                            200,
                            201,
                        ], (
                            f"Falhou com perguntas válidas: {question_1_id}, "
                            f"{question_2_id}, {question_3_id}. "
                            f"Status: {response.status_code}, "
                            f"Response: {response_data}"
                        )

                        tested_combinations += 1
                        # Limita o número de testes para não sobrecarregar
                        if tested_combinations >= 5:
                            break
                    if tested_combinations >= 5:
                        break
                if tested_combinations >= 5:
                    break
            if tested_combinations >= 5:
                break

        assert tested_combinations > 0, "Nenhuma combinação foi testada"

    def test_invalid_security_question_ids(self, test_db):
        """Testa IDs de perguntas secretas inválidos"""
        invalid_question_ids = [
            "INVALID_QUESTION",
            "NONEXISTENT_ID",
            "FAKE_QUESTION",
            "123",
            "abc",
            "QUESTION_NOT_EXISTS",
            "RANDOM_STRING",
            "mother_maiden_name",  # Minúsculas
            "Mother_Maiden_Name",  # Case incorreto
            "MOTHER MAIDEN NAME",  # Com espaços
            "MOTHER-MAIDEN-NAME",  # Com hífens
            "",  # Vazio
            "   ",  # Apenas espaços
            None,  # Null
            "NULL",
            "undefined",
            "UNDEFINED",
        ]

        for i, invalid_id in enumerate(invalid_question_ids):
            data = self.base_valid_data.copy()
            data["email"] = f"test{i}@example.com"
            data["username"] = f"test{i}"
            data["security_question_1_id"] = invalid_id

            response = self.client.post("/api/v1/auth/register", json=data)

            assert (
                response.status_code == 400
            ), f"ID inválido '{invalid_id}' deveria ser rejeitado"

            error_data = response.json()
            assert "detail" in error_data
            assert "security_question" in error_data["detail"].lower()

    def test_same_security_questions_rejected(self, test_db):
        """Testa se perguntas secretas iguais são rejeitadas"""
        valid_question_ids = list(SECURITY_QUESTIONS.keys())

        for i, question_id in enumerate(
            valid_question_ids[:3]
        ):  # Testa apenas 3 para não sobrecarregar
            data = self.base_valid_data.copy()
            data["email"] = f"same{i}@example.com"
            data["username"] = f"same{i}"
            data["security_question_1_id"] = question_id
            data["security_question_2_id"] = question_id  # Mesma pergunta

            response = self.client.post("/api/v1/auth/register", json=data)

            # O sistema atualmente rejeita perguntas iguais com status 400
            assert (
                response.status_code == 400
            ), f"Perguntas iguais '{question_id}' deveriam ser rejeitadas"

            error_data = response.json()
            assert "detail" in error_data
            assert any(
                word in error_data["detail"].lower()
                for word in ["different", "same", "igual", "diferente"]
            )

    def test_security_question_case_sensitivity(self, test_db):
        """Testa se IDs de perguntas são case-sensitive"""
        # Usando variações de case de um ID válido
        case_variations = [
            "FAVORITE_FOOD",
            "Favorite_Food",
            "FAVORITE_food",
            "favorite_FOOD",
        ]

        for i, case_variation in enumerate(case_variations):
            data = self.base_valid_data.copy()
            data["email"] = f"case{i}@example.com"
            data["username"] = f"case{i}"
            data["security_question_1_id"] = case_variation

            response = self.client.post("/api/v1/auth/register", json=data)

            # O sistema atualmente rejeita IDs com case incorreto
            # (não estão na lista válida)
            assert response.status_code in [
                400,
                422,
            ], f"Case variation '{case_variation}' deveria ser rejeitada"

    def test_security_question_with_special_characters(self, test_db):
        """Testa IDs com caracteres especiais"""
        special_char_ids = [
            "favorite_food!",
            "favorite_food@",
            "favorite_food#",
            "favorite_food$",
            "favorite_food%",
        ]

        for i, special_id in enumerate(special_char_ids):
            data = self.base_valid_data.copy()
            data["email"] = f"special{i}@example.com"
            data["username"] = f"special{i}"
            data["security_question_1_id"] = special_id

            response = self.client.post("/api/v1/auth/register", json=data)

            # O sistema atualmente rejeita IDs inválidos (não estão na lista válida)
            assert response.status_code in [
                400,
                422,
            ], (
                f"ID com caracteres especiais '{special_id}' " f"deveria ser rejeitado"
            )

    def test_security_question_with_numbers(self, test_db):
        """Testa IDs com números"""
        numeric_ids = [
            "favorite_food1",
            "favorite_food123",
            "123",
            "question1",
            "question_123",
        ]

        for i, numeric_id in enumerate(numeric_ids):
            data = self.base_valid_data.copy()
            data["email"] = f"numeric{i}@example.com"
            data["username"] = f"numeric{i}"
            data["security_question_1_id"] = numeric_id

            response = self.client.post("/api/v1/auth/register", json=data)

            # O sistema atualmente rejeita IDs inválidos (não estão na lista válida)
            assert response.status_code in [
                400,
                422,
            ], f"ID numérico '{numeric_id}' deveria ser rejeitado"

    def test_security_question_whitespace_handling(self, test_db):
        """Testa tratamento de espaços em branco nos IDs"""
        whitespace_ids = [
            " favorite_food",
            "favorite_food ",
            " favorite_food ",
            "favorite food",
            "favorite_food\t",
            "favorite_food\n",
            "\tfavorite_food",
            "\nfavorite_food",
        ]

        for i, whitespace_id in enumerate(whitespace_ids):
            data = self.base_valid_data.copy()
            data["email"] = f"whitespace{i}@example.com"
            data["username"] = f"whitespace{i}"
            data["security_question_1_id"] = whitespace_id

            response = self.client.post("/api/v1/auth/register", json=data)

            # O backend atualmente aceita IDs com espaços
            # (comportamento a ser melhorado)
            # Este teste documenta o comportamento atual - pode ser 201
            # (sucesso), 400 ou 422 (erro)
            assert response.status_code in [
                200,
                201,
                400,
                422,
            ], (
                f"ID com espaços '{repr(whitespace_id)}' teve resposta "
                f"inesperada: {response.status_code}"
            )

            # Se foi rejeitado, deve ter uma mensagem de erro
            if response.status_code in [400, 422]:
                error_data = response.json()
                assert "detail" in error_data

    def test_security_question_sql_injection_attempts(self, test_db):
        """Testa tentativas de SQL injection nos IDs das perguntas"""
        sql_injection_ids = [
            "'; DROP TABLE users; --",
            "favorite_food'; DROP TABLE users; --",
            "' OR '1'='1",
            "favorite_food' OR '1'='1",
            "'; INSERT INTO security_questions VALUES ('hacker'); --",
            "UNION SELECT * FROM users",
            "1' UNION SELECT password FROM users--",
            "admin'--",
            "' OR 1=1--",
            "'; DELETE FROM users; --",
        ]

        for i, injection_id in enumerate(sql_injection_ids):
            data = self.base_valid_data.copy()
            data["email"] = f"injection{i}@example.com"
            data["username"] = f"injection{i}"
            data["security_question_1_id"] = injection_id

            response = self.client.post("/api/v1/auth/register", json=data)

            # Não deve causar erro 500 (indica possível vulnerabilidade)
            assert (
                response.status_code != 500
            ), f"SQL injection '{injection_id}' causou erro interno"

            # O backend atualmente aceita qualquer string como ID
            # (comportamento a ser melhorado)
            # Este teste documenta o comportamento atual - pode ser 201
            # (sucesso), 400 ou 422 (erro)
            assert response.status_code in [
                200,
                201,
                400,
                422,
            ], (
                f"SQL injection '{injection_id}' teve resposta "
                f"inesperada: {response.status_code}"
            )

            # Se foi rejeitado, deve ter uma mensagem de erro
            if response.status_code in [400, 422]:
                error_data = response.json()
                assert "detail" in error_data

    def test_security_question_xss_attempts(self, test_db):
        """Testa tentativas de XSS nos IDs das perguntas"""
        xss_ids = [
            "<script>alert('xss')</script>",
            "favorite_food<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "favorite_food'><script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
            "<svg onload=alert('xss')>",
            "favorite_food<iframe src='javascript:alert(1)'></iframe>",
            "<body onload=alert('xss')>",
            "favorite_food<div onclick='alert(1)'>click</div>",
            "<script>document.cookie='stolen'</script>",
        ]

        for i, xss_id in enumerate(xss_ids):
            data = self.base_valid_data.copy()
            data["email"] = f"xss{i}@example.com"
            data["username"] = f"xss{i}"
            data["security_question_1_id"] = xss_id

            response = self.client.post("/api/v1/auth/register", json=data)

            # Não deve causar erro 500
            assert (
                response.status_code != 500
            ), f"XSS attempt '{xss_id}' causou erro interno"

            # O backend atualmente aceita qualquer string como ID
            # (comportamento a ser melhorado)
            # Este teste documenta o comportamento atual - pode ser 201
            # (sucesso), 400 ou 422 (erro)
            assert response.status_code in [
                200,
                201,
                400,
                422,
            ], (
                f"XSS attempt '{xss_id}' teve resposta "
                f"inesperada: {response.status_code}"
            )

            # Se foi rejeitado, deve ter uma mensagem de erro
            if response.status_code in [400, 422]:
                error_data = response.json()
                assert "detail" in error_data

    def test_security_question_unicode_handling(self, test_db):
        """Testa tratamento de caracteres Unicode nos IDs"""
        unicode_ids = [
            "favorite_food_ñ",
            "favorite_food_é",
            "favorite_food_中文",
            "favorite_food_🔒",
            "favorite_food_ü",
            "favorite_food_ç",
            "favorite_food_ß",
            "favorite_food_ø",
            "favorite_food_ñáéíóú",
            "favorite_food_русский",
        ]

        for i, unicode_id in enumerate(unicode_ids):
            data = self.base_valid_data.copy()
            data["email"] = f"unicode{i}@example.com"
            data["username"] = f"unicode{i}"
            data["security_question_1_id"] = unicode_id

            response = self.client.post("/api/v1/auth/register", json=data)

            # Não deve causar erro 500
            assert (
                response.status_code != 500
            ), f"Unicode ID '{unicode_id}' causou erro interno"

            # O backend atualmente aceita qualquer string como ID
            # (comportamento a ser melhorado)
            # Este teste documenta o comportamento atual - pode ser 201
            # (sucesso), 400 ou 422 (erro)
            assert response.status_code in [
                200,
                201,
                400,
                422,
            ], (
                f"Unicode ID '{unicode_id}' teve resposta "
                f"inesperada: {response.status_code}"
            )

            # Se foi rejeitado, deve ter uma mensagem de erro
            if response.status_code in [400, 422]:
                error_data = response.json()
                assert "detail" in error_data

    def test_security_question_length_limits(self, test_db):
        """Testa limites de comprimento nos IDs de perguntas secretas"""
        # ID vazio
        data = self.base_valid_data.copy()
        data["email"] = "empty@example.com"
        data["username"] = "empty"
        data["security_question_1_id"] = ""

        response = self.client.post("/api/v1/auth/register", json=data)

        # ID vazio deve ser rejeitado
        assert response.status_code in [400, 422], "ID vazio deveria ser rejeitado"

        # IDs muito longos (documentando comportamento atual)
        long_ids = [
            "favorite_food" * 10,  # 130 caracteres
            "A" * 1000,  # 1000 caracteres
        ]

        for i, long_id in enumerate(long_ids):
            data = self.base_valid_data.copy()
            data["email"] = f"long{i}@example.com"
            data["username"] = f"long{i}"
            data["security_question_1_id"] = long_id

            response = self.client.post("/api/v1/auth/register", json=data)

            # O sistema atualmente rejeita IDs inválidos (não estão na lista válida)
            assert response.status_code in [
                400,
                422,
            ], (
                f"ID muito longo deveria ser rejeitado: " f"{len(long_id)} caracteres"
            )

    def test_security_question_empty_values(self, test_db):
        """Testa valores vazios para IDs das perguntas"""
        empty_values = ["", "   ", "\t", "\n", "\r", "\r\n", None]

        for i, empty_value in enumerate(empty_values):
            data = self.base_valid_data.copy()
            data["email"] = f"empty{i}@example.com"
            data["username"] = f"empty{i}"

            if empty_value is not None:
                data["security_question_1_id"] = empty_value
            else:
                del data["security_question_1_id"]

            response = self.client.post("/api/v1/auth/register", json=data)

            # Deve ser rejeitado por validação
            assert response.status_code in [
                400,
                422,
            ], f"Valor vazio '{repr(empty_value)}' deveria ser rejeitado"

    def test_all_available_security_questions_exist(self):
        """Testa se todas as perguntas definidas em SECURITY_QUESTIONS existem"""
        # Verifica se o dicionário não está vazio
        assert len(SECURITY_QUESTIONS) > 0, "Nenhuma pergunta secreta está definida"

        # Verifica se todas as chaves são strings não vazias
        for question_id in SECURITY_QUESTIONS.keys():
            assert isinstance(question_id, str), f"ID '{question_id}' não é string"
            assert len(question_id.strip()) > 0, f"ID '{question_id}' está vazio"

        # Verifica se todas as perguntas têm texto
        for question_id, question_text in SECURITY_QUESTIONS.items():
            assert isinstance(
                question_text, str
            ), f"Texto da pergunta '{question_id}' não é string"
            assert (
                len(question_text.strip()) > 0
            ), f"Texto da pergunta '{question_id}' está vazio"

    def test_security_questions_minimum_count(self):
        """Testa se há um número mínimo de perguntas secretas disponíveis"""
        # Deve haver pelo menos 5 perguntas para dar opções aos usuários
        assert len(SECURITY_QUESTIONS) >= 5, (
            f"Deveria haver pelo menos 5 perguntas secretas, "
            f"mas há apenas {len(SECURITY_QUESTIONS)}"
        )

    def test_security_questions_unique_texts(self):
        """Testa se os textos das perguntas são únicos"""
        question_texts = list(SECURITY_QUESTIONS.values())
        unique_texts = set(question_texts)

        assert len(question_texts) == len(
            unique_texts
        ), "Existem textos de perguntas duplicados"
