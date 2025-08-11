# 🛡️ Plano de Implementação – Painel Admin & Controle de Acesso Avançado

> Documento vivo: funciona simultaneamente como PLANO (o que será feito) e RELATÓRIO (o que já foi feito). Sempre que uma etapa for concluída marque a checkbox e adicione uma entrada em "18. Log de Progresso".

## 🔍 Visão Rápida (Status Atual)
| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Migração + role + claims + dependências base | ✅ Concluída |
| 2 | Endpoints admin + master password | ✅ Concluída |
| 3 | Testes unidade + integração | ✅ Concluída (primeiro lote) |
| 4 | Atualização README + exemplos | ✅ Concluída |
| 5 | Frontend básico admin | 🟡 Em andamento |
| 6 | Audit log + UI | ⬜ Pendente |

Última atualização: 2025-08-10 (Início detalhamento frontend admin)

## 1. Objetivo
Introduzir um sistema de administração hierárquico com uma **conta mestra (MASTER)** capaz de criar/gerenciar contas **ADMIN**, que por sua vez podem gerenciar usuários **USER**. Adicionar proteção extra às rotas de criação/alteração sensíveis exigindo um **MASTER PASSWORD**.

## 2. Escopo (Fase 1)
Incluído nesta fase:
- Campo `role` no modelo `User` (`MASTER`, `ADMIN`, `USER`).
- Migração para adicionar campo e atribuir valor inicial.
- Inclusão do `role` no JWT.
- Dependências de autorização: `require_admin`, `require_master`.
- Proteção de endpoints de criação/promoção com MASTER PASSWORD.
- Novo endpoint para criação de usuário com role definido.
- Endpoint para alterar role / ativar / desativar usuários.
- Definição de **MASTER PASSWORD** via variável de ambiente.
- Documento de arquitetura (este plano) + checklist de testes.

Fora desta fase (planejado para próximas):
- Audit log persistente.
- UI de painel admin no frontend.
- Rate limiting diferenciado.
- 2FA para MASTER.

## 3. Modelagem
### 3.1. Tabela `users`
Adicionar coluna:
- `role`: `String`, not null, default `'USER'`.

### 3.2. Enum
Não obrigatório criar ENUM físico agora (SQLite), mas em PostgreSQL futuro pode virar `ENUM user_role`. No código utilizar `Literal['MASTER','ADMIN','USER']` ou `Enum` Python.

### 3.3. Migração (pseudo)
```python
# upgrade
op.add_column('users', sa.Column('role', sa.String(), nullable=True))
op.execute("UPDATE users SET role='USER' WHERE role IS NULL")
op.alter_column('users', 'role', nullable=False)
# downgrade
op.drop_column('users', 'role')
```

## 4. Variáveis de Ambiente
Adicionar ao `.env.example`:
```
MASTER_EMAIL=admin@dominio.com
MASTER_PASSWORD=defina-uma-senha-forte
```
Observação: Se existir usuário com `email==MASTER_EMAIL`, promover para `MASTER` na inicialização (script inicial / seed). Caso não exista, criar.

## 5. Segurança Adicional – MASTER PASSWORD
### 5.1. Motivação
Mesmo que o JWT esteja comprometido, exigir o `MASTER_PASSWORD` em operações de alto impacto reduz risco.

### 5.2. Mecanismo
- Cabeçalho: `X-Master-Key: <senha>`.
- Validação somente para rotas sensíveis (criar admin, promover, alterar role, reset crítico).
- Comparação constante (usar `hmac.compare_digest`).
- Futuro: armazenar hash (ex: bcrypt) em vez de valor puro no `.env`.

### 5.3. Middleware/Dependência
```python
def require_master_password(request: Request):
    provided = request.headers.get('X-Master-Key')
    expected = settings.MASTER_PASSWORD
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=403, detail='Master password inválida')
```

## 6. Autorização – Matriz de Acesso
| Ação / Recurso                  | USER | ADMIN | MASTER |
|---------------------------------|------|-------|--------|
| Listar usuários                 | ❌   | ✅    | ✅     |
| Criar usuário USER              | ❌   | ✅    | ✅     |
| Criar usuário ADMIN             | ❌   | ❌    | ✅ (master pwd) |
| Promover USER → ADMIN           | ❌   | ❌    | ✅ (master pwd) |
| Rebaixar ADMIN → USER           | ❌   | ❌    | ✅ (master pwd) |
| Desativar USER                  | ❌   | ✅    | ✅     |
| Desativar ADMIN                 | ❌   | ❌    | ✅ (master pwd) |
| Desativar MASTER                | ❌   | ❌    | ❌     |
| Alterar role MASTER             | ❌   | ❌    | ❌     |

