# Estrutura do Projeto Autônomo Control

Este documento descreve a estrutura organizacional do projeto após a reorganização e limpeza realizada.

## Estrutura Geral

```
Autonomo Control/
├── .gitignore                 # Configuração de arquivos ignorados pelo Git
├── .trae/                     # Configurações do Trae AI
├── README.md                  # Documentação principal do projeto
├── mkdocs.yml                 # Configuração da documentação
├── backend/                   # Código do backend (FastAPI)
├── frontend/                  # Código do frontend (React)
├── docs/                      # Documentação do projeto
└── supabase/                  # Configurações do Supabase
```

## Backend (`backend/`)

### Estrutura Principal

```
backend/
├── app/                       # Código principal da aplicação
│   ├── core/                  # Configurações centrais
│   ├── models/                # Modelos de dados (SQLAlchemy)
│   ├── routes/                # Endpoints da API
│   ├── services/              # Lógica de negócio
│   ├── schemas/               # Validações (Pydantic)
│   └── utils/                 # Utilitários
├── migrations/                # Migrações do banco de dados
│   ├── versions/              # Arquivos de migração
│   ├── env.py                 # Configuração do Alembic
│   └── script.py.mako         # Template de migração
├── scripts/                   # Scripts utilitários organizados
│   ├── admin/                 # Scripts administrativos
│   ├── database/              # Scripts de banco de dados
│   └── utils/                 # Scripts utilitários gerais
├── scripts/tests/             # Scripts de teste organizados
│   ├── run_tests.py           # Script principal para executar testes
│   ├── simple_test.py         # Testes básicos
│   └── test_*.py              # Scripts de teste específicos
├── app/tests/                 # Estrutura de testes do projeto
│   ├── unit/                  # Testes unitários
│   └── integration/           # Testes de integração
├── alembic.ini                # Configuração do Alembic
├── Makefile                   # Comandos automatizados
└── requirements.txt           # Dependências Python
```

### Scripts Organizados (`backend/scripts/`)

#### Admin (`backend/scripts/admin/`)
- `create_admin_user.py` - Criação de usuários administrativos
- `update_admin_password.py` - Atualização de senhas de admin
- `check_admin.py` - Verificação de usuários admin

#### Database (`backend/scripts/database/`)
- `check_database.py` - Verificação do banco de dados
- `check_table_structure.py` - Verificação da estrutura das tabelas
- `create_tables.py` - Criação de tabelas
- `add_hierarchy_columns.py` - Adição de colunas de hierarquia
- `run_migration.py` - Execução de migrações

#### Utils (`backend/scripts/utils/`)
- `check_all_emails.py` - Verificação de emails
- `fix_*.py` - Scripts de correção diversos
- `seed_data.py` - População de dados iniciais
- `run_server.py` - Inicialização do servidor

### Scripts de Teste (`backend/scripts/tests/`)
- `run_tests.py` - Script principal para executar testes
- `simple_test.py` - Testes básicos de API
- `test_admin_endpoint.py` - Testes de endpoints administrativos
- `test_login.py` - Testes de autenticação
- `test_full_flow.py` - Testes de fluxo completo
- `test_admin_features.py` - Testes de funcionalidades admin
- `test_system_config.py` - Testes de configuração do sistema
- `test_hierarchy_system.py` - Testes do sistema de hierarquia

### Estrutura de Testes (`backend/app/tests/`)

#### Testes Unitários (`backend/app/tests/unit/`)
- Testes que verificam componentes isolados sem dependências externas
- Testam services, utils, models individualmente

#### Testes de Integração (`backend/app/tests/integration/`)
- Testes que fazem requisições HTTP reais
- Testam fluxos completos da API
- Testam interação entre componentes

## Frontend (`frontend/`)

```
frontend/
├── src/                       # Código fonte React
│   ├── components/            # Componentes reutilizáveis
│   ├── pages/                 # Páginas da aplicação
│   ├── services/              # Serviços de API
│   ├── hooks/                 # Hooks customizados
│   ├── contexts/              # Contextos React
│   └── utils/                 # Utilitários
├── public/                    # Arquivos públicos
├── package.json               # Dependências Node.js
└── ...
```

## Documentação (`docs/`)

```
docs/
├── 00_guia_rapido/           # Guias de início rápido
├── 01_instalacao/            # Guias de instalação
├── 02_arquitetura/           # Documentação da arquitetura
│   ├── backend/              # Documentação específica do backend
│   ├── frontend/             # Documentação específica do frontend
│   └── ESTRUTURA_PROJETO.md  # Este documento
├── 03_guia_desenvolvedor/    # Guias para desenvolvedores
├── 04_manuais/               # Manuais de uso
├── 05_historico/             # Histórico de mudanças

├── INDICE.md                 # Índice da documentação
└── README.md                 # README da documentação
```

## Configurações

### Supabase (`supabase/`)
- Configurações e migrações do Supabase
- Políticas de segurança (RLS)

### Ambiente
- `.env` - Variáveis de ambiente (não versionado)
- `.env.example` - Exemplo de variáveis de ambiente
- `.gitignore` - Arquivos ignorados pelo Git

## Princípios de Organização

### 1. Separação por Responsabilidade
- **Scripts Admin**: Operações administrativas
- **Scripts Database**: Operações de banco de dados
- **Scripts Utils**: Utilitários gerais
- **Testes Unit**: Testes de componentes isolados
- **Testes Integration**: Testes de fluxo completo

### 2. Convenções de Nomenclatura
- Arquivos Python: `snake_case.py`
- Diretórios: `lowercase` ou `snake_case`
- Testes: prefixo `test_`
- Scripts: nomes descritivos da função

### 3. Estrutura de Testes
- **Unitários**: Testam componentes isolados (services, utils)
- **Integração**: Testam fluxos completos com HTTP
- **Cobertura**: Relatórios automáticos de cobertura
- **Execução**: Script centralizado com opções flexíveis

### 4. Documentação
- Estrutura hierárquica clara
- Separação por área (backend/frontend)
- Documentação técnica e de usuário
- Índices e referências cruzadas

## Comandos Úteis

### Testes
```bash
# Todos os testes
cd backend && python scripts/tests/run_tests.py

# Executar pytest diretamente
cd backend && pytest

# Apenas testes unitários
cd backend && pytest app/tests/unit/

# Apenas testes de integração
cd backend && pytest app/tests/integration/

# Com relatório de cobertura
cd backend && pytest --cov=app --cov-report=html
```

### Scripts
```bash
# Scripts administrativos
cd backend && python scripts/admin/create_admin_user.py

# Scripts de banco
cd backend && python scripts/database/check_database.py

# Scripts utilitários
cd backend && python scripts/utils/seed_data.py
```

## Manutenção

### Adicionando Novos Testes
1. **Unitários**: Adicionar em `backend/app/tests/unit/`
2. **Integração**: Adicionar em `backend/app/tests/integration/`
3. **Scripts de teste**: Adicionar em `backend/scripts/tests/`
4. Seguir convenção `test_*.py`
5. Usar `pytest` ou `scripts/tests/run_tests.py` para execução

### Adicionando Novos Scripts
1. Identificar categoria (admin/database/utils)
2. Adicionar na pasta apropriada
3. Seguir convenções de nomenclatura
4. Documentar no cabeçalho do arquivo

### Atualizando Documentação
1. Manter estrutura hierárquica
2. Atualizar índices quando necessário
3. Usar referências cruzadas
4. Manter exemplos atualizados

Esta estrutura foi projetada para facilitar a manutenção, desenvolvimento e colaboração no projeto Autônomo Control.