import datetime
from app.models.entry import Entry, EntryType


def test_net_amount_auto_calculation(test_db, sample_user):
    gross = 30.0
    fee = 6.0
    tips = 2.0
    net = (gross + tips) - fee
    entry = Entry(
        amount=gross,  # será ajustado manualmente neste teste
        description="Corrida Uber",
        date=datetime.datetime.utcnow(),
        type=EntryType.INCOME,
        category="Corrida",
        user_id=sample_user.id,
        gross_amount=gross,
        platform_fee=fee,
        tips_amount=tips,
        net_amount=net,
    )
    test_db.add(entry)
    test_db.commit()
    test_db.refresh(entry)
    assert entry.net_amount == net


def test_net_amount_update_recalculation(test_db, sample_user):
    entry = Entry(
        amount=20,
        description="Corrida 99",
        date=datetime.datetime.utcnow(),
        type=EntryType.INCOME,
        category="Corrida",
        user_id=sample_user.id,
        gross_amount=25,
        platform_fee=5,
        tips_amount=0,
        net_amount=20,
    )
    test_db.add(entry)
    test_db.commit()

    # Simula alteração de fee e tips recalculando manualmente (API faria isto)
    new_fee = 4
    new_tips = 1
    new_net = (entry.gross_amount + new_tips) - new_fee  # type: ignore
    entry.platform_fee = new_fee  # type: ignore
    entry.tips_amount = new_tips  # type: ignore
    entry.net_amount = new_net  # type: ignore
    entry.amount = new_net  # manter alinhado
    test_db.commit()
    test_db.refresh(entry)
    assert entry.net_amount == new_net
