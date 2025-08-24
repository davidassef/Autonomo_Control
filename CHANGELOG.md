# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Adicionado
- Testes end-to-end com Playwright
- Scripts de correção automática de código
- Configuração completa do Supabase
- Sistema de roles RBAC (USER/ADMIN/MASTER)
- Mais de 300 testes unitários e de integração

### Alterado
- Migração completa de Vitest para Jest
- Padronização de IDs de `number` para `string`
- Interfaces `Entry`, `Category`, `SecurityQuestion` padronizadas
- Hooks `useAuth` e `useToast` com tipagem correta
- Frontend atualizado de 70% para 95% de completude
- MVP atualizado de 80% para 95% de completude

### Corrigido
- Resolvidos mais de 65 erros de TypeScript
- Correções em componentes de administração
- Correções em testes de autenticação
- Problemas de tipagem em hooks e serviços
- Erros de importação em arquivos de teste

### Removido
- Dependências do Vitest
- Código duplicado e não utilizado
- Arquivos de configuração obsoletos

## [2024-12-XX] - Versão Anterior

### Adicionado
- Sistema base de gestão financeira
- Autenticação com Google
- Dashboard principal
- Gestão de categorias e lançamentos
- API FastAPI completa
- Interface React com Tailwind CSS

### Implementado
- Backend FastAPI com estrutura modular
- Frontend React com componentes reutilizáveis
- Sistema de autenticação JWT
- Banco de dados SQLite/Supabase
- Testes básicos de API