export interface User {
  id: string; // UUID string do usuário
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  role?: "USER" | "ADMIN" | "MASTER";
  is_active?: boolean;
}

export interface Category {
  id: string; // UUID string da categoria
  name: string;
  type: "expense" | "income" | "EXPENSE" | "INCOME";
  created_at: string;
  updated_at: string;
  user_id?: string; // UUID string do usuário
  subcategories?: string[];
  icon?: string;
  color?: string;
  is_default?: boolean;
}

export interface Entry {
  id: string; // UUID string do lançamento
  amount: number; // Para receitas de corrida representa valor líquido (net)
  date: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  category_id: string; // UUID string da categoria
  user_id: string; // UUID string do usuário
  created_at: string;
  updated_at: string;
  category?: Category;
  // Campos opcionais de corrida
  platform?: string; // UBER | 99 | INDRIVE | OUTRA
  distance_km?: number;
  duration_min?: number;
  gross_amount?: number;
  platform_fee?: number;
  tips_amount?: number;
  net_amount?: number; // Pode vir do backend; geralmente = amount quando receita de corrida
  vehicle_id?: string;
  shift_tag?: string; // MANHA | TARDE | NOITE | MADRUGADA
  city?: string;
  is_trip_expense?: boolean;
  linked_entry_id?: string;
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

// Métricas de corrida
export interface DailyRideMetric {
  day: string; // YYYY-MM-DD
  gross: number;
  net: number;
  fee: number;
  fee_pct: number;
  tips: number;
  rides: number;
  km: number;
  hours: number;
  earn_per_km: number;
  earn_per_hour: number;
}

export interface DailyRideMetricsResponse {
  items: DailyRideMetric[];
  count: number;
}

export interface MonthlyRideMetric {
  month: string; // MM
  gross: number;
  net: number;
  fee: number;
  fee_pct: number;
  tips: number;
  rides: number;
  km: number;
  hours: number;
  earn_per_km: number;
  earn_per_hour: number;
}

export interface MonthlyRideMetricsResponse {
  year: number;
  items: MonthlyRideMetric[];
  count: number;
}

export interface APIError {
  detail: string | { msg: string }[];
}
