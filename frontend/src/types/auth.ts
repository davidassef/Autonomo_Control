/**
 * Tipos relacionados à autenticação e autorização
 */

export type UserRole = "USER" | "ADMIN" | "MASTER";

export interface User {
  id: string; // UUID string do usuário
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  full_name: string;
  security_questions: Array<{
    question_id: string; // UUID string da pergunta
    answer: string;
  }>;
  optional_fields?: {
    cpf?: string;
    birth_date?: string;
    phone?: string;
    address?: {
      cep?: string;
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
    };
  };
}
