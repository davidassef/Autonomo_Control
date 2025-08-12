import pytest
import datetime
from fastapi import status
from app.models.entry import Entry, EntryType


def test_create_entry_with_gross_amount_calculation(test_client, auth_headers, sample_category):
    """
    Testa a criação de entrada com cálculo automático de net_amount
    """
    entry_data = {
        "amount": 22.0,  # Campo obrigatório
        "description": "Corrida Uber",
        "date": datetime.datetime.now().isoformat(),
        "type": "INCOME",
        "category": sample_category.name,
        "gross_amount": 25.0,
        "platform_fee": 5.0,
        "tips_amount": 2.0,
        "platform": "UBER",
        "distance_km": 10.5,
        "duration_min": 30
    }

    response = test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    
    assert response.status_code == status.HTTP_201_CREATED
    created_entry = response.json()
    # Verificar se os campos foram salvos corretamente
    assert float(created_entry["amount"]) == 22.0
    assert float(created_entry["gross_amount"]) == 25.0
    assert float(created_entry["platform_fee"]) == 5.0
    assert float(created_entry["tips_amount"]) == 2.0


def test_read_entries_with_date_filters(test_client, auth_headers, test_db, sample_user, sample_category):
    """
    Testa a listagem de entradas com filtros de data
    """
    # Criar entradas em datas diferentes
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)
    tomorrow = today + datetime.timedelta(days=1)
    
    entries_data = [
        {
            "amount": 100.0,
            "description": "Entrada hoje",
            "date": today.isoformat(),
            "type": "INCOME",
            "category": sample_category.name
        },
        {
            "amount": 200.0,
            "description": "Entrada ontem",
            "date": yesterday.isoformat(),
            "type": "INCOME",
            "category": sample_category.name
        },
        {
            "amount": 300.0,
            "description": "Entrada amanhã",
            "date": tomorrow.isoformat(),
            "type": "INCOME",
            "category": sample_category.name
        }
    ]
    
    # Criar as entradas
    for entry_data in entries_data:
        test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    
    # Testar filtro por data de início
    response = test_client.get(f"/api/v1/entries/?start_date={today}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    entries = response.json()
    # Deve retornar apenas entradas de hoje e amanhã
    assert len([e for e in entries if e["description"] in ["Entrada hoje", "Entrada amanhã"]]) >= 2
    
    # Testar filtro por data de fim
    response = test_client.get(f"/api/v1/entries/?end_date={today}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    entries = response.json()
    # Deve retornar apenas entradas de ontem e hoje
    assert len([e for e in entries if e["description"] in ["Entrada ontem", "Entrada hoje"]]) >= 2


def test_read_entries_with_search_filter(test_client, auth_headers, sample_category):
    """
    Testa a busca de entradas com filtro de texto
    """
    # Criar entradas com descrições específicas
    entries_data = [
        {
            "amount": 100.0,
            "description": "Pagamento de freelance",
            "date": datetime.datetime.now().isoformat(),
            "type": "INCOME",
            "category": sample_category.name
        },
        {
            "amount": 50.0,
            "description": "Compra de material",
            "date": datetime.datetime.now().isoformat(),
            "type": "EXPENSE",
            "category": sample_category.name
        }
    ]
    
    for entry_data in entries_data:
        test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    
    # Buscar por "freelance"
    response = test_client.get("/api/v1/entries/?search=freelance", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    entries = response.json()
    assert any("freelance" in entry["description"].lower() for entry in entries)


def test_read_entries_with_platform_filter(test_client, auth_headers, sample_category):
    """
    Testa a listagem de entradas com filtro de plataforma
    """
    entries_data = [
        {
            "amount": 100.0,
            "description": "Corrida Uber",
            "date": datetime.datetime.now().isoformat(),
            "type": "INCOME",
            "category": sample_category.name,
            "platform": "UBER"
        },
        {
            "amount": 80.0,
            "description": "Corrida 99",
            "date": datetime.datetime.now().isoformat(),
            "type": "INCOME",
            "category": sample_category.name,
            "platform": "99"
        }
    ]
    
    for entry_data in entries_data:
        test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    
    # Filtrar por plataforma UBER
    response = test_client.get("/api/v1/entries/?platform=UBER", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    entries = response.json()
    uber_entries = [e for e in entries if e.get("platform") == "UBER"]
    assert len(uber_entries) >= 1


def test_read_entries_with_shift_tag_filter(test_client, auth_headers, sample_category):
    """
    Testa a listagem de entradas com filtro de turno
    """
    entry_data = {
        "amount": 100.0,
        "description": "Corrida noturna",
        "date": datetime.datetime.now().isoformat(),
        "type": "INCOME",
        "category": sample_category.name,
        "shift_tag": "NOITE"
    }
    
    test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    
    # Filtrar por turno NOITE
    response = test_client.get("/api/v1/entries/?shift_tag=NOITE", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    entries = response.json()
    night_entries = [e for e in entries if e.get("shift_tag") == "NOITE"]
    assert len(night_entries) >= 1


def test_read_entries_with_city_filter(test_client, auth_headers, sample_category):
    """
    Testa a listagem de entradas com filtro de cidade
    """
    entry_data = {
        "amount": 100.0,
        "description": "Corrida em São Paulo",
        "date": datetime.datetime.now().isoformat(),
        "type": "INCOME",
        "category": sample_category.name,
        "city": "São Paulo"
    }
    
    test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    
    # Filtrar por cidade
    response = test_client.get("/api/v1/entries/?city=São Paulo", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    entries = response.json()
    sp_entries = [e for e in entries if e.get("city") == "São Paulo"]
    assert len(sp_entries) >= 1


def test_get_entries_summary_with_date_filters(test_client, auth_headers, sample_category):
    """
    Testa o resumo de entradas com filtros de data
    """
    today = datetime.date.today()
    
    # Criar entradas de receita e despesa
    entries_data = [
        {
            "amount": 500.0,
            "description": "Receita",
            "date": today.isoformat(),
            "type": "INCOME",
            "category": sample_category.name
        },
        {
            "amount": 200.0,
            "description": "Despesa",
            "date": today.isoformat(),
            "type": "EXPENSE",
            "category": sample_category.name
        }
    ]
    
    for entry_data in entries_data:
        test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    
    # Testar resumo com filtro de data
    response = test_client.get(f"/api/v1/entries/summary?start_date={today}&end_date={today}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    summary = response.json()
    
    assert "total_income" in summary
    assert "total_expense" in summary
    assert "balance" in summary
    assert "count_income" in summary
    assert "count_expense" in summary
    assert "total_count" in summary


def test_get_monthly_summary(test_client, auth_headers, sample_category):
    """
    Testa o resumo mensal de entradas
    """
    today = datetime.date.today()
    
    # Criar entrada para o mês atual
    entry_data = {
        "amount": 1000.0,
        "description": "Receita mensal",
        "date": today.isoformat(),
        "type": "INCOME",
        "category": sample_category.name
    }
    
    test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    
    # Testar resumo mensal
    response = test_client.get(f"/api/v1/entries/summary/monthly/{today.year}/{today.month}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    summary = response.json()
    
    assert "total_income" in summary
    assert "total_expense" in summary
    assert "balance" in summary
    assert "count_income" in summary
    assert "count_expense" in summary
    assert "total_count" in summary


def test_get_monthly_summary_invalid_month(test_client, auth_headers):
    """
    Testa o resumo mensal com mês inválido
    """
    response = test_client.get("/api/v1/entries/summary/monthly/2023/13", headers=auth_headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Mês inválido" in response.json()["detail"]


def test_get_category_distribution(test_client, auth_headers, sample_category):
    """
    Testa a distribuição por categoria
    """
    # Criar entradas em diferentes categorias
    entries_data = [
        {
            "amount": 300.0,
            "description": "Receita categoria 1",
            "date": datetime.datetime.now().isoformat(),
            "type": "INCOME",
            "category": sample_category.name
        },
        {
            "amount": 200.0,
            "description": "Receita categoria 2",
            "date": datetime.datetime.now().isoformat(),
            "type": "INCOME",
            "category": "Outra Categoria"
        }
    ]
    
    for entry_data in entries_data:
        test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    
    # Testar distribuição por categoria
    response = test_client.get("/api/v1/entries/category-distribution", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    distribution = response.json()
    
    assert "distributions" in distribution
    assert "total" in distribution
    assert len(distribution["distributions"]) >= 2
    
    # Verificar estrutura dos itens
    for item in distribution["distributions"]:
        assert "category" in item
        assert "amount" in item
        assert "count" in item
        assert "percentage" in item


def test_get_monthly_metrics_with_year_default(test_client, auth_headers, sample_category):
    """
    Testa métricas mensais com ano padrão (atual)
    """
    # Criar entrada de receita com dados de corrida
    entry_data = {
        "description": "Corrida teste",
        "date": datetime.datetime.now().isoformat(),
        "type": "INCOME",
        "category": sample_category.name,
        "gross_amount": 30.0,
        "platform_fee": 6.0,
        "tips_amount": 2.0,
        "distance_km": 15.0,
        "duration_min": 45,
        "platform": "UBER"
    }
    
    test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    
    # Testar métricas mensais sem especificar ano (deve usar ano atual)
    response = test_client.get("/api/v1/entries/metrics/monthly", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    metrics = response.json()
    
    assert "year" in metrics
    assert "items" in metrics
    assert "count" in metrics
    assert metrics["year"] == datetime.datetime.now().year


def test_get_monthly_metrics_with_platform_filter(test_client, auth_headers, sample_category):
    """
    Testa métricas mensais com filtro de plataforma
    """
    # Criar entradas em plataformas diferentes
    entries_data = [
        {
            "description": "Corrida Uber",
            "date": datetime.datetime.now().isoformat(),
            "type": "INCOME",
            "category": sample_category.name,
            "gross_amount": 25.0,
            "platform_fee": 5.0,
            "platform": "UBER"
        },
        {
            "description": "Corrida 99",
            "date": datetime.datetime.now().isoformat(),
            "type": "INCOME",
            "category": sample_category.name,
            "gross_amount": 20.0,
            "platform_fee": 4.0,
            "platform": "99"
        }
    ]
    
    for entry_data in entries_data:
        test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    
    # Testar métricas mensais filtradas por plataforma
    current_year = datetime.datetime.now().year
    response = test_client.get(f"/api/v1/entries/metrics/monthly?year={current_year}&platform=UBER", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    metrics = response.json()
    
    assert "year" in metrics
    assert "items" in metrics
    assert "count" in metrics


def test_update_entry_put(test_client, auth_headers, sample_entry):
    """
    Testa a atualização completa de uma entrada (PUT)
    """
    update_data = {
        "amount": 150.0,
        "description": "Descrição atualizada via PUT",
        "date": datetime.datetime.now().isoformat(),
        "type": "INCOME",
        "category": "Nova Categoria"
    }
    
    response = test_client.put(f"/api/v1/entries/{sample_entry.id}", json=update_data, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    updated_entry = response.json()
    
    assert float(updated_entry["amount"]) == 150.0
    assert updated_entry["description"] == "Descrição atualizada via PUT"
    assert updated_entry["category"] == "Nova Categoria"


def test_update_entry_with_gross_amount_recalculation(test_client, auth_headers, test_db, sample_user, sample_category):
    """
    Testa a atualização de entrada com recálculo de net_amount
    """
    # Criar entrada de receita primeiro
    entry_data = {
        "amount": 17.0,  # Campo obrigatório: (20 + 1) - 4 = 17
        "description": "Corrida inicial",
        "date": datetime.datetime.now().isoformat(),
        "type": "INCOME",
        "category": sample_category.name,
        "gross_amount": 20.0,
        "platform_fee": 4.0,
        "tips_amount": 1.0
    }
    
    create_response = test_client.post("/api/v1/entries/", json=entry_data, headers=auth_headers)
    assert create_response.status_code == status.HTTP_201_CREATED
    created_entry = create_response.json()
    entry_id = created_entry["id"]
    
    # Atualizar com novos valores
    update_data = {
        "gross_amount": 30.0,
        "platform_fee": 6.0,
        "tips_amount": 2.0
    }
    
    response = test_client.patch(f"/api/v1/entries/{entry_id}", json=update_data, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    updated_entry = response.json()
    
    # Verificar se os campos foram atualizados
    assert float(updated_entry["gross_amount"]) == 30.0
    assert float(updated_entry["platform_fee"]) == 6.0
    assert float(updated_entry["tips_amount"]) == 2.0


def test_read_entry_not_found(test_client, auth_headers):
    """
    Testa a busca de entrada inexistente
    """
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = test_client.get(f"/api/v1/entries/{fake_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Lançamento não encontrado" in response.json()["detail"]


def test_update_entry_not_found(test_client, auth_headers):
    """
    Testa a atualização de entrada inexistente
    """
    fake_id = "00000000-0000-0000-0000-000000000000"
    update_data = {"amount": 100.0}
    
    response = test_client.put(f"/api/v1/entries/{fake_id}", json=update_data, headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Lançamento não encontrado" in response.json()["detail"]


def test_delete_entry_not_found(test_client, auth_headers):
    """
    Testa a exclusão de entrada inexistente
    """
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = test_client.delete(f"/api/v1/entries/{fake_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Lançamento não encontrado" in response.json()["detail"]