# 📌 Plano de Desenvolvimento Contínuo (PREVC)

Metodologia PREVC: **Planejar → Revisar → Executar → Commitar**. Documento vivo.

## 🎯 Nova Visão do Produto
Plataforma SaaS mínima para **conversão de voz falada em voz cantada estilizada / voice cloning** baseada em modelos de voice conversion (similar a experiências Applio/RVC) com UI minimalista inspirada em Kits AI.

### MVP (escopo enxuto)
1. Upload de áudio de voz fala (mono WAV/16k ou 44.1k)
2. Upload/seleção de modelo de voz treinado (slot de modelos)
3. Conversão assíncrona (job queue) com retorno de preview e download (WAV + MP3)
4. Gestão básica de modelos (listar, status: treinando / pronto / falhou)
5. Tela minimal (dark / clean) com histórico das últimas conversões
6. Autenticação (já existe base — adaptar para domínio de áudio)

### Pós-MVP imediato
- Fine-tuning rápido de voz (few-shot) com 1–5 minutos de dataset
- Ajustes de parâmetros (pitch shift, formant preserve, noise gate)
- Fila de processamento com prioridade por plano (futuro billing)
- Observabilidade: métricas de jobs (latência, tempo GPU, taxa sucesso)

## 🔍 Situação Atual do Repositório
Código atual é de gestão financeira (entries, categories, dashboard). **Não existe pipeline de áudio/ML**. Precisamos de pivot estrutural:
- Reaproveitar: autenticação, estrutura FastAPI, CORS, base frontend React
- Remover/Substituir gradualmente: modelos financeiros, páginas de finanças
- Introduzir novos domínios: `AudioJob`, `VoiceModel`, `DatasetSample`

## 🧱 Arquitetura Alvo (Alta Nível)
Backend (FastAPI):
- Módulo `audio/` com submódulos: `ingest`, `preprocess`, `inference`, `training`, `jobs`
- Fila: Celery ou RQ (redis) para processamento assíncrono (treino / conversão)
- Armazenamento de arquivos: local `storage/` (futuro S3)
- Model Registry simples: metadados em tabela + path do modelo (.pth / .onnx)
- Conversão: wrapper sobre pipeline (ex: RVC / so-vits-svc) — sem incorporar código de terceiros aqui; integrar via plugin adaptador

Frontend (React minimal):
- Páginas: Login, Dashboard (jobs recentes), Converter, Modelos, Treinar Novo Modelo
- Componente drag-n-drop para áudio
- Progresso de job via polling ou WebSocket

Fluxo de Conversão:
Upload áudio → validação → criar Job (status=queued) → worker processa (carrega modelo + extrai features + síntese) → armazena saída → atualiza status → frontend exibe/prepara download/player.

## 🗃️ Novas Entidades (Banco)
- `voice_models(id, name, base_type, status, path, created_at)`
- `audio_jobs(id, user_id, model_id, input_path, output_path, status, progress, params_json, created_at)`
- `datasets(id, user_id, model_id, path, duration_sec, created_at)` (para treino)

## 🔁 Ciclo PREVC Atual (Sprint 00 - Pivot)
Objetivo: Preparar base para features de áudio removendo ruído financeiro.

### 1. Planejar
Backlog priorizado desta pivot:
- [ ] Arquivar (mover para `legacy/finance/`) o código de domínio financeiro (models/schemas/API) sem deletar histórico
- [ ] Criar módulos vazios `backend/app/audio/{models,routers,services,workers}`
- [ ] Definir modelos SQLAlchemy iniciais (`VoiceModel`, `AudioJob`)
- [ ] Criar migração Alembic para novas tabelas
- [ ] Endpoint `POST /audio/jobs` (cria job stub) + upload de arquivo (multipart)
- [ ] Endpoint `GET /audio/jobs/{id}` (status + links)
- [ ] Serviço de armazenamento local (`storage_service.py`) para salvar input/output
- [ ] Worker simulado (placeholder) que marca job como completed após delay artificial
- [ ] Página frontend minimal `Convert` (upload + lista jobs)
- [ ] Página `Models` listando modelos fake (seed)
- [ ] Atualizar README e este plano refletindo pivot

