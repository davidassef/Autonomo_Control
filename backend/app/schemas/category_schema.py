from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, List
from datetime import datetime


class CategoryBase(BaseModel):
    name: str
    type: Literal["INCOME", "EXPENSE"]
    icon: Optional[str] = None
    color: Optional[str] = None
    subcategories: Optional[List[str]] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[Literal["INCOME", "EXPENSE"]] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryInDB(CategoryBase):
    id: str
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_default: bool

    model_config = ConfigDict(from_attributes=True)


class Category(CategoryInDB):
    # Versão da categoria exposta na API
    pass
