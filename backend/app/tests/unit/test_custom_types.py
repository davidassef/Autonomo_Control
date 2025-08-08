"""
Testes unitários para tipos customizados.

Este módulo contém testes para validar o comportamento dos tipos customizados
do SQLAlchemy, especialmente o SQLiteListType.
"""
import json
import unittest

from sqlalchemy import create_engine, Column, String, MetaData, Table
from sqlalchemy.orm import sessionmaker, registry

from app.core.custom_types import SQLiteListType


class TestSQLiteListType(unittest.TestCase):
    """
    Testes unitários para a classe SQLiteListType
    """

    def setUp(self):
        """Configurando banco de dados em memória para testes"""
        self.engine = create_engine("sqlite:///:memory:", future=True)
        self.mapper_registry = registry()
        self.Base = self.mapper_registry.generate_base()
        self.Session = sessionmaker(bind=self.engine)

        # Criando modelo de teste que usa SQLiteListType
        class TestModel(self.Base):
            """Test model for SQLiteListType functionality."""
            __tablename__ = "test_model"
            id = Column(String, primary_key=True)
            tags = Column(SQLiteListType(), nullable=True)

        self.TestModel = TestModel
        self.Base.metadata.create_all(self.engine)

    def test_sqlite_save_and_retrieve_list(self):
        """
        Testa se uma lista pode ser salva e recuperada corretamente do SQLite
        """
        # Arrange
        test_list = ["tag1", "tag2", "tag3"]
        with self.Session() as session:
            # Act - Salvando um registro com uma lista
            test_obj = self.TestModel(id="1", tags=test_list)
            session.add(test_obj)
            session.commit()

            # Act - Recuperando o registro
            retrieved_obj = session.query(self.TestModel).filter_by(
                id="1"
            ).first()

            # Assert
            self.assertEqual(test_list, retrieved_obj.tags)

            # Verificando se o valor foi realmente armazenado como JSON
            # Acessando diretamente o valor armazenado no banco
            metadata = MetaData()
            table = Table("test_model", metadata, autoload_with=self.engine)
            with self.engine.connect() as conn:
                result = conn.execute(
                    table.select().where(table.c.id == "1")
                ).fetchone()
                stored_value = result[1]  # índice 1 corresponde à coluna 'tags'

                # Assert - Verificando se o valor armazenado é uma string
                # JSON válida
                self.assertIsInstance(stored_value, str)
                parsed_json = json.loads(stored_value)
                self.assertEqual(test_list, parsed_json)

    def test_sqlite_save_and_retrieve_none(self):
        """
        Testa se None pode ser salvo e recuperado corretamente do SQLite
        """
        # Act - Salvando um registro com tags None
        with self.Session() as session:
            test_obj = self.TestModel(id="2", tags=None)
            session.add(test_obj)
            session.commit()

            # Recuperando o registro
            retrieved_obj = session.query(self.TestModel).filter_by(
                id="2"
            ).first()

            # Assert
            self.assertIsNone(retrieved_obj.tags)

    def test_sqlite_process_invalid_json(self):
        """
        Testa o comportamento ao processar JSON inválido
        """
        # Arrange - Inserindo diretamente um valor inválido no banco
        metadata = MetaData()
        table = Table("test_model", metadata, autoload_with=self.engine)

        with self.engine.connect() as conn:
            conn.execute(table.insert().values(id="3", tags="invalid json"))
            conn.commit()

        # Act & Assert - Recuperando o registro deve retornar lista vazia
        with self.Session() as session:
            retrieved_obj = session.query(self.TestModel).filter_by(
                id="3"
            ).first()
            self.assertEqual([], retrieved_obj.tags)

    def test_handling_postgresql_dialect(self):
        """
        Testa o comportamento simulado com dialeto PostgreSQL
        """
        sqlite_list_type = SQLiteListType()

        # Simula o dialeto PostgreSQL

        class MockDialect:
            """Mock dialect class for testing PostgreSQL behavior."""
            name = "postgresql"

        mock_dialect = MockDialect()
        test_value = ["item1", "item2"]

        # Testa process_bind_param com PostgreSQL
        result = sqlite_list_type.process_bind_param(test_value, mock_dialect)
        self.assertEqual(test_value, result)

        # Testa process_result_value com PostgreSQL
        result = sqlite_list_type.process_result_value(
            test_value,
            mock_dialect
        )
        self.assertEqual(test_value, result)


if __name__ == "__main__":
    unittest.main()