## 7. Endpoints Planejados (Nova Área `/api/v1/admin`)
| Método | Rota                              | Descrição | Proteção |
|--------|-----------------------------------|-----------|----------|
| GET    | `/admin/users`                    | Lista filtrável (role, ativo) | ADMIN+ |
| POST   | `/admin/users`                    | Cria usuário (USER ou ADMIN)  | ADMIN+ (ADMIN só cria USER; ADMIN→MASTER proibido; ADMIN não cria ADMIN) |
| PATCH  | `/admin/users/{id}/role`          | Altera role (USER⇄ADMIN)      | MASTER + MASTER PASSWORD |
| PATCH  | `/admin/users/{id}/status`        | Ativa/Desativa usuário        | ADMIN+ (ADMIN não desativa ADMIN/MASTER) |
| GET    | `/admin/users/{id}`               | Detalhe                        | ADMIN+ |

(Atual POST `/users/` pode ser mantido como fluxo público restrito, ou movido para `/admin/users`).

## 8. Fluxos Principais
### 8.1. Bootstrapping
1. Rodar migração.
2. Verificar `MASTER_EMAIL`.
3. Se não existir -> criar user com role MASTER.
4. Se existir e não for MASTER -> atualizar role.

### 8.2. Criação Usuário ADMIN
1. Requisição POST `/admin/users` com body `{email,name,role:"ADMIN"}`.
2. Verificar `current_user.role == MASTER`.
3. Verificar header `X-Master-Key`.
4. Persistir.

### 8.3. Promoção USER→ADMIN
1. PATCH `/admin/users/{id}/role` body `{role:"ADMIN"}`.
2. Validar MASTER + header.
3. Atualizar.

### 8.4. Desativar Usuário
1. PATCH `/admin/users/{id}/status` body `{is_active:false}`.
2. ADMIN pode desativar USER.
3. MASTER pode desativar USER ou ADMIN (não MASTER).

## 9. Checklist de Implementação Detalhado

### Fase 1 – Fundamentos de Role & Claims
- [x] Criar migration `xxxx_add_role_to_users.py`
- [x] Adicionar coluna `role` no modelo `User`
- [x] Atualizar schemas (`UserInDB`, `User`) adicionando `role`
- [x] Incluir `role` no payload do JWT
- [x] Função bootstrap/promoção MASTER por `MASTER_EMAIL`
- [x] Ajustar seed para criar/promover MASTER

### Fase 2 – Autorização & Endpoints Admin
- [x] Dependências `get_current_admin` e `get_current_master`
- [x] Dependência `require_master_password`
- [x] Router `admin_users` criado (`app/api/v1/admin_users.py`)
- [x] Endpoint GET `/admin/users`
- [x] Endpoint POST `/admin/users` (criar USER / ADMIN com regras)
- [x] Endpoint PATCH `/admin/users/{id}/role`
- [x] Endpoint PATCH `/admin/users/{id}/status`
- [x] Adicionar router admin em `api/v1/__init__.py`

### Fase 3 – Testes
- [x] Test bootstrap MASTER
- [x] Test acesso negado USER em rota admin
- [x] Test ADMIN cria USER
- [x] Test ADMIN tenta criar ADMIN (403)
- [x] Test MASTER cria ADMIN (com header)
- [x] Test promoção USER→ADMIN (MASTER + header)
- [x] Test desativação USER (ADMIN)
- [x] Test ADMIN tenta desativar ADMIN (403)
- [x] Test MASTER desativa ADMIN
- [x] Test login bloqueado para inativo
- [x] Test master password incorreta (403)

### Fase 4 – Documentação
- [x] Atualizar `.env.example` (MASTER_EMAIL / MASTER_PASSWORD)
- [x] Exemplos curl atualizados
- [x] Adicionar seção Roles & Admin ao README
- [x] Notas de segurança (não expor master password)