### 2. Revisar (Criteria / DoD)
- [ ] Novos endpoints documentados no OpenAPI
- [ ] Upload até 15MB funcionando (validar mime + duração aproximada)
- [ ] Job ciclo completo (queued → processing → completed) com worker simulado
- [ ] Tabelas criadas e persistência funcional
- [ ] Dashboard antigo inacessível (link removido) para evitar confusão

### 3. Executar (Tarefas Técnicas Granulares)
Estrutura / Código:
- [ ] Criar pasta `backend/app/audio`
- [ ] `audio/models.py` (VoiceModel, AudioJob)
- [ ] `audio/schemas.py` (Pydantic) 
- [ ] `audio/routers.py` (jobs e modelos)
- [ ] `audio/services/jobs.py` (criação e atualização de status)
- [ ] `audio/services/storage.py` (salvar arquivo, gerar paths)
- [ ] Registrar rotas em `api/v1/__init__.py`
- [ ] Script seed modelos (`create_sample_models.py`)

Fila / Worker (fase simulada):
- [ ] Adicionar dependência Redis + simple RQ (ou fallback thread executor) – decisão
- [ ] Worker placeholder converte após `sleep(3)` e cria arquivo WAV dummy

Frontend:
- [ ] Criar rota `/convert`
- [ ] Componente Upload + chamada `POST /audio/jobs`
- [ ] Lista jobs (polling cada 3s)
- [ ] Player HTML5 quando `completed`

Documentação:
- [ ] Atualizar README visão do produto
- [ ] Adicionar seção Arquitetura de Áudio
- [ ] Atualizar PLANO_PREVC (este arquivo) marcando tarefas concluídas

### 4. Commitar
Commits pequenos e coerentes:
`chore(pivot): add audio module skeleton`
`feat(audio): create models & migrations`
`feat(audio): upload endpoint`
`feat(audio): job worker simulation`
`feat(frontend): convert page`
`docs: update readme pivot`

## 📊 Métricas a Acompanhar (Pivot)
- Tempo médio de conversão (simulado agora, real depois)
- Nº jobs por usuário
- Tamanho médio dos uploads

## 🧪 Baseline Inicial
- Áudio: inexistente
- Modelos: 0
- Jobs: 0
- Worker: não implementado

## ✅ Registro de Ciclos Concluídos
| Ciclo | Data Início | Data Fim | Entregas | Observações |
|-------|-------------|----------|----------|-------------|
| 00 | (preencher) | (preencher) | Pivot skeleton | - |

## 📂 Backlog Futuro
- Conversão real (integração pipeline RVC / ONNX export) via adaptador isolado
- Extração de features (f0, content vec) cacheadas
- Fine-tuning incremental (upload dataset + progress)
- Suporte GPU múltiplos workers
- Streaming progress (WebSocket)
- Filas com prioridade (planos pagos)
- Conversão em lote
- Modelo de autorização por quota
- Export MP3/FLAC + normalização loudness
- Log estruturado por job (JSON)

## 🔄 Atualização do Documento
Seguir PREVC a cada mudança estrutural. Atualizar checklists e mover entregas concluídas para a tabela.

## 🔐 Governança
- Branches: `pivot/audio-*` durante sprint 00
- Revisão obrigatória para código de worker / segurança arquivos
- Licenciamento: evitar incorporar código de terceiros proprietários (usar adaptadores isolados, citar upstream open-source conforme licença)

## ⚠️ Riscos Atuais
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Ausência de engine real | MVP sem valor para usuário final | Planejar integração mínima RVC fase 02 |
| Processamento pesado no request | Travar API | Obrigatório job assíncrono |
| Vazamento de arquivos | Problema privacidade | Sanitizar nomes, gerar UUID paths |
| Crescimento de storage | Custos / limpeza | Tarefas de expiração (cron) |
| Falta de GPU | Baixa qualidade/latência | Simulação inicial + planejar infra GPU |

## 💬 Notas Rápidas
> Este arquivo substitui plano anterior (finanças) – manter histórico no Git.

