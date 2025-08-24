import pytest
from datetime import date, datetime
from app.utils.validators import (
    validate_cpf,
    format_cpf,
    validate_phone,
    format_phone,
    validate_cep,
    format_cep,
    validate_birth_date,
    validate_state,
)


class TestCPFValidation:
    """Testes para validação de CPF."""

    def test_valid_cpf_numbers(self):
        """Testa CPFs válidos."""
        valid_cpfs = ["11144477735", "12345678909", "98765432100", "00000000191"]

        for cpf in valid_cpfs:
            assert validate_cpf(cpf) is True, f"CPF {cpf} deveria ser válido"

    def test_invalid_cpf_numbers(self):
        """Testa CPFs inválidos."""
        invalid_cpfs = [
            "11111111111",  # Todos os dígitos iguais
            "22222222222",
            "33333333333",
            "12345678901",  # Dígitos verificadores incorretos
            "98765432111",
            "123456789",  # Muito curto
            "123456789012",  # Muito longo
            "abcdefghijk",  # Não numérico
            "",  # Vazio
            "123.456.789-01",  # Com formatação
        ]

        for cpf in invalid_cpfs:
            assert validate_cpf(cpf) is False, f"CPF {cpf} deveria ser inválido"

    def test_cpf_formatting(self):
        """Testa formatação de CPF."""
        test_cases = [
            ("11144477735", "111.444.777-35"),
            ("12345678909", "123.456.789-09"),
            ("00000000191", "000.000.001-91"),
        ]

        for cpf, expected in test_cases:
            assert format_cpf(cpf) == expected

    def test_cpf_formatting_invalid(self):
        """Testa formatação de CPF inválido."""
        invalid_cpfs = ["123456789", "abcdefghijk", ""]

        for cpf in invalid_cpfs:
            with pytest.raises(ValueError):
                format_cpf(cpf)


class TestPhoneValidation:
    """Testes para validação de telefone."""

    def test_valid_phone_numbers(self):
        """Testa números de telefone válidos."""
        valid_phones = [
            "11987654321",  # Celular SP
            "21987654321",  # Celular RJ
            "1134567890",  # Fixo SP
            "2134567890",  # Fixo RJ
            "85987654321",  # Celular CE
            "8534567890",  # Fixo CE
        ]

        for phone in valid_phones:
            assert validate_phone(phone) is True, f"Telefone {phone} deveria ser válido"

    def test_invalid_phone_numbers(self):
        """Testa números de telefone inválidos."""
        invalid_phones = [
            "123456789",  # Muito curto
            "123456789012",  # Muito longo
            "abcdefghijk",  # Não numérico
            "",  # Vazio
            "00987654321",  # DDD inválido
            "99987654321",  # DDD inválido
            "11123456789",  # Número inválido
            "(11) 98765-4321",  # Com formatação
        ]

        for phone in invalid_phones:
            assert (
                validate_phone(phone) is False
            ), f"Telefone {phone} deveria ser inválido"

    def test_phone_formatting(self):
        """Testa formatação de telefone."""
        test_cases = [
            ("11987654321", "(11) 98765-4321"),
            ("1134567890", "(11) 3456-7890"),
            ("21987654321", "(21) 98765-4321"),
            ("2134567890", "(21) 3456-7890"),
        ]

        for phone, expected in test_cases:
            assert format_phone(phone) == expected

    def test_phone_formatting_invalid(self):
        """Testa formatação de telefone inválido."""
        invalid_phones = ["123456789", "abcdefghijk", ""]

        for phone in invalid_phones:
            with pytest.raises(ValueError):
                format_phone(phone)