### Fase 5 – Frontend Básico Admin
- [x] Guard de rota admin (role based) no router
- [x] Serviço API admin (`listUsers`, `createUser`, `changeRole`, `changeStatus`)
- [x] Página `/admin/users` com tabela (email, nome, role, status, ações)
- [x] Ação criar USER
- [x] Ação criar ADMIN (exibir modal para master password)
- [x] Toggle ativar/desativar (respeitando regras)
- [x] Promoção / Rebaixamento (botão condicionado ao role atual)
- [x] Exibição badges de role
- [x] Mensagens de erro amigáveis (403 / master password inválida)
 - [x] Loading e estados vazios

### Fase 5 – Frontend Básico
- [ ] Guard de rota admin (verificar `role`)
- [ ] Página listagem usuários
- [ ] Ações básicas (criar USER, toggle ativo)
- [ ] Indicação de permissões (badges)

### Fase 6 – Audit & Hardening (Posterior)
- [ ] Tabela `audit_logs`
- [ ] Registro de ação crítica
- [ ] Visualização básica logs
- [ ] Hash de `MASTER_PASSWORD`
- [ ] Rate limiting rotas admin

### Operacional / Qualidade
- [ ] Script de reset seguro (opcional)
- [ ] Revisão de segurança final
- [ ] Atualizar este plano (todas as seções checadas)

### Meta de Conclusão Inicial
Meta Fases 1–4: +3 dias corridos após início.

## 10. JWT & Claims
Adicionar `role` ao payload:
```python
access_token = create_access_token(data={"sub": user.email, "user_id": user.id, "role": user.role})
```
Validação nas dependências para extrair role e colocar em `request.state.current_user` (ou retornar objeto).

## 11. Tratamento de Erros Padronizado
| Código | Motivo | Mensagem |
|--------|--------|----------|
| 400    | Regras de negócio | `Email já cadastrado` |
| 401    | Token inválido    | `Token inválido ou expirado` |
| 403    | Sem permissão     | `Ação não permitida` |
| 403    | Master password   | `Master password inválida` |
| 404    | Usuário não encontrado | `Usuário não encontrado` |

## 12. Testes Planejados
### 12.1. Unidade
- Dependências `get_current_admin/get_current_master`.
- Validação `require_master_password`.
- Função bootstrap master.

### 12.2. Integração
- Criação MASTER automática.
- ADMIN criando USER (200) / tentando criar ADMIN (403).
- MASTER criando ADMIN (201) com header correto / sem header (403).
- Promoção USER→ADMIN (MASTER + header).
- Desativação: ADMIN desativa USER (200); ADMIN tenta desativar ADMIN (403); MASTER desativa ADMIN (200).
- Login bloqueado para inativo.

### 12.3. Segurança
- Acesso sem token → 401.
- Token USER acessa rota admin → 403.
- Reutilização de master password errada → 403.

## 13. Roadmap Incremental
| Fase | Conteúdo | Entrega |
|------|----------|---------|
| 1 | Migração + role + claims + dependências | Dia 1 |
| 2 | Endpoints admin + proteção master password | Dia 2 |
| 3 | Testes (unidade + integração) | Dia 3 |
| 4 | Documentação README + exemplos curl | Dia 3 |
| 5 | Frontend (listagem + ações básicas) | Dia 5 |
| 6 | Audit log + UI | Pós estabilização |

## 14. Riscos & Mitigações
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Exposição MASTER_PASSWORD | Alto | Usar variável e evitar logar valor |
| Promoção indevida | Médio | Gate MASTER + header + testes |
| Token antigo sem claim role | Baixo | Forçar logout ao detectar ausência de claim |
| Esquecimento master password | Médio | Procedimento de reset via acesso direto DB |

## 15. Futuras Extensões
- Hash do MASTER_PASSWORD (armazenar `MASTER_PASSWORD_HASH`).
- Suporte a refresh tokens com revogação.
- RBAC dinâmico (tabela `roles` e `permissions`).
- Auditoria detalhada (JSON diff de alterações).
- Notificação por email para ações críticas.

