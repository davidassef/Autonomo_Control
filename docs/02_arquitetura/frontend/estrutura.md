# 🖥️ Estrutura do Frontend

Este documento detalha a estrutura e organização do código do frontend do Autônomo Control.

## 📁 Visão Geral da Estrutura

```
frontend/
├── public/                 # Arquivos públicos
│   ├── index.html          # Template HTML principal
│   ├── favicon.ico         # Ícone da aplicação
│   ├── manifest.json       # Configuração PWA
│   └── robots.txt          # Instruções para web crawlers
│
├── src/
│   ├── assets/             # Recursos estáticos
│   │   ├── fonts/          # Fontes personalizadas
│   │   ├── images/         # Imagens e ícones
│   │   └── styles/         # Estilos globais
│   │
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/             # Componentes de UI básicos
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── ...
│   │   ├── layout/         # Componentes de layout
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   └── ...
│   │   └── shared/         # Componentes compartilhados
│   │
│   ├── config/             # Configurações da aplicação
│   │   ├── routes.tsx      # Definição de rotas
│   │   └── theme.ts        # Configuração do tema
│   │
│   ├── context/            # Contextos React
│   │   ├── AuthContext.tsx
│   │   └── AppContext.tsx
│   │
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useForm.ts
│   │
│   ├── pages/              # Páginas da aplicação
│   │   ├── Dashboard/
│   │   ├── Entries/
│   │   ├── Reports/
│   │   └── Settings/
│   │
│   ├── services/           # Serviços de API
│   │   ├── api.ts          # Cliente HTTP
│   │   ├── auth.ts         # Serviços de autenticação
│   │   └── entries.ts      # Serviços de lançamentos
│   │
│   ├── types/              # Tipos TypeScript
│   │   ├── user.ts
│   │   └── entry.ts
│   │
│   ├── utils/              # Utilitários
│   │   ├── formatters.ts   # Funções de formatação
│   │   └── validators.ts   # Validações de formulário
│   │
│   ├── App.tsx             # Componente raiz
│   ├── main.tsx            # Ponto de entrada
│   └── index.css           # Estilos globais
│
├── .env                   # Variáveis de ambiente
├── .env.example           # Exemplo de variáveis de ambiente
├── package.json           # Dependências e scripts
├── tailwind.config.js     # Configuração do Tailwind CSS
├── tsconfig.json          # Configuração do TypeScript
└── vite.config.ts         # Configuração do Vite
```

## 🏗️ Componentes Principais

### 1. Páginas (src/pages/)
- Uma pasta para cada rota da aplicação
- Componentes de página conectados ao gerenciamento de estado
- Responsáveis por buscar dados iniciais

### 2. Componentes (src/components/)
- **UI**: Componentes básicos reutilizáveis
- **Layout**: Componentes estruturais
- **Shared**: Componentes compartilhados entre páginas

### 3. Serviços (src/services/)
- Comunicação com a API
- Gerenciamento de tokens JWT
- Tratamento de erros

### 4. Contextos (src/context/)
- Estado global da aplicação
- Autenticação
- Tema e preferências do usuário

## 🎨 Estilização

### Tailwind CSS
- Framework CSS utilitário
- Classes utilitárias para estilização rápida
- Personalização via `tailwind.config.js`

### Estrutura de Estilos
```
styles/
├── base/           # Estilos base (reset, tipografia)
├── components/     # Estilos específicos de componentes
├── layouts/        # Estilos de layout
└── utilities/      # Classes utilitárias personalizadas
```

## 🛠️ Desenvolvimento

### Scripts Principais
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  }
}
```

### Ferramentas de Desenvolvimento
- **Vite**: Bundler e dev server
- **TypeScript**: Tipagem estática
- **ESLint**: Linter
- **Prettier**: Formatação de código
- **Husky**: Git hooks

## 🧪 Testes

### Estrutura de Testes
```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
└── utils/          # Utilitários para testes
```

### Executando Testes
```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm test -- --watch

# Gerar relatório de cobertura
npm test -- --coverage
```

## 🔄 Gerenciamento de Estado

### Context API
- Para estado global da aplicação
- Autenticação
- Tema e preferências

### React Query
- Gerenciamento de cache de dados
- Atualizações em tempo real
- Paginação e busca

## 📱 Responsividade

### Breakpoints
```js
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
```

### Abordagem
- Mobile-first
- Design responsivo
- Testes em múltiplos dispositivos

## 🔒 Segurança

### Boas Práticas
- Armazenamento seguro de tokens
- Proteção contra XSS
- Validação de entrada
- Headers de segurança

## 🚀 Otimizações

### Performance
- Code splitting
- Lazy loading de rotas
- Imagens otimizadas
- Bundle analysis

### Acessibilidade
- ARIA labels
- Navegação por teclado
- Contraste de cores
- Testes com leitores de tela

## 📚 Próximos Passos

- [Guia de Estilo](../../03_guia_desenvolvedor/guia_estilo.md)
- [Testes Automatizados](../../03_guia_desenvolvedor/testes_automatizados.md)
- [Padrões de Código](../../03_guia_desenvolvedor/padroes_codigo.md)
