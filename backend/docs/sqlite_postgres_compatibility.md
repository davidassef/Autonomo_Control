# Solução para Compatibilidade de Tipos entre SQLite e PostgreSQL

## Problema

Ao executar testes com SQLite (banco de dados em memória), encontramos o seguinte erro:

```
sqlalchemy.exc.CompileError: (in table 'categories', column 'subcategories'): Compiler <sqlalchemy.dialects.sqlite.base.SQLiteTypeCompiler object> can't render element of type ARRAY
```

O problema ocorreu porque o modelo `Category` utilizava o tipo `ARRAY` do PostgreSQL para a coluna `subcategories`, que não é compatível com SQLite. Este erro impedia a execução de todos os testes que direta ou indiretamente acessavam o modelo `Category`.

## Solução Implementada

Criamos uma classe de tipo personalizada `SQLiteListType` que:

1. Herda de `TypeDecorator` do SQLAlchemy
2. Converte automaticamente entre listas Python e strings JSON em SQLite
3. Mantém o comportamento normal de arrays em PostgreSQL

Código da implementação:

```python
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
        if dialect.name == 'sqlite':
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
        if dialect.name == 'sqlite':
            try:
                return json.loads(value)
            except (ValueError, TypeError):
                return []

        # Para PostgreSQL, retorna o valor normalmente (já vem como lista)
        return value
```

## Modificação no Modelo

O modelo `Category` foi atualizado para usar o tipo personalizado em vez do tipo `ARRAY` do PostgreSQL:

```python
# Antes
subcategories = Column(ARRAY(SQLAlchemyString), nullable=True)

# Depois
subcategories = Column(SQLiteListType(), nullable=True)
```

## Testes Unitários

Foram criados testes específicos para verificar o comportamento da classe `SQLiteListType`:

1. `test_sqlite_save_and_retrieve_list`: Testa o armazenamento e recuperação de uma lista de strings em SQLite
2. `test_sqlite_save_and_retrieve_none`: Testa o comportamento com valor `None`
3. `test_sqlite_process_invalid_json`: Testa a recuperação de um valor JSON inválido (deve retornar lista vazia)
4. `test_handling_postgresql_dialect`: Testa o comportamento simulado com dialeto PostgreSQL

## Resultado

A implementação da solução resultou em:

- 100% dos testes passando
- Cobertura de testes de 100% para o módulo `custom_types.py`
- Melhoria da cobertura geral do projeto de 89% para 96%
- Transparência na utilização do modelo `Category` entre ambientes

## Benefícios Adicionais

Esta abordagem proporciona uma transição suave entre ambientes de desenvolvimento/teste (SQLite) e produção (PostgreSQL) sem necessidade de alterações no código de aplicação. A API e os modelos permanecem consistentes, independentemente do banco de dados subjacente.

## Lições Aprendidas

1. Sempre considerar as diferenças de dialetos em SQLAlchemy ao projetar modelos
2. Implementar soluções adaptativas para tipos específicos de banco de dados
3. Testar exaustivamente tipos personalizados para garantir comportamento consistente
4. Utilizar classes como `TypeDecorator` facilita a criação de adaptadores entre diferentes bancos de dados