## 16. Exemplos de Uso (curl)
```bash
# Criar usuário USER (ADMIN ou MASTER)
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  https://localhost:8000/api/v1/admin/users \
  -d '{"email":"user1@example.com","name":"User 1","role":"USER"}'

# Criar usuário ADMIN (MASTER + master password)
curl -X POST \
  -H "Authorization: Bearer <MASTER_TOKEN>" \
  -H "X-Master-Key: $MASTER_PASSWORD" \
  -H "Content-Type: application/json" \
  https://localhost:8000/api/v1/admin/users \
  -d '{"email":"admin2@example.com","name":"Admin 2","role":"ADMIN"}'

# Promover USER → ADMIN
curl -X PATCH \
  -H "Authorization: Bearer <MASTER_TOKEN>" \
  -H "X-Master-Key: $MASTER_PASSWORD" \
  -H "Content-Type: application/json" \
  https://localhost:8000/api/v1/admin/users/<USER_ID>/role \
  -d '{"role":"ADMIN"}'

# Desativar usuário
curl -X PATCH \
  -H "Authorization: Bearer <ADMIN_OR_MASTER_TOKEN>" \
  -H "Content-Type: application/json" \
  https://localhost:8000/api/v1/admin/users/<USER_ID>/status \
  -d '{"is_active":false}'
```

## 17. Próximos Passos (Ação)
1. Criar migração `add_role_to_users`.
2. Atualizar modelo + schemas.
3. Adicionar claims no JWT.
4. Implementar dependências de autorização.
5. Implementar rotas admin.
6. Adicionar validação master password.
7. Escrever testes.
8. Atualizar README.

---
**Status:** Documento inicial aprovado → seguir para implementação Fase 1.

## 18. Log de Progresso
| Data/Hora (UTC) | Fase | Item | Ação | Resultado | Autor |
|-----------------|------|------|------|-----------|-------|
| 2025-08-09T00:00Z | - | plano | Plano criado | Documento base aprovado | dev |
| 2025-08-09T00:10Z | 1 | migration | Criar migration role | concluído | dev |
| 2025-08-09T00:11Z | 1 | model | Campo role adicionado ao modelo | concluído | dev |
| 2025-08-09T00:12Z | 1 | schema | Schemas atualizados com role | concluído | dev |
| 2025-08-09T00:13Z | 1 | jwt | Claim role adicionada ao token | concluído | dev |
| 2025-08-09T00:14Z | 1 | bootstrap | Startup promove/cria MASTER | concluído | dev |
| 2025-08-09T00:30Z | 2 | deps | Dependências admin/master + master password | concluído | dev |
| 2025-08-09T00:35Z | 2 | endpoints | CRUD admin users implementado | concluído | dev |
| 2025-08-09T00:45Z | 2 | router | Router admin incluído no aggregator | concluído | dev |
| 2025-08-09T00:55Z | 3 | tests | Testes integração admin users criados | concluído | dev |
| 2025-08-09T01:00Z | 1 | seed | Seed ajustado para MASTER | concluído | dev |
| 2025-08-09T01:05Z | 4 | readme | Início atualização README (roles) | em andamento | dev |
| 2025-08-09T01:10Z | 4 | readme | README roles + segurança finalizado | concluído | dev |
| 2025-08-09T01:12Z | 5 | kickoff | Iniciada implementação frontend admin | em andamento | dev |
| 2025-08-10T00:05Z | 5 | design | Estrutura inicial componentes admin definida | em andamento | dev |
| 2025-08-10T00:15Z | 5 | api | Especificação detalhada service API admin frontend | em andamento | dev |
| 2025-08-10T00:25Z | 5 | ux | Regras de exibição estados (loading/empty/error) documentadas | em andamento | dev |
| 2025-08-10T02:10Z | 5 | impl | Hook useAdminUsers + componentes base criados | concluído | dev |
| 2025-08-10T02:20Z | 5 | page | Página admin refatorada para novos componentes | concluído | dev |
| 2025-08-10T02:35Z | 5 | tests | Testes unitários iniciais hook e componentes | concluído | dev |
| 2025-08-10T02:55Z | 5 | ui | Skeletons + empty state + toast global | concluído | dev |
| 2025-08-10T03:05Z | 5 | tests | Testes adicionais tabela e master password erro | concluído | dev |
| 2025-08-10T03:15Z | 5 | hardening | Desabilitação ações (self/master) na UI | concluído | dev |

Legenda Ação: criado / atualizado / concluído / bloqueado. Preencher sempre imediatamente após cada avanço.

---

## 19. Detalhamento Frontend Admin (Fase 5)
### 19.1. Objetivo Específico
Fornecer interface mínima porém robusta para administração de usuários (CRUD restrito + promoções / desativações) com feedback claro de autorização e segurança (uso do master password quando requerido).

