# 📋 Pré-requisitos do Sistema

## 💻 Requisitos Mínimos

### Backend
- Python 3.8 ou superior
- pip (gerenciador de pacotes do Python)
- Banco de dados (PostgreSQL 12+ ou SQLite)
- Git (para controle de versão)

### Frontend
- Node.js 16 ou superior
- npm (gerenciador de pacotes do Node.js) ou Yarn

### Para Desenvolvimento
- Git
- Docker (opcional, para ambiente de desenvolvimento)
- IDE ou editor de código (VS Code, PyCharm, etc.)

## 🔧 Dependências do Projeto

### Backend (Python)
As dependências serão instaladas automaticamente durante a instalação. As principais incluem:
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic (para migrações de banco de dados)
- Uvicorn (servidor ASGI)

### Frontend (React)
- React 18+
- TypeScript
- Tailwind CSS
- Axios (para requisições HTTP)
- React Router (para navegação)

## 🔐 Configurações de Segurança

### Variáveis de Ambiente
O projeto utiliza variáveis de ambiente para configurações sensíveis. Você precisará configurar:
- Chaves de API
- Credenciais do banco de dados
- Configurações de autenticação

### Permissões
Certifique-se de que o usuário do banco de dados tenha as permissões necessárias para:
- Criar e modificar tabelas
- Executar migrações
- Ler/Escrever dados

## 📦 Instalação

### Backend
1. Clone o repositório
2. Crie um ambiente virtual
3. Instale as dependências com `pip install -r requirements.txt`
4. Configure as variáveis de ambiente
5. Execute as migrações do banco de dados

### Frontend
1. Navegue até a pasta `frontend`
2. Instale as dependências com `npm install`
3. Configure as variáveis de ambiente
4. Inicie o servidor de desenvolvimento com `npm start`

## 🔄 Próximos Passos
Após a instalação, siga para o guia de configuração do [Ambiente de Desenvolvimento](./ambiente_desenvolvimento.md) para configurar seu ambiente local.
