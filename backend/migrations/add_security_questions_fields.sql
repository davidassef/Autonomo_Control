-- Adicionar campos de perguntas secretas para recuperação de senha
-- Executar: python run_migration.py migrations/add_security_questions_fields.sql

ALTER TABLE users ADD COLUMN security_answer_1 VARCHAR(255);
ALTER TABLE users ADD COLUMN security_answer_2 VARCHAR(255);
ALTER TABLE users ADD COLUMN security_answer_3 VARCHAR(255);

-- Comentários sobre as perguntas:
-- security_answer_1: Hash da resposta para "Qual o nome da sua comida favorita?"
-- security_answer_2: Hash da resposta para "Qual o nome do seu primeiro pet?"
-- security_answer_3: Hash da resposta para "Qual o ano da sua data de nascimento?"