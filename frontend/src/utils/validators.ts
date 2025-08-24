/**
 * Utilitários de validação para formulários
 */

/**
 * Remove caracteres não numéricos de uma string
 */
export const removeNonNumeric = (value: string): string => {
  return value.replace(/\D/g, "");
};

/**
 * Valida e formata CPF
 */
export const validateCPF = (
  cpf: string,
): { isValid: boolean; formatted: string; error?: string } => {
  const cleanCPF = removeNonNumeric(cpf);

  if (cleanCPF.length !== 11) {
    return { isValid: false, formatted: cpf, error: "CPF deve ter 11 dígitos" };
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { isValid: false, formatted: cpf, error: "CPF inválido" };
  }

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    return { isValid: false, formatted: cpf, error: "CPF inválido" };
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    return { isValid: false, formatted: cpf, error: "CPF inválido" };
  }

  const formatted = `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9)}`;
  return { isValid: true, formatted };
};

/**
 * Formata CPF enquanto o usuário digita
 */
export const formatCPF = (value: string): string => {
  const cleanValue = removeNonNumeric(value);
  if (cleanValue.length <= 3) return cleanValue;
  if (cleanValue.length <= 6)
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  if (cleanValue.length <= 9)
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9, 11)}`;
};

/**
 * Valida e formata telefone brasileiro
 */
export const validatePhone = (
  phone: string,
): { isValid: boolean; formatted: string; error?: string } => {
  const cleanPhone = removeNonNumeric(phone);

  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return {
      isValid: false,
      formatted: phone,
      error: "Telefone deve ter 10 ou 11 dígitos",
    };
  }

  // Verifica se é celular (11 dígitos) ou fixo (10 dígitos)
  let formatted: string;
  if (cleanPhone.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    formatted = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  } else {
    // Fixo: (XX) XXXX-XXXX
    formatted = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  }

  return { isValid: true, formatted };
};

/**
 * Formata telefone enquanto o usuário digita
 */
export const formatPhone = (value: string): string => {
  const cleanValue = removeNonNumeric(value);
  if (cleanValue.length <= 2) return cleanValue;
  if (cleanValue.length <= 6)
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
  if (cleanValue.length <= 10)
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 6)}-${cleanValue.slice(6)}`;
  return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
};

/**
 * Valida e formata CEP
 */
export const validateCEP = (
  cep: string,
): { isValid: boolean; formatted: string; error?: string } => {
  const cleanCEP = removeNonNumeric(cep);

  if (cleanCEP.length !== 8) {
    return { isValid: false, formatted: cep, error: "CEP deve ter 8 dígitos" };
  }

  const formatted = `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}`;
  return { isValid: true, formatted };
};

/**
 * Formata CEP enquanto o usuário digita
 */
export const formatCEP = (value: string): string => {
  const cleanValue = removeNonNumeric(value);
  if (cleanValue.length <= 5) return cleanValue;
  return `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 8)}`;
};

/**
 * Valida data de nascimento
 */
export const validateBirthDate = (
  date: string,
): { isValid: boolean; error?: string } => {
  if (!date) {
    return { isValid: false, error: "Data de nascimento é obrigatória" };
  }

  const birthDate = new Date(date);
  const today = new Date();

  if (isNaN(birthDate.getTime())) {
    return { isValid: false, error: "Data inválida" };
  }

  if (birthDate >= today) {
    return {
      isValid: false,
      error: "Data de nascimento deve ser anterior à data atual",
    };
  }

  // Calcular idade
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  const actualAge =
    monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

  if (actualAge < 16) {
    return { isValid: false, error: "Idade mínima é 16 anos" };
  }

  return { isValid: true };
};

/**
 * Valida estado brasileiro
 */
export const validateState = (
  state: string,
): { isValid: boolean; error?: string } => {
  const validStates = [
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
  ];

  if (!validStates.includes(state.toUpperCase())) {
    return { isValid: false, error: "Estado inválido" };
  }

  return { isValid: true };
};

/**
 * Lista de estados brasileiros para select
 */
export const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];
