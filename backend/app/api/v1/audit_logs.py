from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from typing import List, Optional
from datetime import datetime, date

from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log_schema import (
    AuditLogResponse,
    AuditLogCreate,
    AuditLogFilter
)
from app.dependencies import get_current_admin, get_current_master
from app.models.user import User

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    performed_by: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Lista logs de auditoria com filtros opcionais.
    Apenas ADMINs e MASTERs podem acessar.
    """
    query = db.query(AuditLog)
    
    # Aplicar filtros
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    
    if performed_by:
        query = query.filter(AuditLog.performed_by.ilike(f"%{performed_by}%"))
    
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    
    if end_date:
        # Incluir todo o dia final
        end_datetime = datetime.combine(end_date, datetime.max.time())
        query = query.filter(AuditLog.created_at <= end_datetime)
    
    # Ordenar por data decrescente (mais recentes primeiro)
    query = query.order_by(desc(AuditLog.created_at))
    
    # Aplicar paginação
    logs = query.offset(skip).limit(limit).all()
    
    return logs


@router.get("/actions", response_model=List[str])
def get_available_actions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Retorna lista de ações disponíveis para filtro.
    """
    actions = db.query(AuditLog.action).distinct().all()
    return [action[0] for action in actions if action[0]]


@router.get("/resource-types", response_model=List[str])
def get_available_resource_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Retorna lista de tipos de recursos disponíveis para filtro.
    """
    resource_types = db.query(AuditLog.resource_type).distinct().all()
    return [rt[0] for rt in resource_types if rt[0]]


@router.get("/stats")
def get_audit_stats(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_master)  # Apenas MASTER
):
    """
    Retorna estatísticas de auditoria dos últimos N dias.
    Apenas MASTERs podem acessar.
    """
    from datetime import timedelta
    
    start_date = datetime.now() - timedelta(days=days)
    
    # Total de logs no período
    total_logs = db.query(AuditLog).filter(
        AuditLog.created_at >= start_date
    ).count()
    
    # Logs por ação
    actions_stats = db.query(
        AuditLog.action,
        db.func.count(AuditLog.id).label('count')
    ).filter(
        AuditLog.created_at >= start_date
    ).group_by(AuditLog.action).all()
    
    # Logs por tipo de recurso
    resource_stats = db.query(
        AuditLog.resource_type,
        db.func.count(AuditLog.id).label('count')
    ).filter(
        AuditLog.created_at >= start_date
    ).group_by(AuditLog.resource_type).all()
    
    # Usuários mais ativos
    user_stats = db.query(
        AuditLog.performed_by,
        db.func.count(AuditLog.id).label('count')
    ).filter(
        AuditLog.created_at >= start_date
    ).group_by(AuditLog.performed_by).order_by(
        desc(db.func.count(AuditLog.id))
    ).limit(10).all()
    
    return {
        "period_days": days,
        "total_logs": total_logs,
        "actions": [{
            "action": action,
            "count": count
        } for action, count in actions_stats],
        "resource_types": [{
            "resource_type": resource_type,
            "count": count
        } for resource_type, count in resource_stats],
        "most_active_users": [{
            "user": user,
            "count": count
        } for user, count in user_stats]
    }


@router.delete("/cleanup")
def cleanup_old_logs(
    days_to_keep: int = 90,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_master)  # Apenas MASTER
):
    """
    Remove logs de auditoria mais antigos que N dias.
    Apenas MASTERs podem executar esta operação.
    """
    from datetime import timedelta
    
    if days_to_keep < 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível manter menos de 30 dias de logs"
        )
    
    cutoff_date = datetime.now() - timedelta(days=days_to_keep)
    
    # Contar logs que serão removidos
    logs_to_delete = db.query(AuditLog).filter(
        AuditLog.created_at < cutoff_date
    ).count()
    
    # Remover logs antigos
    deleted_count = db.query(AuditLog).filter(
        AuditLog.created_at < cutoff_date
    ).delete()
    
    db.commit()
    
    # Registrar a operação de limpeza
    cleanup_log = AuditLog(
        action="CLEANUP_LOGS",
        resource_type="audit_log",
        performed_by=current_user.email,
        description=f"Limpeza de logs antigos - {deleted_count} logs removidos",
        details={
            "days_to_keep": days_to_keep,
            "cutoff_date": cutoff_date.isoformat(),
            "deleted_count": deleted_count
        }
    )
    db.add(cleanup_log)
    db.commit()
    
    return {
        "message": f"Limpeza concluída: {deleted_count} logs removidos",
        "deleted_count": deleted_count,
        "cutoff_date": cutoff_date.isoformat()
    }