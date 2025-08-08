export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income' | 'EXPENSE' | 'INCOME';
  created_at: string;
  updated_at: string;
  user_id?: string;
  subcategories?: string[];
  icon?: string;
  color?: string;
  is_default?: boolean;
}

export interface Entry {
  id: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
  description: string;
  category_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface EntrySummary {
  total_income: number;
  total_expense: number;
  balance: number;
  count_income: number;
  count_expense: number;
  total_count: number;
}

export interface MonthlySummary {
  month: string;
  year: number;
  total_income: number;
  total_expense: number;
  balance: number;
  count_income: number;
  count_expense: number;
  total_count: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface APIError {
  detail: string | { msg: string }[];
}
