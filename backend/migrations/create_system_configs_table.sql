-- Criação da tabela system_configs para configurações do sistema
CREATE TABLE IF NOT EXISTS system_configs (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    value_type TEXT NOT NULL DEFAULT 'string',
    description TEXT,
    category TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    default_value TEXT,
    config_metadata TEXT, -- JSON como texto
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key);
CREATE INDEX IF NOT EXISTS idx_system_configs_category ON system_configs(category);
CREATE INDEX IF NOT EXISTS idx_system_configs_is_active ON system_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_system_configs_is_public ON system_configs(is_public);

-- Inserir configurações padrão do sistema
INSERT OR IGNORE INTO system_configs (id, key, value, value_type, description, category, is_public, default_value) VALUES
-- Configurações gerais
('cfg_app_name', 'app_name', 'Autonomo Control', 'string', 'Nome da aplicação', 'general', 'true', 'Autonomo Control'),
('cfg_app_version', 'app_version', '1.0.0', 'string', 'Versão da aplicação', 'general', 'true', '1.0.0'),
('cfg_maintenance_mode', 'maintenance_mode', 'false', 'boolean', 'Modo de manutenção ativo', 'general', 'false', 'false'),

-- Configurações de usuários
('cfg_max_users', 'max_users', '1000', 'integer', 'Número máximo de usuários', 'users', 'false', '1000'),
('cfg_allow_registration', 'allow_registration', 'true', 'boolean', 'Permitir registro de novos usuários', 'users', 'false', 'true'),
('cfg_default_user_role', 'default_user_role', 'USER', 'string', 'Role padrão para novos usuários', 'users', 'false', 'USER'),

-- Configurações de senha
('cfg_password_min_length', 'password_min_length', '8', 'integer', 'Comprimento mínimo da senha', 'security', 'false', '8'),
('cfg_password_require_uppercase', 'password_require_uppercase', 'true', 'boolean', 'Exigir letra maiúscula na senha', 'security', 'false', 'true'),
('cfg_password_require_lowercase', 'password_require_lowercase', 'true', 'boolean', 'Exigir letra minúscula na senha', 'security', 'false', 'true'),
('cfg_password_require_numbers', 'password_require_numbers', 'true', 'boolean', 'Exigir números na senha', 'security', 'false', 'true'),
('cfg_password_require_symbols', 'password_require_symbols', 'false', 'boolean', 'Exigir símbolos na senha', 'security', 'false', 'false'),
('cfg_temp_password_expiry_hours', 'temp_password_expiry_hours', '24', 'integer', 'Horas para expiração de senha temporária', 'security', 'false', '24'),

-- Configurações de email
('cfg_smtp_host', 'smtp_host', '', 'string', 'Servidor SMTP', 'email', 'false', ''),
('cfg_smtp_port', 'smtp_port', '587', 'integer', 'Porta SMTP', 'email', 'false', '587'),
('cfg_smtp_username', 'smtp_username', '', 'string', 'Usuário SMTP', 'email', 'false', ''),
('cfg_smtp_password', 'smtp_password', '', 'string', 'Senha SMTP', 'email', 'false', ''),
('cfg_smtp_use_tls', 'smtp_use_tls', 'true', 'boolean', 'Usar TLS no SMTP', 'email', 'false', 'true'),
('cfg_email_from', 'email_from', 'noreply@autonomocontrol.com', 'string', 'Email remetente padrão', 'email', 'false', 'noreply@autonomocontrol.com'),

-- Configurações de backup
('cfg_backup_enabled', 'backup_enabled', 'true', 'boolean', 'Backup automático habilitado', 'backup', 'false', 'true'),
('cfg_backup_frequency_hours', 'backup_frequency_hours', '24', 'integer', 'Frequência de backup em horas', 'backup', 'false', '24'),
('cfg_backup_retention_days', 'backup_retention_days', '30', 'integer', 'Dias para manter backups', 'backup', 'false', '30'),
('cfg_backup_path', 'backup_path', './backups', 'string', 'Caminho para armazenar backups', 'backup', 'false', './backups'),

-- Configurações de logs
('cfg_log_level', 'log_level', 'INFO', 'string', 'Nível de log do sistema', 'logging', 'false', 'INFO'),
('cfg_log_retention_days', 'log_retention_days', '90', 'integer', 'Dias para manter logs', 'logging', 'false', '90'),
('cfg_audit_log_enabled', 'audit_log_enabled', 'true', 'boolean', 'Log de auditoria habilitado', 'logging', 'false', 'true'),

-- Configurações de sessão
('cfg_session_timeout_minutes', 'session_timeout_minutes', '480', 'integer', 'Timeout de sessão em minutos', 'security', 'false', '480'),
('cfg_max_login_attempts', 'max_login_attempts', '5', 'integer', 'Máximo de tentativas de login', 'security', 'false', '5'),
('cfg_lockout_duration_minutes', 'lockout_duration_minutes', '30', 'integer', 'Duração do bloqueio em minutos', 'security', 'false', '30');