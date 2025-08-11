#!/usr/bin/env python3
"""
Simple script to run the FastAPI server
"""
import os
import sys
import uvicorn


def _ensure_env():
    """Validate that required dependencies are available and venv is active.

    Exits early with a helpful message if a core dependency (e.g. sqlalchemy)
    is missing — typical cause: virtualenv not activated.
    """
    try:
        import sqlalchemy  # noqa: F401
    except ImportError:
        print("\n[ERRO] Dependências não encontradas (ex: sqlalchemy).\n"
              "Provável causa: virtualenv não ativada ou 'pip install -r requirements.txt' não executado.\n\n"
              "Siga os passos:\n"
              "  cd backend\n"
              "  python -m venv .venv  # se ainda não existir\n"
              "  source .venv/bin/activate  # Windows: .venv\\Scripts\\activate\n"
              "  pip install -r requirements.txt\n"
              "  python run_server.py\n")
        sys.exit(1)

    if not os.environ.get("VIRTUAL_ENV"):
        # Not fatal, but let the developer know which interpreter is in use.
        print(f"[AVISO] Executando fora de uma virtualenv ativa. Python: {sys.executable}\n"
              "Recomenda-se ativar .venv para isolar dependências.")

# Use import string to allow --reload to work properly without warning.
# This avoids: "You must pass the application as an import string to enable 'reload' or 'workers'."

APP_IMPORT = "app.main:app"

if __name__ == "__main__":
    _ensure_env()
    uvicorn.run(APP_IMPORT, host="127.0.0.1", port=8000, reload=True)
