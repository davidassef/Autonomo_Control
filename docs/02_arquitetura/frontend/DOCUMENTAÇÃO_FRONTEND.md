# Documentação do Frontend - Autônomo Control

## Visão Geral

O frontend do Autônomo Control foi desenvolvido usando React com TypeScript para criar uma interface de usuário moderna, reativa e tipada. A aplicação permite aos profissionais autônomos gerenciar suas finanças de forma simples e eficiente, com recursos para cadastro de lançamentos financeiros, categorização, relatórios e análises.

## Estrutura de Diretórios

A estrutura do projeto segue o padrão recomendado para aplicações React modernas:

```
frontend/
├── public/               # Arquivos públicos acessíveis diretamente
├── src/                  # Código-fonte da aplicação
│   ├── components/       # Componentes reutilizáveis
│   ├── contexts/         # Contextos React para gerenciamento de estado global
│   ├── hooks/            # Hooks personalizados para lógica reutilizável
│   ├── pages/            # Componentes de página (rotas principais)
│   ├── services/         # Serviços para comunicação com a API
│   ├── types/            # Definições de tipos TypeScript
│   └── utils/            # Funções utilitárias
└── docs/                 # Documentação do frontend
```

## Tecnologias Utilizadas

- **React 18**: Biblioteca para construção de interfaces de usuário
- **TypeScript**: Superset de JavaScript com tipagem estática
- **React Router**: Gerenciamento de rotas e navegação
- **Axios**: Cliente HTTP para comunicação com a API
- **Tailwind CSS**: Framework CSS para estilização rápida e responsiva
- **React Context API**: Para gerenciamento de estado global

## Autenticação e Segurança

A autenticação é gerenciada através do `AuthContext`, que encapsula toda a lógica relacionada à autenticação, incluindo:

- Login com email/senha
- Login com Google OAuth2
- Registro de novos usuários
- Armazenamento seguro do token JWT
- Proteção de rotas autenticadas
- Interceptação de solicitações para adicionar o token de autenticação
- Tratamento automático de tokens expirados

## Principais Funcionalidades Implementadas

### Dashboard

O dashboard (`DashboardPage`) apresenta uma visão geral das finanças do usuário:

- Resumo de receitas e despesas do mês atual
- Saldo mensal calculado automaticamente
- Lista das transações mais recentes
- Links rápidos para gerenciamento de lançamentos

### Gerenciamento de Lançamentos

A página de lançamentos (`EntriesPage`) oferece funcionalidades completas para gerenciar lançamentos financeiros:

- **Listagem**: Visualização de todos os lançamentos com paginação
- **Filtragem**: Filtros por período, tipo (receita/despesa) e categoria
- **Adição**: Formulário para inclusão de novos lançamentos
- **Edição**: Alteração de lançamentos existentes
- **Exclusão**: Remoção de lançamentos com confirmação

#### Componentes da Tela de Lançamentos

1. **EntryList**: Componente responsável por exibir a lista de lançamentos, com opções para editar e excluir cada item.

2. **EntryFilters**: Componente de filtros que permite ao usuário filtrar lançamentos por:
   - Data inicial e final
   - Tipo (receita ou despesa)
   - Categoria

3. **EntryForm**: Formulário modal para adição e edição de lançamentos, com validações para garantir dados corretos.

## Integração com o Backend

A comunicação com o backend é gerenciada através de serviços especializados:

- **api.ts**: Configuração base do Axios com interceptores para autenticação
- **auth.ts**: Serviços relacionados à autenticação e gerenciamento de usuários
- **entries.ts**: Serviços para operações CRUD de lançamentos financeiros
- **categories.ts**: Serviços para operações CRUD de categorias

## Hooks Personalizados

Para encapsular lógicas complexas e reutilizáveis, foram implementados hooks personalizados:

- **useAuth**: Acesso ao contexto de autenticação
- **useEntries**: Gerenciamento de lançamentos financeiros (listagem, filtragem, adição, edição, exclusão)
- **useCategories**: Gerenciamento de categorias (listagem, filtragem, adição, edição, exclusão)

## Layout e Responsividade

O sistema foi desenvolvido seguindo o princípio "mobile-first", garantindo que a interface seja utilizável em dispositivos móveis e se adapte a diferentes tamanhos de tela:

- Menu lateral colapsável em dispositivos móveis
- Cards adaptáveis para diferentes tamanhos de tela
- Tabelas responsivas que se transformam em cards em telas menores
- Formulários otimizados para entrada de dados em dispositivos móveis e desktop

## Considerações sobre Performance

Para otimizar a performance da aplicação, foram adotadas as seguintes estratégias:

- Carregamento sob demanda de dados (filtros aplicados no servidor)
- Memoização de componentes e funções para evitar re-renderizações desnecessárias
- Feedback visual durante operações assíncronas (estados de carregamento)
- Tratamento adequado de erros com feedback ao usuário

## Próximos Passos

As próximas implementações planejadas para o frontend incluem:

1. Tela de gerenciamento de categorias
2. Integração completa com Google OAuth2
3. Aprimoramento dos componentes de formulário
4. Implementação de relatórios financeiros básicos
5. Adição de visualizações gráficas para métricas financeiras