### 19.2. Stack Considerada
- Framework: (assumido) React + TypeScript (confirmar: já há `tsconfig.json` e Tailwind).
- Estilização: TailwindCSS + componentes utilitários leves.
- State global: Context API simples ou Zustand (avaliar necessidade – escopo pequeno → Context + hooks custom).
- HTTP: fetch wrapper com interceptors para token / handling 401/403.

### 19.3. Estrutura de Pastas Proposta (incremental)
```
frontend/src/
  api/
    http.ts              # base fetch wrapper
    adminUsers.ts        # funções chamadas admin
  auth/
    authContext.tsx      # contexto com user + role + token
    useRequireRole.ts    # hook guard
  components/admin/
    UserTable.tsx
    UserRow.tsx
    RoleBadge.tsx
    StatusToggle.tsx
    CreateUserModal.tsx
    MasterPasswordPrompt.tsx
    PromoteDemoteButton.tsx
    EmptyState.tsx
    ErrorState.tsx
  pages/admin/
    UsersPage.tsx
  hooks/
    useAdminUsers.ts     # composição: listagem + refresh + ações
```

### 19.4. Contrato API (Frontend → Backend)
| Ação | Método / Rota | Body | Headers Especiais | Resposta Esperada |
|------|---------------|------|-------------------|-------------------|
| Listar usuários | GET /api/v1/admin/users?role&active | - | Auth | 200 [{id,email,name,role,is_active,created_at}] |
| Criar USER | POST /api/v1/admin/users | {email,name,role:'USER'} | Auth | 201 objeto usuário |
| Criar ADMIN | POST /api/v1/admin/users | {email,name,role:'ADMIN'} | Auth + X-Master-Key | 201 |
| Alterar role | PATCH /api/v1/admin/users/{id}/role | {role} | Auth + X-Master-Key | 200 usuário atualizado |
| Alterar status | PATCH /api/v1/admin/users/{id}/status | {is_active} | Auth | 200 |
| Detalhe | GET /api/v1/admin/users/{id} | - | Auth | 200 |

### 19.5. Estados de Carregamento
- Loading inicial tabela: skeleton rows (3–5) ou spinner central.
- Empty (sem usuários filtrados): componente `EmptyState` com CTA "Criar usuário" quando permissão.
- Erro network (>=500): `ErrorState` com botão retry.
- 401: forçar logout → redirect login.
- 403: exibir toast "Ação não permitida" (mensagem backend) + bloquear botão.
- Master password inválida: modal permanece aberto; campo master password recebe estado de erro e é limpo.

### 19.6. Regras de UI Condicionais
- Botão "Criar Admin" somente visível se `currentUser.role==='MASTER'`.
- Botão promoção visível se target USER e current MASTER.
- Botão rebaixar visível se target ADMIN e current MASTER.
- Toggle ativo desabilitado para o próprio usuário logado e para MASTERs alvo.
- Ao promover/demover: otimistic loading (desabilitar linha) e refresh.

### 19.7. Feedback / Toaster
Usar um provedor simples (ex: contexto) ou biblioteca leve. Mensagens:
- Sucesso criação: "Usuário criado" / "Admin criado".
- Sucesso promoção: "Usuário promovido".
- Sucesso desativação: "Usuário desativado" / "Usuário reativado".
- Erros 400: mostrar `detail`.
- Erros 403 master password: "Master password inválida".

### 19.8. Acessibilidade & i18n
- Labels textuais para ícones dos botões (aria-label: "Promover para Admin").
- Preparar estrutura para internacionalização futura (wrapper `t()` minimal).

### 19.9. Segurança Frontend
- Nunca persistir master password (campo input `type=password`, limpar ao fechar modal / após uso).
- Interceptar responses 401 e limpar tokens.
- Prevenir múltiplos envios simultâneos com disabled + loading spinners inline.

### 19.10. Métricas de Aceitação Fase 5 Minimum
- Listagem atualiza após qualquer mutação sem recarregar página.
- Erros 403 distintos (permissão vs master password) exibidos corretamente.
- Fluxo criar Admin exige master password sempre.
- Nenhuma chamada envia master password quando não estritamente necessário.

