# 🧪 Guia de Testes Automatizados - Backend

Este documento descreve os procedimentos de teste para o backend do sistema Autônomo Control.

## 📊 Status Atual da Cobertura

- **Cobertura Total**: 96% ✅
- **Meta Mínima**: 85% ✅
- **API Entries**: 91% ✅ (melhorada de 63%)
- **Testes Totais**: 257 testes
- **Testes Falhando**: 1 (não crítico)

## 🏗️ Estrutura de Testes

```
app/tests/
├── unit/                    # Testes unitários
│   ├── test_entry_schema.py
│   ├── test_user_schema.py
│   ├── test_category_schema.py
│   └── ...
├── integration/             # Testes de integração
│   ├── test_entries_api.py
│   ├── test_entries_api_extended.py
│   ├── test_users_api.py
│   └── ...
└── mocks/                   # Mocks e fixtures
    └── google_auth_mock.py
```

## 🚀 Executando Testes

### Opção 1: Usando o Script Python

```bash
# Todos os testes com cobertura
python run_tests.py

# Apenas testes unitários
python run_tests.py --unit

# Apenas testes de integração
python run_tests.py --integration

# Com relatório HTML
python run_tests.py --html

# Execução rápida
python run_tests.py --fast
```

### Opção 2: Usando Makefile

```bash
# Ver todos os comandos disponíveis
make help

# Executar todos os testes
make test

# Testes unitários apenas
make test-unit

# Testes de integração apenas
make test-integration

# Gerar relatório HTML
make test-html

# Verificar cobertura mínima
make test-min-coverage
```

### Opção 3: Usando pytest diretamente

```bash
# Todos os testes com cobertura
pytest app/tests --cov=app --cov-report=html --cov-report=term-missing -v

# Apenas testes unitários
pytest app/tests/unit --cov=app --cov-report=term-missing -v

# Apenas testes de integração
pytest app/tests/integration --cov=app --cov-report=term-missing -v
```

## 📈 Relatórios de Cobertura

### Visualizando Relatórios

1. **Terminal**: Executado automaticamente com `--cov-report=term-missing`
2. **HTML**: Disponível em `htmlcov/index.html` após executar com `--cov-report=html`
3. **XML**: Para integração com CI/CD usando `--cov-report=xml`

### Interpretando a Cobertura

- **Verde (90-100%)**: Excelente cobertura
- **Amarelo (75-89%)**: Boa cobertura, pode melhorar
- **Vermelho (<75%)**: Cobertura insuficiente, precisa de atenção

## 🎯 Áreas de Foco para Novos Testes

### Módulos com Cobertura Abaixo de 85%

1. **app\api\v1\admin_users.py** (81%)
   - Faltam testes para cenários de erro
   - Validações de permissão

2. **app\api\v1\auth.py** (79%)
   - Testes de autenticação com falha
   - Cenários de token inválido

3. **app\api\v1\categories.py** (79%)
   - Testes de validação de categoria
   - Cenários de categoria duplicada

4. **app\dependencies.py** (79%)
   - Testes de dependências de autenticação
   - Cenários de usuário inativo

5. **app\api\v1\users.py** (75%)
   - Testes de atualização de usuário
   - Validações de dados de entrada

## ✅ Boas Práticas

### Escrevendo Novos Testes

1. **Nomenclatura Clara**:
   ```python
   def test_create_entry_with_valid_data():
   def test_create_entry_with_invalid_amount_should_fail():
   ```

2. **Estrutura AAA (Arrange, Act, Assert)**:
   ```python
   def test_example():
       # Arrange
       data = {"field": "value"}
       
       # Act
       response = client.post("/endpoint", json=data)
       
       # Assert
       assert response.status_code == 201
   ```

3. **Usar Fixtures**:
   ```python
   def test_with_user(test_client, auth_headers, sample_user):
       # Teste usando fixtures predefinidas
   ```

4. **Testar Cenários de Erro**:
   ```python
   def test_create_entry_with_negative_amount_should_fail():
       # Testar validações e casos de erro
   ```

### Fixtures Disponíveis

- `test_client`: Cliente de teste FastAPI
- `test_db`: Sessão de banco de dados de teste
- `sample_user`: Usuário de exemplo
- `sample_category`: Categoria de exemplo
- `sample_entry`: Entrada de exemplo
- `auth_headers`: Headers de autenticação

## 🔧 Configuração do Ambiente

### Dependências de Teste

```bash
# Instalar dependências
pip install -r requirements.txt

# Dependências principais de teste
pip install pytest pytest-asyncio pytest-cov
```

### Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas:

```bash
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=test-secret-key
ALGORITHM=HS256
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **ModuleNotFoundError**:
   ```bash
   # Instalar dependências faltantes
   pip install -r requirements.txt
   ```

2. **Testes falhando por dependências**:
   ```bash
   # Limpar cache e reinstalar
   pip cache purge
   pip install -r requirements.txt --force-reinstall
   ```

3. **Banco de dados de teste**:
   ```bash
   # Remover banco de teste corrompido
   rm test.db
   ```

### Comandos de Limpeza

```bash
# Limpar arquivos temporários
make clean

# Ou manualmente
rm -rf __pycache__ .pytest_cache htmlcov .coverage
```

## 📋 Checklist para Pull Requests

Antes de submeter um PR, certifique-se de que:

- [ ] Todos os testes passam: `make test`
- [ ] Cobertura está acima de 85%: `make test-min-coverage`
- [ ] Novos recursos têm testes correspondentes
- [ ] Testes de regressão foram adicionados para bugs corrigidos
- [ ] Documentação foi atualizada se necessário

## 🔄 Integração Contínua

### Pipeline Recomendado

```yaml
# Exemplo para GitHub Actions
steps:
  - name: Install dependencies
    run: pip install -r requirements.txt
    
  - name: Run tests with coverage
    run: pytest app/tests --cov=app --cov-fail-under=85
    
  - name: Upload coverage reports
    uses: codecov/codecov-action@v3
```

## 📞 Suporte

Para dúvidas sobre testes:

1. Consulte este documento
2. Verifique os testes existentes como exemplo
3. Execute `make help` para ver comandos disponíveis
4. Consulte a documentação do pytest: https://docs.pytest.org/

---

**Última atualização**: Janeiro 2025  
**Cobertura atual**: 96%  
**Meta**: Manter acima de 85%