from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, Literal, List
from datetime import datetime


class EntryBase(BaseModel):
    amount: float
    description: str
    date: datetime
    type: Literal["INCOME", "EXPENSE"]
    category: str
    subcategory: Optional[str] = None
    is_recurring: bool = False


class EntryCreate(EntryBase):
    @field_validator('amount')
    @classmethod
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('O valor deve ser maior que zero')
        return v


class EntryUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    type: Optional[Literal["INCOME", "EXPENSE"]] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    is_recurring: Optional[bool] = None

    @field_validator('amount')
    @classmethod
    def amount_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('O valor deve ser maior que zero')
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
    category_name: str
    amount: float
    count: int
    percentage: float


class CategoryDistributionList(BaseModel):
    distributions: List[CategoryDistribution]
    total: float
