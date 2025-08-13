from typing import Dict, List, Optional, Any
from datetime import datetime
import json
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.core.database import get_db
from app.models.system_config import SystemConfig

class SystemConfigService:
    """Serviço para gerenciar configurações do sistema."""
    
    def __init__(self, db: Session):
        self.db = db
        
        # Configurações padrão do sistema
        self.default_configs = {
            # Configurações gerais
            "app_name": {"value": "Autonomo Control", "type": "string", "category": "general", "public": True},
            "app_version": {"value": "1.0.0", "type": "string", "category": "general", "public": True},
            "maintenance_mode": {"value": False, "type": "boolean", "category": "general", "public": False},
            
            # Configurações de usuários
            "max_users": {"value": 1000, "type": "integer", "category": "users", "public": False},
            "allow_registration": {"value": True, "type": "boolean", "category": "users", "public": False},
            "default_user_role": {"value": "USER", "type": "string", "category": "users", "public": False},
            
            # Configurações de senha
            "password_min_length": {"value": 8, "type": "integer", "category": "security", "public": False},
            "password_require_uppercase": {"value": True, "type": "boolean", "category": "security", "public": False},
            "password_require_lowercase": {"value": True, "type": "boolean", "category": "security", "public": False},
            "password_require_numbers": {"value": True, "type": "boolean", "category": "security", "public": False},
            "password_require_symbols": {"value": False, "type": "boolean", "category": "security", "public": False},
            "temp_password_expiry_hours": {"value": 24, "type": "integer", "category": "security", "public": False},
            
            # Configurações de email
            "smtp_host": {"value": "", "type": "string", "category": "email", "public": False},
            "smtp_port": {"value": 587, "type": "integer", "category": "email", "public": False},
            "smtp_username": {"value": "", "type": "string", "category": "email", "public": False},
            "smtp_password": {"value": "", "type": "string", "category": "email", "public": False},
            "smtp_use_tls": {"value": True, "type": "boolean", "category": "email", "public": False},
            "email_from": {"value": "noreply@autonomocontrol.com", "type": "string", "category": "email", "public": False},
            
            # Configurações de backup
            "backup_enabled": {"value": True, "type": "boolean", "category": "backup", "public": False},
            "backup_frequency_hours": {"value": 24, "type": "integer", "category": "backup", "public": False},
            "backup_retention_days": {"value": 30, "type": "integer", "category": "backup", "public": False},
            "backup_path": {"value": "./backups", "type": "string", "category": "backup", "public": False},
            
            # Configurações de logs
            "log_level": {"value": "INFO", "type": "string", "category": "logging", "public": False},
            "log_retention_days": {"value": 90, "type": "integer", "category": "logging", "public": False},
            "audit_log_enabled": {"value": True, "type": "boolean", "category": "logging", "public": False},
            
            # Configurações de sessão
            "session_timeout_minutes": {"value": 480, "type": "integer", "category": "security", "public": False},
            "max_login_attempts": {"value": 5, "type": "integer", "category": "security", "public": False},
            "lockout_duration_minutes": {"value": 30, "type": "integer", "category": "security", "public": False},
        }
    
    def get_all_configs(self, category: Optional[str] = None, public_only: bool = False) -> Dict[str, Any]:
        """
        Retorna todas as configurações do sistema.
        Se não existirem configurações, retorna as configurações padrão.
        """
        try:
            query = self.db.query(SystemConfig).filter(SystemConfig.is_active == True)
            
            if category:
                query = query.filter(SystemConfig.category == category)
            
            if public_only:
                query = query.filter(SystemConfig.is_public == True)
            
            configs_from_db = query.all()
            
            # Começar com configurações padrão
            configs = {}
            for key, config_data in self.default_configs.items():
                if category and config_data["category"] != category:
                    continue
                if public_only and not config_data["public"]:
                    continue
                configs[key] = config_data["value"]
            
            # Sobrescrever com valores do banco
            for config in configs_from_db:
                configs[config.key] = self._parse_value(config.value, config.value_type)
            
            return configs
            
        except Exception as e:
            # Em caso de erro, retornar configurações padrão
            configs = {}
            for key, config_data in self.default_configs.items():
                if category and config_data["category"] != category:
                    continue
                if public_only and not config_data["public"]:
                    continue
                configs[key] = config_data["value"]
            return configs
    
    def get_config(self, key: str) -> Optional[Any]:
        """
        Retorna uma configuração específica.
        """
        try:
            config = self.db.query(SystemConfig).filter(
                and_(SystemConfig.key == key, SystemConfig.is_active == True)
            ).first()
            
            if config:
                return self._parse_value(config.value, config.value_type)
            
            # Se não encontrou no banco, retornar padrão
            if key in self.default_configs:
                return self.default_configs[key]["value"]
            
            return None
            
        except Exception as e:
            # Em caso de erro, retornar configuração padrão
            if key in self.default_configs:
                return self.default_configs[key]["value"]
            return None
    
    def update_config(self, key: str, value: Any, user_id: int) -> bool:
        """
        Atualiza uma configuração específica.
        """
        try:
            # Validar se a configuração é conhecida
            if key not in self.default_configs:
                return False
            
            # Determinar o tipo do valor
            value_type = self.default_configs[key]["type"]
            value_str = self._serialize_value(value, value_type)
            
            # Verificar se a configuração já existe
            existing_config = self.db.query(SystemConfig).filter(
                and_(SystemConfig.key == key, SystemConfig.is_active == True)
            ).first()
            
            if existing_config:
                # Atualizar configuração existente
                existing_config.value = value_str
                existing_config.value_type = value_type
                existing_config.updated_at = datetime.utcnow()
                existing_config.updated_by = user_id
            else:
                # Criar nova configuração
                config_data = self.default_configs[key]
                new_config = SystemConfig(
                    key=key,
                    value=value_str,
                    value_type=value_type,
                    category=config_data["category"],
                    is_public=config_data["public"],
                    created_by=user_id,
                    updated_by=user_id
                )
                self.db.add(new_config)
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            return False
    
    def update_multiple_configs(self, configs: Dict[str, Any], user_id: int) -> Dict[str, bool]:
        """
        Atualiza múltiplas configurações de uma vez.
        Retorna um dicionário com o resultado de cada atualização.
        """
        results = {}
        
        for key, value in configs.items():
            results[key] = self.update_config(key, value, user_id)
        
        return results
    
    def reset_to_defaults(self, user_id: int) -> bool:
        """
        Reseta todas as configurações para os valores padrão.
        """
        try:
            # Desativar todas as configurações existentes
            configs = self.db.query(SystemConfig).filter(SystemConfig.is_active == True).all()
            
            for config in configs:
                config.is_active = False
                config.updated_at = datetime.utcnow()
                config.updated_by = user_id
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            return False
    
    def get_config_history(self, key: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Retorna o histórico de alterações das configurações.
        """
        try:
            from app.models.user import User
            
            query = self.db.query(SystemConfig).join(
                User, SystemConfig.updated_by == User.id, isouter=True
            )
            
            if key:
                query = query.filter(SystemConfig.key == key)
            
            configs = query.order_by(SystemConfig.updated_at.desc()).limit(limit).all()
            
            history = []
            for config in configs:
                history.append({
                    'config_key': config.key,
                    'config_value': config.value,
                    'value_type': config.value_type,
                    'category': config.category,
                    'created_at': config.created_at.isoformat() if config.created_at else None,
                    'updated_at': config.updated_at.isoformat() if config.updated_at else None,
                    'is_active': config.is_active,
                    'updated_by': {
                        'name': config.updated_by_user.name if config.updated_by_user else None,
                        'email': config.updated_by_user.email if config.updated_by_user else None
                    }
                })
            
            return history
            
        except Exception as e:
            return []
    
    def validate_config_value(self, key: str, value: Any) -> tuple[bool, str]:
        """
        Valida se um valor de configuração é válido.
        Retorna (is_valid, error_message).
        """
        try:
            if key not in self.default_configs:
                return False, "Configuração não reconhecida"
            
            expected_type = self.default_configs[key]["type"]
            
            # Validar tipo
            if expected_type == "boolean" and not isinstance(value, bool):
                return False, f"Configuração {key} deve ser um valor booleano"
            elif expected_type == "integer" and not isinstance(value, int):
                return False, f"Configuração {key} deve ser um número inteiro"
            elif expected_type == "string" and not isinstance(value, str):
                return False, f"Configuração {key} deve ser uma string"
            
            # Validações específicas
            if key == "max_users" and value < 1:
                return False, "Número máximo de usuários deve ser positivo"
            
            if key == "password_min_length" and (value < 4 or value > 50):
                return False, "Comprimento mínimo da senha deve estar entre 4 e 50 caracteres"
            
            if key == "max_login_attempts" and (value < 1 or value > 20):
                return False, "Máximo de tentativas de login deve estar entre 1 e 20"
            
            if key == "session_timeout_minutes" and value < 5:
                return False, "Timeout de sessão deve ser pelo menos 5 minutos"
            
            if key == "lockout_duration_minutes" and value < 1:
                return False, "Duração do bloqueio deve ser pelo menos 1 minuto"
            
            if key in ["backup_retention_days", "log_retention_days"] and value < 1:
                return False, "Retenção deve ser pelo menos 1 dia"
            
            if key == "smtp_port" and (value < 1 or value > 65535):
                return False, "Porta SMTP deve estar entre 1 e 65535"
            
            if key == "temp_password_expiry_hours" and value < 1:
                return False, "Expiração de senha temporária deve ser pelo menos 1 hora"
            
            return True, ""
            
        except Exception as e:
            return False, f"Erro na validação: {str(e)}"
    
    def get_public_configs(self) -> Dict[str, Any]:
        """Retorna apenas as configurações públicas."""
        return self.get_all_configs(public_only=True)
    
    def get_configs_by_category(self, category: str) -> Dict[str, Any]:
        """Retorna configurações de uma categoria específica."""
        return self.get_all_configs(category=category)
    
    def initialize_default_configs(self, user_id: int) -> bool:
        """Inicializa as configurações padrão no banco de dados."""
        try:
            for key, config_data in self.default_configs.items():
                # Verificar se já existe
                existing = self.db.query(SystemConfig).filter(
                    and_(SystemConfig.key == key, SystemConfig.is_active == True)
                ).first()
                
                if not existing:
                    new_config = SystemConfig(
                        key=key,
                        value=self._serialize_value(config_data["value"], config_data["type"]),
                        value_type=config_data["type"],
                        category=config_data["category"],
                        is_public=config_data["public"],
                        created_by=user_id,
                        updated_by=user_id
                    )
                    self.db.add(new_config)
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            return False
    
    def _parse_value(self, value_str: str, value_type: str) -> Any:
        """Converte string do banco para o tipo correto."""
        try:
            if value_type == "boolean":
                return value_str.lower() == "true"
            elif value_type == "integer":
                return int(value_str)
            elif value_type == "float":
                return float(value_str)
            elif value_type == "json":
                return json.loads(value_str)
            else:  # string
                return value_str
        except:
            return value_str
    
    def _serialize_value(self, value: Any, value_type: str) -> str:
        """Converte valor para string para armazenar no banco."""
        if value_type == "boolean":
            return str(value).lower()
        elif value_type in ["integer", "float"]:
            return str(value)
        elif value_type == "json":
            return json.dumps(value)
        else:  # string
            return str(value)