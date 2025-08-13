from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, date


class AuditLogBase(BaseModel):
    """Schema base para logs de auditoria."""
    action: str = Field(..., description="Ação realizada")
    resource_type: str = Field(..., description="Tipo de recurso afetado")
    description: str = Field(..., description="Descrição da ação")
    details: Optional[Dict[str, Any]] = Field(None, description="Detalhes adicionais em JSON")
    ip_address: Optional[str] = Field(None, description="Endereço IP do usuário")
    user_agent: Optional[str] = Field(None, description="User agent do navegador")


class AuditLogCreate(AuditLogBase):
    """Schema para criação de logs de auditoria."""
    performed_by: str = Field(..., description="Email do usuário que realizou a ação")


class AuditLogResponse(AuditLogBase):
    """Schema para resposta de logs de auditoria."""
    id: str
    performed_by: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuditLogFilter(BaseModel):
    """Schema para filtros de busca de logs."""
    action: Optional[str] = Field(None, description="Filtrar por ação")
    resource_type: Optional[str] = Field(None, description="Filtrar por tipo de recurso")
    performed_by: Optional[str] = Field(None, description="Filtrar por usuário")
    start_date: Optional[date] = Field(None, description="Data inicial")
    end_date: Optional[date] = Field(None, description="Data final")
    skip: int = Field(0, ge=0, description="Número de registros para pular")
    limit: int = Field(100, ge=1, le=1000, description="Limite de registros por página")


class AuditLogStats(BaseModel):
    """Schema para estatísticas de auditoria."""
    period_days: int
    total_logs: int
    actions: list[Dict[str, Any]]
    resource_types: list[Dict[str, Any]]
    most_active_users: list[Dict[str, Any]]