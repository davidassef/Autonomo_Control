# 🛠️ Configuração do Ambiente de Desenvolvimento

Este guia orienta na configuração do ambiente de desenvolvimento local para o Autônomo Control.

## 1. Pré-requisitos

Certifique-se de ter instalado:
- [Git](https://git-scm.com/)
- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 16+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) (opcional, SQLite incluso)

## 2. Clonar o Repositório

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/autonomo-control.git
cd autonomo-control
```

## 3. Configurar Ambiente Backend

### Criar e ativar ambiente virtual
```bash
# Linux/macOS
python -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
.\venv\Scripts\activate
```

### Instalar dependências
```bash
pip install -r requirements.txt
```

### Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
# Configurações do Banco de Dados
DATABASE_URL=sqlite:///./autonomo_control.db
# ou para PostgreSQL:
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/autonomo_control

# Configurações de Autenticação
SECRET_KEY=sua_chave_secreta_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Aplicar migrações
```bash
alembic upgrade head
```

## 4. Configurar Frontend

### Instalar dependências
```bash
cd frontend
npm install
```

### Configurar variáveis de ambiente
Crie um arquivo `.env` na pasta `frontend`:
```env
REACT_APP_API_URL=http://localhost:8000
```

## 5. Iniciar Servidores

### Backend
```bash
# Na raiz do projeto
uvicorn app.main:app --reload
```

### Frontend
```bash
# Na pasta frontend
npm start
```

## 6. Acessar a Aplicação

- Frontend: http://localhost:3000
- API Docs (Swagger): http://localhost:8000/docs
- Admin do Banco de Dados: http://localhost:8000/admin

## 7. Executando Testes

### Backend
```bash
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## 8. Dicas de Desenvolvimento

- Use `pre-commit` para formatação automática de código
- Crie branches para novas funcionalidades: `git checkout -b feature/nova-funcionalidade`
- Siga as convenções de commit: `git commit -m "tipo(escopo): mensagem descritiva"`

## 9. Solução de Problemas

### Erro de Conexão com o Banco
- Verifique se o serviço do banco de dados está rodando
- Confira as credenciais no arquivo `.env`

### Erros de Dependências
```bash
# Limpe o cache do pip
pip cache purge

# Reinstale as dependências
pip install -r requirements.txt
```

### Problemas no Frontend
```bash
# Limpe o cache do npm
npm cache clean --force

# Reinstale as dependências
rm -rf node_modules
npm install
```

## 10. Próximos Passos

- [Configurar Ambiente de Produção](./ambiente_producao.md)
- [Guia do Desenvolvedor](../03_guia_desenvolvedor/README.md)
