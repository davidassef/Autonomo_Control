-- Migração para adicionar controles de hierarquia e visibilidade
-- Data: 2024-01-15
-- Descrição: Adiciona campos para controlar visibilidade entre MASTER/ADMIN e rastreamento de promoções/rebaixamentos
-- Compatível com SQLite

-- Adicionar novos campos de controle de hierarquia
ALTER TABLE users ADD COLUMN can_view_admins BOOLEAN DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN promoted_by TEXT NULL;
ALTER TABLE users ADD COLUMN demoted_by TEXT NULL;
ALTER TABLE users ADD COLUMN demoted_at TEXT NULL;

-- Índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_users_can_view_admins ON users(can_view_admins);
CREATE INDEX IF NOT EXISTS idx_users_promoted_by ON users(promoted_by);
CREATE INDEX IF NOT EXISTS idx_users_demoted_by ON users(demoted_by);
CREATE INDEX IF NOT EXISTS idx_users_demoted_at ON users(demoted_at);

-- Atualizar usuários MASTER existentes para terem can_view_admins = TRUE por padrão
UPDATE users SET can_view_admins = 1 WHERE role = 'MASTER';