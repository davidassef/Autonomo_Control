from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.dependencies import get_current_admin, get_current_master
from app.models.user import User
from app.services.system_reports_service import SystemReportsService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/system-reports", tags=["system-reports"])


@router.get("/users")
def get_user_statistics(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> Dict[str, Any]:
    """
    Retorna estatísticas de usuários do sistema.
    Apenas ADMINs e MASTERs podem acessar.
    """
    if days < 1 or days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O período deve estar entre 1 e 365 dias",
        )

    # Registrar acesso ao relatório
    AuditService.log_system_action(
        db=db,
        action="VIEW_USER_STATISTICS",
        performed_by=current_user.email,
        description=f"Visualização de estatísticas de usuários ({days} dias)",
        details={"period_days": days},
    )

    return SystemReportsService.get_user_statistics(db, days)


@router.get("/usage")
def get_system_usage_statistics(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> Dict[str, Any]:
    """
    Retorna estatísticas de uso do sistema.
    Apenas ADMINs e MASTERs podem acessar.
    """
    if days < 1 or days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O período deve estar entre 1 e 365 dias",
        )

    # Registrar acesso ao relatório
    AuditService.log_system_action(
        db=db,
        action="VIEW_USAGE_STATISTICS",
        performed_by=current_user.email,
        description=f"Visualização de estatísticas de uso ({days} dias)",
        details={"period_days": days},
    )

    return SystemReportsService.get_system_usage_statistics(db, days)


@router.get("/financial")
def get_financial_overview(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> Dict[str, Any]:
    """
    Retorna visão geral financeira do sistema.
    Apenas ADMINs e MASTERs podem acessar.
    """
    if days < 1 or days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O período deve estar entre 1 e 365 dias",
        )

    # Registrar acesso ao relatório
    AuditService.log_system_action(
        db=db,
        action="VIEW_FINANCIAL_OVERVIEW",
        performed_by=current_user.email,
        description=f"Visualização de visão geral financeira ({days} dias)",
        details={"period_days": days},
    )

    return SystemReportsService.get_financial_overview(db, days)


@router.get("/health")
def get_system_health_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_master),  # Apenas MASTER
) -> Dict[str, Any]:
    """
    Retorna métricas de saúde do sistema.
    Apenas MASTERs podem acessar.
    """
    # Registrar acesso ao relatório
    AuditService.log_system_action(
        db=db,
        action="VIEW_SYSTEM_HEALTH",
        performed_by=current_user.email,
        description="Visualização de métricas de saúde do sistema",
    )

    return SystemReportsService.get_system_health_metrics(db)


@router.get("/engagement")
def get_user_engagement_report(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> Dict[str, Any]:
    """
    Retorna relatório de engajamento dos usuários.
    Apenas ADMINs e MASTERs podem acessar.
    """
    if days < 1 or days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O período deve estar entre 1 e 365 dias",
        )

    # Registrar acesso ao relatório
    AuditService.log_system_action(
        db=db,
        action="VIEW_ENGAGEMENT_REPORT",
        performed_by=current_user.email,
        description=f"Visualização de relatório de engajamento ({days} dias)",
        details={"period_days": days},
    )

    return SystemReportsService.get_user_engagement_report(db, days)


@router.get("/dashboard")
def get_admin_dashboard_data(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)
) -> Dict[str, Any]:
    """
    Retorna dados consolidados para o dashboard administrativo.
    Apenas ADMINs e MASTERs podem acessar.
    """
    # Registrar acesso ao dashboard
    AuditService.log_system_action(
        db=db,
        action="VIEW_ADMIN_DASHBOARD",
        performed_by=current_user.email,
        description="Visualização do dashboard administrativo",
    )

    # Coletar dados de diferentes relatórios
    user_stats = SystemReportsService.get_user_statistics(db, 30)
    usage_stats = SystemReportsService.get_system_usage_statistics(db, 30)
    health_metrics = SystemReportsService.get_system_health_metrics(db)

    # Dados específicos para o dashboard
    dashboard_data = {
        "summary": {
            "total_users": user_stats["total_users"],
            "active_users_30d": user_stats["active_users"],
            "new_users_30d": user_stats["new_users"],
            "blocked_users": user_stats["blocked_users"],
            "total_entries_30d": usage_stats["total_entries"],
            "audit_logs_30d": usage_stats["audit_logs_count"],
        },
        "activity_24h": health_metrics["activity_24h"],
        "activity_7d": health_metrics["activity_7d"],
        "users_by_role": user_stats["users_by_role"],
        "entries_by_type": usage_stats["entries_by_type"],
        "daily_activity": usage_stats["daily_activity"][-7:],  # Últimos 7 dias
        "most_active_users": user_stats["most_active_users"][:5],  # Top 5
        "common_actions": usage_stats["common_actions"][:5],  # Top 5
    }

    return dashboard_data
