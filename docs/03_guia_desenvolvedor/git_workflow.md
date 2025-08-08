# 🌿 Fluxo de Trabalho com Git

Este documento descreve o fluxo de trabalho com Git adotado pelo time de desenvolvimento do Autônomo Control.

## 📋 Visão Geral

Utilizamos um fluxo baseado no Git Flow, com as seguintes branches principais:

- `main` - Código de produção (estável)
- `develop` - Próxima versão em desenvolvimento
- `feature/*` - Novas funcionalidades
- `bugfix/*` - Correções de bugs
- `release/*` - Preparação para lançamento
- `hotfix/*` - Correções críticas em produção

## 🔄 Fluxo de Desenvolvimento

### 1. Iniciando um Novo Recurso

```bash
# Atualize seu repositório local
git fetch origin
git checkout develop
git pull origin develop

# Crie uma nova branch de feature
git checkout -b feature/nome-do-recurso
```

### 2. Desenvolvendo o Recurso

Faça commits atômicos com mensagens claras:

```bash
git add .
git commit -m "feat: adiciona formulário de cadastro"

# Ou use o modo interativo para selecionar partes específicas
git add -p
```

### 3. Mantendo a Branch Atualizada

```bash
# Traga as atualizações da develop para sua branch
git fetch origin
git merge origin/develop

# Ou use rebase para um histórico mais limpo
git pull --rebase origin develop
```

### 4. Finalizando o Recurso

```bash
# Certifique-se que todos os testes estão passando
pytest  # Backend
npm test  # Frontend

# Envie sua branch para o repositório remoto
git push -u origin feature/nome-do-recurso
```

## 🧩 Convenções de Commit

Utilizamos o [Conventional Commits](https://www.conventionalcommits.org/):

```
type(escopo): descrição breve

Corpo explicativo (opcional)

[rodapé] (opcional)
```

### Tipos de Commit
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `style`: Formatação, ponto e vírgula, etc (não altera código)
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Atualização de tarefas, configuração, etc

### Exemplos
```
feat(auth): adiciona autenticação com Google
fix(api): corrige erro 500 na rota de usuários
docs: atualiza guia de instalação
refactor(ui): melhora desempenho do componente de lista
```

## 🔀 Revisão de Código

1. Crie um Pull Request (PR) da sua branch para `develop`
2. Adicione uma descrição clara do que foi feito
3. Vincule a issue relacionada (ex: `Resolve #123`)
4. Atribua revisores
5. Aguarde a aprovação de pelo menos um revisor

### Boas Práticas para Revisão
- Seja respeitoso e construtivo
- Explique o "porquê" dos comentários
- Destaque os pontos positivos também
- Revise em blocos lógicos
- Verifique se há testes adequados

## 🚀 Processo de Lançamento

### 1. Criar Branch de Release

```bash
git checkout develop
git pull origin develop
git checkout -b release/1.0.0
```

### 2. Preparar para Lançamento
- Atualize o CHANGELOG.md
- Atualize a versão no package.json/pyproject.toml
- Execute todos os testes
- Atualize a documentação se necessário

### 3. Finalizar Release

```bash
git commit -m "chore(release): versão 1.0.0"
git tag -a v1.0.0 -m "Versão 1.0.0"
git push origin release/1.0.0 --tags
```

### 4. Mesclar para Main e Develop

```bash
git checkout main
git merge --no-ff release/1.0.0
git push origin main

git checkout develop
git merge --no-ff release/1.0.0
git push origin develop

# Remova a branch de release
git branch -d release/1.0.0
git push origin --delete release/1.0.0
```

## 🚑 Hotfixes

Para correções críticas em produção:

```bash
# A partir de main
git checkout -b hotfix/descricao main

# Faça as correções necessárias
# Siga o mesmo processo de commit e PR
# Mescle em main E develop
```

## 🔒 Branch Protection Rules

As branches principais têm proteção ativada:
- `main` e `develop` exigem PR
- Pelo menos 1 aprovação obrigatória
- Todos os testes devem passar
- Atualização da branch obrigatória antes do merge

## 🛠️ Git Hooks

O projeto inclui hooks do Git para garantir qualidade:
- Pre-commit: Executa lint e formatação
- Pre-push: Executa testes

### Configurando Hooks

```bash
# Instalar dependências de desenvolvimento
pip install pre-commit
npm install

# Instalar hooks
pre-commit install
```

## 🔍 Boas Práticas

1. **Commits Pequenos e Focados**
   - Um commit por funcionalidade/correção
   - Mensagens claras e descritivas

2. **Branches Descritivas**
   - Use prefixos: `feature/`, `bugfix/`, `hotfix/`
   - Nomes em inglês, separados por hífens

3. **Pull Requests**
   - Títulos descritivos
   - Descrição clara das mudanças
   - Screenshots quando aplicável
   - Checklist de tarefas

4. **Revisão de Código**
   - Revise código dos outros como gostaria que revisassem o seu
   - Seja objetivo e educado
   - Aprenda com o feedback

5. **Sincronização**
   - Mantenha suas branches atualizadas
   - Resolva conflitos o quanto antes

## 🤝 Trabalho em Equipe

1. **Comunicação**
   - Documente decisões importantes
   - Atualize as issues regularmente
   - Peça ajuda quando necessário

2. **Compartilhamento**
   - Faça code review regularmente
   - Compartilhe conhecimento
   - Participe das discussões técnicas

3. **Respeito**
   - Seja profissional
   - Critique ideias, não pessoas
   - Valorize as contribuições

## 📚 Recursos Adicionais

- [Git Documentation](https://git-scm.com/doc)
- [Git Flow Cheat Sheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Git Tips](https://github.com/git-tips/tips)
