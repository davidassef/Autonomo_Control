# 🚀 Guia de Início Rápido

Bem-vindo ao Autônomo Control! Este guia irá ajudá-lo a configurar e começar a usar o sistema rapidamente.

## 📋 Pré-requisitos

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Git

## 🛠️ Instalação Rápida

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/autonomo-control.git
cd autonomo-control
```

### 2. Configurar Ambiente Backend

```bash
# Criar e ativar ambiente virtual
python -m venv venv
source venv/bin/activate  # No Windows: .\venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Aplicar migrações
alembic upgrade head
```

### 3. Configurar Frontend

```bash
cd frontend
npm install

# Copiar arquivo de configuração
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## 🚀 Executando o Projeto

### Backend

```bash
# No diretório raiz do projeto
uvicorn app.main:app --reload
```

### Frontend

```bash
# No diretório frontend
npm run dev
```

Acesse o sistema em: [http://localhost:5173](http://localhost:5173)

## 👤 Primeiro Acesso

1. Acesse a página de registro
2. Preencha seus dados para criar uma conta
3. Faça login com suas credenciais
4. Configure suas categorias iniciais
5. Comece a registrar seus lançamentos financeiros

## 📱 Principais Funcionalidades

### 1. Dashboard
- Visão geral das finanças
- Gráficos de receitas e despesas
- Saldo atual

### 2. Lançamentos
- Adicione receitas e despesas
- Categorize seus lançamentos
- Filtre por data e categoria

### 3. Relatórios
- Análise mensal/trimestral/anual
- Gráficos por categoria
- Exporte para PDF/Excel

### 4. Configurações
- Gerencie suas categorias
- Configure metas financeiras
- Personalize seu perfil

## 🔄 Sincronização

Seu dados são sincronizados automaticamente com a nuvem. Para usar offline:

1. Faça login pelo menos uma vez quando estiver online
2. Seus dados serão armazenados localmente
3. As alterações serão sincronizadas quando a conexão for restabelecida

## 📱 Aplicativo Móvel

Disponível para download nas lojas de aplicativos:

- [Google Play Store](#)
- [Apple App Store](#)

## 📞 Suporte

Precisa de ajuda?

- Consulte nossa [documentação completa](#)
- Acesse o [centro de ajuda](#)
- Entre em contato: suporte@autonomocontrol.com.br

## 🎯 Próximos Passos

- [Explorar recursos avançados](#)
- [Configurar notificações](#)
- [Conectar sua conta bancária](#)
- [Configurar orçamentos](#)
