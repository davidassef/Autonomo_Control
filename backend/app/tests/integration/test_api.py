import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    """
    Teste do endpoint raiz da API
    """
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert "Bem-vindo" in response.json()["message"]
