# 📌 Plano de Desenvolvimento Contínuo (PREVC)

Metodologia PREVC: **Planejar → Revisar → Executar → Commitar**. Documento vivo atualizado a cada ciclo.

## 🎯 Objetivo Geral (MVP)
Fornecer plataforma funcional de gestão financeira para autônomos com: cadastro de usuários, autenticação segura, lançamentos (receitas/despesas), categorias, dashboard com resumos mensais e distribuição por categoria.

---
## 🔁 Ciclo PREVC Atual (Sprint 01)
Período alvo: 1 semana a partir da data de criação.

### 1. Planejar
Backlog priorizado para esta iteração.
- [ ] Definir estrutura unificada de configuração (`settings` central) com suporte a ambientes (dev/test/prod)
- [ ] Criar `.env.example` (backend + frontend variáveis)
- [ ] Consolidar cobertura real de testes backend (gerar relatório atualizado) e registrar baseline
- [ ] Introduzir testes iniciais do frontend (renderização e fluxo de login) com Vitest/Jest
- [ ] Endpoint de healthcheck (`/api/v1/health`) com status DB e versão
- [ ] Revisar e remover arquivos/documentação duplicada (histórico) — mapear antes
- [ ] Adicionar script `make lint test` ou equivalente (Makefile / task runner)
- [ ] Configurar pipeline CI (GitHub Actions) para: lint + testes + build frontend
- [ ] Especificar padrão de versionamento (SemVer) e CHANGELOG inicial
- [ ] Documentar política de branches (ex: `main`, `develop`, `feature/*`)

### 2. Revisar (Critérios de Aceite / Definition of Done)
- [ ] CI executa automaticamente em PRs
- [ ] Healthcheck retorna JSON: `{\n  status, version, db: {connected}, time\n}`
- [ ] Testes frontend >= 3 testes básicos (LoginPage, Protected Route, Entries list mock)
- [ ] Backend tests passam 100% (baseline mantido ≥ baseline inicial)
- [ ] `.env.example` cobre todas variáveis obrigatórias sem segredos
- [ ] Lint sem erros críticos
- [ ] Documentação atualizada (README + este plano)

### 3. Executar (Tarefas Técnicas Granulares)
Backend:
- [ ] Criar módulo `backend/app/core/settings.py` centralizando config (Pydantic Settings)
- [ ] Implementar `/api/v1/health`
- [ ] Script `scripts/print_settings.py` para depuração (não versionar env)
- [ ] Remover duplicações de `security_fixed.py` etc., consolidar em `security.py`
- [ ] Atualizar docs arquitetura com novo fluxo config

Frontend:
- [ ] Adicionar Vitest ou Jest + React Testing Library
- [ ] Teste: render `LoginPage` + submissão mock
- [ ] Teste: `PrivateRoute` redireciona sem token
- [ ] Teste: mock entries service e render lista

DevOps / Qualidade:
- [ ] GitHub Action workflow: Python (lint+test), Node (build+test)
- [ ] Makefile ou `tasks.md` com comandos padronizados
- [ ] Adicionar `ruff` (lint/format) e/ou `black` + `isort`
- [ ] Configurar pre-commit hooks (opcional se tempo)

Documentação / Organização:
- [ ] `.env.example` criado (backend + frontend)
- [ ] Remover docs históricas redundantes (apenas consolidar link para arquivo histórico)
- [ ] Atualizar README com seção Healthcheck + CI status badge
- [ ] Adicionar CHANGELOG.md inicial

### 4. Commitar (Registro de Progresso)
Usar mensagens convencionais: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `ci:`.
Registrar no fim do ciclo um resumo em seção específica abaixo.

---
## 📊 Métricas a Acompanhar
- Cobertura backend (%)
- Nº testes frontend
- Tempo médio pipeline CI
- Bugs abertos vs fechados no ciclo
- Lead time PR (abertura → merge)

---
## 🧪 Baseline Inicial (pre-sprint)
- Testes backend: (atualizar após geração) — placeholder
- Cobertura backend: (baseline %) — placeholder
- Testes frontend: 0
- CI: não configurado

---
## ✅ Registro de Ciclos Concluídos
(Preencher ao finalizar Sprints)

| Ciclo | Data Início | Data Fim | Principais Entregas | Observações |
|-------|-------------|----------|----------------------|-------------|
| 01 | (preencher) | (preencher) | - | - |

---
## 📂 Backlog Futuro (Não no Ciclo Atual)
- Multi-tenant
- Exportação PDF / Relatórios avançados
- Backup automatizado + criptografia
- Monitoramento (Prometheus, Grafana, Sentry) implantação real
- Modo orçamento / metas mensais
- Integração bancária (open banking) – estudo
- Otimizações performance (lazy load / pagination avançada)

---
## 🔄 Como Atualizar Este Documento
1. Ao iniciar um ciclo: ajustar seções Planejar / Revisar / Executar.
2. Ao concluir uma tarefa: marcar checkbox.
3. Ao final do ciclo: preencher tabela de registro e mover itens não concluídos.
4. Commit dedicado: `docs(plan): update PREVC progress cycle X`.

---
## 🔐 Governança
- Revisões de PR exigem pelo menos 1 aprovação.
- Branch naming: `feature/`, `fix/`, `chore/`, `docs/`.
- Releases: tag `vMAJOR.MINOR.PATCH`.

---
## ⚠️ Riscos Atuais
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Ausência de CI | Falhas passam despercebidas | Priorizar workflow inicial |
| Sem testes frontend | Regressões UI | Adicionar testes mínimos já no ciclo 01 |
| Config dispersa | Erros de ambiente | Centralizar em settings Pydantic |
| Documentação divergente | Onboarding lento | Consolidar e limpar duplicados |

---
## 💬 Notas Rápidas
(Usar esta área para anotações de contexto rápidas durante execução.)

> Documento versionado: manter enxuto e atualizado.
