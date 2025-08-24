import datetime
from fastapi.testclient import TestClient
from app.models.entry import Entry, EntryType


def create_income(
    db,
    user_id,
    day_offset=0,
    gross=20,
    fee=4,
    tips=1,
    km=10,
    minutes=30,
    platform="UBER",
):
    net = (gross + tips) - fee
    entry = Entry(
        amount=net,
        description=f"Corrida {platform}",
        date=datetime.datetime.utcnow() - datetime.timedelta(days=day_offset),
        type=EntryType.INCOME,
        category="Corrida",
        user_id=user_id,
        gross_amount=gross,
        platform_fee=fee,
        tips_amount=tips,
        net_amount=net,
        distance_km=km,
        duration_min=minutes,
        platform=platform,
    )
    db.add(entry)
    return entry


def test_daily_metrics(test_db, sample_user, test_client, auth_headers):
    create_income(
        test_db,
        sample_user.id,
        day_offset=0,
        gross=30,
        fee=6,
        tips=2,
        km=12,
        minutes=24,
        platform="UBER",
    )
    create_income(
        test_db,
        sample_user.id,
        day_offset=0,
        gross=20,
        fee=4,
        tips=0,
        km=8,
        minutes=16,
        platform="UBER",
    )
    create_income(
        test_db,
        sample_user.id,
        day_offset=1,
        gross=25,
        fee=5,
        tips=1,
        km=10,
        minutes=20,
        platform="99",
    )
    test_db.commit()

    resp = test_client.get("/api/v1/entries/metrics/daily", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data and data["count"] == len(data["items"])
    # Pelo menos 2 dias
    assert data["count"] >= 2
    # Verifica campos calculados
    first = data["items"][0]
    for key in [
        "gross",
        "net",
        "fee",
        "fee_pct",
        "rides",
        "km",
        "hours",
        "earn_per_km",
        "earn_per_hour",
    ]:
        assert key in first


def test_monthly_metrics(test_db, sample_user, test_client, auth_headers):
    # 3 corridas em meses distintos (usar datas controladas)
    now = datetime.datetime.utcnow()
    e1 = Entry(
        amount=10,
        description="Mês atual",
        date=now,
        type=EntryType.INCOME,
        category="Corrida",
        user_id=sample_user.id,
        gross_amount=12,
        platform_fee=2,
        tips_amount=0,
        net_amount=10,
        platform="UBER",
    )
    prev_month = (now.replace(day=15) - datetime.timedelta(days=31)).replace(day=10)
    e2 = Entry(
        amount=15,
        description="Mês passado",
        date=prev_month,
        type=EntryType.INCOME,
        category="Corrida",
        user_id=sample_user.id,
        gross_amount=18,
        platform_fee=3,
        tips_amount=0,
        net_amount=15,
        platform="99",
    )
    two_months = (now.replace(day=15) - datetime.timedelta(days=62)).replace(day=5)
    e3 = Entry(
        amount=20,
        description="Dois meses",
        date=two_months,
        type=EntryType.INCOME,
        category="Corrida",
        user_id=sample_user.id,
        gross_amount=24,
        platform_fee=4,
        tips_amount=0,
        net_amount=20,
        platform="UBER",
    )
    test_db.add_all([e1, e2, e3])
    test_db.commit()

    resp = test_client.get(
        f"/api/v1/entries/metrics/monthly?year={now.year}", headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["year"] == now.year
    assert data["count"] >= 1
    # Cada item tem month
    for item in data["items"]:
        assert "month" in item and "gross" in item
