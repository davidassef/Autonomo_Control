"""
Testes unitários para o modelo Entry.

Este módulo contém testes para validar o comportamento do modelo Entry,
incluindo criação, atualização e relacionamentos com categorias e usuários.
"""
import datetime
from uuid import UUID

from app.models.entry import Entry, EntryType


def test_create_entry(test_db, sample_user, sample_category):
    """
    Testa a criação de um lançamento financeiro com dados válidos
    """
    # Arrange
    amount = 100.00
    description = "Pagamento por serviço"
    date = datetime.datetime.now()

    # Act
    entry = Entry(
        amount=amount,
        description=description,
        date=date,
        type=EntryType.INCOME,
        category=sample_category.name,
        user_id=sample_user.id
    )
    test_db.add(entry)
    test_db.commit()    # Assert
    db_entry = test_db.query(Entry).filter(
        Entry.description == description
    ).first()
    assert db_entry is not None
    assert db_entry.amount == amount
    assert db_entry.description == description
    assert db_entry.type == EntryType.INCOME
    assert db_entry.category == sample_category.name
    assert db_entry.user_id == sample_user.id
    assert db_entry.is_deleted is False

    # Verifica se o ID foi gerado como UUID válido em formato string
    assert db_entry.id is not None
    try:
        UUID(db_entry.id)
        is_valid_uuid = True
    except ValueError:
        is_valid_uuid = False
    assert is_valid_uuid is True    # Verifica timestamps automáticos
    assert db_entry.created_at is not None


def test_entry_update(test_db, sample_entry):
    """
    Testa a atualização de um lançamento financeiro
    """
    # Arrange
    entry_id = sample_entry.id
    new_amount = 75.50
    new_description = "Descrição atualizada"

    # Act
    db_entry = test_db.query(Entry).filter(Entry.id == entry_id).first()
    db_entry.amount = new_amount
    db_entry.description = new_description
    test_db.commit()
    test_db.refresh(db_entry)    # Assert
    updated_entry = test_db.query(Entry).filter(Entry.id == entry_id).first()
    assert updated_entry.amount == new_amount
    assert updated_entry.description == new_description


def test_entry_soft_delete(test_db, sample_entry):
    """
    Testa a exclusão lógica (soft delete) de um lançamento financeiro
    """
    # Arrange
    entry_id = sample_entry.id

    # Act
    db_entry = test_db.query(Entry).filter(Entry.id == entry_id).first()
    db_entry.is_deleted = True
    test_db.commit()    # Assert
    deleted_entry = test_db.query(Entry).filter(Entry.id == entry_id).first()
    assert deleted_entry.is_deleted is True
    # The record should still exist in the database
    assert deleted_entry is not None


def test_entry_with_different_types(test_db, sample_user):
    """
    Testa a criação de lançamentos com diferentes tipos (receita e despesa)
    """
    # Arrange & Act - Criando uma receita
    income_entry = Entry(
        amount=200.00,
        description="Pagamento de cliente",
        date=datetime.datetime.now(),
        type=EntryType.INCOME,
        category="Vendas",
        user_id=sample_user.id
    )
    test_db.add(income_entry)

    # Arrange & Act - Criando uma despesa
    expense_entry = Entry(
        amount=50.00,
        description="Compra de material",
        date=datetime.datetime.now(),        type=EntryType.EXPENSE,
        category="Material",
        user_id=sample_user.id
    )
    test_db.add(expense_entry)
    test_db.commit()    # Assert
    db_income = test_db.query(Entry).filter(
        Entry.description == "Pagamento de cliente"
    ).first()
    db_expense = test_db.query(Entry).filter(
        Entry.description == "Compra de material"
    ).first()

    assert db_income.type == EntryType.INCOME
    assert db_expense.type == EntryType.EXPENSE
    assert db_income.type == EntryType.INCOME
