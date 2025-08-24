#!/usr/bin/env python3
"""
Testes específicos para tratamento de erros HTTP 400 e 422
Cobertura: validação de campos, mensagens de erro, códigos de status
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


class TestErrorHandling:
    """Classe de testes para tratamento de erros"""

    def setup_method(self):
        """Configuração executada antes de cada teste"""
        self.client = TestClient(app)
        self.base_valid_data = {
            "email": "test@example.com",
            "name": "Test User",
            "username": "testuser",
            "full_name": "Test User",
            "password": "SecurePass123!",
            "security_question_1_id": "MOTHER_MAIDEN_NAME",
            "security_answer_1": "Silva",
            "security_question_2_id": "FIRST_PET_NAME",
            "security_answer_2": "Rex",
        }

    def test_error_400_invalid_security_question_id(self, test_db):
        """Testa erro 400 para ID de pergunta secreta inválido"""
        data = self.base_valid_data.copy()
        data["security_question_1_id"] = "INVALID_QUESTION_ID"

        response = self.client.post("/api/v1/auth/register", json=data)

        assert response.status_code == 400
        error_data = response.json()
        assert "detail" in error_data
        assert "security_question" in error_data["detail"].lower()
        assert (
            "invalid" in error_data["detail"].lower()
            or "inválid" in error_data["detail"].lower()
        )

    def test_error_400_duplicate_security_questions(self, test_db):
        """Testa erro 400 para perguntas secretas duplicadas"""
        data = self.base_valid_data.copy()
        data["security_question_1_id"] = "MOTHER_MAIDEN_NAME"
        data["security_question_2_id"] = "MOTHER_MAIDEN_NAME"  # Mesma pergunta

        response = self.client.post("/api/v1/auth/register", json=data)

        assert response.status_code == 400
        error_data = response.json()
        assert "detail" in error_data
        assert any(
            word in error_data["detail"].lower()
            for word in ["different", "same", "igual", "diferente", "duplicate"]
        )

    def test_error_400_duplicate_email(self, test_db):
        """Testa erro 400 para email duplicado"""
        # Primeiro registro
        response1 = self.client.post("/api/v1/auth/register", json=self.base_valid_data)
        assert response1.status_code == 200

        # Segundo registro com mesmo email
        data = self.base_valid_data.copy()
        data["username"] = "different_username"

        response2 = self.client.post("/api/v1/auth/register", json=data)

        assert response2.status_code == 400
        error_data = response2.json()
        assert "detail" in error_data
        assert "email" in error_data["detail"].lower()
        assert any(
            word in error_data["detail"].lower()
            for word in ["already", "exists", "duplicate", "já", "existe"]
        )

    def test_error_400_duplicate_username(self, test_db):
        """Testa erro 400 para username duplicado"""
        # Primeiro registro
        response1 = self.client.post("/api/v1/auth/register", json=self.base_valid_data)
        assert response1.status_code == 200

        # Segundo registro com mesmo username
        data = self.base_valid_data.copy()
        data["email"] = "different@example.com"

        response2 = self.client.post("/api/v1/auth/register", json=data)

        assert response2.status_code == 400
        error_data = response2.json()
        assert "detail" in error_data
        assert "username" in error_data["detail"].lower()
        assert any(
            word in error_data["detail"].lower()
            for word in ["already", "exists", "duplicate", "já", "existe"]
        )

    def test_error_422_missing_required_fields(self, test_db):
        """Testa erro 422 para campos obrigatórios ausentes"""
        required_fields = [
            "email",
            "name",
            "username",
            "full_name",
            "password",
            "security_question_1_id",
            "security_answer_1",
            "security_question_2_id",
            "security_answer_2",
        ]

        for field in required_fields:
            data = self.base_valid_data.copy()
            del data[field]  # Remove campo obrigatório

            response = self.client.post("/api/v1/auth/register", json=data)

            assert (
                response.status_code == 422
            ), f"Campo '{field}' deveria ser obrigatório"

            error_data = response.json()
            assert "detail" in error_data

            # Verifica se o erro menciona o campo específico
            error_str = str(error_data["detail"]).lower()
            assert (
                field.lower() in error_str
                or "required" in error_str
                or "obrigatório" in error_str
            )

    def test_error_422_invalid_email_format(self, test_db):
        """Testa erro 422 para formato de email inválido"""
        invalid_emails = [
            "invalid-email",
            "@example.com",
            "test@",
            "test.example.com",
            "test@.com",
            "test@com",
            "test space@example.com",
            "test@exam ple.com",
            "test@@example.com",
            "test@example..com",
            "",
            "   ",
            "test@",
            "@",
            "test@example.",
            "test@.example.com",
        ]

        for i, invalid_email in enumerate(invalid_emails):
            data = self.base_valid_data.copy()
            data["email"] = invalid_email
            data["username"] = f"user{i}"  # Username único

            response = self.client.post("/api/v1/auth/register", json=data)

            assert (
                response.status_code == 422
            ), f"Email inválido '{invalid_email}' deveria ser rejeitado"

            error_data = response.json()
            assert "detail" in error_data

            error_str = str(error_data["detail"]).lower()
            assert "email" in error_str or "valid" in error_str or "format" in error_str

    def test_error_422_weak_password(self, test_db):
        """Testa erro 422 para senhas fracas"""
        weak_passwords = [
            "123",
            "password",
            "abc",
            "12345678",
            "abcdefgh",
            "PASSWORD",
            "Password",
            "pass123",
            "Pass123",  # Sem caracteres especiais
            "Pass!",  # Muito curta
            "",  # Vazia
            "   ",  # Apenas espaços
            "a",  # Muito curta
            "ab",  # Muito curta
            "abc123",  # Sem maiúsculas nem especiais
            "ABC123",  # Sem minúsculas nem especiais
            "Abc123",  # Sem caracteres especiais
            "Abc!@#",  # Sem números
            "123!@#",  # Sem letras
            "ABCD!@#",  # Sem minúsculas nem números
            "abcd!@#",  # Sem maiúsculas nem números
        ]

        for i, weak_password in enumerate(weak_passwords):
            data = self.base_valid_data.copy()
            data["password"] = weak_password
            data["email"] = f"weak{i}@example.com"
            data["username"] = f"weak{i}"

            response = self.client.post("/api/v1/auth/register", json=data)

            assert (
                response.status_code == 422
            ), f"Senha fraca '{weak_password}' deveria ser rejeitada"

            error_data = response.json()
            assert "detail" in error_data

            error_str = str(error_data["detail"]).lower()
            assert any(
                word in error_str
                for word in [
                    "password",
                    "senha",
                    "weak",
                    "fraca",
                    "strong",
                    "forte",
                    "requirements",
                    "requisitos",
                    "criteria",
                    "critérios",
                ]
            )

    def test_error_422_empty_string_fields(self, test_db):
        """Testa erro 422 para campos com strings vazias"""
        string_fields = [
            "email",
            "name",
            "username",
            "full_name",
            "password",
            "security_question_1_id",
            "security_answer_1",
            "security_question_2_id",
            "security_answer_2",
        ]

        empty_values = ["", "   ", "\t", "\n", "\r\n"]

        for field in string_fields:
            for i, empty_value in enumerate(empty_values):
                data = self.base_valid_data.copy()
                data[field] = empty_value
                data["email"] = f"empty{field}{i}@example.com"
                data["username"] = f"empty{field}{i}"

                response = self.client.post("/api/v1/auth/register", json=data)

                assert (
                    response.status_code == 422
                ), f"Campo '{field}' com valor vazio '{repr(empty_value)}' deveria ser rejeitado"

                error_data = response.json()
                assert "detail" in error_data

    def test_error_422_null_fields(self, test_db):
        """Testa erro 422 para campos com valor null"""
        fields_to_test = [
            "email",
            "name",
            "username",
            "full_name",
            "password",
            "security_question_1_id",
            "security_answer_1",
            "security_question_2_id",
            "security_answer_2",
        ]

        for field in fields_to_test:
            data = self.base_valid_data.copy()
            data[field] = None

            response = self.client.post("/api/v1/auth/register", json=data)

            assert (
                response.status_code == 422
            ), f"Campo '{field}' com valor null deveria ser rejeitado"

            error_data = response.json()
            assert "detail" in error_data

    def test_error_422_invalid_field_types(self, test_db):
        """Testa erro 422 para tipos de campo inválidos"""
        invalid_type_tests = [
            ("email", 123),
            ("email", ["test@example.com"]),
            ("email", {"email": "test@example.com"}),
            ("name", 456),
            ("name", ["Test User"]),
            ("username", 456),
            ("username", ["testuser"]),
            ("full_name", 789),
            ("full_name", ["Test User"]),
            ("password", 101112),
            ("password", ["SecurePass123!"]),
            ("security_question_1_id", 131415),
            ("security_question_1_id", ["MOTHER_MAIDEN_NAME"]),
            ("security_answer_1", 161718),
            ("security_answer_1", ["Silva"]),
            ("security_question_2_id", 192021),
            ("security_answer_2", 222324),
        ]

        for i, (field, invalid_value) in enumerate(invalid_type_tests):
            data = self.base_valid_data.copy()
            data[field] = invalid_value
            data["email"] = f"type{i}@example.com"
            data["username"] = f"type{i}"

            response = self.client.post("/api/v1/auth/register", json=data)

            assert (
                response.status_code == 422
            ), f"Campo '{field}' com tipo inválido '{type(invalid_value).__name__}' deveria ser rejeitado"

            error_data = response.json()
            assert "detail" in error_data

    def test_error_response_structure(self, test_db):
        """Testa estrutura das respostas de erro"""
        # Testa erro 400
        data = self.base_valid_data.copy()
        data["security_question_1_id"] = "INVALID_ID"

        response = self.client.post("/api/v1/auth/register", json=data)

        assert response.status_code == 400
        error_data = response.json()

        # Verifica estrutura do erro 400
        assert isinstance(error_data, dict)
        assert "detail" in error_data
        assert isinstance(error_data["detail"], str)
        assert len(error_data["detail"]) > 0

        # Testa erro 422
        data2 = self.base_valid_data.copy()
        del data2["email"]

        response2 = self.client.post("/api/v1/auth/register", json=data2)

        assert response2.status_code == 422
        error_data2 = response2.json()

        # Verifica estrutura do erro 422
        assert isinstance(error_data2, dict)
        assert "detail" in error_data2
        # Para erro 422, detail pode ser string ou lista
        assert isinstance(error_data2["detail"], (str, list))

    def test_error_messages_are_informative(self, test_db):
        """Testa se as mensagens de erro são informativas"""
        test_cases = [
            {
                "data_modification": lambda d: d.update(
                    {"security_question_1_id": "INVALID"}
                ),
                "expected_status": 400,
                "expected_keywords": ["security_question", "invalid", "question"],
            },
            {
                "data_modification": lambda d: d.pop("email"),
                "expected_status": 422,
                "expected_keywords": ["email", "required", "field"],
            },
            {
                "data_modification": lambda d: d.update({"email": "invalid-email"}),
                "expected_status": 422,
                "expected_keywords": ["email", "valid", "format"],
            },
            {
                "data_modification": lambda d: d.update({"password": "123"}),
                "expected_status": 422,
                "expected_keywords": ["password", "weak", "requirements"],
            },
        ]

        for i, test_case in enumerate(test_cases):
            data = self.base_valid_data.copy()
            data["email"] = f"info{i}@example.com"
            data["username"] = f"info{i}"

            test_case["data_modification"](data)

            response = self.client.post("/api/v1/auth/register", json=data)

            assert response.status_code == test_case["expected_status"]

            error_data = response.json()
            error_message = str(error_data["detail"]).lower()

            # Verifica se pelo menos uma palavra-chave está presente
            keyword_found = any(
                keyword.lower() in error_message
                for keyword in test_case["expected_keywords"]
            )

            assert (
                keyword_found
            ), f"Mensagem de erro '{error_message}' não contém nenhuma das palavras-chave esperadas: {test_case['expected_keywords']}"

    def test_error_handling_consistency(self, test_db):
        """Testa consistência no tratamento de erros"""
        # Testa múltiplos erros do mesmo tipo para garantir consistência
        invalid_emails = ["invalid1", "invalid2", "invalid3"]

        responses = []
        for i, invalid_email in enumerate(invalid_emails):
            data = self.base_valid_data.copy()
            data["email"] = invalid_email
            data["username"] = f"consistent{i}"

            response = self.client.post("/api/v1/auth/register", json=data)
            responses.append(response)

        # Todos devem ter o mesmo status code
        status_codes = [r.status_code for r in responses]
        assert all(
            code == status_codes[0] for code in status_codes
        ), f"Status codes inconsistentes para o mesmo tipo de erro: {status_codes}"

        # Todos devem ter estrutura de resposta similar
        for response in responses:
            error_data = response.json()
            assert "detail" in error_data
            assert isinstance(error_data["detail"], (str, list))

    def test_no_sensitive_data_in_errors(self, test_db):
        """Testa se dados sensíveis não são expostos em mensagens de erro"""
        sensitive_data = {
            "password": "MySecretPassword123!",
            "security_answer_1": "MySensitiveAnswer",
            "security_answer_2": "AnotherSensitiveAnswer",
        }

        # Testa com dados sensíveis em campos inválidos
        data = self.base_valid_data.copy()
        data.update(sensitive_data)
        data["email"] = "invalid-email"  # Força erro

        response = self.client.post("/api/v1/auth/register", json=data)

        assert response.status_code == 422

        error_data = response.json()
        error_message = str(error_data["detail"]).lower()

        # Verifica se dados sensíveis não estão na mensagem de erro
        for field, value in sensitive_data.items():
            assert (
                value.lower() not in error_message
            ), f"Dado sensível '{value}' foi exposto na mensagem de erro"

    def test_error_logging_does_not_expose_sensitive_data(self, test_db):
        """Testa se logs de erro não expõem dados sensíveis"""
        # Este teste verifica indiretamente através das respostas
        # Em um ambiente real, você verificaria os logs diretamente

        data = self.base_valid_data.copy()
        data["password"] = "SensitivePassword123!"
        data["security_answer_1"] = "MySensitiveAnswer"
        data["email"] = "invalid-email"  # Força erro

        response = self.client.post("/api/v1/auth/register", json=data)

        # Verifica se a resposta não contém dados sensíveis
        response_text = response.text.lower()

        sensitive_values = [
            "SensitivePassword123!".lower(),
            "MySensitiveAnswer".lower(),
        ]

        for sensitive_value in sensitive_values:
            assert (
                sensitive_value not in response_text
            ), f"Valor sensível '{sensitive_value}' foi exposto na resposta"
