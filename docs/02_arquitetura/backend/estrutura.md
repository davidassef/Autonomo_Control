# 🖥️ Estrutura do Backend

Este documento detalha a estrutura e organização do código do backend do Autônomo Control.

## 📁 Visão Geral da Estrutura

```
backend/
├── alembic/              # Migrações do banco de dados
├── app/
│   ├── api/              # Rotas da API (v1, v2, etc.)
│   │   ├── v1/           # Versão 1 da API
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── entries.py
│   │   │   │   └── categories.py
│   │   │   └── __init__.py
│   │   └── __init__.py
│   │
│   ├── core/             # Configurações centrais
│   │   ├── config.py     # Configurações da aplicação
│   │   ├── security.py   # Autenticação e autorização
│   │   └── logging.py    # Configuração de logs
│   │
│   ├── db/               # Configuração do banco de dados
│   │   ├── base.py       # Classe base do SQLAlchemy
│   │   ├── session.py    # Sessão do banco de dados
│   │   └── init_db.py    # Inicialização do banco de dados
│   │
│   ├── models/           # Modelos SQLAlchemy
│   │   ├── user.py
│   │   ├── entry.py
│   │   ├── category.py
│   │   └── __init__.py
│   │
│   ├── schemas/          # Esquemas Pydantic
│   │   ├── user.py
│   │   ├── entry.py
│   │   ├── category.py
│   │   └── __init__.py
│   │
│   ├── services/         # Lógica de negócio
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── entry.py
│   │   └── report.py
│   │
│   ├── utils/            # Utilitários
│   │   ├── security.py
│   │   ├── files.py
│   │   └── helpers.py
│   │
│   ├── tests/            # Testes automatizados
│   │   ├── conftest.py
│   │   ├── unit/         # Testes unitários
│   │   │   ├── test_models/
│   │   │   └── test_services/
│   │   └── integration/  # Testes de integração
│   │       └── test_api/
│   │
│   ├── main.py           # Ponto de entrada da aplicação
│   └── __init__.py
│
├── .env                 # Variáveis de ambiente
├── .env.example         # Exemplo de variáveis de ambiente
├── requirements.txt     # Dependências do projeto
└── pytest.ini           # Configuração do pytest
```

## 🏗️ Componentes Principais

### 1. API (app/api/)
- Organizada por versões (v1, v2, etc.)
- Cada endpoint em seu próprio arquivo
- Validação de entrada com Pydantic
- Tratamento de erros consistente

### 2. Modelos (app/models/)
- Definições das tabelas do banco de dados
- Relacionamentos entre modelos
- Métodos auxiliares para operações comuns

### 3. Esquemas (app/schemas/)
- Validação de dados de entrada/saída
- Separação entre schemas de requisição e resposta
- Documentação automática da API

### 4. Serviços (app/services/)
- Lógica de negócio principal
- Separação clara entre camadas
- Fácil de testar e manter

## 🛠️ Configurações

### Banco de Dados
- **ORM**: SQLAlchemy 1.4+
- **Migrações**: Alembic
- **SGBD**: PostgreSQL (recomendado) ou SQLite (desenvolvimento)

### Autenticação
- **Método**: JWT (JSON Web Tokens)
- **Tempo de vida do token**: Configurável
- **Segurança**: HTTPS obrigatório em produção

### Logging
- Formato estruturado (JSON em produção)
- Níveis de log configuráveis
- Rotação de arquivos

## 🧪 Testes

### Estrutura de Testes
```
app/
└── tests/
    ├── conftest.py         # Configuração dos fixtures
    ├── unit/               # Testes unitários
    │   ├── test_models/    # Testes dos modelos
    │   │   ├── test_user.py
    │   │   └── test_entry.py
    │   └── test_services/  # Testes dos serviços
    │       └── test_auth.py
    └── integration/        # Testes de integração
        └── test_api/       # Testes da API
            └── test_users.py
```

### Tipos de Testes
1. **Testes de Unidade**: Testam funções individuais
2. **Testes de Integração**: Testam a interação entre componentes
3. **Testes de API**: Testam os endpoints HTTP

### Executando Testes
```bash
# Executar todos os testes
pytest

# Executar testes com cobertura
pytest --cov=app --cov-report=term-missing

# Executar apenas testes unitários
pytest app/tests/unit/ -v

# Executar apenas testes de integração
pytest app/tests/integration/ -v

# Executar testes específicos
pytest app/tests/unit/test_models/test_user.py -v
```

## 🔄 Migrações de Banco de Dados

### Criar Nova Migração
```bash
alembic revision --autogenerate -m "Descrição da migração"
```

### Aplicar Migrações
```bash
alembic upgrade head
```

### Reverter Migração
```bash
alembic downgrade -1
```

## 🚀 Implantação

### Requisitos
- Python 3.8+
- PostgreSQL ou SQLite
- Gunicorn (produção)
- Nginx (recomendado para produção)

### Variáveis de Ambiente
```env
# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost/dbname

# Autenticação
SECRET_KEY=sua_chave_secreta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Configurações de Email (opcional)
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASSWORD=password
```

## 📊 Monitoramento

### Métricas
- Uso de CPU/Memória
- Tempo de resposta da API
- Taxa de erros
- Uso do banco de dados

### Logs
- Acesso (Nginx)
- Aplicação
- Erros
- Auditoria

## 🔒 Segurança

### Boas Práticas
- Todas as senhas são hasheadas com bcrypt
- Tokens JWT com tempo de expiração curto
- Proteção contra CSRF
- Headers de segurança habilitados
- Rate limiting em endpoints sensíveis

## 📚 Próximos Passos

- [Documentação da API](./api.md)
- [Guia de Contribuição](../../03_guia_desenvolvedor/contribuindo.md)
- [Políticas de Segurança](../../03_guia_desenvolvedor/seguranca.md)
