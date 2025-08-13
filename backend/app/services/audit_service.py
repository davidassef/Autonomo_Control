from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from fastapi import Request

from app.models.audit_log import AuditLog
from app.models.user import User


class AuditService:
    """Serviço para registrar logs de auditoria."""
    
    @staticmethod
    def log_action(
        db: Session,
        action: str,
        resource_type: str,
        performed_by: str,
        description: str,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ) -> AuditLog:
        """
        Registra uma ação no log de auditoria.
        
        Args:
            db: Sessão do banco de dados
            action: Ação realizada (ex: 'CREATE_USER', 'BLOCK_USER')
            resource_type: Tipo de recurso (ex: 'user', 'entry', 'category')
            performed_by: Email do usuário que realizou a ação
            description: Descrição legível da ação
            details: Detalhes adicionais em formato dict
            request: Request HTTP para extrair IP e User-Agent
        
        Returns:
            AuditLog: O log criado
        """
        ip_address = None
        user_agent = None
        
        if request:
            # Extrair IP (considerando proxies)
            ip_address = (
                request.headers.get("X-Forwarded-For", "")
                .split(",")[0]
                .strip()
            )
            if not ip_address:
                ip_address = request.headers.get("X-Real-IP")
            if not ip_address and hasattr(request, "client") and request.client:
                ip_address = request.client.host
            
            # Extrair User-Agent
            user_agent = request.headers.get("User-Agent")
        
        audit_log = AuditLog(
            action=action,
            resource_type=resource_type,
            performed_by=performed_by,
            performed_by_role="SYSTEM",  # Default role
            description=description,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        
        return audit_log
    
    @staticmethod
    def log_user_action(
        db: Session,
        action: str,
        target_user: User,
        performed_by: User,
        description: str,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ) -> AuditLog:
        """
        Registra uma ação relacionada a usuários.
        
        Args:
            db: Sessão do banco de dados
            action: Ação realizada
            target_user: Usuário alvo da ação
            performed_by: Usuário que realizou a ação
            description: Descrição da ação
            details: Detalhes adicionais
            request: Request HTTP
        
        Returns:
            AuditLog: O log criado
        """
        audit_details = {
            "target_user_id": target_user.id,
            "target_user_email": target_user.email,
            "target_user_name": target_user.name,
            "target_user_role": target_user.role,
            **(details or {})
        }
        
        audit_log = AuditLog(
            action=action,
            resource_type="user",
            performed_by=performed_by.email,
            performed_by_role=performed_by.role,
            description=description,
            details=audit_details,
            ip_address=None,
            user_agent=None
        )
        
        if request:
            # Extrair IP (considerando proxies)
            ip_address = (
                request.headers.get("X-Forwarded-For", "")
                .split(",")[0]
                .strip()
            )
            if not ip_address:
                ip_address = request.headers.get("X-Real-IP")
            if not ip_address and hasattr(request, "client") and request.client:
                ip_address = request.client.host
            
            # Extrair User-Agent
            user_agent = request.headers.get("User-Agent")
            
            audit_log.ip_address = ip_address
            audit_log.user_agent = user_agent
        
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        
        return audit_log
    
    @staticmethod
    def log_auth_action(
        db: Session,
        action: str,
        user_email: str,
        description: str,
        success: bool = True,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ) -> AuditLog:
        """
        Registra ações de autenticação.
        
        Args:
            db: Sessão do banco de dados
            action: Ação de autenticação (LOGIN, LOGOUT, etc.)
            user_email: Email do usuário
            description: Descrição da ação
            success: Se a ação foi bem-sucedida
            details: Detalhes adicionais
            request: Request HTTP
        
        Returns:
            AuditLog: O log criado
        """
        audit_details = {
            "success": success,
            **(details or {})
        }
        
        audit_log = AuditLog(
            action=action,
            resource_type="auth",
            performed_by=user_email,
            performed_by_role=details.get('role', 'USER') if details else 'USER',
            description=description,
            details=audit_details,
            ip_address=None,
            user_agent=None
        )
        
        if request:
            # Extrair IP (considerando proxies)
            ip_address = (
                request.headers.get("X-Forwarded-For", "")
                .split(",")[0]
                .strip()
            )
            if not ip_address:
                ip_address = request.headers.get("X-Real-IP")
            if not ip_address and hasattr(request, "client") and request.client:
                ip_address = request.client.host
            
            # Extrair User-Agent
            user_agent = request.headers.get("User-Agent")
            
            audit_log.ip_address = ip_address
            audit_log.user_agent = user_agent
        
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        
        return audit_log
    
    @staticmethod
    def log_system_action(
        db: Session,
        action: str,
        performed_by: str,
        description: str,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ) -> AuditLog:
        """
        Registra ações do sistema.
        
        Args:
            db: Sessão do banco de dados
            action: Ação do sistema
            performed_by: Usuário que realizou a ação
            description: Descrição da ação
            details: Detalhes adicionais
            request: Request HTTP
        
        Returns:
            AuditLog: O log criado
        """
        return AuditService.log_action(
            db=db,
            action=action,
            resource_type="system",
            performed_by=performed_by,
            description=description,
            details=details,
            request=request
        )


# Constantes para ações comuns
class AuditActions:
    """Constantes para ações de auditoria."""
    
    # Ações de usuário
    CREATE_USER = "CREATE_USER"
    UPDATE_USER = "UPDATE_USER"
    DELETE_USER = "DELETE_USER"
    BLOCK_USER = "BLOCK_USER"
    UNBLOCK_USER = "UNBLOCK_USER"
    CHANGE_USER_ROLE = "CHANGE_USER_ROLE"
    CHANGE_USER_STATUS = "CHANGE_USER_STATUS"
    RESET_USER_PASSWORD = "RESET_USER_PASSWORD"
    
    # Ações de autenticação
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    TOKEN_REFRESH = "TOKEN_REFRESH"
    
    # Ações de sistema
    SYSTEM_BACKUP = "SYSTEM_BACKUP"
    SYSTEM_RESTORE = "SYSTEM_RESTORE"
    CLEANUP_LOGS = "CLEANUP_LOGS"
    SYSTEM_CONFIG_CHANGE = "SYSTEM_CONFIG_CHANGE"
    
    # Ações de dados
    CREATE_ENTRY = "CREATE_ENTRY"
    UPDATE_ENTRY = "UPDATE_ENTRY"
    DELETE_ENTRY = "DELETE_ENTRY"
    
    CREATE_CATEGORY = "CREATE_CATEGORY"
    UPDATE_CATEGORY = "UPDATE_CATEGORY"
    DELETE_CATEGORY = "DELETE_CATEGORY"


class ResourceTypes:
    """Constantes para tipos de recursos."""
    
    USER = "user"
    ENTRY = "entry"
    CATEGORY = "category"
    AUTH = "auth"
    SYSTEM = "system"
    AUDIT_LOG = "audit_log"