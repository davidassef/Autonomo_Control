# 📌 Plano de Desenvolvimento Contínuo (PREVC)

Metodologia PREVC: **Planejar → Revisar → Executar → Commitar**. Documento vivo focado no app de controle financeiro para motoristas de aplicativo (ex: Uber, 99, etc.).

## 🎯 Visão do Produto
Aplicativo central para motoristas autônomos registrarem corridas, ganhos, taxas e despesas operacionais, produzindo métricas chave: lucro líquido, custo por km, ganho por hora, eficiência por plataforma e evolução diária/semanal/mensal.

## 🧪 Situação Atual (Base Existente)
- Backend: CRUD genérico de lançamentos (INCOME/EXPENSE) com categorias e sumários simples.
- Frontend: Dashboard básico de receitas/despesas, categorias e lançamentos.
- Falta: Campos específicos de corrida (km, duração, plataforma, taxas), granularidade por viagem, relatórios direcionados ao motorista.

## 🧱 GAP PRINCIPAIS
1. Modelo Entry sem atributos de corrida.
2. Ausência de entidade "Trip" (corrida) ou distinção de tipo de lançamento (ex: corrida vs despesa fixa).
3. Sem cálculo automático de métricas derivadas (R$/km, R$/hora, lucro líquido após custos variáveis).
4. Categorias genéricas — necessidade de taxonomia orientada a motorista (Combustível, Manutenção, Lavagem, Taxa Plataforma, Pedágio, Alimentação em Turno, Seguro, Depreciação estimada).
5. Relatórios temporais (dia/semana/mês) e comparativos ainda ausentes.
6. Futuros: importação semiautomática (CSV export das plataformas), estimativa de impostos (INSS / MEI), metas e alertas.

## 🗃️ Evolução de Modelo de Dados (Proposta)
Extender `Entry` ou criar `Trip` separado. Estratégia inicial: adicionar campos opcionais a Entry para acelerar, migrando para tabela própria se complexidade crescer.

Novos campos (Entry) sugeridos:
- `platform` (String) – UBER, 99, INDRIVE, OUTRA
- `distance_km` (Float)
- `duration_min` (Integer)
- `gross_amount` (Float) – valor bruto recebido da plataforma
- `platform_fee` (Float) – taxa retida
- `tips_amount` (Float) – gorjetas
- `net_amount` (Float) – (gross_amount + tips_amount - platform_fee) (pode ser calculado)
- `vehicle_id` (String nullable) – referência futura a veículo
- `shift_tag` (ENUM/Multi) – MANHA, TARDE, NOITE, MADRUGADA
- `city` (String)

Para despesas vinculadas a operação:
- `is_trip_expense` (Boolean) – se despesa diretamente atribuível a corrida específica
- `linked_entry_id` (String) – referencia cruzada (ex: pedágio específico)

Alternativa futura: criar tabela `trips` e deixar `entries` apenas para agregados e despesas gerais.

## � Métricas MVP Prioritárias
- Ganho bruto diário/mensal por plataforma.
- Taxa média de plataforma (% = platform_fee / gross_amount).
- Lucro líquido (net_amount - despesas variáveis proporcionais - rateio de fixas/hora ou km).
- Custo operacional por km (combustível + manutenção + depreciação estimada / km).
- Rendimento por hora (net / horas ativas).
- Distribuição de tipos de despesas.

## 🔁 Ciclo PREVC Atual (Sprint 01 – Especialização para Motorista)
Objetivo: Introduzir campos de corrida + tela de registro de corrida + dashboard básico de métricas.

### 1. Planejar (Backlog Sprint 01)
- [x] Definir escolha: extender Entry (fase 1) — aprovado
- [x] Criar migração Alembic adicionando campos novos
- [x] Atualizar modelo SQLAlchemy e schemas Pydantic
- [x] Serviços: lógica para calcular `net_amount` se não enviado
- [x] Endpoints: permitir filtro por plataforma, intervalo data, cidade, turno
- [x] Endpoint extra: `/entries/metrics/daily` e `/entries/metrics/monthly`
- [x] Seed categorias padrão motorista (combustível, pedágio, manutenção, etc.)
- [x] Frontend: Formulário de nova corrida (com campos específicos)
- [x] Frontend: Tabela de corridas recentes + filtros (data inicial/final, plataforma/turno/cidade)
- [ ] Frontend: Dashboard métricas (cards: Bruto, Taxas, Líquido, R$/km, R$/hora)
- [x] Atualizar README (escopo motorista) + este plano

