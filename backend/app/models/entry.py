from sqlalchemy import Boolean, Column, String, DateTime, Integer, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from uuid import uuid4

from app.core.database import Base

class EntryType(str, PyEnum):
    INCOME = "INCOME"  # Ganho/Receita
    EXPENSE = "EXPENSE"  # Despesa/Gasto

class Entry(Base):
    __tablename__ = "entries"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))

    # Dados do lançamento
    amount = Column(Float)  # Valor do lançamento
    description = Column(String)  # Descrição
    date = Column(DateTime(timezone=True))  # Data do lançamento
    type = Column(String, nullable=False)  # Tipo: INCOME ou EXPENSE
    category = Column(String)  # Categoria (ex: Combustível, Alimentação, Pagamento)
    subcategory = Column(String, nullable=True)  # Subcategoria

    # Relação com usuário
    user_id = Column(String, ForeignKey("users.id"))

    # Dados de recorrência (para implementação futura)
    is_recurring = Column(Boolean, default=False)

    # Campos de controle
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_deleted = Column(Boolean, default=False)  # Soft delete
