from sqlalchemy import types
from sqlalchemy.schema import Column
import json


class SQLiteListType(types.TypeDecorator):
    """
    Tipo personalizado que salva listas como texto delimitado em SQLite
    mas mantém o comportamento normal de ARRAY no PostgreSQL
    """

    impl = types.Text
    cache_ok = True

    def __init__(self, item_type=None):
        super(SQLiteListType, self).__init__()
        self.item_type = item_type

    def process_bind_param(self, value, dialect):
        """
        Converte o valor para uma representação que pode ser armazenada no banco
        """
        if value is None:
            return None

        # Para SQLite, converte a lista para uma string JSON
        if dialect.name == "sqlite":
            return json.dumps(value)

        # Para PostgreSQL, retorna o valor normalmente (será tratado como ARRAY)
        return value

    def process_result_value(self, value, dialect):
        """
        Converte o valor armazenado no banco para o tipo Python apropriado
        """
        if value is None:
            return None

        # Para SQLite, converte a string JSON de volta para lista
        if dialect.name == "sqlite":
            try:
                return json.loads(value)
            except (ValueError, TypeError):
                return []

        # Para PostgreSQL, retorna o valor normalmente (já vem como lista)
        return value