class TestCEPValidation:
    """Testes para validação de CEP."""

    def test_valid_cep_numbers(self):
        """Testa CEPs válidos."""
        valid_ceps = [
            "01310100",
            "04038001",
            "20040020",
            "30112000",
            "40070110",
            "50030230",
            "60160230",
            "70040010",
            "80010000",
            "90010001",
        ]

        for cep in valid_ceps:
            assert validate_cep(cep) is True, f"CEP {cep} deveria ser válido"

    def test_invalid_cep_numbers(self):
        """Testa CEPs inválidos."""
        invalid_ceps = [
            "1234567",  # Muito curto
            "123456789",  # Muito longo
            "abcdefgh",  # Não numérico
            "",  # Vazio
            "01310-100",  # Com formatação
        ]

        for cep in invalid_ceps:
            assert validate_cep(cep) is False, f"CEP {cep} deveria ser inválido"

    def test_cep_formatting(self):
        """Testa formatação de CEP."""
        test_cases = [
            ("01310100", "01310-100"),
            ("04038001", "04038-001"),
            ("20040020", "20040-020"),
        ]

        for cep, expected in test_cases:
            assert format_cep(cep) == expected

    def test_cep_formatting_invalid(self):
        """Testa formatação de CEP inválido."""
        invalid_ceps = ["1234567", "abcdefgh", ""]

        for cep in invalid_ceps:
            with pytest.raises(ValueError):
                format_cep(cep)


class TestBirthDateValidation:
    """Testes para validação de data de nascimento."""

    def test_valid_birth_dates(self):
        """Testa datas de nascimento válidas (16+ anos)."""
        today = date.today()
        valid_dates = [
            date(today.year - 16, today.month, today.day),  # Exatamente 16 anos
            date(today.year - 20, 5, 15),  # 20 anos
            date(today.year - 30, 12, 25),  # 30 anos
            date(today.year - 50, 1, 1),  # 50 anos
            date(1950, 6, 10),  # Muito mais velho
        ]

        for birth_date in valid_dates:
            assert (
                validate_birth_date(birth_date) is True
            ), f"Data {birth_date} deveria ser válida"

    def test_invalid_birth_dates(self):
        """Testa datas de nascimento inválidas (menos de 16 anos)."""
        today = date.today()
        invalid_dates = [
            today,  # Hoje
            date(today.year - 15, today.month, today.day),  # 15 anos
            date(today.year - 10, 5, 15),  # 10 anos
            date(today.year - 5, 12, 25),  # 5 anos
            date(today.year + 1, 1, 1),  # Futuro
        ]

        for birth_date in invalid_dates:
            assert (
                validate_birth_date(birth_date) is False
            ), f"Data {birth_date} deveria ser inválida"

    def test_birth_date_edge_cases(self):
        """Testa casos extremos de data de nascimento."""
        today = date.today()

        # Exatamente 16 anos atrás
        sixteen_years_ago = date(today.year - 16, today.month, today.day)
        assert validate_birth_date(sixteen_years_ago) is True

        # Um dia antes de completar 16 anos
        almost_sixteen = (
            date(today.year - 15, today.month, today.day + 1)
            if today.day < 28
            else date(today.year - 15, today.month + 1, 1)
        )
        assert validate_birth_date(almost_sixteen) is False


class TestBrazilianStateValidation:
    """Testes para validação de estados brasileiros."""

    def test_valid_states(self):
        """Testa siglas de estados válidas."""
        valid_states = [
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
        ]

        for state in valid_states:
            assert validate_state(state) is True, f"Estado {state} deveria ser válido"

    def test_invalid_states(self):
        """Testa siglas de estados inválidas."""
        invalid_states = [
            "XX",
            "YY",
            "ZZ",
            "AB",
            "CD",
            "EF",
            "sp",
            "rj",
            "mg",  # Minúsculas
            "SAO",
            "RIO",  # Muito longo
            "S",
            "R",  # Muito curto
            "",
            "  ",  # Vazio ou espaços
            "123",
            "A1",  # Com números
        ]

        for state in invalid_states:
            assert (
                validate_state(state) is False
            ), f"Estado {state} deveria ser inválido"

    def test_state_case_sensitivity(self):
        """Testa sensibilidade a maiúsculas/minúsculas."""
        # Apenas maiúsculas devem ser aceitas
        assert validate_state("SP") is True
        assert validate_state("sp") is False
        assert validate_state("Sp") is False
        assert validate_state("sP") is False
