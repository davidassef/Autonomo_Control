# 📡 Documentação da API

Este documento descreve os endpoints da API do Autônomo Control, incluindo parâmetros, respostas e exemplos de uso.

## 🔐 Autenticação

A API usa autenticação baseada em JWT (JSON Web Tokens) com sistema de conta master única. Para autenticar uma requisição, inclua o token JWT no cabeçalho `Authorization`.

```http
Authorization: Bearer seu_token_aqui
```

### Endpoints de Autenticação

#### Login

```http
POST /api/v1/auth/token
```

**Corpo da Requisição (form-data):**
```
username=masterautonomocontrol
password=Senhamaster123
```

**Resposta de Sucesso (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "masterautonomocontrol",
    "full_name": "Master Admin",
    "role": "admin"
  }
}
```

#### Registro de Usuários

```http
POST /api/v1/auth/register
```

**Corpo da Requisição (JSON):**
```json
{
  "username": "novousuario",
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "full_name": "Nome Completo",
  "name": "Nome"
}
```

#### Sistema de Chaves Secretas

```http
POST /api/v1/secret_keys
```

**Corpo da Requisição (JSON):**
```json
{
  "user_id": 1,
  "question_1": "Qual o nome da sua primeira escola?",
  "answer_1": "Escola ABC",
  "question_2": "Qual o nome do seu primeiro animal?",
  "answer_2": "Rex"
}
```

## 👤 Usuários

### Obter Perfil do Usuário

```http
GET /api/v1/users/me
```

**Resposta de Sucesso (200 OK):**
```json
{
  "id": 1,
  "email": "usuario@exemplo.com",
  "full_name": "Fulano de Tal",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00"
}
```

### Atualizar Perfil do Usuário

```http
PUT /api/v1/users/me
```

**Corpo da Requisição (JSON):**
```json
{
  "full_name": "Novo Nome",
  "email": "novo@email.com"
}
```

## 💰 Lançamentos Financeiros

### Listar Lançamentos

```http
GET /api/v1/entries
```

**Parâmetros de Consulta:**
- `type`: `income` ou `expense` (opcional)
- `category_id`: ID da categoria (opcional)
- `start_date`: Data de início (YYYY-MM-DD)
- `end_date`: Data de término (YYYY-MM-DD)
- `page`: Número da página (padrão: 1)
- `per_page`: Itens por página (padrão: 20)

**Resposta de Sucesso (200 OK):**
```json
{
  "items": [
    {
      "id": 1,
      "description": "Salário",
      "amount": 3000.00,
      "type": "income",
      "date": "2023-06-01",
      "category_id": 1,
      "created_at": "2023-06-01T10:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "total_pages": 1
}
```

### Criar Lançamento

```http
POST /api/v1/entries
```

**Corpo da Requisição (JSON):**
```json
{
  "description": "Supermercado",
  "amount": 350.50,
  "type": "expense",
  "date": "2023-06-15",
  "category_id": 2
}
```

## 📊 Relatórios

### Resumo Financeiro

```http
GET /api/v1/reports/summary
```

**Parâmetros de Consulta:**
- `start_date`: Data de início (YYYY-MM-DD)
- `end_date`: Data de término (YYYY-MM-DD)

**Resposta de Sucesso (200 OK):**
```json
{
  "total_income": 3000.00,
  "total_expenses": 1200.50,
  "balance": 1799.50,
  "by_category": [
    {
      "category_id": 1,
      "category_name": "Alimentação",
      "amount": 800.50,
      "percentage": 66.67
    },
    {
      "category_id": 2,
      "category_name": "Transporte",
      "amount": 400.00,
      "percentage": 33.33
    }
  ]
}
```

## 📂 Categorias

### Listar Categorias

```http
GET /api/v1/categories
```

**Resposta de Sucesso (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Alimentação",
    "type": "expense",
    "color": "#FF5733"
  },
  {
    "id": 2,
    "name": "Salário",
    "type": "income",
    "color": "#33FF57"
  }
]
```

## 🚦 Códigos de Status

A API retorna os seguintes códigos de status HTTP com tratamento robusto de erros:

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `204 No Content`: Recurso excluído com sucesso
- `400 Bad Request`: Dados inválidos na requisição (mensagens específicas implementadas)
- `401 Unauthorized`: Autenticação necessária
- `403 Forbidden`: Acesso negado
- `404 Not Found`: Recurso não encontrado
- `422 Unprocessable Entity`: Erro de validação (campos obrigatórios: full_name + name)
- `500 Internal Server Error`: Erro no servidor

### Exemplos de Respostas de Erro

**400 Bad Request:**
```json
{
  "detail": "Username já existe no sistema",
  "error_code": "DUPLICATE_USERNAME"
}
```

**422 Unprocessable Entity:**
```json
{
  "detail": [
    {
      "loc": ["body", "full_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## 🔄 Paginação

Endpoints que retornam listas de recursos suportam paginação através dos parâmetros de consulta `page` e `per_page`.

**Exemplo:**
```
GET /api/v1/entries?page=2&per_page=10
```

## 🔍 Filtros

Muitos endpoints suportam filtros através de parâmetros de consulta. Consulte a documentação específica de cada endpoint para mais detalhes.

## 📝 Convenções

### Formato de Datas
Todas as datas são enviadas e retornadas no formato ISO 8601: `YYYY-MM-DD`.

### Formato de Moeda
Todos os valores monetários são representados como números decimais com duas casas decimais.

### Ordenação
A ordenação pode ser especificada através do parâmetro `sort`:
```
GET /api/v1/entries?sort=-date,amount
```
O prefixo `-` indica ordem decrescente.

## 📚 Documentação Interativa

Para uma documentação interativa, acesse:
- Swagger UI: `/docs`
- ReDoc: `/redoc`

## 📡 Webhooks

A API suporta webhooks para notificações em tempo real de eventos importantes.

### Eventos Suportados
- `entry.created`: Novo lançamento criado
- `entry.updated`: Lançamento atualizado
- `entry.deleted`: Lançamento excluído

### Configuração
Para configurar um webhook, envie uma requisição para:

```http
POST /api/v1/webhooks
```

**Corpo da Requisição (JSON):**
```json
{
  "url": "https://sua-aplicacao.com/webhook",
  "events": ["entry.created", "entry.updated"],
  "secret": "seu_segredo_aqui"
}
```

## 🔒 Segurança

### Headers de Segurança
A API inclui os seguintes headers de segurança por padrão:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: default-src 'self'`

### Rate Limiting
A API implementa rate limiting para prevenir abuso:
- 100 requisições por minuto por IP
- 1000 requisições por hora por usuário autenticado

## 🌍 Internacionalização

A API suporta múltiplos idiomas através do header `Accept-Language`.

**Exemplo:**
```http
GET /api/v1/entries
Accept-Language: pt-BR
```

## 🔄 Versionamento

A API segue o versionamento semântico (SemVer) e inclui a versão no caminho da URL:

```
/api/v1/...
```

Mudanças que quebram a compatibilidade serão lançadas em uma nova versão da API.

## 📞 Suporte

Para relatar problemas ou solicitar suporte, entre em contato através de:
- Email: suporte@autonomocontrol.com.br
- Repositório: https://github.com/seu-usuario/autonomo-control/issues
