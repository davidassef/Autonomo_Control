from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, date

from app.models.user import User
from app.models.entry import Entry
from app.models.audit_log import AuditLog


class SystemReportsService:
    """Serviço para gerar relatórios e estatísticas do sistema."""
    
    @staticmethod
    def get_user_statistics(db: Session, days: int = 30) -> Dict[str, Any]:
        """Retorna estatísticas de usuários do sistema."""
        start_date = datetime.now() - timedelta(days=days)
        
        # Total de usuários
        total_users = db.query(User).count()
        
        # Usuários ativos (que criaram entradas nos últimos N dias)
        active_users = db.query(func.count(func.distinct(Entry.user_id))).filter(
            Entry.created_at >= start_date
        ).scalar() or 0
        
        # Novos usuários no período
        new_users = db.query(User).filter(
            User.created_at >= start_date
        ).count()
        
        # Usuários por role
        users_by_role = db.query(
            User.role,
            func.count(User.id).label('count')
        ).group_by(User.role).all()
        
        # Usuários bloqueados
        blocked_users = db.query(User).filter(
            User.blocked_at.isnot(None)
        ).count()
        
        # Top 10 usuários mais ativos (por número de entradas)
        most_active_users = db.query(
            User.email,
            User.name,
            func.count(Entry.id).label('entries_count')
        ).join(Entry, User.id == Entry.user_id).filter(
            Entry.created_at >= start_date
        ).group_by(User.id, User.email, User.name).order_by(
            desc(func.count(Entry.id))
        ).limit(10).all()
        
        return {
            "period_days": days,
            "total_users": total_users,
            "active_users": active_users,
            "new_users": new_users,
            "blocked_users": blocked_users,
            "users_by_role": [{
                "role": role,
                "count": count
            } for role, count in users_by_role],
            "most_active_users": [{
                "email": email,
                "name": name,
                "entries_count": entries_count
            } for email, name, entries_count in most_active_users]
        }
    
    @staticmethod
    def get_system_usage_statistics(db: Session, days: int = 30) -> Dict[str, Any]:
        """Retorna estatísticas de uso do sistema."""
        start_date = datetime.now() - timedelta(days=days)
        
        # Total de entradas no período
        total_entries = db.query(Entry).filter(
            Entry.created_at >= start_date
        ).count()
        
        # Entradas por tipo
        entries_by_type = db.query(
            Entry.type,
            func.count(Entry.id).label('count'),
            func.sum(Entry.amount).label('total_amount')
        ).filter(
            Entry.created_at >= start_date
        ).group_by(Entry.type).all()
        
        # Atividade diária (últimos 30 dias)
        daily_activity = db.query(
            func.date(Entry.created_at).label('date'),
            func.count(Entry.id).label('entries_count'),
            func.count(func.distinct(Entry.user_id)).label('active_users')
        ).filter(
            Entry.created_at >= start_date
        ).group_by(func.date(Entry.created_at)).order_by(
            func.date(Entry.created_at)
        ).all()
        
        # Logs de auditoria no período
        audit_logs_count = db.query(AuditLog).filter(
            AuditLog.created_at >= start_date
        ).count()
        
        # Ações mais comuns nos logs
        common_actions = db.query(
            AuditLog.action,
            func.count(AuditLog.id).label('count')
        ).filter(
            AuditLog.created_at >= start_date
        ).group_by(AuditLog.action).order_by(
            desc(func.count(AuditLog.id))
        ).limit(10).all()
        
        return {
            "period_days": days,
            "total_entries": total_entries,
            "entries_by_type": [{
                "type": entry_type,
                "count": count,
                "total_amount": float(total_amount or 0)
            } for entry_type, count, total_amount in entries_by_type],
            "daily_activity": [{
                "date": str(date),
                "entries_count": entries_count,
                "active_users": active_users
            } for date, entries_count, active_users in daily_activity],
            "audit_logs_count": audit_logs_count,
            "common_actions": [{
                "action": action,
                "count": count
            } for action, count in common_actions]
        }
    
    @staticmethod
    def get_financial_overview(db: Session, days: int = 30) -> Dict[str, Any]:
        """Retorna visão geral financeira do sistema."""
        start_date = datetime.now() - timedelta(days=days)
        
        # Totais por tipo
        financial_summary = db.query(
            Entry.type,
            func.count(Entry.id).label('count'),
            func.sum(Entry.amount).label('total_amount'),
            func.avg(Entry.amount).label('avg_amount'),
            func.min(Entry.amount).label('min_amount'),
            func.max(Entry.amount).label('max_amount')
        ).filter(
            Entry.created_at >= start_date
        ).group_by(Entry.type).all()
        
        # Evolução mensal (últimos 12 meses)
        twelve_months_ago = datetime.now() - timedelta(days=365)
        monthly_evolution = db.query(
            func.extract('year', Entry.created_at).label('year'),
            func.extract('month', Entry.created_at).label('month'),
            Entry.type,
            func.sum(Entry.amount).label('total_amount'),
            func.count(Entry.id).label('count')
        ).filter(
            Entry.created_at >= twelve_months_ago
        ).group_by(
            func.extract('year', Entry.created_at),
            func.extract('month', Entry.created_at),
            Entry.type
        ).order_by(
            func.extract('year', Entry.created_at),
            func.extract('month', Entry.created_at)
        ).all()
        
        # Top categorias por volume
        top_categories = db.query(
            Entry.category_name,
            Entry.type,
            func.count(Entry.id).label('count'),
            func.sum(Entry.amount).label('total_amount')
        ).filter(
            Entry.created_at >= start_date
        ).group_by(Entry.category_name, Entry.type).order_by(
            desc(func.sum(Entry.amount))
        ).limit(20).all()
        
        return {
            "period_days": days,
            "financial_summary": [{
                "type": entry_type,
                "count": count,
                "total_amount": float(total_amount or 0),
                "avg_amount": float(avg_amount or 0),
                "min_amount": float(min_amount or 0),
                "max_amount": float(max_amount or 0)
            } for entry_type, count, total_amount, avg_amount, min_amount, max_amount in financial_summary],
            "monthly_evolution": [{
                "year": int(year),
                "month": int(month),
                "type": entry_type,
                "total_amount": float(total_amount or 0),
                "count": count
            } for year, month, entry_type, total_amount, count in monthly_evolution],
            "top_categories": [{
                "category_name": category_name,
                "type": entry_type,
                "count": count,
                "total_amount": float(total_amount or 0)
            } for category_name, entry_type, count, total_amount in top_categories]
        }
    
    @staticmethod
    def get_system_health_metrics(db: Session) -> Dict[str, Any]:
        """Retorna métricas de saúde do sistema."""
        now = datetime.now()
        
        # Últimas 24 horas
        last_24h = now - timedelta(hours=24)
        
        # Últimos 7 dias
        last_7d = now - timedelta(days=7)
        
        # Atividade nas últimas 24h
        activity_24h = {
            "new_entries": db.query(Entry).filter(Entry.created_at >= last_24h).count(),
            "active_users": db.query(func.count(func.distinct(Entry.user_id))).filter(
                Entry.created_at >= last_24h
            ).scalar() or 0,
            "audit_logs": db.query(AuditLog).filter(AuditLog.created_at >= last_24h).count()
        }
        
        # Atividade nos últimos 7 dias
        activity_7d = {
            "new_entries": db.query(Entry).filter(Entry.created_at >= last_7d).count(),
            "active_users": db.query(func.count(func.distinct(Entry.user_id))).filter(
                Entry.created_at >= last_7d
            ).scalar() or 0,
            "new_users": db.query(User).filter(User.created_at >= last_7d).count(),
            "audit_logs": db.query(AuditLog).filter(AuditLog.created_at >= last_7d).count()
        }
        
        # Estatísticas gerais
        general_stats = {
            "total_users": db.query(User).count(),
            "total_entries": db.query(Entry).count(),
            "total_audit_logs": db.query(AuditLog).count(),
            "blocked_users": db.query(User).filter(User.blocked_at.isnot(None)).count()
        }
        
        return {
            "timestamp": now.isoformat(),
            "activity_24h": activity_24h,
            "activity_7d": activity_7d,
            "general_stats": general_stats
        }
    
    @staticmethod
    def get_user_engagement_report(db: Session, days: int = 30) -> Dict[str, Any]:
        """Retorna relatório de engajamento dos usuários."""
        start_date = datetime.now() - timedelta(days=days)
        
        # Usuários por frequência de uso
        user_activity = db.query(
            User.id,
            User.email,
            User.name,
            func.count(Entry.id).label('entries_count'),
            func.max(Entry.created_at).label('last_entry'),
            func.min(Entry.created_at).label('first_entry')
        ).outerjoin(Entry, and_(
            User.id == Entry.user_id,
            Entry.created_at >= start_date
        )).group_by(User.id, User.email, User.name).all()
        
        # Classificar usuários por engajamento
        highly_engaged = []  # 20+ entradas
        moderately_engaged = []  # 5-19 entradas
        low_engaged = []  # 1-4 entradas
        inactive = []  # 0 entradas
        
        for user_id, email, name, entries_count, last_entry, first_entry in user_activity:
            user_data = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "entries_count": entries_count or 0,
                "last_entry": last_entry.isoformat() if last_entry else None,
                "first_entry": first_entry.isoformat() if first_entry else None
            }
            
            if entries_count >= 20:
                highly_engaged.append(user_data)
            elif entries_count >= 5:
                moderately_engaged.append(user_data)
            elif entries_count >= 1:
                low_engaged.append(user_data)
            else:
                inactive.append(user_data)
        
        return {
            "period_days": days,
            "engagement_summary": {
                "highly_engaged": len(highly_engaged),
                "moderately_engaged": len(moderately_engaged),
                "low_engaged": len(low_engaged),
                "inactive": len(inactive)
            },
            "highly_engaged_users": highly_engaged[:10],  # Top 10
            "inactive_users": inactive[:20]  # Primeiros 20
        }