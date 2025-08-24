"""Utilitários de validação para campos do usuário."""

import re
from datetime import date, datetime
from typing import Union


def validate_cpf(cpf: str) -> bool:
    """Valida CPF brasileiro.

    Args:
        cpf: CPF a ser validado (com ou sem formatação)

    Returns:
        bool: True se CPF é válido, False caso contrário
    """
    if not cpf:
        return False

    # Remove formatação
    cpf = re.sub(r"[^0-9]", "", cpf)

    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        return False

    # Verifica se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        return False

    # Calcula primeiro dígito verificador
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto

    # Verifica primeiro dígito
    if int(cpf[9]) != digito1:
        return False

    # Calcula segundo dígito verificador
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto

    # Verifica segundo dígito
    return int(cpf[10]) == digito2


def validate_phone(phone: str) -> bool:
    """Valida telefone brasileiro.

    Args:
        phone: Telefone a ser validado

    Returns:
        bool: True se telefone é válido, False caso contrário
    """
    if not phone:
        return False

    # Remove formatação
    phone = re.sub(r"[^0-9]", "", phone)

    # Verifica se tem 10 ou 11 dígitos (com DDD)
    if len(phone) not in [10, 11]:
        return False

    # Verifica se DDD é válido (11 a 99)
    ddd = int(phone[:2])
    if ddd < 11 or ddd > 99:
        return False

    # Para celular (11 dígitos), o terceiro dígito deve ser 9
    if len(phone) == 11 and phone[2] != "9":
        return False

    return True


def validate_cep(cep: str) -> bool:
    """Valida CEP brasileiro.

    Args:
        cep: CEP a ser validado

    Returns:
        bool: True se CEP é válido, False caso contrário
    """
    if not cep:
        return False

    # Remove formatação
    cep = re.sub(r"[^0-9]", "", cep)

    # Verifica se tem 8 dígitos
    return len(cep) == 8 and cep.isdigit()


def validate_birth_date(birth_date: Union[date, str]) -> bool:
    """Valida data de nascimento (idade mínima de 16 anos).

    Args:
        birth_date: Data de nascimento

    Returns:
        bool: True se data é válida, False caso contrário
    """
    if not birth_date:
        return False

    try:
        if isinstance(birth_date, str):
            # Tenta converter string para date
            birth_date = datetime.strptime(birth_date, "%Y-%m-%d").date()

        # Verifica se é uma data válida
        if not isinstance(birth_date, date):
            return False

        # Verifica se não é uma data futura
        today = date.today()
        if birth_date > today:
            return False

        # Calcula idade
        age = today.year - birth_date.year
        if today.month < birth_date.month or (
            today.month == birth_date.month and today.day < birth_date.day
        ):
            age -= 1

        # Verifica idade mínima de 16 anos
        return age >= 16

    except (ValueError, TypeError):
        return False


def validate_state(state: str) -> bool:
    """Valida sigla do estado brasileiro.

    Args:
        state: Sigla do estado (2 caracteres)

    Returns:
        bool: True se estado é válido, False caso contrário
    """
    if not state:
        return False

    # Lista de estados brasileiros válidos
    valid_states = {
        "AC",
        "AL",
        "AP",
        "AM",
        "BA",
        "CE",
        "DF",
        "ES",
        "GO",
        "MA",
        "MT",
        "MS",
        "MG",
        "PA",
        "PB",
        "PR",
        "PE",
        "PI",
        "RJ",
        "RN",
        "RS",
        "RO",
        "RR",
        "SC",
        "SP",
        "SE",
        "TO",
    }

    return state.upper() in valid_states


def format_cpf(cpf: str) -> str:
    """Formata CPF para exibição.

    Args:
        cpf: CPF sem formatação

    Returns:
        str: CPF formatado (XXX.XXX.XXX-XX)
    """
    if not cpf:
        return ""

    # Remove formatação existente
    cpf = re.sub(r"[^0-9]", "", cpf)

    if len(cpf) == 11:
        return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"

    return cpf


def format_phone(phone: str) -> str:
    """Formata telefone para exibição.

    Args:
        phone: Telefone sem formatação

    Returns:
        str: Telefone formatado
    """
    if not phone:
        return ""

    # Remove formatação existente
    phone = re.sub(r"[^0-9]", "", phone)

    if len(phone) == 11:  # Celular
        return f"({phone[:2]}) {phone[2:7]}-{phone[7:]}"
    elif len(phone) == 10:  # Fixo
        return f"({phone[:2]}) {phone[2:6]}-{phone[6:]}"

    return phone


def format_cep(cep: str) -> str:
    """Formata CEP para exibição.

    Args:
        cep: CEP sem formatação

    Returns:
        str: CEP formatado (XXXXX-XXX)
    """
    if not cep:
        return ""

    # Remove formatação existente
    cep = re.sub(r"[^0-9]", "", cep)

    if len(cep) == 8:
        return f"{cep[:5]}-{cep[5:]}"

    return cep
