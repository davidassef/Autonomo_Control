"""
Testes para o endpoint de distribuição de categorias.
Arquivo: test_category_distribution_api.py
"""

from datetime import datetime
from app.models.category import Category
from app.models.entry import Entry


def test_category_distribution_endpoint(test_db, test_client, sample_user, auth_headers):
    """Testa o endpoint de distribuição por categoria."""

    # Criar categorias de teste
    income_category = Category(
        name="Salário",
        type="INCOME",
        user_id=sample_user.id
    )
    expense_category = Category(
        name="Alimentação",
        type="EXPENSE",
        user_id=sample_user.id
    )

    test_db.add(income_category)
    test_db.add(expense_category)
    test_db.commit()
    test_db.refresh(income_category)
    test_db.refresh(expense_category)

    # Criar entradas de teste
    income_entry = Entry(
        amount=3000.0,
        description="Salário mensal",
        date=datetime(2024, 1, 15),
        type="INCOME",
        category=income_category.name,
        user_id=sample_user.id
    )

    expense_entry1 = Entry(
        amount=500.0,
        description="Supermercado",
        date=datetime(2024, 1, 20),
        type="EXPENSE",
        category=expense_category.name,
        user_id=sample_user.id
    )

    expense_entry2 = Entry(
        amount=300.0,
        description="Restaurante",
        date=datetime(2024, 1, 25),
        type="EXPENSE",
        category=expense_category.name,
        user_id=sample_user.id
    )

    test_db.add_all([income_entry, expense_entry1, expense_entry2])
    test_db.commit()

    # Testar endpoint de distribuição
    response = test_client.get("/api/v1/entries/category-distribution", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()

    # Verificar estrutura da resposta
    assert "distributions" in data
    assert "total" in data

    # Verificar dados das distribuições
    distributions = data["distributions"]
    assert len(distributions) == 2  # Uma receita e uma despesa

    # Verificar dados por categoria
    categories = {dist["category"]: dist for dist in distributions}

    # Verificar categoria de receita
    assert "Salário" in categories
    salary_dist = categories["Salário"]
    assert salary_dist["amount"] == 3000.0
    assert salary_dist["count"] == 1

    # Verificar categoria de despesa
    assert "Alimentação" in categories
    food_dist = categories["Alimentação"]
    assert food_dist["amount"] == 800.0  # 500 + 300
    assert food_dist["count"] == 2

    # Verificar total
    assert data["total"] == 3800.0  # 3000 + 500 + 300


def test_category_distribution_with_date_filter(test_db, test_client, sample_user, auth_headers):
    """Testa o endpoint com filtro de data."""

    # Criar categoria
    category = Category(
        name="Transporte",
        type="EXPENSE",
        user_id=sample_user.id
    )

    test_db.add(category)
    test_db.commit()
    test_db.refresh(category)

    # Criar entradas em meses diferentes
    entry_jan = Entry(
        amount=100.0,
        description="Uber Janeiro",
        date=datetime(2024, 1, 15),
        type="EXPENSE",
        category=category.name,
        user_id=sample_user.id
    )

    entry_feb = Entry(
        amount=150.0,
        description="Uber Fevereiro",
        date=datetime(2024, 2, 15),
        type="EXPENSE",
        category=category.name,
        user_id=sample_user.id
    )

    test_db.add_all([entry_jan, entry_feb])
    test_db.commit()

    # Testar filtro por mês específico
    response = test_client.get(
        "/api/v1/entries/category-distribution",
        headers=auth_headers,
        params={
            "start_date": "2024-01-01",
            "end_date": "2024-01-31"
        }
    )

    assert response.status_code == 200
    data = response.json()

    # Verificar que apenas janeiro foi incluído
    distributions = data["distributions"]
    assert len(distributions) == 1
    assert distributions[0]["amount"] == 100.0
    assert distributions[0]["count"] == 1


def test_category_distribution_empty_result(test_db, test_client, sample_user, auth_headers):
    """Testa o endpoint quando não há entradas."""

    response = test_client.get("/api/v1/entries/category-distribution", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()

    # Verificar resposta vazia
    assert data["distributions"] == []
    assert data["total"] == 0


def test_category_distribution_unauthorized(test_client):
    """Testa acesso não autorizado ao endpoint."""

    response = test_client.get("/api/v1/entries/category-distribution")

    assert response.status_code == 401
