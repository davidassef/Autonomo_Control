-- Adicionar campos de IDs das perguntas secretas para sistema flexível
-- Executar: python run_migration.py migrations/add_security_question_ids.sql

-- Adicionar colunas para armazenar os IDs das perguntas escolhidas
ALTER TABLE users ADD COLUMN security_question_1_id VARCHAR(50);
ALTER TABLE users ADD COLUMN security_question_2_id VARCHAR(50);
ALTER TABLE users ADD COLUMN security_question_3_id VARCHAR(50);

-- Para usuários existentes que já têm perguntas secretas, vamos mapear para os IDs padrão
UPDATE users 
SET 
    security_question_1_id = 'favorite_food',
    security_question_2_id = 'first_pet', 
    security_question_3_id = 'birth_year'
WHERE 
    security_answer_1 IS NOT NULL 
    AND security_answer_2 IS NOT NULL 
    AND security_answer_3 IS NOT NULL;

-- Comentários sobre o mapeamento:
-- favorite_food: "Qual o nome da sua comida favorita?"
-- first_pet: "Qual o nome do seu primeiro pet?"
-- birth_year: "Qual o ano da sua data de nascimento?"
-- father_maiden_name: "Qual o nome de solteiro do seu pai?"
-- birth_city: "Qual a cidade onde você nasceu?"
-- first_job: "Qual foi o seu primeiro emprego?"
-- favorite_movie: "Qual é o seu filme favorito?"