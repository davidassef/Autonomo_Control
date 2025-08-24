import api from "./api";

export interface UserStatistics {
  period_days: number;
  total_users: number;
  active_users: number;
  new_users: number;
  blocked_users: number;
  users_by_role: Array<{
    role: string;
    count: number;
  }>;
  most_active_users: Array<{
    email: string;
    name: string;
    entries_count: number;
  }>;
}

export interface SystemUsageStatistics {
  period_days: number;
  total_entries: number;
  entries_by_type: Array<{
    type: string;
    count: number;
    total_amount: number;
  }>;
  daily_activity: Array<{
    date: string;
    entries_count: number;
    active_users: number;
  }>;
  audit_logs_count: number;
  common_actions: Array<{
    action: string;
    count: number;
  }>;
}

export interface FinancialOverview {
  period_days: number;
  financial_summary: Array<{
    type: string;
    count: number;
    total_amount: number;
    avg_amount: number;
    min_amount: number;
    max_amount: number;
  }>;
  monthly_evolution: Array<{
    year: number;
    month: number;
    type: string;
    total_amount: number;
    count: number;
  }>;
  top_categories: Array<{
    category_name: string;
    type: string;
    count: number;
    total_amount: number;
  }>;
}

export interface SystemHealthMetrics {
  timestamp: string;
  activity_24h: {
    new_entries: number;
    active_users: number;
    audit_logs: number;
  };
  activity_7d: {
    new_entries: number;
    active_users: number;
    new_users: number;
    audit_logs: number;
  };
  general_stats: {
    total_users: number;
    total_entries: number;
    total_audit_logs: number;
    blocked_users: number;
  };
}

export interface UserEngagementReport {
  period_days: number;
  engagement_summary: {
    highly_engaged: number;
    moderately_engaged: number;
    low_engaged: number;
    inactive: number;
  };
  highly_engaged_users: Array<{
    user_id: number;
    email: string;
    name: string;
    entries_count: number;
    last_entry: string | null;
    first_entry: string | null;
  }>;
  inactive_users: Array<{
    user_id: number;
    email: string;
    name: string;
    entries_count: number;
    last_entry: string | null;
    first_entry: string | null;
  }>;
}

export interface AdminDashboardData {
  summary: {
    total_users: number;
    active_users_30d: number;
    new_users_30d: number;
    blocked_users: number;
    total_entries_30d: number;
    audit_logs_30d: number;
  };
  activity_24h: {
    new_entries: number;
    active_users: number;
    audit_logs: number;
  };
  activity_7d: {
    new_entries: number;
    active_users: number;
    new_users: number;
    audit_logs: number;
  };
  users_by_role: Array<{
    role: string;
    count: number;
  }>;
  entries_by_type: Array<{
    type: string;
    count: number;
    total_amount: number;
  }>;
  daily_activity: Array<{
    date: string;
    entries_count: number;
    active_users: number;
  }>;
  most_active_users: Array<{
    email: string;
    name: string;
    entries_count: number;
  }>;
  common_actions: Array<{
    action: string;
    count: number;
  }>;
}

class SystemReportsService {
  /**
   * Obtém estatísticas de usuários do sistema
   */
  async getUserStatistics(days: number = 30): Promise<UserStatistics> {
    const response = await api.get(`/system-reports/users?days=${days}`);
    return response.data;
  }

  /**
   * Obtém estatísticas de uso do sistema
   */
  async getSystemUsageStatistics(
    days: number = 30,
  ): Promise<SystemUsageStatistics> {
    const response = await api.get(`/system-reports/usage?days=${days}`);
    return response.data;
  }

  /**
   * Obtém visão geral financeira do sistema
   */
  async getFinancialOverview(days: number = 30): Promise<FinancialOverview> {
    const response = await api.get(`/system-reports/financial?days=${days}`);
    return response.data;
  }

  /**
   * Obtém métricas de saúde do sistema (apenas MASTER)
   */
  async getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
    const response = await api.get("/system-reports/health");
    return response.data;
  }

  /**
   * Obtém relatório de engajamento dos usuários
   */
  async getUserEngagementReport(
    days: number = 30,
  ): Promise<UserEngagementReport> {
    const response = await api.get(`/system-reports/engagement?days=${days}`);
    return response.data;
  }

  /**
   * Obtém dados consolidados para o dashboard administrativo
   */
  async getAdminDashboardData(): Promise<AdminDashboardData> {
    const response = await api.get("/system-reports/dashboard");
    return response.data;
  }
}

// Instância única do serviço
export const systemReportsService = new SystemReportsService();
export default systemReportsService;
