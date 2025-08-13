from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from fastapi import HTTPException, status

from app.models.user import User
from app.services.audit_service import AuditService

class HierarchyService:
    """
    Serviço para gerenciar hierarquia de usuários e controles de visibilidade.
    
    Regras de hierarquia:
    - MASTER: Controle total, pode ver e gerenciar todos os usuários
    - ADMIN: Pode ver apenas usuários USER por padrão, a menos que MASTER permita ver outros ADMINs
    - USER: Usuário comum, sem privilégios administrativos
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_visible_users(self, current_user: User, filters: dict = None) -> List[User]:
        """
        Retorna lista de usuários visíveis para o usuário atual baseado na hierarquia.
        
        Args:
            current_user: Usuário fazendo a consulta
            filters: Filtros opcionais (role, active, etc.)
        
        Returns:
            Lista de usuários visíveis
        """
        query = self.db.query(User)
        
        # Aplicar regras de visibilidade baseadas na hierarquia
        if current_user.role == "MASTER":
            # MASTER pode ver todos os usuários
            pass
        elif current_user.role == "ADMIN":
            # ADMIN pode ver:
            # 1. Todos os usuários USER
            # 2. Outros ADMINs apenas se can_view_admins = True
            # 3. Nunca pode ver usuários MASTER
            if current_user.can_view_admins:
                query = query.filter(User.role.in_(["USER", "ADMIN"]))
            else:
                query = query.filter(User.role == "USER")
        else:
            # USER comum não pode ver outros usuários (apenas através de endpoints específicos)
            query = query.filter(User.id == current_user.id)
        
        # Aplicar filtros adicionais se fornecidos
        if filters:
            if filters.get("role"):
                query = query.filter(User.role == filters["role"])
            if filters.get("active") is not None:
                query = query.filter(User.is_active == filters["active"])
            if filters.get("blocked") is not None:
                if filters["blocked"]:
                    query = query.filter(User.blocked_at.isnot(None))
                else:
                    query = query.filter(User.blocked_at.is_(None))
            if filters.get("can_view_admins") is not None:
                query = query.filter(User.can_view_admins == filters["can_view_admins"])
        
        return query.order_by(User.created_at.desc()).all()
    
    def can_manage_user(self, manager: User, target_user: User) -> bool:
        """
        Verifica se um usuário pode gerenciar outro usuário.
        
        Args:
            manager: Usuário que quer gerenciar
            target_user: Usuário alvo
        
        Returns:
            True se pode gerenciar, False caso contrário
        """
        # MASTER pode gerenciar todos exceto outros MASTERs
        if manager.role == "MASTER":
            return target_user.role != "MASTER" or manager.id == target_user.id
        
        # ADMIN pode gerenciar apenas usuários USER
        if manager.role == "ADMIN":
            return target_user.role == "USER"
        
        # USER não pode gerenciar ninguém
        return False
    
    def promote_to_admin(self, master_user: User, target_user: User, reason: str = None) -> User:
        """
        Promove um usuário USER para ADMIN.
        
        Args:
            master_user: Usuário MASTER fazendo a promoção
            target_user: Usuário sendo promovido
            reason: Motivo da promoção
        
        Returns:
            Usuário atualizado
        """
        if master_user.role != "MASTER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas usuários MASTER podem promover usuários"
            )
        
        if target_user.role != "USER":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas usuários USER podem ser promovidos para ADMIN"
            )
        
        # Atualizar usuário
        target_user.role = "ADMIN"
        target_user.promoted_by = master_user.id
        target_user.updated_at = datetime.utcnow()
        
        # Registrar auditoria
        AuditService.log_user_action(
            db=self.db,
            action="PROMOTE_TO_ADMIN",
            target_user=target_user,
            performed_by=master_user,
            description=f"Usuário {target_user.email} promovido para ADMIN",
            details={
                "from_role": "USER",
                "to_role": "ADMIN",
                "reason": reason
            }
        )
        
        self.db.commit()
        self.db.refresh(target_user)
        return target_user
    
    def demote_to_user(self, master_user: User, target_user: User, reason: str = None) -> User:
        """
        Rebaixa um usuário ADMIN para USER.
        
        Args:
            master_user: Usuário MASTER fazendo o rebaixamento
            target_user: Usuário sendo rebaixado
            reason: Motivo do rebaixamento
        
        Returns:
            Usuário atualizado
        """
        if master_user.role != "MASTER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas usuários MASTER podem rebaixar usuários"
            )
        
        if target_user.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas usuários ADMIN podem ser rebaixados para USER"
            )
        
        # Atualizar usuário
        target_user.role = "USER"
        target_user.demoted_by = master_user.id
        target_user.demoted_at = datetime.utcnow()
        target_user.can_view_admins = False  # Remover permissão de ver ADMINs
        target_user.updated_at = datetime.utcnow()
        
        # Registrar auditoria
        AuditService.log_user_action(
            db=self.db,
            action="DEMOTE_TO_USER",
            target_user=target_user,
            performed_by=master_user,
            description=f"Usuário {target_user.email} rebaixado para USER",
            details={
                "from_role": "ADMIN",
                "to_role": "USER",
                "reason": reason
            }
        )
        
        self.db.commit()
        self.db.refresh(target_user)
        return target_user
    
    def toggle_admin_visibility(self, master_user: User, target_admin: User, can_view: bool) -> User:
        """
        Controla se um ADMIN pode ver outras contas ADMIN.
        
        Args:
            master_user: Usuário MASTER fazendo a alteração
            target_admin: Usuário ADMIN sendo alterado
            can_view: Se pode ver outras contas ADMIN
        
        Returns:
            Usuário atualizado
        """
        if master_user.role != "MASTER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas usuários MASTER podem alterar permissões de visibilidade"
            )
        
        if target_admin.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas usuários ADMIN podem ter permissões de visibilidade alteradas"
            )
        
        # Atualizar permissão
        target_admin.can_view_admins = can_view
        target_admin.updated_at = datetime.utcnow()
        
        # Registrar auditoria
        AuditService.log_user_action(
            db=self.db,
            action="TOGGLE_ADMIN_VISIBILITY",
            target_user=target_admin,
            performed_by=master_user,
            description=f"Permissão de visibilidade alterada para {target_admin.email}",
            details={
                "can_view_admins": can_view
            }
        )
        
        self.db.commit()
        self.db.refresh(target_admin)
        return target_admin
    
    def block_user(self, manager_user: User, target_user: User, reason: str = None) -> User:
        """
        Bloqueia um usuário.
        
        Args:
            manager_user: Usuário fazendo o bloqueio (ADMIN ou MASTER)
            target_user: Usuário sendo bloqueado
            reason: Motivo do bloqueio
        
        Returns:
            Usuário atualizado
        """
        if not self.can_manage_user(manager_user, target_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para bloquear este usuário"
            )
        
        if target_user.blocked_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário já está bloqueado"
            )
        
        # Bloquear usuário
        target_user.blocked_at = datetime.utcnow()
        target_user.blocked_by = manager_user.id
        target_user.is_active = False
        target_user.updated_at = datetime.utcnow()
        
        # Registrar auditoria
        AuditService.log_user_action(
            db=self.db,
            action="BLOCK_USER",
            target_user=target_user,
            performed_by=manager_user,
            description=f"Usuário {target_user.email} bloqueado",
            details={
                "reason": reason
            }
        )
        
        self.db.commit()
        self.db.refresh(target_user)
        return target_user
    
    def unblock_user(self, manager_user: User, target_user: User, reason: str = None) -> User:
        """
        Desbloqueia um usuário.
        
        Args:
            manager_user: Usuário fazendo o desbloqueio (ADMIN ou MASTER)
            target_user: Usuário sendo desbloqueado
            reason: Motivo do desbloqueio
        
        Returns:
            Usuário atualizado
        """
        if not self.can_manage_user(manager_user, target_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para desbloquear este usuário"
            )
        
        if not target_user.blocked_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário não está bloqueado"
            )
        
        # Desbloquear usuário
        target_user.blocked_at = None
        target_user.blocked_by = None
        target_user.is_active = True
        target_user.updated_at = datetime.utcnow()
        
        # Registrar auditoria
        AuditService.log_user_action(
            db=self.db,
            action="UNBLOCK_USER",
            target_user=target_user,
            performed_by=manager_user,
            description=f"Usuário {target_user.email} desbloqueado",
            details={
                "reason": reason
            }
        )
        
        self.db.commit()
        self.db.refresh(target_user)
        return target_user