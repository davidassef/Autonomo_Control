"""
Testes unitários para schemas de categorias (category_schema.py)
"""
from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.category_schema import (
    CategoryBase,
    CategoryCreate,
    CategoryUpdate,
    CategoryInDB,
    Category
)


class TestCategoryBase:
    """Testes para o schema CategoryBase"""

    def test_category_base_valid_income(self):
        """Testa criação de categoria base válida para receita"""
        category_data = {
            "name": "Vendas",
            "type": "INCOME",
            "icon": "💰",
            "color": "#4CAF50",
            "subcategories": ["Produtos", "Serviços"]
        }
        category = CategoryBase(**category_data)

        assert category.name == "Vendas"
        assert category.type == "INCOME"
        assert category.icon == "💰"
        assert category.color == "#4CAF50"
        assert category.subcategories == ["Produtos", "Serviços"]

    def test_category_base_valid_expense(self):
        """Testa criação de categoria base válida para despesa"""
        category_data = {
            "name": "Alimentação",
            "type": "EXPENSE",
            "icon": "🍽️",
            "color": "#FF5722"
        }
        category = CategoryBase(**category_data)

        assert category.name == "Alimentação"
        assert category.type == "EXPENSE"
        assert category.icon == "🍽️"
        assert category.color == "#FF5722"
        assert category.subcategories is None

    def test_category_base_minimal(self):
        """Testa criação de categoria base com campos mínimos"""
        category_data = {
            "name": "Categoria Simples",
            "type": "INCOME"
        }
        category = CategoryBase(**category_data)

        assert category.name == "Categoria Simples"
        assert category.type == "INCOME"
        assert category.icon is None
        assert category.color is None
        assert category.subcategories is None

    def test_category_base_invalid_type(self):
        """Testa validação de tipo inválido"""
        category_data = {
            "name": "Teste",
            "type": "INVALID_TYPE"
        }

        with pytest.raises(ValidationError):
            CategoryBase(**category_data)

    def test_category_base_empty_subcategories(self):
        """Testa categoria com lista vazia de subcategorias"""
        category_data = {
            "name": "Categoria",
            "type": "EXPENSE",
            "subcategories": []
        }
        category = CategoryBase(**category_data)

        assert category.subcategories == []

    def test_category_base_required_fields(self):
        """Testa validação de campos obrigatórios"""
        # Sem nome
        with pytest.raises(ValidationError):
            CategoryBase(type="INCOME")

        # Sem tipo
        with pytest.raises(ValidationError):
            CategoryBase(name="Teste")


class TestCategoryCreate:
    """Testes para o schema CategoryCreate"""

    def test_category_create_inheritance(self):
        """Testa que CategoryCreate herda de CategoryBase"""
        assert issubclass(CategoryCreate, CategoryBase)

    def test_category_create_valid(self):
        """Testa criação de categoria válida"""
        category_data = {
            "name": "Nova Categoria",
            "type": "INCOME",
            "icon": "📊",
            "color": "#2196F3",
            "subcategories": ["Sub1", "Sub2"]
        }
        category = CategoryCreate(**category_data)

        assert category.name == "Nova Categoria"
        assert category.type == "INCOME"
        assert category.icon == "📊"
        assert category.color == "#2196F3"
        assert category.subcategories == ["Sub1", "Sub2"]


class TestCategoryUpdate:
    """Testes para o schema CategoryUpdate"""

    def test_category_update_valid(self):
        """Testa atualização de categoria válida"""
        update_data = {
            "name": "Nome Atualizado",
            "icon": "🔄",
            "color": "#FF9800"
        }
        category_update = CategoryUpdate(**update_data)

        assert category_update.name == "Nome Atualizado"
        assert category_update.icon == "🔄"
        assert category_update.color == "#FF9800"

    def test_category_update_empty(self):
        """Testa atualização vazia"""
        category_update = CategoryUpdate()

        assert category_update.name is None
        assert category_update.icon is None
        assert category_update.color is None

    def test_category_update_partial(self):
        """Testa atualização parcial"""
        update_data = {"name": "Novo Nome"}
        category_update = CategoryUpdate(**update_data)

        assert category_update.name == "Novo Nome"
        assert category_update.icon is None
        assert category_update.color is None

    def test_category_update_icon_only(self):
        """Testa atualização apenas do ícone"""
        update_data = {"icon": "🆕"}
        category_update = CategoryUpdate(**update_data)

        assert category_update.name is None
        assert category_update.icon == "🆕"
        assert category_update.color is None

    def test_category_update_color_only(self):
        """Testa atualização apenas da cor"""
        update_data = {"color": "#9C27B0"}
        category_update = CategoryUpdate(**update_data)

        assert category_update.name is None
        assert category_update.icon is None
        assert category_update.color == "#9C27B0"


