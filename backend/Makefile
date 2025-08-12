# Makefile para automação de testes do backend
# Uso: make <comando>

.PHONY: help test test-unit test-integration test-coverage test-html test-fast clean install lint format check

# Configurações
PYTHON := python
PIP := pip
PYTEST := pytest
TEST_DIR := app/tests
COV_DIR := htmlcov

# Comando padrão
help:
	@echo "Comandos disponíveis:"
	@echo "  test           - Executa todos os testes com cobertura"
	@echo "  test-unit      - Executa apenas testes unitários"
	@echo "  test-integration - Executa apenas testes de integração"
	@echo "  test-coverage  - Executa testes e gera relatório de cobertura"
	@echo "  test-html      - Executa testes e gera relatório HTML"
	@echo "  test-fast      - Execução rápida sem relatórios detalhados"
	@echo "  clean          - Remove arquivos temporários e cache"
	@echo "  install        - Instala dependências"
	@echo "  lint           - Executa linting do código"
	@echo "  format         - Formata o código"
	@echo "  check          - Executa verificações completas"

# Testes
test:
	@echo "🧪 Executando todos os testes com cobertura..."
	$(PYTEST) $(TEST_DIR) --cov=app --cov-report=term-missing -v

test-unit:
	@echo "🔬 Executando testes unitários..."
	$(PYTEST) $(TEST_DIR)/unit --cov=app --cov-report=term-missing -v

test-integration:
	@echo "🔗 Executando testes de integração..."
	$(PYTEST) $(TEST_DIR)/integration --cov=app --cov-report=term-missing -v

test-coverage:
	@echo "📊 Executando testes com relatório de cobertura..."
	$(PYTEST) $(TEST_DIR) --cov=app --cov-report=term-missing --cov-report=html
	@echo "Relatório HTML disponível em: $(COV_DIR)/index.html"

test-html:
	@echo "🌐 Executando testes e gerando relatório HTML..."
	$(PYTEST) $(TEST_DIR) --cov=app --cov-report=html --cov-report=term-missing -v
	@echo "📊 Relatório HTML disponível em: $(COV_DIR)/index.html"

test-fast:
	@echo "⚡ Execução rápida de testes..."
	$(PYTEST) $(TEST_DIR) -q

# Verificação de cobertura mínima
test-min-coverage:
	@echo "🎯 Verificando cobertura mínima de 85%..."
	$(PYTEST) $(TEST_DIR) --cov=app --cov-fail-under=85 --cov-report=term-missing

# Limpeza
clean:
	@echo "🧹 Limpando arquivos temporários..."
	rm -rf __pycache__/
	rm -rf .pytest_cache/
	rm -rf $(COV_DIR)/
	rm -rf .coverage
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Instalação
install:
	@echo "📦 Instalando dependências..."
	$(PIP) install -r requirements.txt

install-dev:
	@echo "🛠️ Instalando dependências de desenvolvimento..."
	$(PIP) install -r requirements.txt
	$(PIP) install black flake8 mypy

# Linting e formatação
lint:
	@echo "🔍 Executando linting..."
	@if command -v flake8 >/dev/null 2>&1; then \
		flake8 app/ --max-line-length=88 --extend-ignore=E203,W503; \
	else \
		echo "⚠️ flake8 não instalado. Execute: pip install flake8"; \
	fi

format:
	@echo "✨ Formatando código..."
	@if command -v black >/dev/null 2>&1; then \
		black app/ --line-length=88; \
	else \
		echo "⚠️ black não instalado. Execute: pip install black"; \
	fi

type-check:
	@echo "🔎 Verificando tipos..."
	@if command -v mypy >/dev/null 2>&1; then \
		mypy app/ --ignore-missing-imports; \
	else \
		echo "⚠️ mypy não instalado. Execute: pip install mypy"; \
	fi

# Verificações completas
check: lint type-check test-min-coverage
	@echo "✅ Todas as verificações concluídas!"

# Comandos de desenvolvimento
dev-setup: install-dev
	@echo "🚀 Ambiente de desenvolvimento configurado!"

ci: clean install test-min-coverage
	@echo "🤖 Pipeline de CI executado com sucesso!"

# Relatórios
report:
	@echo "📈 Gerando relatório completo..."
	$(PYTEST) $(TEST_DIR) --cov=app --cov-report=html --cov-report=term --cov-report=xml
	@echo "Relatórios disponíveis:"
	@echo "  - HTML: $(COV_DIR)/index.html"
	@echo "  - XML: coverage.xml"

# Comandos de monitoramento
watch:
	@echo "👀 Monitorando mudanças e executando testes..."
	@if command -v pytest-watch >/dev/null 2>&1; then \
		ptw $(TEST_DIR) -- --cov=app --cov-report=term-missing; \
	else \
		echo "⚠️ pytest-watch não instalado. Execute: pip install pytest-watch"; \
	fi