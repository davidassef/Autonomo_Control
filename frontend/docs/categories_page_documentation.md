# Documentação da Tela de Categorias - Autônomo Control

## Visão Geral

A tela de categorias do Autônomo Control permite aos usuários gerenciar suas categorias de receitas e despesas. As categorias são essenciais para a organização e classificação dos lançamentos financeiros, permitindo análises mais detalhadas e relatórios precisos.

## Estrutura de Arquivos

A implementação da tela de categorias é composta pelos seguintes arquivos:

```
frontend/
├── src/
│   ├── pages/
│   │   └── CategoriesPage.tsx       # Página principal de categorias
│   ├── components/
│   │   ├── CategoryList.tsx         # Componente de listagem
│   │   ├── CategoryForm.tsx         # Formulário de adição/edição
│   │   ├── IconPicker.tsx           # Seletor de ícones
│   │   └── ColorPicker.tsx          # Seletor de cores
│   ├── hooks/
│   │   └── useCategories.ts         # Hook personalizado para gerenciar categorias
│   ├── services/
│   │   └── categories.ts            # Serviço de comunicação com a API
│   └── types/
│       └── index.ts                 # Definição dos tipos relacionados a categorias
```

## Componentes Principais

### 1. CategoriesPage.tsx

Este é o componente principal que coordena a interação entre os diversos componentes da tela de categorias. Suas responsabilidades incluem:

- Gerenciamento de estado da página (tipo ativo, modal aberto/fechado, categoria selecionada)
- Coordenação da comunicação com a API através do hook `useCategories`
- Filtragem das categorias por tipo (receita/despesa) e texto de busca
- Resposta às ações do usuário (adicionar, editar, excluir)

### 2. CategoryList.tsx

Componente responsável por exibir a lista de categorias filtradas pelo tipo ativo (receita ou despesa). Características principais:

- Exibição das informações principais de cada categoria (nome, subcategorias)
- Visualização de ícones e cores personalizadas para cada categoria
- Identificação visual de categorias padrão do sistema
- Desabilitação de ações de edição e exclusão para categorias padrão
- Estados de carregamento (loading) com skeleton animation
- Mensagem para lista vazia

### 3. CategoryForm.tsx

Modal de formulário utilizado tanto para adicionar novas categorias quanto para editar categorias existentes. Implementa:

- Campos para nome, tipo, subcategorias, ícone e cor
- Interface intuitiva para adição e remoção de subcategorias
- Integração com componentes visuais avançados para seleção de ícones e cores
- Validação de campos obrigatórios
- Conversão de tipos entre o formato do frontend e backend (income/expense vs INCOME/EXPENSE)
- Preenchimento automático dos campos ao editar uma categoria existente

### 4. IconPicker.tsx

Componente especializado para selecionar ícones para categorias:

- Pré-visualização de ícones financeiros comuns com emojis
- Campo de busca para facilitar a localização dos ícones
- Interface intuitiva de seleção por clique
- Suporte para entrada manual de nomes de ícones personalizados

### 5. ColorPicker.tsx

Componente para seleção visual de cores:

- Paleta de cores predefinida com opções comuns
- Pré-visualização da cor selecionada
- Suporte para entrada manual de códigos de cores personalizadas
- Interface de seleção intuitiva

## Principais Funcionalidades

### Alternância entre Categorias de Receita e Despesa

A interface permite alternar facilmente entre a visualização de categorias de receita e despesa através de uma interface de abas intuitiva:

```tsx
<div className="flex justify-center space-x-4">
  <button
    onClick={() => handleTypeChange('expense')}
    className={`px-4 py-2 rounded-md ${
      activeType === 'expense'
        ? 'bg-red-100 text-red-700 font-medium'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    Despesas
  </button>
  <button
    onClick={() => handleTypeChange('income')}
    className={`px-4 py-2 rounded-md ${
      activeType === 'income'
        ? 'bg-green-100 text-green-700 font-medium'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    Receitas
  </button>
</div>
```

### Gestão de Subcategorias

O formulário de categorias permite a adição e remoção de subcategorias de forma dinâmica:

- Interface intuitiva com campo de texto e botão "Adicionar"
- Suporte para adição de subcategorias via tecla Enter
- Validação para evitar duplicação de subcategorias
- Exibição visual das subcategorias adicionadas com opção de remoção

### Tratamento de Categorias Padrão do Sistema

A implementação diferencia entre categorias padrão do sistema e categorias personalizadas do usuário:

- As categorias padrão são identificadas visualmente com um badge "Padrão"
- Os botões de edição e exclusão são desabilitados para categorias padrão
- Estilização visual diferente para botões desabilitados

## Compatibilidade com o Backend

Para garantir a compatibilidade com o backend, a implementação trata as diferenças de nomenclatura entre o frontend e o backend:

- No frontend: `income` e `expense` (minúsculas)
- No backend: `INCOME` e `EXPENSE` (maiúsculas)

A conversão é feita nas operações de salvamento:

```tsx
const handleSaveCategory = async (category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
  try {
    // Converte o tipo para o formato esperado pelo backend
    const categoryToSave = {
      ...category,
      type: category.type.toUpperCase() as 'INCOME' | 'EXPENSE'
    };

    // Resto do código de salvamento...
  } catch (error) {
    console.error('Error saving category:', error);
  }
};
```

## Considerações sobre Usabilidade

Para melhorar a usabilidade da tela de categorias, foram implementadas diversas estratégias:

- Feedback visual claro para diferentes estados (carregamento, erro, sucesso)
- Confirmação antes de excluir uma categoria
- Cores distintas para categorias de receita (verde) e despesa (vermelho)
- Desabilitação visual de ações não permitidas
- Campos opcionais claramente identificados

## Responsividade

A interface foi implementada seguindo o princípio "mobile-first", adaptando-se a diferentes tamanhos de tela:

- Em telas menores, os elementos se reorganizam verticalmente
- Tabela de categorias se adapta para exibição em formato de cards em dispositivos móveis
- O modal de formulário ocupa toda a tela em dispositivos móveis, mantendo os campos acessíveis