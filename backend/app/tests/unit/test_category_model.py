"""
Testes unitários para o modelo Category.

Este módulo contém testes para validar o comportamento do modelo Category,
incluindo criação, atualização e relacionamentos com usuários.
"""

from uuid import UUID

from app.models.category import Category


def test_create_category(test_db, sample_user):
    """
    Testa a criação de uma categoria com dados válidos
    """
    # Arrange
    name = "Manutenção"
    category_type = "EXPENSE"  # Renamed from 'type' to avoid built-in conflict
    color = "#FF5733"
    icon = "tools"

    # Act
    category = Category(
        name=name, type=category_type, color=color, icon=icon, user_id=sample_user.id
    )
    test_db.add(category)
    test_db.commit()

    # Assert
    db_category = test_db.query(Category).filter(Category.name == name).first()
    assert db_category is not None
    assert db_category.name == name
    assert db_category.type == category_type
    assert db_category.color == color
    assert db_category.icon == icon
    assert db_category.user_id == sample_user.id
    assert db_category.is_default is False

    # Verifica se o ID foi gerado como UUID válido em formato string
    assert db_category.id is not None
    try:
        UUID(db_category.id)
        is_valid_uuid = True
    except ValueError:
        is_valid_uuid = False
    assert is_valid_uuid is True
    # Verifica timestamps automáticos
    assert db_category.created_at is not None


def test_create_default_category(test_db):
    """
    Testa a criação de uma categoria padrão do sistema
    (sem usuário associado)
    """
    # Arrange
    name = "Alimentação"
    category_type = "EXPENSE"  # Renamed from 'type' to avoid built-in conflict

    # Act
    category = Category(name=name, type=category_type, is_default=True)
    test_db.add(category)
    test_db.commit()

    # Assert
    db_category = test_db.query(Category).filter(Category.name == name).first()
    assert db_category is not None
    assert db_category.name == name
    assert db_category.user_id is None
    assert db_category.is_default is True


def test_category_update(test_db, sample_category):
    """
    Testa a atualização de uma categoria
    """
    # Arrange
    category_id = sample_category.id
    new_name = "Combustível e Manutenção"
    new_color = "#3366FF"

    # Act
    db_category = test_db.query(Category).filter(Category.id == category_id).first()
    db_category.name = new_name
    db_category.color = new_color
    test_db.commit()
    test_db.refresh(db_category)

    # Assert
    updated_category = (
        test_db.query(Category).filter(Category.id == category_id).first()
    )
    assert updated_category.name == new_name
    assert updated_category.color == new_color


def test_user_categories(test_db, sample_user):
    """
    Testa a criação de múltiplas categorias para o mesmo usuário
    """
    # Arrange & Act - Criando várias categorias para o mesmo usuário
    categories = [
        Category(name="Alimentação", type="EXPENSE", user_id=sample_user.id),
        Category(name="Transporte", type="EXPENSE", user_id=sample_user.id),
        Category(name="Freelancer", type="INCOME", user_id=sample_user.id),
    ]

    for category in categories:
        test_db.add(category)

    test_db.commit()  # Assert
    user_categories = (
        test_db.query(Category).filter(Category.user_id == sample_user.id).all()
    )  # Pode haver a categoria de amostra também
    assert len(user_categories) >= 3

    # Verificar se há pelo menos uma categoria de cada tipo
    income_categories = [c for c in user_categories if c.type == "INCOME"]
    expense_categories = [c for c in user_categories if c.type == "EXPENSE"]

    assert len(income_categories) > 0
    assert len(expense_categories) > 0
