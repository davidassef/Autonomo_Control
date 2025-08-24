from typing import Dict, List

# Lista de perguntas secretas disponíveis para o usuário escolher
SECURITY_QUESTIONS: Dict[str, str] = {
    "favorite_food": "Qual o nome da sua comida favorita?",
    "first_pet": "Qual o nome do seu primeiro pet?",
    "birth_year": "Qual o ano da sua data de nascimento?",
    "father_maiden_name": "Qual o nome de solteiro do seu pai?",
    "birth_city": "Qual a cidade onde você nasceu?",
    "first_job": "Qual foi o seu primeiro emprego?",
    "favorite_movie": "Qual é o seu filme favorito?",
}

# Lista ordenada dos IDs das perguntas para facilitar o uso
SECURITY_QUESTION_IDS: List[str] = list(SECURITY_QUESTIONS.keys())


# Função para obter o texto da pergunta pelo ID
def get_question_text(question_id: str) -> str:
    """Retorna o texto da pergunta pelo ID"""
    return SECURITY_QUESTIONS.get(question_id, "")


# Função para validar se um ID de pergunta é válido
def is_valid_question_id(question_id: str) -> bool:
    """Verifica se o ID da pergunta é válido"""
    return question_id in SECURITY_QUESTIONS


# Função para obter todas as perguntas como lista de dicionários
def get_all_questions() -> List[Dict[str, str]]:
    """Retorna todas as perguntas como lista de dicionários com id e text"""
    return [
        {"id": question_id, "text": question_text}
        for question_id, question_text in SECURITY_QUESTIONS.items()
    ]