class TestCategoryInDB:
    """Testes para o schema CategoryInDB"""

    def test_category_in_db_valid_custom(self):
        """Testa criação de categoria personalizada do banco"""
        category_data = {
            "id": "cat123",
            "name": "Categoria Personalizada",
            "type": "EXPENSE",
            "icon": "🎯",
            "color": "#E91E63",
            "subcategories": ["Sub1", "Sub2"],
            "user_id": "user123",
            "created_at": datetime(2025, 5, 24, 10, 0, 0),
            "updated_at": datetime(2025, 5, 24, 11, 0, 0),
            "is_default": False
        }
        category = CategoryInDB(**category_data)

        assert category.id == "cat123"
        assert category.name == "Categoria Personalizada"
        assert category.type == "EXPENSE"
        assert category.user_id == "user123"
        assert category.is_default is False
        assert category.created_at == datetime(2025, 5, 24, 10, 0, 0)
        assert category.updated_at == datetime(2025, 5, 24, 11, 0, 0)

    def test_category_in_db_valid_default(self):
        """Testa criação de categoria padrão do banco"""
        category_data = {
            "id": "default_cat",
            "name": "Categoria Padrão",
            "type": "INCOME",
            "created_at": datetime(2025, 5, 24, 10, 0, 0),
            "is_default": True
        }
        category = CategoryInDB(**category_data)

        assert category.id == "default_cat"
        assert category.name == "Categoria Padrão"
        assert category.type == "INCOME"
        assert category.user_id is None
        assert category.is_default is True
        assert category.updated_at is None

    def test_category_in_db_without_optional_fields(self):
        """Testa categoria do banco sem campos opcionais"""
        category_data = {
            "id": "minimal_cat",
            "name": "Categoria Mínima",
            "type": "EXPENSE",
            "created_at": datetime(2025, 5, 24, 10, 0, 0),
            "is_default": False
        }
        category = CategoryInDB(**category_data)

        assert category.icon is None
        assert category.color is None
        assert category.subcategories is None
        assert category.user_id is None
        assert category.updated_at is None

    def test_category_in_db_required_fields(self):
        """Testa validação de campos obrigatórios"""
        base_data = {
            "name": "Teste",
            "type": "INCOME",
            "created_at": datetime.now(),
            "is_default": True
        }

        # Sem ID
        data_without_id = base_data.copy()
        with pytest.raises(ValidationError):
            CategoryInDB(**data_without_id)

        # Sem created_at
        data_without_created = base_data.copy()
        del data_without_created["created_at"]
        data_without_created["id"] = "test"
        with pytest.raises(ValidationError):
            CategoryInDB(**data_without_created)

        # Sem is_default
        data_without_default = base_data.copy()
        del data_without_default["is_default"]
        data_without_default["id"] = "test"
        with pytest.raises(ValidationError):
            CategoryInDB(**data_without_default)


class TestCategory:
    """Testes para o schema Category"""

    def test_category_inheritance(self):
        """Testa que Category herda de CategoryInDB"""
        assert issubclass(Category, CategoryInDB)

    def test_category_valid(self):
        """Testa criação de categoria válida"""
        category_data = {
            "id": "api_cat",
            "name": "Categoria API",
            "type": "INCOME",
            "icon": "🌟",
            "color": "#FFC107",
            "subcategories": ["API Sub"],
            "user_id": "user456",
            "created_at": datetime(2025, 5, 24, 12, 0, 0),
            "updated_at": datetime(2025, 5, 24, 12, 30, 0),
            "is_default": False
        }
        category = Category(**category_data)

        assert category.id == "api_cat"
        assert category.name == "Categoria API"
        assert category.type == "INCOME"
        assert category.icon == "🌟"
        assert category.color == "#FFC107"
        assert category.subcategories == ["API Sub"]
        assert category.user_id == "user456"
        assert category.is_default is False


class TestCategorySchemaIntegration:
    """Testes de integração entre schemas"""

    def test_category_create_to_in_db_conversion(self):
        """Testa conversão conceitual de CategoryCreate para CategoryInDB"""

        create_data = {
            "name": "Nova Categoria",
            "type": "EXPENSE",
            "icon": "⚡",
            "color": "#3F51B5",
            "subcategories": ["Sub Test"]
        }

        # Simula dados que seriam adicionados pelo banco
        db_data = create_data.copy()
        db_data.update({
            "id": "generated_id",
            "user_id": "user789",
            "created_at": datetime(2025, 5, 24, 15, 0, 0),
            "is_default": False
        })

        category_create = CategoryCreate(**create_data)
        category_in_db = CategoryInDB(**db_data)

        # Verifica que os dados base são os mesmos
        assert category_create.name == category_in_db.name
        assert category_create.type == category_in_db.type
        assert category_create.icon == category_in_db.icon
        assert category_create.color == category_in_db.color
        assert category_create.subcategories == category_in_db.subcategories

    def test_category_update_partial_fields(self):
        """Testa que CategoryUpdate aceita apenas alguns campos"""
        update = CategoryUpdate(name="Atualizado")

        # Verifica que apenas o campo especificado foi definido
        assert update.name == "Atualizado"
        assert update.icon is None
        assert update.color is None
        assert update.type is None

        # Verifica que não tem subcategories (que não está em CategoryUpdate)
        assert not hasattr(update, 'subcategories')
