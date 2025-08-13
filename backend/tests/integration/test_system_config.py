#!/usr/bin/env python3
"""
Script para testar os endpoints de configuração do sistema.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1/system-config"

def test_public_configs():
    """Testa o endpoint de configurações públicas."""
    print("\n=== Testando configurações públicas ===")
    try:
        response = requests.get(f"{BASE_URL}/public")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            data = response.json()
            print(f"Configurações públicas: {json.dumps(data, indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Erro: {e}")
        return False

def test_initialize_configs():
    """Testa a inicialização das configurações padrão."""
    print("\n=== Testando inicialização de configurações ===")
    try:
        # Primeiro, vamos tentar sem autenticação para ver o erro
        response = requests.post(f"{BASE_URL}/initialize")
        print(f"Status sem auth: {response.status_code}")
        print(f"Response sem auth: {response.text}")
        
        # Agora com um token fake (só para testar a estrutura)
        headers = {"Authorization": "Bearer fake-token"}
        response = requests.post(f"{BASE_URL}/initialize", headers=headers)
        print(f"Status com fake token: {response.status_code}")
        print(f"Response com fake token: {response.text}")
        
        return True
    except Exception as e:
        print(f"Erro: {e}")
        return False

def test_all_configs():
    """Testa o endpoint de todas as configurações."""
    print("\n=== Testando todas as configurações ===")
    try:
        # Sem autenticação
        response = requests.get(f"{BASE_URL}/")
        print(f"Status sem auth: {response.status_code}")
        print(f"Response sem auth: {response.text}")
        
        # Com token fake
        headers = {"Authorization": "Bearer fake-token"}
        response = requests.get(f"{BASE_URL}/", headers=headers)
        print(f"Status com fake token: {response.status_code}")
        print(f"Response com fake token: {response.text}")
        
        return True
    except Exception as e:
        print(f"Erro: {e}")
        return False

def main():
    """Executa todos os testes."""
    print("Iniciando testes da API de configurações do sistema...")
    
    # Teste 1: Configurações públicas (não requer auth)
    test_public_configs()
    
    # Teste 2: Inicialização de configurações
    test_initialize_configs()
    
    # Teste 3: Todas as configurações
    test_all_configs()
    
    print("\n=== Testes concluídos ===")

if __name__ == "__main__":
    main()