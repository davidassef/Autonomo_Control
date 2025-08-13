# Autônomo Control - Frontend

Interface web do sistema de gestão financeira para profissionais autônomos, desenvolvida com React e TypeScript.

## Tecnologias

- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS** - Framework CSS utilitário
- **Vite** - Build tool e dev server
- **React Router** - Roteamento SPA
- **Axios** - Cliente HTTP
- **React Hook Form** - Gerenciamento de formulários
- **Jest & Testing Library** - Testes unitários

## Scripts Disponíveis

### Desenvolvimento
```bash
npm start          # Inicia servidor de desenvolvimento (porta 3000)
npm run dev        # Alias para npm start
```

### Testes
```bash
npm test           # Executa testes em modo watch
npm run test:ci    # Executa testes uma vez (CI/CD)
npm run test:coverage  # Relatório de cobertura
```

### Build
```bash
npm run build      # Build para produção
npm run preview    # Preview do build local
```

### Qualidade de Código
```bash
npm run lint       # Verifica código com ESLint
npm run lint:fix   # Corrige problemas automaticamente
npm run type-check # Verifica tipos TypeScript
```

## Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── pages/         # Páginas da aplicação
├── hooks/         # Hooks customizados
├── services/      # Serviços de API
├── contexts/      # Contextos React
├── types/         # Definições TypeScript
├── utils/         # Funções utilitárias
└── styles/        # Estilos globais
```

## Funcionalidades

- 🔐 **Autenticação** - Login/logout com JWT
- 📊 **Dashboard** - Visão geral financeira
- 💰 **Lançamentos** - CRUD de receitas e despesas
- 🏷️ **Categorias** - Organização personalizada
- 📈 **Relatórios** - Análises e gráficos
- 👤 **Perfil** - Gerenciamento de conta
- ⚙️ **Admin** - Painel administrativo (RBAC)

## Desenvolvimento

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar ambiente:**
   ```bash
   # Criar arquivo .env se necessário
   # Ajustar REACT_APP_API_URL se necessário
   ```

3. **Iniciar desenvolvimento:**
   ```bash
   npm start
   ```

4. **Executar testes:**
   ```bash
   npm test
   ```

## Documentação

Para documentação completa do projeto, consulte:
- [README Principal](../README.md)
- [Documentação da Arquitetura](../docs/02_arquitetura/)
- [Guia do Desenvolvedor](../docs/03_guia_desenvolvedor/)

---

**Status:** ✅ Funcional | **Cobertura:** Em desenvolvimento | **Versão:** 1.0.0
