from sqlalchemy import Boolean, Column, String, DateTime, Integer, Float, ForeignKey
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

    # Dados do lançamento genérico / financeiro
    amount = Column(Float)  # Valor consolidado (para despesas ou receitas simples)
    description = Column(String)  # Descrição
    date = Column(DateTime(timezone=True))  # Data do lançamento
    type = Column(String, nullable=False, index=True)  # INCOME / EXPENSE
    category = Column(String, index=True)  # Categoria (Combustível, Corrida, etc.)
    subcategory = Column(String, nullable=True)

    # Campos específicos de corrida (opcionais, somente quando type=INCOME e representar corrida)
    platform = Column(String, nullable=True, index=True)              # Plataforma (UBER, 99, etc.)
    distance_km = Column(Float, nullable=True)                        # Distância em km
    duration_min = Column(Integer, nullable=True)                     # Duração em minutos
    gross_amount = Column(Float, nullable=True)                       # Valor bruto plataforma
    platform_fee = Column(Float, nullable=True)                       # Taxa cobrada pela plataforma
    tips_amount = Column(Float, nullable=True)                        # Gorjetas
    net_amount = Column(Float, nullable=True)                         # Calculado = gross + tips - fee (fallback amount)
    vehicle_id = Column(String, nullable=True)                        # Referência futura a veículo
    shift_tag = Column(String, nullable=True, index=True)             # MANHA / TARDE / NOITE / MADRUGADA
    city = Column(String, nullable=True)
    is_trip_expense = Column(Boolean, default=False)                  # Se despesa atrelada a corrida
    linked_entry_id = Column(String, ForeignKey("entries.id"), nullable=True)  # Possível referência cruzada

    # Relação com usuário
    user_id = Column(String, ForeignKey("users.id"))

    # Dados de recorrência (para implementação futura)
    is_recurring = Column(Boolean, default=False)

    # Campos de controle
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_deleted = Column(Boolean, default=False)  # Soft delete
