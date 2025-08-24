# 🚀 AUTÔNOMO CONTROL

*Sistema completo de gestão financeira para profissionais autônomos*

![Status](https://img.shields.io/badge/Backend-100%25-brightgreen)
![Status](https://img.shields.io/badge/Frontend-95%25-brightgreen)
![Status](https://img.shields.io/badge/MVP-95%25-brightgreen)
![Tests](https://img.shields.io/badge/Tests-300%2B-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-99%25-brightgreen)
![Performance](https://img.shields.io/badge/Anti--Flickering-✅-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-Zero%20Errors-brightgreen)
![Testing](https://img.shields.io/badge/Jest-Migrated-brightgreen)

---

## 🎯 **Propósito**

O Autônomo Control é uma aplicação de gestão financeira desenvolvida especificamente para profissionais autônomos brasileiros - motoristas de aplicativo, entregadores, freelancers e outros trabalhadores independentes.

### **Objetivos Principais:**
- 💡 **Simplificar** o controle financeiro diário
- 📊 **Facilitar** o cálculo de lucratividade real
- 📈 **Proporcionar** visibilidade sobre tendências financeiras
- 🎯 **Auxiliar** no planejamento e declarações fiscais

---

## 📋 **Documentação Principal**

### 🎯 **[📚 Documentação Completa](docs/INDICE.md)**
**Acesse a documentação completa** para obter todas as informações sobre instalação, uso, desenvolvimento e manutenção do sistema.

### 🚀 **Comece Aqui**
- [Guia de Início Rápido](docs/00_guia_rapido/guia_inicio_rapido.md) - Comece a usar o Autônomo Control rapidamente
- [Instruções de Login](docs/01_instalacao/instrucoes_login.md) - Como configurar e acessar sua conta
- [Perguntas Frequentes](docs/00_guia_rapido/faq.md) - Respostas para dúvidas comuns

### 📚 **Documentação Técnica**
- [Visão Geral da Arquitetura](docs/02_arquitetura/visao_geral.md) - Visão geral da arquitetura do sistema
- [Backend](docs/02_arquitetura/backend/estrutura.md) - Documentação técnica do backend
- [Frontend](docs/02_arquitetura/frontend/estrutura.md) - Documentação técnica do frontend
- 🔑 **[Instruções de Login](docs/historico/unificacao_30_05_2025/INSTRUCOES_LOGIN.md)** - Configuração de autenticação
- ⚡ **[Otimizações Anti-Flickering](docs/ANTI_FLICKERING_OPTIMIZATIONS.md)** - Performance improvements
- 🧪 **[Testes E2E](frontend/e2e/)** - Testes end-to-end com Playwright
- 📁 **[Arquivo Histórico](docs/historico/)** - Documentos consolidados anteriores

---

## 🆕 **Melhorias Recentes**

### ✅ **Correções de TypeScript (Janeiro 2025)**
- **Zero erros TypeScript**: Resolvidos mais de 65 erros de tipagem
- **Migração Jest**: Convertido de Vitest para Jest com Testing Library
- **Tipagem aprimorada**: Interfaces `Entry`, `Category`, `SecurityQuestion` padronizadas
- **IDs consistentes**: Migração de `number` para `string` em todos os componentes
- **Hooks otimizados**: `useAuth` e `useToast` com tipagem correta
- **Testes robustos**: 300+ testes unitários e de integração
- **E2E implementado**: Testes end-to-end com Playwright
- **Scripts de correção**: Ferramentas automáticas para manutenção de código

### 🔧 **Melhorias Técnicas**
- **Backend completo**: API FastAPI com estrutura modular
- **Segurança aprimorada**: Sistema de roles RBAC (USER/ADMIN/MASTER)
- **Testes abrangentes**: Cobertura de 99% no backend
- **Configuração Supabase**: Integração com banco de dados em nuvem
- **Scripts administrativos**: Ferramentas para gestão de usuários

---

## ⚡ **Quick Start**
Roteiro mínimo para ter o sistema rodando em menos de 5 minutos.

### 1. Pré‑requisitos
- Python 3.12+
- Node.js 18+ / npm
- (Opcional) pyenv ou virtualenv

### 2. Clonar e configurar ambiente
```bash
git clone https://github.com/davidassef/Autonomo_Control.git
cd Autonomo_Control
cp backend/.env.example backend/.env  # Ajuste SECRET_KEY se quiser
```

### 3. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scripts/utils/seed_data.py   # (opcional) popula categorias + corridas fictícias
python scripts/utils/run_server.py  # Servirá em http://127.0.0.1:8000 (requer venv ATIVA)

# Dica:
# Se aparecer "ModuleNotFoundError: No module named 'sqlalchemy'" o motivo quase sempre é a venv não ativada.
# O script agora exibe instruções automáticas quando dependências faltam.

# Alternativa direta (mesmo efeito do scripts/utils/run_server.py):
# uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Swagger/OpenAPI: http://127.0.0.1:8000/docs

### 4. Frontend (React)
Em outro terminal:
```bash
cd frontend
npm install
npm start   # http://localhost:3000
```

### 5. Login / Usuário de Seed
O seed cria usuário system@seed (Google ID fictício). Para fluxo real de login Google implemente variáveis `GOOGLE_CLIENT_ID` etc. (ver `.env.example`).

### 5.1 Roles & Administração (RBAC)
O sistema agora suporta três níveis hierárquicos de acesso:

| Role | Pode | Não Pode |
|------|------|----------|
| USER | Gerenciar seus próprios lançamentos e categorias | Acessar rota `/admin` |
| ADMIN | Tudo de USER + listar usuários, criar USER, desativar USER | Criar ADMIN, promover roles sem MASTER password |
| MASTER | Tudo de ADMIN + criar ADMIN, promover/rebaixar, desativar ADMIN | Desativar ou alterar o próprio MASTER |

Operações críticas (criar ADMIN, alterar role, desativar ADMIN) exigem cabeçalho adicional:
`X-Master-Key: <MASTER_PASSWORD>`

Configure no arquivo `.env`:
```
MASTER_EMAIL=seu.email+master@dominio.com
MASTER_PASSWORD=defina-uma-senha-forte
```
No primeiro start / seed:
- Se `MASTER_EMAIL` não existir => usuário MASTER criado.
- Se existir como USER/ADMIN => promovido a MASTER.

Exemplo criar ADMIN (via curl):
```bash
curl -X POST \
        -H "Authorization: Bearer <TOKEN_MASTER>" \
        -H "X-Master-Key: $MASTER_PASSWORD" \
        -H "Content-Type: application/json" \
        http://127.0.0.1:8000/api/v1/admin/users?role=ADMIN \
        -d '{"email":"novo.admin@example.com","name":"Novo Admin"}'
```

Promover USER → ADMIN:
```bash
curl -X PATCH \
        -H "Authorization: Bearer <TOKEN_MASTER>" \
        -H "X-Master-Key: $MASTER_PASSWORD" \
        -H "Content-Type: application/json" \
        http://127.0.0.1:8000/api/v1/admin/users/<USER_ID>/role \
        -d '{"role":"ADMIN"}'
```

Desativar USER (ADMIN ou MASTER):
```bash
curl -X PATCH \
        -H "Authorization: Bearer <TOKEN_ADMIN_OU_MASTER>" \
        -H "Content-Type: application/json" \
        http://127.0.0.1:8000/api/v1/admin/users/<USER_ID>/status \
        -d '{"is_active":false}'
```

Notas de segurança:
- NÃO commit o `.env` com `MASTER_PASSWORD` real.
- Troque a master password periodicamente.
- Em produção armazene hash (futuro: `MASTER_PASSWORD_HASH`).

### 5.2 Painel Admin (UI)
Interface web básica disponível em `/admin/users` (acesso restrito a ADMIN e MASTER), com recursos:

| Recurso | USER | ADMIN | MASTER | Observações |
|---------|------|-------|--------|-------------|
| Listagem usuários | ❌ | ✅ | ✅ | Paginação futura (atual: lista completa) |
| Criar USER | ❌ | ✅ | ✅ | Formulário inline |
| Criar ADMIN | ❌ | ❌ | ✅ | Exige modal com Master Password |
| Promover USER→ADMIN | ❌ | ❌ | ✅ | Botão + modal master password |
| Rebaixar ADMIN→USER | ❌ | ❌ | ✅ | Botão + modal master password |
| Ativar/Desativar USER | ❌ | ✅ | ✅ | Toggle direto |
| Ativar/Desativar ADMIN | ❌ | ❌ | ✅ | Toggle bloqueado para ADMIN comum |
| Desativar MASTER | ❌ | ❌ | ❌ | Sempre bloqueado |

UX / Segurança:
- Campo Master Password nunca é armazenado; limpa após tentativa.
- Ações críticas mostram feedback via toasts.
- Skeletons exibidos durante carregamento inicial.
- Não é possível desativar o próprio usuário logado nem o MASTER.
- Erros 403 diferenciados (permissão vs master password inválida) no modal.

Roadmap UI Admin (próximos incrementos): paginação, filtros por role/status, busca, audit trail visível, exportação CSV.

### 6. Testes Rápidos
```bash
cd backend
pytest -q
```

Frontend (inclui testes iniciais painel admin):
```bash
cd frontend
npm run test:ci
```

Relatório de cobertura frontend é exibido em terminal (scripts adicionados Fase 5).

### Testes E2E (Playwright)
```bash
cd frontend
npm run test:e2e
```

Testes end-to-end incluem validação de login e interface visual.

### 7. Estrutura de Pastas Essencial
```
backend/
        app/ (api, models, schemas, services)
        seed_data.py
frontend/
        src/
                components/, hooks/, pages/, services/
```

### 8. Comandos Úteis
```bash
# Regenerar banco local (cuidado: perde dados)
rm backend/autonomo_control.db && cd backend && python scripts/utils/seed_data.py

# Rodar somente testes de métricas
pytest -k metrics -q

# Ver logs de requisições (FastAPI já mostra em stdout)
```

### 9. Solução de Problemas
| Sintoma | Causa Provável | Solução |
|--------|----------------|---------|
| `ModuleNotFoundError` | venv não ativada | `source .venv/bin/activate` |
| Erro SQLite lock | Execuções concorrentes | Feche processos / use Postgres em prod |
| 401 nas rotas | Falta token JWT | Autentique e envie `Authorization: Bearer <token>` |
| Campos corrida não aparecem | Frontend antigo em cache | Hard refresh (Ctrl+Shift+R) |
| 403 ao criar ADMIN | Master password ausente | Adicionar header X-Master-Key |
| 403 Master password inválida | Valor incorreto | Verifique variável de ambiente MASTER_PASSWORD |
| 403 promoção/rebaixamento | Usuário não MASTER | Logar com conta MASTER |

### 10. Próximos (Opcional)
| Objetivo | Passo inicial |
|----------|---------------|
| Usar PostgreSQL | Ajustar `DATABASE_URL=postgresql+psycopg://user:pass@host/db` em `.env` e rodar migrações |
| Dockerizar | Criar `Dockerfile` multi-stage e `docker-compose.yml` com backend + frontend + db |
| CI | Adicionar workflow GitHub Actions rodando pytest + build frontend |

---

---

## 📊 **Status Atual**

Referência de planejamento contínuo detalhada em `PLANO_PREVC.md` (metodologia PREVC: Planejar, Revisar, Executar, Commitar).

### ✅ **Backend - Sprint Motorista**
- 🚖 Campos de corrida e métricas diárias/mensais adicionados
- 🎯 **236/236 testes passando** (inclui testes admin RBAC)
- 📊 Cobertura alta (executar pytest --cov para número atualizado)
- ✅ **0 erros MyPy** (type safety perfeita)
- 🔧 **25+ endpoints** implementados
- 🛡️ **JWT + OAuth2** funcionando
- 🗄️ **SQLAlchemy + Alembic** configurado

### 🔄 **Frontend - 70% Implementado**
- ⚛️ **React + TypeScript** configurado
- 🎨 **Tailwind CSS** para estilização
- 📱 **4/6 páginas** implementadas
- 📊 **Charts.js** para gráficos
- 🔐 **Autenticação** integrada
- 📱 **Design responsivo** básico

### 🎯 **MVP - 80% Completo**
**Meta (revisada):** 100% até 30/06/2025

---

## 🏗️ **Arquitetura Detalhada**

### **Estrutura Backend (FastAPI)**
```
📦 backend/
├── 🚀 app/
│   ├── 🔌 api/v1/              # Endpoints REST
│   │   ├── auth.py            # Autenticação (login, refresh)
│   │   ├── entries.py         # CRUD lançamentos
│   │   ├── users.py           # Gestão de usuários
│   │   ├── categories.py      # Categorias personalizáveis
│   │   └── reports.py         # Relatórios e análises
│   ├── ⚙️ core/               # Configurações centrais
│   │   ├── config.py          # Variáveis de ambiente
│   │   ├── security.py        # JWT e segurança
│   │   ├── database.py        # Conexão banco
│   │   └── exceptions.py      # Handlers de exceções
│   ├── 🗄️ models/             # SQLAlchemy Models
│   │   ├── user.py           # Modelo User
│   │   ├── entry.py          # Modelo Entry
│   │   ├── category.py       # Modelo Category
│   │   └── base.py           # Base model
│   ├── 📋 schemas/            # Pydantic Schemas
│   │   ├── user.py           # Schemas User
│   │   ├── entry.py          # Schemas Entry
│   │   ├── category.py       # Schemas Category
│   │   └── responses.py      # Padronização respostas
│   ├── ⚡ services/           # Lógica de negócio
│   │   ├── google_auth.py    # OAuth2 Google
│   │   ├── email_service.py  # Envio de emails
│   │   ├── storage.py        # Armazenamento arquivos
│   │   └── analytics.py      # Análise de dados
│   ├── 🧪 tests/             # 374 testes (99% coverage)
│   │   ├── unit/             # Testes unitários
│   │   ├── integration/      # Testes integração
│   │   └── conftest.py       # Configurações
│   ├── 🔄 migrations/        # Alembic migrations
│   ├── main.py               # App FastAPI
│   └── dependencies.py       # Dependências compartilhadas
├── 🐳 Dockerfile             # Containerização
├── 📦 requirements.txt       # Dependências Python
└── ⚙️ alembic.ini            # Config migrações
```

### **Estrutura Frontend (React)**
```
📦 frontend/
├── 🌐 public/               # Arquivos estáticos
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── ⚛️ src/
│   ├── 🧩 components/       # Componentes reutilizáveis
│   │   ├── ui/             # Componentes básicos (Button, Input)
│   │   ├── layout/         # Header, Sidebar, Footer
│   │   ├── forms/          # Formulários específicos
│   │   ├── charts/         # Visualização de dados
│   │   ├── tables/         # Tabelas e listagens
│   │   └── modals/         # Modais e diálogos
│   ├── 📄 pages/           # Páginas da aplicação
│   │   ├── auth/           # Login/Logout
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── entries/        # Gestão lançamentos
│   │   ├── reports/        # Relatórios
│   │   └── settings/       # Configurações
│   ├── 🪝 hooks/           # Custom hooks
│   ├── 🔌 services/        # APIs e integrações
│   │   ├── api/            # Clientes API
│   │   └── storage/        # Storage local
│   ├── 🛠️ utils/           # Funções utilitárias
│   │   ├── formatters/     # Data, moeda, etc
│   │   └── validators/     # Validação dados
│   ├── 🌍 context/         # Estado global
│   ├── 🎨 assets/          # Imagens, ícones
│   ├── 📝 types/           # Tipos TypeScript
│   ├── App.jsx             # Componente principal
│   ├── index.jsx           # Entry point
│   └── routes.jsx          # Definição rotas
├── 📦 package.json         # Dependências npm
├── 🎨 tailwind.config.js   # Config Tailwind
├── ⚡ vite.config.js       # Config Vite
├── 🔍 .eslintrc.js         # Config linter
└── 🐳 Dockerfile          # Containerização
```

### **Diagrama de Arquitetura**
```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
│   📱 Frontend   │    │   🚀 Backend     │    │   🗄️ Database │
│   (React TS)   │◄──►│   (FastAPI)      │◄──►│  (PostgreSQL)  │
│   Port: 3000    │    │   Port: 8000     │    │   Port: 5432   │
└─────────────────┘    └──────────────────┘    └────────────────┘
        ▲                       ▲                       ▲
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
│  📦 Static CDN  │    │  🔐 OAuth APIs   │    │  ☁️ Backups    │
│  (Vercel/CDN)   │    │  (Google Auth)   │    │  (AWS S3)      │
└─────────────────┘    └──────────────────┘    └────────────────┘
```

---

## 🚀 **Funcionalidades**

### ✅ **Implementadas - Backend (atual)**
- 🔐 **Autenticação** (JWT + Google OAuth2 + Refresh Tokens)
- 👤 **Gestão de usuários** (CRUD completo)
- 📂 **Categorias** (receitas/despesas + subcategorias)
- 💰 **Lançamentos financeiros** (CRUD completo com validações)
- 🚖 **Campos de corrida**: platform, distance_km, duration_min, gross_amount, platform_fee, tips_amount, net_amount, shift_tag, city
- 📈 **Métricas corridas**: `/entries/metrics/daily` & `/entries/metrics/monthly` (gross, net, fee %, tips, km, horas, R$/km, R$/hora)
- 📊 **Dashboard** com resumos e estatísticas
- 🔍 **Filtros avançados** (data, tipo, categoria, valor)
- 📈 **Relatórios** (evolução e distribuição)
- 🛡️ **Segurança** (proteção OWASP Top 10)
- 🗄️ **Banco de dados** (SQLAlchemy + Alembic)

### ✅ **Implementadas - Frontend 70%**
- ⚛️ **React + TypeScript** configurado
- 🎨 **Tailwind CSS** para estilização responsiva
- 📱 **4/6 páginas** implementadas
- 📊 **Charts.js** para gráficos interativos
- 🔐 **Autenticação** integrada
- 🎯 **Dashboard** funcional
- 📋 **Listagem de lançamentos** com filtros

### 🔄 **Em Desenvolvimento Ativo**
- 🧪 **Testes frontend** (Jest + Testing Library)
- 📊 **Página de relatórios** avançados
- 📄 **Exportação PDF/CSV**
- 📱 **PWA** (Progressive Web App)
- 🎨 **Design responsivo** melhorado

### ⏳ **Planejadas - Roadmap**
- 🐳 **Docker** containerização completa
- ☁️ **Deploy produção** (Railway/Vercel)
- 🗄️ **PostgreSQL** migration
- 🔗 **APIs bancárias** (Open Banking)
- 📧 **Relatórios automáticos**
- 📱 **App móvel nativo**
- 📎 **Anexos** para lançamentos
- 🔔 **Notificações** e alertas

---

## 💻 **Stack Tecnológico**

### **Backend - FastAPI**
| Tecnologia | Versão | Justificativa |
|------------|--------|---------------|
| **FastAPI** | 0.95+ | Alta performance, tipagem, documentação automática |
| **SQLAlchemy** | 2.0+ | ORM moderno com suporte async |
| **Alembic** | Latest | Migrações de banco versionadas |
| **Pydantic** | 2.0+ | Validação de dados com tipagem |
| **JWT** | PyJWT | Autenticação stateless segura |
| **OAuth2** | Google | Autenticação social simplificada |
| **Pytest** | Latest | Framework de testes robusto |

### **Frontend - React**
| Tecnologia | Versão | Justificativa |
|------------|--------|---------------|
| **React** | 18+ | Library UI moderna e madura |
| **TypeScript** | 5+ | Tipagem estática e IntelliSense |
| **Tailwind CSS** | 3+ | CSS utility-first produtivo |
| **Chart.js** | 4+ | Gráficos interativos performantes |
| **React Hook Form** | Latest | Formulários otimizados |
| **Zod** | Latest | Validação de schemas TypeScript |
| **Vite** | Latest | Build tool rápido |

### **DevOps & Qualidade**
| Ferramenta | Uso |
|------------|-----|
| **Docker** | Containerização para desenvolvimento |
| **GitHub Actions** | CI/CD automático |
| **ESLint + Prettier** | Qualidade e formatação de código |
| **MyPy** | Verificação de tipos Python |
| **Coverage.py** | Cobertura de testes (99%) |

---

## 🔒 **Segurança & Conformidade**

### **Segurança Implementada**
- 🛡️ **Proteção OWASP Top 10** (injeção SQL, XSS, CSRF)
- 🔐 **Tokens JWT** com refresh automático
- 🔒 **OAuth2** com Google (sem senhas locais)
- 🧹 **Sanitização** de inputs e validação rigorosa
- ⚡ **Rate limiting** contra ataques de força bruta
- 🚫 **CSP** (Content Security Policy)

### **Privacidade & LGPD**
- ✅ **Conformidade LGPD** (Lei Geral de Proteção de Dados)
- 📋 **Política de privacidade** transparente
- ✋ **Consentimento explícito** para coleta de dados
- 📤 **Exportação** e exclusão de dados pessoais
- 🔒 **Criptografia** de dados sensíveis

---

## 🎯 **Próximos Passos - Roadmap 2025**

### **📅 Janeiro 2025 - Concluído ✅**
- ✅ **Limpeza de código** - 8 arquivos duplicados removidos
- ✅ **Melhoria testes** - Cobertura aumentada para 99%
- ✅ **Zero falhas** - 374/374 testes passando
- ✅ **Type safety** - Zero erros MyPy

### **📅 Esta Semana (27/05 - 03/06)**
1. 🧪 **Frontend Testing Setup** - Jest + Testing Library
2. 🎨 **Responsive Design Review** - Mobile optimization
3. 📊 **Reports Page** - Implementação completa

### **📅 Próximas 2 Semanas (04/06 - 17/06)**
1. 🐳 **Docker Setup** - Containerização completa
2. 🗄️ **PostgreSQL Migration** - Banco de produção
3. ☁️ **Deploy Staging** - Ambiente de teste

### **📅 Próximo Mês (Junho 2025)**
1. 📄 **Exportação PDF/CSV** - Relatórios para download
2. 📱 **PWA Implementation** - App instalável
3. 🔔 **Notificações** - Alertas financeiros
4. 🎯 **MVP 100%** - Meta: 30/06/2025

### **📅 Q3 2025 (Julho - Setembro)**
1. 📱 **App Móvel Nativo** - React Native
2. 🔗 **APIs Bancárias** - Open Banking integration
3. 📎 **Anexos** - Upload de comprovantes
4. 🤖 **IA Financeira** - Insights automáticos

### **📅 Q4 2025 (Outubro - Dezembro)**
1. 🏢 **Versão Empresarial** - Multi-usuários
2. 📧 **Relatórios Automáticos** - Email scheduling
3. 🌍 **Internacionalização** - Múltiplos idiomas
4. 💎 **Versão Premium** - Recursos avançados

*Para detalhes completos, consulte [📊 Progresso Consolidado](progresso_app.md)*

---

## 🏆 **Conquistas & Marcos Recentes**

### **🎉 Janeiro 2025**
- ✨ **Limpeza de código** - 8 arquivos duplicados removidos (15/01/2025)
- 📈 **99% cobertura** - Novo recorde de qualidade de testes
- 🔒 **Type safety** - Zero erros MyPy em 63 arquivos

### **🎉 Maio / Agosto 2025**
- 🎯 **Zero falhas** - 374/374 testes passando (25/05/2025)
- ⚡ **Backend 100%** - Todas as funcionalidades implementadas
- 🚀 **FastAPI** - 25+ endpoints funcionais
- 🛡️ **Segurança** - JWT + OAuth2 + Rate limiting

### **📊 Métricas Atuais (Sprint Motorista)**
- **Backend:** Modelo extendido + métricas de corrida ativas
- **Frontend:** Campos de corrida integrados (formulário, listagem, filtros plataforma/turno/cidade); dashboard de métricas ainda pendente
- **Testes:** 231/231 passando
- **Cobertura:** alta (executar pytest --cov para número preciso)
- **Type errors:** 0

---

## 🧪 **Qualidade & Testes**

### **Backend Testing (atual)**
```bash
cd backend
pytest --cov=app --cov-report=term-missing
# Esperado: 231 passed
```

### **Frontend Testing - Em Implementação**
```bash
cd frontend
npm test            # Testes unitários (em preparação)
```
Testes específicos Admin Panel:
```bash
npm run test:ci -- src/components/admin
```

### **Code Quality Tools**
- ✅ **MyPy** - Verificação de tipos Python
- ✅ **ESLint** - Linting JavaScript/TypeScript
- ✅ **Prettier** - Formatação automática
- ✅ **Black** - Formatação Python
- ✅ **Coverage.py** - Cobertura Python
- 🔄 **Husky** - Pre-commit hooks (em setup)

---

## 📞 **Desenvolvimento & Contribuição**

### **🛠️ Ambiente de Desenvolvimento**
```bash
# Setup completo do projeto
git clone <repo-url>
cd autonomo-control

# Backend setup
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
python run_server.py

# Frontend setup
cd ../frontend
npm install
npm start

# Executar testes
cd ../backend && pytest --cov=app
cd ../frontend && npm test
```

### **🔄 Fluxo de Desenvolvimento**
```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Feature   │   │   Commit &  │   │    Pull     │   │   Deploy    │
│   Branch    ├──►│    Push     ├──►│   Request   ├──►│   Staging   │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
                                                               │
┌─────────────┐   ┌─────────────┐   ┌─────────────┐            ▼
│   Deploy    │   │    User     │   │  Automated  │◄───┬─────────────┐
│ Production  │◄──┤ Acceptance  │◄──┤    Tests    │    │   Manual    │
└─────────────┘   └─────────────┘   └─────────────┘    │   Testing   │
                                                       └─────────────┘
```

### **📋 Estrutura de Branches**
- 🎯 `main` - Código em produção (stable)
- 🚀 `develop` - Próxima versão em desenvolvimento
- ⚡ `feature/*` - Funcionalidades em desenvolvimento
- 🔥 `hotfix/*` - Correções urgentes
- 🧪 `test/*` - Experimentos e POCs

### **✅ Padrões de Código**
- **Backend:** PEP 8 + MyPy + Black formatting
- **Frontend:** Airbnb Style Guide + ESLint + Prettier
- **Commits:** Conventional Commits (feat, fix, docs, etc.)
- **PRs:** Template com descrição detalhada e checklist

### **🏗️ Tecnologias para Portfolio**
Este projeto demonstra competência em:
- 🔐 **OAuth2 & JWT** - Autenticação moderna e segura
- 📊 **API RESTful** - Documentação automática Swagger/OpenAPI
- 🏗️ **Arquitetura em Camadas** - Separation of concerns
- 📝 **Tipagem Avançada** - TypeScript + Pydantic type safety
- 🎨 **Design Patterns** - Repository, Dependency Injection, Singleton
- 🧪 **Testing** - Unitários, integração e E2E (99% coverage)
- 🗄️ **Database Migrations** - Versionamento schema com Alembic
- 📱 **Frontend Responsivo** - Mobile-first design
- ♿ **Acessibilidade** - WCAG 2.1 AA compliant
- ⚡ **Performance** - Lazy loading, caching, optimizations

---

## 📈 **Métricas de Projeto**

### **📊 Status Geral**
- 📅 **Início:** 15 de maio de 2025
- 🎯 **MVP Meta:** 30 de junho de 2025
- 🚀 **Status:** Em desenvolvimento ativo
- 👥 **Equipe:** 1 desenvolvedor full-stack
- 📝 **Documentação:** 6 documentos consolidados

### **💻 Código**
- 📂 **Repositórios:** Backend + Frontend separados
- 📋 **Linhas de código:** ~15.000 (estimativa)
- 🧪 **Testes:** 374 testes automatizados
- 📊 **Coverage:** 99% backend, 0% frontend (em setup)
        - Frontend coverage parcial (admin hooks/componentes) disponível via `npm run test:ci`.
- 🔍 **Qualidade:** 0 erros MyPy, ESLint compliant

### **🏗️ Funcionalidades**
- ✅ **Backend APIs:** 25+ endpoints implementados
- ⚛️ **Frontend Pages:** 4/6 páginas completas
- 🔐 **Autenticação:** OAuth2 + JWT funcional
- 📊 **Dashboard:** Gráficos e métricas ativas
- 🗄️ **Database:** SQLAlchemy models + Alembic

---

**📅 Projeto iniciado:** 15 de maio de 2025
**🎯 MVP previsto:** 30 de junho de 2025
**🚀 Status:** Em desenvolvimento ativo

![Backend](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Frontend](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)

---

## 🧪 Checklist QA Painel Admin
Lista de verificação manual rápida antes de release.

### Preparação
- [ ] Variáveis `MASTER_EMAIL` e `MASTER_PASSWORD` definidas
- [ ] Usuário MASTER criado / promovido automaticamente
- [ ] Logar como MASTER e obter token JWT válido

### Cenários CRUD Usuários
- [ ] ADMIN consegue acessar `/admin/users`
- [ ] USER não consegue acessar (redirect/login ou 403)
- [ ] ADMIN cria novo USER (sucesso)
- [ ] ADMIN tenta criar ADMIN (falha 403)
- [ ] MASTER cria ADMIN com master password correta (sucesso)
- [ ] MASTER cria ADMIN com master password incorreta (erro exibido no modal)

### Alteração Role
- [ ] MASTER promove USER→ADMIN (toast sucesso)
- [ ] MASTER rebaixa ADMIN→USER (toast sucesso)
- [ ] ADMIN não vê botões promover/rebaixar

### Status / Ativação
- [ ] ADMIN desativa USER (status muda e toast sucesso)
- [ ] ADMIN tenta desativar ADMIN (botão ausente ou inoperante)
- [ ] MASTER desativa ADMIN (sucesso)
- [ ] Não é possível desativar MASTER
- [ ] Usuário inativo não autentica (login bloqueado)

### Segurança UI
- [ ] Master Password não persiste após fechar modal
- [ ] Ações múltiplas durante loading são bloqueadas (botões disabled)
- [ ] Sem chamadas indevidas contendo `X-Master-Key` para operações que não exigem

### Erros e Feedback
- [ ] Mensagem clara para master password inválida
- [ ] Mensagem clara para ação não permitida (403 genérico)
- [ ] Skeleton exibido no carregamento inicial
- [ ] Empty state exibido sem usuários

### Regressão Básica
- [ ] Dashboard continua acessível
- [ ] Fluxos de lançamentos (entries) intactos
- [ ] Logout funciona e limpa token

### Pós-Teste
- [ ] Atualizar plano (`PLANO_PAINEL_ADMIN.md`) com data da execução QA
- [ ] Registrar anomalias / bugs encontrados

---

## 📚 **Status da Documentação**

### ✅ **Unificação Concluída (30/05/2025)**

A documentação do projeto foi **completamente unificada e organizada**:

#### 🎯 **Estrutura Atual:**
- **📚 Documentação Principal:** `DOCUMENTACAO_UNIFICADA.md` (overview completo)
- **📊 Progresso Técnico:** `progresso_app.md` (detalhes de desenvolvimento)
- **🗂️ Arquivo Histórico:** `docs/historico/unificacao_30_05_2025/` (documentos consolidados)

#### ✅ **Documentos Organizados:**
- 9 documentos movidos para arquivo histórico
- Cross-references estabelecidos entre documentos
- Navegação simplificada implementada
- Status atualizado: **MVP 95% completo**

#### 🎯 **Benefícios da Unificação:**
- **Uma única fonte de verdade** para status do projeto
- **Navegação mais simples** entre documentos
- **Histórico preservado** para rastreabilidade
- **Informações atualizadas** com status real

### 📋 **Próxima Atualização:** Após conclusão do Frontend Testing Setup

---
