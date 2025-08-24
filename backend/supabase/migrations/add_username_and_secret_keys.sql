-- Migração para adicionar suporte a username e chaves secretas para recuperação de senha do Master
-- Data: $(date)
-- Descrição: Adiciona campo username e sistema de chaves secretas para conta Master única

-- Adicionar campo username à tabela users
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;

-- Adicionar campos para chaves secretas
ALTER TABLE users ADD COLUMN secret_key_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN secret_key_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN secret_key_used_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para username
CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN users.username IS 'Nome de usuário único, usado principalmente para conta Master';
COMMENT ON COLUMN users.secret_key_hash IS 'Hash da chave secreta para recuperação de senha (apenas Master)';
COMMENT ON COLUMN users.secret_key_created_at IS 'Data de criação da chave secreta';
COMMENT ON COLUMN users.secret_key_used_at IS 'Data da última utilização da chave secreta';

-- Inserir ou atualizar a conta Master única
-- Primeiro, converter todas as contas Master existentes para Admin
UPDATE users 
SET role = 'ADMIN' 
WHERE role = 'MASTER';

-- Criar a nova conta Master única
INSERT INTO users (
    id,
    email,
    username,
    name,
    role,
    hashed_password,
    is_active,
    created_at
) VALUES (
    'master-unique-id-' || EXTRACT(EPOCH FROM NOW())::text,
    'master@autonomocontrol.system',
    'masterautonomocontrol',
    'Master do Sistema',
    'MASTER',
    '$2b$12$LQv3c1yqBWVHxkd0LQ4YCOdHrwku1Aob0NEVkn5OHEM9bdks9Tl2O', -- Hash de 'Senhamaster123'
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    hashed_password = EXCLUDED.hashed_password,
    updated_at = NOW();

-- Garantir que apenas uma conta Master existe
-- Esta constraint será aplicada via código, não via SQL para flexibilidade