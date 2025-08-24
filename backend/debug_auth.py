#!/usr/bin/env python3
"""
Script para debugar problemas de autenticação
"""

import sys

sys.path.append(".")

from app.core.security import verify_token
from app.core.database import SessionLocal
from app.models.user import User

# Token do usuário MASTER
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0ZUBtYXN0ZXIuY29tIiwidXNlcl9pZCI6ImJlNWM2N2ZlLTZjNTktNDBiNC1hNWY3LTZkYzY0ZjExMWNhOSIsInJvbGUiOiJNQVNURVIiLCJleHAiOjE3NTUxMDkyMTF9.I4x0zSm4AJ919mmlRuwV12vA3gHJ7PSmCvSZrJjlxz8"

print("=== DEBUG AUTH ===")
print(f"Token: {token[:50]}...")

# Verificar token
token_data = verify_token(token)
print(f"Token data: {token_data}")

if token_data:
    # Verificar usuário no banco
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if user:
            print(f"Usuário encontrado:")
            print(f"  ID: {user.id}")
            print(f"  Email: {user.email}")
            print(f"  Nome: {user.name}")
            print(f"  Role: {getattr(user, 'role', 'NONE')}")
            print(f"  Ativo: {getattr(user, 'is_active', 'NONE')}")
            print(f"  Bloqueado: {getattr(user, 'blocked_at', 'NONE')}")

            # Verificar se é MASTER
            role = getattr(user, "role", None)
            print(f"\nVerificação MASTER:")
            print(f"  Role == 'MASTER': {role == 'MASTER'}")
            print(f"  Role type: {type(role)}")
            print(f"  Role repr: {repr(role)}")
        else:
            print("Usuário não encontrado no banco")
    finally:
        db.close()
else:
    print("Token inválido")
