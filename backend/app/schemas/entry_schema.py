from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, Literal, List
from datetime import datetime


PLATFORM_VALUES = ["UBER", "99", "INDRIVE", "OUTRA"]
SHIFT_TAG_VALUES = ["MANHA", "TARDE", "NOITE", "MADRUGADA"]


class EntryBase(BaseModel):
    amount: float
    description: str
    date: datetime
    type: Literal["INCOME", "EXPENSE"]
    category: str
    subcategory: Optional[str] = None
    is_recurring: bool = False

    # Campos de corrida (opcionais)
    platform: Optional[str] = None
    distance_km: Optional[float] = None
    duration_min: Optional[int] = None
    gross_amount: Optional[float] = None
    platform_fee: Optional[float] = None
    tips_amount: Optional[float] = None
    net_amount: Optional[float] = None
    vehicle_id: Optional[str] = None
    shift_tag: Optional[str] = None
    city: Optional[str] = None
    is_trip_expense: Optional[bool] = False
    linked_entry_id: Optional[str] = None


class EntryCreate(EntryBase):
    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("O valor deve ser maior que zero")
        return v

    @field_validator("distance_km")
    @classmethod
    def distance_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("distance_km deve ser > 0")
        return v

    @field_validator("duration_min")
    @classmethod
    def duration_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("duration_min deve ser > 0")
        return v

    @field_validator("platform")
    @classmethod
    def platform_valid(cls, v):
        if v is not None and v not in PLATFORM_VALUES:
            raise ValueError(f"platform deve estar em {PLATFORM_VALUES}")
        return v

    @field_validator("shift_tag")
    @classmethod
    def shift_valid(cls, v):
        if v is not None and v not in SHIFT_TAG_VALUES:
            raise ValueError(f"shift_tag deve estar em {SHIFT_TAG_VALUES}")
        return v


class EntryUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    type: Optional[Literal["INCOME", "EXPENSE"]] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    is_recurring: Optional[bool] = None

    platform: Optional[str] = None
    distance_km: Optional[float] = None
    duration_min: Optional[int] = None
    gross_amount: Optional[float] = None
    platform_fee: Optional[float] = None
    tips_amount: Optional[float] = None
    net_amount: Optional[float] = None
    vehicle_id: Optional[str] = None
    shift_tag: Optional[str] = None
    city: Optional[str] = None
    is_trip_expense: Optional[bool] = None
    linked_entry_id: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("O valor deve ser maior que zero")
        return v


class EntryInDB(EntryBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_id: str

    model_config = ConfigDict(from_attributes=True)


class EntryResponse(EntryInDB):
    pass


class EntrySummary(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    count_income: int
    count_expense: int
    total_count: int


class CategoryDistribution(BaseModel):
    category: str
    amount: float
    count: int
    percentage: float


class CategoryDistributionList(BaseModel):
    distributions: List[CategoryDistribution]
    total: float
