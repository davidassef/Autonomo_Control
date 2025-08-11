import pytest
from datetime import datetime
from pydantic import ValidationError

from app.schemas.entry_schema import EntryCreate


def base_payload(**overrides):
    data = {
        "amount": 10.0,
        "description": "Teste corrida",
        "date": datetime.utcnow().isoformat(),
        "type": "INCOME",
        "category": "Corrida",
    }
    data.update(overrides)
    return data


def test_amount_positive():
    with pytest.raises(ValidationError):
        EntryCreate(**base_payload(amount=0))


def test_distance_positive():
    with pytest.raises(ValidationError):
        EntryCreate(**base_payload(distance_km=0))
    obj = EntryCreate(**base_payload(distance_km=5.3))
    assert obj.distance_km == 5.3


def test_duration_positive():
    with pytest.raises(ValidationError):
        EntryCreate(**base_payload(duration_min=0))
    obj = EntryCreate(**base_payload(duration_min=15))
    assert obj.duration_min == 15


def test_platform_enum():
    with pytest.raises(ValidationError):
        EntryCreate(**base_payload(platform="INVALID"))
    obj = EntryCreate(**base_payload(platform="UBER"))
    assert obj.platform == "UBER"


def test_shift_enum():
    with pytest.raises(ValidationError):
        EntryCreate(**base_payload(shift_tag="X"))
    obj = EntryCreate(**base_payload(shift_tag="MANHA"))
    assert obj.shift_tag == "MANHA"
