/**
 * Utilitários de validação para formulários
 */

/**
 * Valida se um campo obrigatório foi preenchido
 * @param value - Valor a ser validado
 * @returns true se o valor é válido, false caso contrário
 */
export const validateRequired = (value: string | undefined | null): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  return value.trim().length > 0;
};

/**
 * Valida formato de email
 * @param email - Email a ser validado
 * @returns true se o email é válido, false caso contrário
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Valida força da senha
 * @param password - Senha a ser validada
 * @returns true se a senha é válida, false caso contrário
 */
export const validatePassword = (password: string): boolean => {
  if (!password || typeof password !== "string") {
    return false;
  }

  // Mínimo 8 caracteres, pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};
