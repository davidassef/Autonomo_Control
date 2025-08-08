# 🧪 Guia de Testes

Este documento descreve como escrever e executar testes no projeto Autônomo Control.

## 📋 Visão Geral

O projeto utiliza diferentes tipos de testes para garantir a qualidade do código:

- **Testes Unitários**: Testam funções e componentes isoladamente
- **Testes de Integração**: Testam a interação entre componentes
- **Testes de API**: Testam os endpoints da API
- **Testes E2E**: Testam fluxos completos do usuário

## 🛠️ Ferramentas

### Backend (Python)
- **pytest**: Framework de testes
- **pytest-cov**: Cobertura de código
- **pytest-asyncio**: Suporte a testes assíncronos
- **HTTPX**: Cliente HTTP para testes de API
- **Factory Boy**: Criação de dados de teste

### Frontend (JavaScript/TypeScript)
- **Vitest**: Executor de testes
- **React Testing Library**: Testes de componentes React
- **MSW**: Mock de requisições HTTP
- **Cypress**: Testes E2E

## 🏗️ Estrutura de Testes

### Backend
```
tests/
├── conftest.py           # Configuração global de fixtures
├── test_models/          # Testes de modelos
│   ├── test_user.py
│   └── test_entry.py
├── test_services/        # Testes de serviços
│   ├── test_auth.py
│   └── test_entry.py
└── test_api/             # Testes de API
    ├── test_users.py
    └── test_entries.py
```

### Frontend
```
frontend/
└── src/
    └── __tests__/
        ├── components/   # Testes de componentes
        │   ├── Button.test.tsx
        │   └── Form.test.tsx
        ├── pages/        # Testes de páginas
        │   ├── Login.test.tsx
        │   └── Dashboard.test.tsx
        └── utils/        # Testes de utilitários
            └── formatters.test.ts
```

## 🧪 Escrevendo Testes

### Testes Unitários (Backend)

```python
# tests/test_services/test_auth.py
def test_authenticate_user_success(db_session, test_user):
    from app.services import auth_service
    
    # Testa autenticação bem-sucedida
    user = auth_service.authenticate_user(
        db=db_session,
        email=test_user.email,
        password="senha123"
    )
    
    assert user is not None
    assert user.email == test_user.email
```

### Testes de API (Backend)

```python
# tests/test_api/test_users.py
def test_read_users_me(client, test_user, test_token):
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert "hashed_password" not in data
```

### Testes de Componentes (Frontend)

```tsx
// frontend/src/__tests__/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies the correct variant class', () => {
    const { container } = render(<Button variant="secondary">Test</Button>);
    expect(container.firstChild).toHaveClass('bg-secondary');
  });
});
```

### Testes E2E (Frontend)

```javascript
// frontend/cypress/e2e/dashboard.cy.js
describe('Dashboard', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('/dashboard');
  });

  it('displays the welcome message', () => {
    cy.contains('Bem-vindo ao seu painel').should('be.visible');
  });

  it('shows the current balance', () => {
    cy.get('[data-testid="balance-amount"]').should('be.visible');
  });
});
```

## 🚀 Executando Testes

### Backend

```bash
# Executar todos os testes
pytest

# Executar testes com cobertura
pytest --cov=app --cov-report=term-missing

# Executar testes específicos
pytest tests/test_models/test_user.py -v

# Executar testes com watch mode
ptw --runner "pytest -xvs"
```

### Frontend

```bash
# Executar testes unitários
npm test

# Executar testes em modo watch
npm test -- --watch

# Executar testes de cobertura
npm test -- --coverage

# Executar testes E2E (com Cypress aberto)
npm run test:e2e

# Executar testes E2E em modo headless
npm run test:e2e:ci
```

## 📊 Cobertura de Código

### Backend
O relatório de cobertura é gerado automaticamente após a execução dos testes com a flag `--cov`. Para gerar um relatório HTML:

```bash
pytest --cov=app --cov-report=html
```

Abra `htmlcov/index.html` no navegador para visualizar o relatório.

### Frontend
A cobertura é exibida no terminal após a execução dos testes com `--coverage`. Um relatório HTML detalhado é gerado em `coverage/lcov-report/`.

## 🔄 Testes em CI/CD

O projeto inclui configurações para execução de testes em pipelines de CI/CD:

- **GitHub Actions**: `.github/workflows/tests.yml`
- **GitLab CI**: `.gitlab-ci.yml`

## 🧩 Fixtures e Mocks

### Backend (pytest fixtures)
```python
# conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.core.config import settings

@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(settings.TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
```

### Frontend (MSW para mock de API)
```javascript
// src/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/user', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      }),
    )
  }),
];
```

## 🔍 Testes de Acessibilidade

O projeto inclui testes de acessibilidade usando `@axe-core/react`:

```javascript
// frontend/src/__tests__/a11y.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import App from '../App';

describe('App', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 🧪 Testes de Performance

### Backend (Locust)
```python
# locustfile.py
from locust import HttpUser, task, between

class QuickstartUser(HttpUser):
    wait_time = between(1, 2.5)
    
    @task
    def get_entries(self):
        self.client.get("/api/v1/entries")
    
    @task(3)
    def view_item(self):
        self.client.get(f"/api/v1/entries/1")
```

### Frontend (Lighthouse CI)
```yaml
# .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      staticDistDir: './build',
      url: ['http://localhost:3000'],
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.9}],
      },
    },
  },
};
```

## 📝 Boas Práticas

1. **Nomes Descritivos**: Use nomes que descrevam o comportamento esperado
2. **AAA Pattern**: Organize os testes em Arrange, Act, Assert
3. **Testes Isolados**: Cada teste deve ser independente
4. **Mocks Eficientes**: Use mocks para dependências externas
5. **Cobertura Significativa**: Busque qualidade, não apenas quantidade de testes
6. **Testes Rápidos**: Mantenha os testes rápidos para feedback rápido
7. **Testes Determinísticos**: Evite testes que falham aleatoriamente

## 🔍 Debugando Testes

### Backend
```bash
# Executar com PDB ativado
pytest --pdb

# Executar com logging detalhado
pytest -v -s
```

### Frontend
```bash
# Executar em modo debug
DEBUG=* npm test

# Rodar Cypress em modo debug
npx cypress open --config watchForFileChanges=true
```

## 📚 Recursos Adicionais

- [Documentação do pytest](https://docs.pytest.org/)
- [Testing Library](https://testing-library.com/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [MSW Documentation](https://mswjs.io/)
- [Jest Cheat Sheet](https://devhints.io/jest)
