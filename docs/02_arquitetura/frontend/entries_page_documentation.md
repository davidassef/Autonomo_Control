# Documentação da Tela de Lançamentos - Autônomo Control

## Visão Geral

A tela de lançamentos é uma das interfaces principais do sistema Autônomo Control, permitindo aos usuários visualizar, filtrar, adicionar, editar e excluir lançamentos financeiros (receitas e despesas). Esta tela foi implementada com foco na usabilidade e eficiência, seguindo as melhores práticas de desenvolvimento React e TypeScript.

## Estrutura de Arquivos

A implementação da tela de lançamentos é composta pelos seguintes arquivos:

```
frontend/
├── src/
│   ├── pages/
│   │   └── EntriesPage.tsx        # Página principal de lançamentos
│   ├── components/
│   │   ├── EntryList.tsx          # Componente de listagem
│   │   ├── EntryFilters.tsx       # Componente de filtros
│   │   └── EntryForm.tsx          # Formulário de adição/edição
│   ├── hooks/
│   │   └── useEntries.ts          # Hook personalizado para gerenciar lançamentos
│   ├── services/
│   │   └── entries.ts             # Serviço de comunicação com a API
│   └── types/
│       └── index.ts               # Definição dos tipos relacionados a lançamentos
```

## Componentes Principais

### 1. EntriesPage.tsx

Este é o componente principal que coordena a interação entre os diversos componentes da tela de lançamentos. Suas responsabilidades incluem:

- Gerenciamento de estado da página (modal aberto/fechado, lançamento selecionado)
- Coordenação da comunicação com a API através do hook `useEntries`
- Resposta às ações do usuário (adicionar, editar, excluir)
- Exibição de mensagens de erro/sucesso

Trecho de código relevante:

```tsx
const EntriesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    type: '' as '' | 'income' | 'expense',
    categoryId: '',
  });

  const {
    entries,
    isLoading,
    error,
    refreshEntries,
    addEntry,
    updateEntry,
    deleteEntry
  } = useEntries(filters);

  // Funções de manipulação de eventos...
};
```

### 2. EntryFilters.tsx

Componente responsável por exibir e gerenciar os filtros da listagem de lançamentos. Permite ao usuário:

- Filtrar por período (data inicial e final)
- Filtrar por tipo (receita ou despesa)
- Filtrar por categoria

A implementação utiliza formulários controlados para manter o estado dos filtros sincronizado com a interface do usuário.

### 3. EntryList.tsx

Componente que renderiza a lista de lançamentos com base nos filtros aplicados. Características principais:

- Exibição das informações principais de cada lançamento (data, descrição, categoria, valor)
- Diferenciação visual entre receitas e despesas (cores e ícones)
- Botões de ação para editar e excluir
- Estados de carregamento (loading) com skeleton animation
- Mensagem para lista vazia

### 4. EntryForm.tsx

Modal de formulário utilizado tanto para adicionar novos lançamentos quanto para editar lançamentos existentes. Implementa:

- Validação de campos obrigatórios
- Ajuste dinâmico da lista de categorias com base no tipo selecionado (receita/despesa)
- Preenchimento automático dos campos ao editar um lançamento existente
- Feedback visual de erros
- Persistência dos dados via API

## Hook useEntries

O hook personalizado `useEntries` encapsula toda a lógica de acesso a dados, incluindo:

- Listagem de lançamentos com suporte a filtros
- Adição de novos lançamentos
- Atualização de lançamentos existentes
- Exclusão de lançamentos
- Gerenciamento de estados de carregamento e erros

Este padrão permite a separação da lógica de negócio da camada de apresentação, tornando os componentes mais simples e focados na interface.

## Fluxo de Dados

O fluxo de dados na página de lançamentos segue o seguinte padrão:

1. **Carregamento Inicial**: Ao montar o componente, o hook `useEntries` carrega os lançamentos com os filtros padrão (mês atual)
2. **Filtragem**: Quando o usuário altera os filtros, o hook recarrega os dados com os novos critérios
3. **Adição/Edição**: O formulário captura os dados, valida-os e os envia para a API através do hook
4. **Atualização da Lista**: Após qualquer operação de modificação, a lista é atualizada automaticamente

## Tratamento de Erros

A implementação inclui tratamento robusto de erros em vários níveis:

- Erros de comunicação com a API são capturados e exibidos ao usuário
- Validações no formulário para evitar dados inválidos
- Confirmação para operações destrutivas (exclusão)
- Estados de carregamento para feedback durante operações assíncronas

## Responsividade

A interface foi implementada seguindo o princípio "mobile-first", adaptando-se a diferentes tamanhos de tela:

- Em telas menores, os filtros empilham verticalmente
- A tabela de lançamentos se adapta para exibição em formato de cards em dispositivos móveis
- O modal de formulário ocupa toda a tela em dispositivos móveis, mantendo os campos acessíveis

## Considerações sobre Performance

Para otimizar a performance da tela de lançamentos, foram adotadas estratégias como:

- Filtros aplicados no servidor para reduzir o volume de dados transferidos
- Paginação para lidar com grandes volumes de lançamentos
- Estados de carregamento para feedback ao usuário
- Memoização de dependências em efeitos e callbacks
