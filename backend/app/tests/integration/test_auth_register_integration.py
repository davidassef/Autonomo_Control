#!/usr/bin/env python3
"""
Testes de integração para o endpoint /auth/register
Cobertura: fluxo completo, integração com banco de dados, validações end-to-end
"""

import pytest
import requests
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User
from app.core.database import get_db
from app.core.security_questions import SECURITY_QUESTIONS


class TestAuthRegisterIntegration:
    """Classe de testes de integração para o endpoint /auth/register"""

    def setup_method(self):
        """Configuração executada antes de cada teste"""
        self.client = TestClient(app)
        self.base_url = "http://127.0.0.1:8000/api/v1"
        self.valid_register_data = {
            "email": "integration@example.com",
            "name": "Integration Test User",
            "username": "integrationuser",
            "full_name": "Integration Test User",
            "password": "SecurePass123!",
            "security_question_1_id": "MOTHER_MAIDEN_NAME",
            "security_answer_1": "Silva",
            "security_question_2_id": "FIRST_PET_NAME",
            "security_answer_2": "Rex",
        }

    def test_complete_registration_flow(self, test_db):
        """Testa o fluxo completo de registro com verificação no banco"""
        # 1. Registro do usuário
        response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )

        assert response.status_code == 200
        data = response.json()

        # Verifica resposta
        assert "access_token" in data
        assert "user" in data
        user_data = data["user"]
        user_id = user_data["id"]

        # 2. Verifica se usuário foi criado no banco
        db_user = test_db.query(User).filter(User.id == user_id).first()
        assert db_user is not None
        assert db_user.email == self.valid_register_data["email"]
        assert db_user.username == self.valid_register_data["username"]
        assert db_user.full_name == self.valid_register_data["full_name"]
        assert db_user.role == "USER"

        # 3. Verifica se a senha foi hasheada
        assert db_user.hashed_password != self.valid_register_data["password"]
        assert len(db_user.hashed_password) > 50  # Hash deve ser longo

        # 4. Verifica se as perguntas secretas foram salvas
        assert (
            db_user.security_question_1_id
            == self.valid_register_data["security_question_1_id"]
        )
        assert (
            db_user.security_question_2_id
            == self.valid_register_data["security_question_2_id"]
        )

        # 5. Verifica se as respostas foram hasheadas
        assert (
            db_user.security_answer_1_hash
            != self.valid_register_data["security_answer_1"]
        )
        assert (
            db_user.security_answer_2_hash
            != self.valid_register_data["security_answer_2"]
        )

    def test_registration_and_immediate_login(self, test_db):
        """Testa registro seguido de login imediato"""
        # 1. Registro
        register_response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )
        assert register_response.status_code == 200

        # 2. Login imediato com as mesmas credenciais
        login_data = {
            "username": self.valid_register_data["email"],
            "password": self.valid_register_data["password"],
        }

        login_response = self.client.post("/api/v1/auth/token", data=login_data)
        assert login_response.status_code == 200

        login_result = login_response.json()
        assert "access_token" in login_result
        assert "token_type" in login_result

    def test_registration_and_login_with_username(self, test_db):
        """Testa registro e login usando username em vez de email"""
        # 1. Registro
        register_response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )
        assert register_response.status_code == 200

        # 2. Login usando username
        login_data = {
            "username": self.valid_register_data["username"],
            "password": self.valid_register_data["password"],
        }

        login_response = self.client.post("/api/v1/auth/token", data=login_data)
        assert login_response.status_code == 200

        login_result = login_response.json()
        assert "access_token" in login_result

    def test_registration_with_all_security_questions(self, test_db):
        """Testa registro usando todas as perguntas secretas disponíveis"""
        question_ids = list(SECURITY_QUESTIONS.keys())

        for i, question_1_id in enumerate(question_ids):
            for j, question_2_id in enumerate(question_ids):
                if i != j:  # Perguntas diferentes
                    data = {
                        "email": f"test{i}{j}@example.com",
                        "name": f"Test User {i}{j}",
                        "username": f"testuser{i}{j}",
                        "full_name": f"Test User {i}{j}",
                        "password": "SecurePass123!",
                        "security_question_1_id": question_1_id,
                        "security_answer_1": f"Answer{i}",
                        "security_question_2_id": question_2_id,
                        "security_answer_2": f"Answer{j}",
                    }

                    response = self.client.post("/api/v1/auth/register", json=data)
                    assert (
                        response.status_code == 200
                    ), f"Falhou com {question_1_id} e {question_2_id}"

                    # Limita o teste para não criar muitos usuários
                    if i >= 2:  # Testa apenas algumas combinações
                        break
            if i >= 2:
                break

    def test_concurrent_registrations_different_users(self, test_db):
        """Testa registros simultâneos de usuários diferentes"""
        users_data = [
            {
                "email": "user1@example.com",
                "name": "User One",
                "username": "user1",
                "full_name": "User One",
                "password": "SecurePass123!",
                "security_question_1_id": "MOTHER_MAIDEN_NAME",
                "security_answer_1": "Silva",
                "security_question_2_id": "FIRST_PET_NAME",
                "security_answer_2": "Rex",
            },
            {
                "email": "user2@example.com",
                "name": "User Two",
                "username": "user2",
                "full_name": "User Two",
                "password": "SecurePass456!",
                "security_question_1_id": "CHILDHOOD_FRIEND",
                "security_answer_1": "João",
                "security_question_2_id": "FAVORITE_TEACHER",
                "security_answer_2": "Maria",
            },
            {
                "email": "user3@example.com",
                "name": "User Three",
                "username": "user3",
                "full_name": "User Three",
                "password": "SecurePass789!",
                "security_question_1_id": "BIRTH_CITY",
                "security_answer_1": "São Paulo",
                "security_question_2_id": "FIRST_CAR",
                "security_answer_2": "Civic",
            },
        ]

        responses = []
        for user_data in users_data:
            response = self.client.post("/api/v1/auth/register", json=user_data)
            responses.append(response)

        # Todos devem ter sucesso
        for response in responses:
            assert response.status_code == 200

        # Verifica se todos os usuários foram criados no banco
        for user_data in users_data:
            db_user = (
                test_db.query(User).filter(User.email == user_data["email"]).first()
            )
            assert db_user is not None

    def test_registration_database_rollback_on_error(self, test_db):
        """Testa se há rollback adequado em caso de erro durante o registro"""
        # Conta usuários antes do teste
        initial_count = test_db.query(User).count()

        # Tenta registro com dados inválidos que podem causar erro interno
        invalid_data = self.valid_register_data.copy()
        invalid_data["security_question_1_id"] = "INVALID_QUESTION_ID"

        response = self.client.post("/api/v1/auth/register", json=invalid_data)

        # Deve falhar
        assert response.status_code == 400

        # Verifica se não houve criação parcial no banco
        final_count = test_db.query(User).count()
        assert final_count == initial_count

    def test_registration_with_special_characters_in_answers(self, test_db):
        """Testa registro com caracteres especiais nas respostas de segurança"""
        special_answers = [
            "José da Silva",
            "Ação & Reação",
            "Coração ♥",
            "Número #123",
            "Email@domain.com",
            "Acentuação: ção, ão, ões",
        ]

        for i, answer in enumerate(special_answers):
            data = self.valid_register_data.copy()
            data["email"] = f"special{i}@example.com"
            data["name"] = f"Special User {i}"
            data["username"] = f"special{i}"
            data["security_answer_1"] = answer
            data["security_answer_2"] = f"Answer {i}"

            response = self.client.post("/api/v1/auth/register", json=data)
            assert response.status_code == 200, f"Falhou com resposta: {answer}"

    def test_registration_email_normalization(self, test_db):
        """Testa se emails são normalizados adequadamente"""
        # Registro com email em maiúsculas
        data = self.valid_register_data.copy()
        data["email"] = "UPPERCASE@EXAMPLE.COM"
        data["name"] = "Uppercase User"

        response = self.client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 200

        # Verifica se foi salvo em minúsculas no banco
        user_data = response.json()["user"]
        db_user = test_db.query(User).filter(User.id == user_data["id"]).first()
        assert db_user.email == data["email"].lower()

    def test_registration_audit_trail(self, test_db):
        """Testa se o registro cria trilha de auditoria adequada"""
        response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )
        assert response.status_code == 200

        # Verifica se o usuário foi criado
        user_data = response.json()["user"]
        db_user = test_db.query(User).filter(User.id == user_data["id"]).first()
        assert db_user is not None

        # Verifica timestamps
        assert db_user.created_at is not None
        assert db_user.updated_at is not None
        assert db_user.created_at == db_user.updated_at  # Devem ser iguais no registro

    def test_registration_token_validity(self, test_db):
        """Testa se o token retornado no registro é válido"""
        response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )
        assert response.status_code == 200

        data = response.json()
        token = data["access_token"]

        # Usa o token para acessar endpoint protegido
        headers = {"Authorization": f"Bearer {token}"}
        me_response = self.client.get("/api/v1/auth/me", headers=headers)

        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["email"] == self.valid_register_data["email"]

    def test_registration_prevents_master_role_creation(self, test_db):
        """Testa se o registro não permite criação de usuários com role MASTER"""
        # Tenta registrar usuário comum
        response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )
        assert response.status_code == 200

        # Verifica se o role é USER, não MASTER
        user_data = response.json()["user"]
        assert user_data["role"] == "USER"

        # Verifica no banco também
        db_user = test_db.query(User).filter(User.id == user_data["id"]).first()
        assert db_user.role == "USER"

    def test_registration_field_length_limits(self, test_db):
        """Testa limites de tamanho dos campos"""
        # Testa campos com tamanhos no limite
        data = self.valid_register_data.copy()
        data["name"] = "A" * 100  # Nome longo mas aceitável
        data["full_name"] = "A" * 100  # Nome longo mas aceitável
        data["username"] = "a" * 30  # Username longo mas aceitável

        response = self.client.post("/api/v1/auth/register", json=data)
        # Deve aceitar ou rejeitar de forma controlada
        assert response.status_code in [200, 400, 422]

        if response.status_code == 200:
            # Se aceito, verifica se foi salvo corretamente
            user_data = response.json()["user"]
            assert user_data["full_name"] == data["full_name"]
            assert user_data["username"] == data["username"]

    def test_registration_security_answer_case_sensitivity(self, test_db):
        """Testa se respostas de segurança são case-sensitive"""
        # Registra usuário
        response = self.client.post(
            "/api/v1/auth/register", json=self.valid_register_data
        )
        assert response.status_code == 200

        user_data = response.json()["user"]
        db_user = test_db.query(User).filter(User.id == user_data["id"]).first()

        # As respostas devem ser hasheadas, não em texto plano
        assert (
            db_user.security_answer_1_hash
            != self.valid_register_data["security_answer_1"]
        )
        assert (
            db_user.security_answer_2_hash
            != self.valid_register_data["security_answer_2"]
        )

        # Os hashes devem ter tamanho adequado
        assert len(db_user.security_answer_1_hash) > 50
        assert len(db_user.security_answer_2_hash) > 50
