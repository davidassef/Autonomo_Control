import pytest
from fastapi import status
import datetime


def test_get_entries(test_client, auth_headers, test_db, sample_entry):
    """
    Testa a listagem de lançamentos financeiros
    """
    # Act
    response = test_client.get("/api/v1/entries/", headers=auth_headers)

    # Assert
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # Pelo menos o lançamento de teste

    # Verifica se o formato dos dados está correto
    for entry in data:
        assert "id" in entry
        assert "amount" in entry
        assert "description" in entry
        assert "date" in entry
        assert "type" in entry
        assert "category" in entry


def test_get_entry_by_id(test_client, auth_headers, sample_entry):
    """
    Testa a busca de lançamento por ID
    """
    # Act
    response = test_client.get(f"/api/v1/entries/{sample_entry.id}", headers=auth_headers)

    # Assert
    assert response.status_code == status.HTTP_200_OK
    entry_data = response.json()
    assert entry_data["id"] == sample_entry.id
    assert entry_data["description"] == sample_entry.description
    assert entry_data["type"] == sample_entry.type
    assert float(entry_data["amount"]) == float(sample_entry.amount)


def test_create_entry(test_client, auth_headers, sample_category):
    """
    Testa a criação de um novo lançamento financeiro
    """
    # Arrange
    today = datetime.datetime.now().isoformat()
    new_entry_data = {
        "amount": 150.75,
        "description": "Pagamento de serviço",
        "date": today,
        "type": "INCOME",
        "category": sample_category.name
    }

    # Act
    response = test_client.post(
        "/api/v1/entries/",
        json=new_entry_data,
        headers=auth_headers
    )

    # Assert
    assert response.status_code == status.HTTP_201_CREATED
    created_entry = response.json()
    assert float(created_entry["amount"]) == float(new_entry_data["amount"])
    assert created_entry["description"] == new_entry_data["description"]
    assert created_entry["type"] == new_entry_data["type"]
    assert created_entry["category"] == new_entry_data["category"]
    assert "id" in created_entry  # Verifica se foi gerado um ID


def test_update_entry(test_client, auth_headers, sample_entry):
    """
    Testa a atualização de um lançamento existente
    """
    # Arrange
    update_data = {
        "amount": 67.89,
        "description": "Descrição atualizada"
    }

    # Act
    response = test_client.patch(
        f"/api/v1/entries/{sample_entry.id}",
        json=update_data,
        headers=auth_headers
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    updated_entry = response.json()
    assert float(updated_entry["amount"]) == float(update_data["amount"])
    assert updated_entry["description"] == update_data["description"]
    assert updated_entry["id"] == sample_entry.id  # ID não deve mudar


def test_soft_delete_entry(test_client, auth_headers, sample_entry, test_db):
    """
    Testa a exclusão lógica (soft delete) de um lançamento
    """
    # Act
    response = test_client.delete(
        f"/api/v1/entries/{sample_entry.id}",
        headers=auth_headers
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK

    # Verifica se não aparece mais na listagem
    list_response = test_client.get("/api/v1/entries/", headers=auth_headers)
    entries = list_response.json()
    deleted_entries = [e for e in entries if e["id"] == sample_entry.id]
    assert len(deleted_entries) == 0  # Não deve aparecer na listagem normal


def test_filter_entries_by_type(test_client, auth_headers, test_db, sample_entry, sample_user, sample_category):
    """
    Testa a filtragem de lançamentos por tipo (INCOME/EXPENSE)
    """
    # Arrange - cria um lançamento do tipo receita
    income_entry = {
        "amount": 250.00,
        "description": "Freelance",
        "date": datetime.datetime.now().isoformat(),
        "type": "INCOME",
        "category": "Serviços"
    }

    # Adiciona a entrada de receita
    test_client.post(
        "/api/v1/entries/",
        json=income_entry,
        headers=auth_headers
    )

    # Act - filtra por despesas
    expense_response = test_client.get(
        "/api/v1/entries/?type=EXPENSE",
        headers=auth_headers
    )

    # Act - filtra por receitas
    income_response = test_client.get(
        "/api/v1/entries/?type=INCOME",
        headers=auth_headers
    )

    # Assert
    assert expense_response.status_code == status.HTTP_200_OK
    expense_entries = expense_response.json()
    assert all(entry["type"] == "EXPENSE" for entry in expense_entries)

    assert income_response.status_code == status.HTTP_200_OK
    income_entries = income_response.json()
    assert all(entry["type"] == "INCOME" for entry in income_entries)