### 2. Revisar (Critérios de Aceite / DoD)
- [ ] Migração aplica e reverte sem erro
- [ ] Novos campos aparecem no response (EntryInDB)
- [ ] Cálculo de `net_amount` testado (unit > 3 casos: com/sem tips, sem fee)
- [ ] Filtros retornam dados corretos (testes de integração)
- [ ] Dashboard exibe métricas com base em mocks quando vazio (zero states) e dados reais
- [ ] Performance: lista de 500 corridas < 400ms (local sqlite) — teste simples
- [ ] Documentação de API atualizada (OpenAPI reflete novos campos)

### 3. Executar (Tarefas Técnicas Granulares)
Backend:
- [x] Criar revisão de `Entry` adicionando colunas (script + Alembic)
- [x] Atualizar `EntryBase` / `EntryCreate` / `EntryUpdate` com validações (ex: distance_km > 0 quando presente)
- [x] Adicionar enum plataformas em `custom_types` (ou const)
- [x] Novo router ou expandir `entries` com rota `/entries/metrics/daily` & `/entries/metrics/monthly`
- [x] Função agregadora (CTEs ou GROUP BY por dia, plataforma)
- [x] Testes unit: validações de schema e agregações
- [x] Testes integração: criação corrida, listagem filtrada

Frontend:
- [x] Atualizar tipo `Entry` em `src/types`
- [x] Formulário de corrida (condicional: se type=INCOME exibir campos de corrida)
- [x] Hooks: `useEntries` aceitar novos filtros (platform, shift, city)
- [ ] Dashboard: criar componentes de métricas e gráficos básicos (linha diária, pizza despesas)

Dados / Seeds:
- [x] Script seed categorias padrão
- [x] Script gerar 50 corridas fictícias para testes locais

Qualidade:
- [ ] Atualizar cobertura alvo (≥ baseline anterior)
- [ ] Verificar regressão endpoints antigos

Documentação:
- [x] README seção "Modelo de Dados Estendido" (incluído resumo campos corrida)
- [x] Atualizar este plano marcando concluído conforme avança

### 4. Commitar (Padrões)
Commits exemplo:
`feat(model): extend Entry with ride-specific fields`
`feat(api): daily metrics endpoint`
`feat(frontend): trip creation form`
`chore(data): seed driver categories`
`docs: update readme driver domain`

## 📊 Métricas a Acompanhar (Sprint 01)
- Nº corridas registradas
- R$/km médio (net / soma km) — baseline
- R$/hora médio (net / horas) — baseline
- % taxa plataforma média
- Cobertura testes backend (%)

## 🧪 Baseline Inicial (antes Sprint 01)
- Campos específicos: inexistentes
- Métricas por dia: inexistentes
- Cobertura backend: (ver relatório) — registrar
- Testes frontend específicos: 0

## ✅ Registro de Ciclos Concluídos
| Ciclo | Data Início | Data Fim | Entregas | Observações |
|-------|-------------|----------|----------|-------------|
| 01 | 2025-08-09 | (em andamento) | Extensão modelo + métricas básicas + UI corrida parcial | Dashboard métricas pendente |

## 📂 Backlog Futuro (Priorizar Próximos Sprints)
- Importação CSV/Excel de extratos da plataforma
- Estimador de depreciação por km (parâmetro configurável)
- Cálculo de custo combustível (consumo médio × preço médio)
- Metas mensais (lucro líquido alvo, horas, km)
- Alertas (ex: taxa plataforma > X%, custo/km acima meta)
- Modo offline PWA (cache local)
- Multi-veículo e rateio de custos
- Exportação de relatórios (PDF/CSV)
- Suporte multi-moeda / ajuste inflação

## 🔄 Atualização do Documento
Aplicar PREVC: atualizar seções a cada sprint; mover itens concluídos para registro; não excluir histórico.

## 🔐 Governança
- Branching: `feature/driver-*`, `feat/metrics-*`
- Code review mínimo 1 aprovação
- Migrações: uma por conjunto lógico de alterações, sempre com downgrade válido

## ⚠️ Riscos Atuais
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Aumento de complexidade do Entry | Dificultar queries | Migrar para tabela trip se >12 colunas extras |
| Cálculos incorretos de métricas | Decisões erradas do usuário | Tests de agregação + casos limites |
| Performance em agregações | Dashboard lento | Índices (date, platform, type) e caching leve |
| Falta de dados de km/duração | Métricas distorcidas | Permitir estimativa e destacar incompletos |

## 💬 Notas Rápidas
> Plano corrigido após engano de pivot. Foco 100% domínio motorista de app.

