from sqlalchemy import Boolean, Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4

from app.core.database import Base
from app.core.custom_types import SQLiteListType


class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False, index=True)  # INCOME ou EXPENSE
    icon = Column(String, nullable=True)  # Ícone opcional para a categoria
    color = Column(String, nullable=True)  # Cor opcional para visualização
    subcategories = Column(SQLiteListType(), nullable=True)  # type: ignore  # Lista de subcategorias como array

    # Relação com usuário (categorias podem ser personalizadas por usuário)
    user_id = Column(
        String, ForeignKey("users.id"), nullable=True
    )  # Null para categorias padrão do sistema

    # Campos de controle
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_default = Column(Boolean, default=False)  # Se é categoria padrão do sistema

    # Relacionamentos SQLAlchemy
    user = relationship("User", back_populates="categories")
