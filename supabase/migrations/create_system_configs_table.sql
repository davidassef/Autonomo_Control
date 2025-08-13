-- Criação da tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL DEFAULT 'string', -- 'string', 'integer', 'float', 'boolean', 'json'
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(config_key);
CREATE INDEX IF NOT EXISTS idx_system_configs_active ON system_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_system_configs_key_active ON system_configs(config_key, is_active);

-- Constraint para garantir que não haja chaves duplicadas ativas
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_configs_unique_active_key 
ON system_configs(config_key) WHERE is_active = true;

-- Comentários na tabela
COMMENT ON TABLE system_configs IS 'Configurações do sistema gerenciadas por usuários MASTER';
COMMENT ON COLUMN system_configs.config_key IS 'Chave única da configuração';
COMMENT ON COLUMN system_configs.config_value IS 'Valor da configuração armazenado como texto';
COMMENT ON COLUMN system_configs.value_type IS 'Tipo do valor para conversão correta';
COMMENT ON COLUMN system_configs.description IS 'Descrição da configuração';
COMMENT ON COLUMN system_configs.is_active IS 'Indica se a configuração está ativa';

-- Inserir algumas configurações padrão
INSERT INTO system_configs (config_key, config_value, value_type, description, created_by, updated_by) 
VALUES 
    ('app_name', 'Autônomo Control', 'string', 'Nome da aplicação', 1, 1),
    ('app_version', '1.0.0', 'string', 'Versão da aplicação', 1, 1),
    ('maintenance_mode', 'false', 'boolean', 'Modo de manutenção ativo', 1, 1),
    ('max_users', '1000', 'integer', 'Número máximo de usuários permitidos', 1, 1),
    ('session_timeout', '3600', 'integer', 'Timeout da sessão em segundos', 1, 1),
    ('password_min_length', '8', 'integer', 'Comprimento mínimo da senha', 1, 1),
    ('password_require_uppercase', 'true', 'boolean', 'Senha deve conter maiúsculas', 1, 1),
    ('password_require_lowercase', 'true', 'boolean', 'Senha deve conter minúsculas', 1, 1),
    ('password_require_numbers', 'true', 'boolean', 'Senha deve conter números', 1, 1),
    ('password_require_symbols', 'false', 'boolean', 'Senha deve conter símbolos', 1, 1),
    ('max_login_attempts', '5', 'integer', 'Máximo de tentativas de login', 1, 1),
    ('account_lockout_duration', '1800', 'integer', 'Duração do bloqueio em segundos', 1, 1),
    ('backup_retention_days', '30', 'integer', 'Dias de retenção de backup', 1, 1),
    ('log_retention_days', '90', 'integer', 'Dias de retenção de logs', 1, 1),
    ('email_notifications_enabled', 'true', 'boolean', 'Notificações por email habilitadas', 1, 1),
    ('audit_log_enabled', 'true', 'boolean', 'Log de auditoria habilitado', 1, 1),
    ('file_upload_max_size', '10485760', 'integer', 'Tamanho máximo de upload em bytes', 1, 1),
    ('allowed_file_types', '["jpg", "jpeg", "png", "pdf", "doc", "docx", "xls", "xlsx"]', 'json', 'Tipos de arquivo permitidos', 1, 1),
    ('timezone', 'America/Sao_Paulo', 'string', 'Fuso horário do sistema', 1, 1),
    ('date_format', 'dd/MM/yyyy', 'string', 'Formato de data padrão', 1, 1),
    ('currency', 'BRL', 'string', 'Moeda padrão', 1, 1),
    ('decimal_places', '2', 'integer', 'Casas decimais para valores monetários', 1, 1),
    ('theme', 'light', 'string', 'Tema padrão da interface', 1, 1),
    ('language', 'pt-BR', 'string', 'Idioma padrão', 1, 1)
ON CONFLICT (config_key) WHERE is_active = true DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- Política para usuários MASTER (podem ver e modificar tudo)
CREATE POLICY "MASTER can manage system configs" ON system_configs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::integer 
            AND users.role = 'MASTER'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::integer 
            AND users.role = 'MASTER'
        )
    );

-- Política para outros usuários (apenas leitura de configurações públicas)
CREATE POLICY "Users can read public system configs" ON system_configs
    FOR SELECT
    TO authenticated
    USING (
        is_active = true 
        AND config_key NOT IN (
            'maintenance_mode', 'max_users', 'session_timeout',
            'max_login_attempts', 'account_lockout_duration',
            'backup_retention_days', 'log_retention_days'
        )
    );

-- Conceder permissões
GRANT SELECT ON system_configs TO authenticated;
GRANT ALL PRIVILEGES ON system_configs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE system_configs_id_seq TO authenticated;