## 20. Hooks & Serviços – Especificação
### 20.1. `adminUsers.ts`
```
listUsers(params?: {role?: string; active?: boolean}): Promise<User[]>;
createUser(data: {email:string; name:string; role:'USER'|'ADMIN'} , masterKey?: string)
changeRole(id: string, role: 'USER'|'ADMIN', masterKey: string)
changeStatus(id: string, is_active: boolean)
```

### 20.2. `useAdminUsers`
Responsabilidades:
- Carregar lista.
- Expor `refresh()`.
- Expor ações: `createUser`, `createAdmin`, `promote`, `demote`, `toggleActive` com gestão otimista e rollback simples.
- State: `{users, loading, error, actionLoadingId}`.

### 20.3. Tratamento de Erros
Mapear `res.status` → chave interna:
- 400 => business
- 401 => auth (logout)
- 403 => forbidden / masterPassword
- 404 => notFound
- default => unknown

## 21. Estratégia de Testes Frontend
### 21.1. Unidade (Jest + Testing Library)
- Hooks: `useAdminUsers` (mock fetch) – cenários sucesso, 403, 401.
- Componente `CreateUserModal` (validação / submissão dupla bloqueada).
- Componente `MasterPasswordPrompt` (erro limpa campo).

### 21.2. Integração
- Página `UsersPage`: render listagem, promover usuário (mock endpoints), bloquear promoção sem master password.

### 21.3. E2E (Posterior / Opcional)
- Fluxo completo criar ADMIN (Playwright ou Cypress) – Fase 5.2 opcional.

### 21.4. Critérios de Cobertura
- 80% statements nos módulos frontend admin novos.

## 22. Pré-Design Audit Log (Fase 6 Preview)
### 22.1. Tabela Proposta `audit_logs`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| actor_user_id | UUID | Usuário que executou |
| action | String | ex: USER_PROMOTED |
| target_user_id | UUID? | Usuário alvo (se houver) |
| metadata | JSON | diffs / campos alterados |
| ip | String | IP origem |
| created_at | DateTime | Timestamp |

### 22.2. Ações Candidatas Iniciais
- USER_CREATED, ADMIN_CREATED, USER_PROMOTED, USER_DEMOTED, USER_DISABLED, USER_ENABLED, LOGIN_FAILED (crítico), MASTER_PASSWORD_FAILURE.

### 22.3. Endpoint Futuro
- GET `/api/v1/admin/audit?actor=&action=&target=&from=&to=` (MASTER somente).

### 22.4. Estratégia de Inserção
Wrapper serviço admin que registra dentro da mesma transação (quando suportado) ou best-effort após commit.

## 23. Riscos Atualizados (Revisão 2025-08-10)
| Risco | Novo? | Impacto | Mitigação Atual | Próxima Ação |
|-------|-------|---------|-----------------|--------------|
| UI expõe operações não permitidas (race cond.) | Sim | Médio | Checagem role backend + desabilitar UI durante mutação | Adicionar revalidação da lista pós-mutações |
| Master password digitada incorretamente múltiplas vezes | Sim | Baixo | Apenas feedback; sem lock ainda | Considerar contador e aviso após 5 falhas |
| Falta de testes de regressão UI | Sim | Médio | Plano testes definido | Implementar suíte Jest |

## 24. Próximos Passos Imediatos (Sequência Operacional)
1. Implementar `http.ts` + interceptors auth.
2. Criar `adminUsers.ts` com funções stub e tipagens.
3. Criar hook `useAdminUsers` (listagem + refresh básico).
4. Implementar `UsersPage` com tabela estática + integração hook.
5. Adicionar ações criar USER / toggle status.
6. Adicionar fluxo criar ADMIN com modal master password.
7. Adicionar promoção / rebaixamento.
8. Testes unidade hooks + componentes críticos.
9. Ajustes de UX (empty/error states).
10. Revisão de segurança (não vazamento master password em logs).

## 25. Marco de Conclusão Fase 5 Revisado
- Data alvo: T+5 dias do início geral (ajustar se dependências externas surgirem).
- Critério Done: Todos itens checklist Fase 5 marcados + cobertura >=80% nos módulos frontend novos + verificação manual fluxo completo MASTER.

---
Nota: Este incremento adiciona planejamento detalhado sem marcar tarefas como concluídas indevidamente. Atualizar o log conforme implementação avança.
