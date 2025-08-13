import api from './api';

export interface AuditLog {
  id: number;
  action: string;
  resource_type: string;
  resource_id?: string;
  performed_by: string;
  description: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface AuditLogFilter {
  action?: string;
  resource_type?: string;
  performed_by?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

export interface AuditLogStats {
  total_logs: number;
  unique_users: number;
  logs_today: number;
  logs_this_week: number;
  top_actions: Array<{ action: string; count: number }>;
  top_users: Array<{ user: string; count: number }>;
}

export interface CleanupResponse {
  message: string;
  deleted_count: number;
  cutoff_date: string;
}

class AuditLogsService {
  /**
   * Lista logs de auditoria com filtros opcionais
   */
  async getAuditLogs(filters: AuditLogFilter = {}): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    
    if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
    if (filters.action) params.append('action', filters.action);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.performed_by) params.append('performed_by', filters.performed_by);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    const response = await api.get(`/audit-logs/?${params.toString()}`);
    return response.data;
  }

  /**
   * Obtém lista de ações disponíveis para filtro
   */
  async getAvailableActions(): Promise<string[]> {
    const response = await api.get('/audit-logs/actions');
    return response.data;
  }

  /**
   * Obtém lista de tipos de recursos disponíveis para filtro
   */
  async getAvailableResourceTypes(): Promise<string[]> {
    const response = await api.get('/audit-logs/resource-types');
    return response.data;
  }

  /**
   * Obtém estatísticas de auditoria (apenas MASTER)
   */
  async getAuditStats(days: number = 30): Promise<AuditLogStats> {
    const response = await api.get(`/audit-logs/stats?days=${days}`);
    return response.data;
  }

  /**
   * Remove logs antigos (apenas MASTER)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<CleanupResponse> {
    const response = await api.delete(`/audit-logs/cleanup?days_to_keep=${daysToKeep}`);
    return response.data;
  }

  /**
   * Formata a data para exibição
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Formata a ação para exibição
   */
  formatAction(action: string): string {
    const actionMap: Record<string, string> = {
      'CREATE_USER': 'Criar Usuário',
      'UPDATE_USER': 'Atualizar Usuário',
      'DELETE_USER': 'Excluir Usuário',
      'BLOCK_USER': 'Bloquear Usuário',
      'UNBLOCK_USER': 'Desbloquear Usuário',
      'CHANGE_USER_ROLE': 'Alterar Role',
      'CHANGE_USER_STATUS': 'Alterar Status',
      'RESET_USER_PASSWORD': 'Resetar Senha',
      'LOGIN_SUCCESS': 'Login Bem-sucedido',
      'LOGIN_FAILED': 'Falha no Login',
      'LOGOUT': 'Logout',
      'TOKEN_REFRESH': 'Renovar Token',
      'SYSTEM_BACKUP': 'Backup do Sistema',
      'SYSTEM_RESTORE': 'Restaurar Sistema',
      'CLEANUP_LOGS': 'Limpeza de Logs',
      'SYSTEM_CONFIG_CHANGE': 'Alterar Configuração',
      'CREATE_ENTRY': 'Criar Lançamento',
      'UPDATE_ENTRY': 'Atualizar Lançamento',
      'DELETE_ENTRY': 'Excluir Lançamento',
      'CREATE_CATEGORY': 'Criar Categoria',
      'UPDATE_CATEGORY': 'Atualizar Categoria',
      'DELETE_CATEGORY': 'Excluir Categoria'
    };
    
    return actionMap[action] || action;
  }

  /**
   * Formata o tipo de recurso para exibição
   */
  formatResourceType(resourceType: string): string {
    const resourceMap: Record<string, string> = {
      'user': 'Usuário',
      'entry': 'Lançamento',
      'category': 'Categoria',
      'auth': 'Autenticação',
      'system': 'Sistema',
      'audit_log': 'Log de Auditoria'
    };
    
    return resourceMap[resourceType] || resourceType;
  }

  /**
   * Obtém a cor do badge baseada na ação
   */
  getActionColor(action: string): string {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE') || action.includes('CHANGE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE') || action.includes('BLOCK')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN_SUCCESS')) return 'bg-green-100 text-green-800';
    if (action.includes('LOGIN_FAILED')) return 'bg-red-100 text-red-800';
    if (action.includes('UNBLOCK')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('SYSTEM')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtém a cor do badge baseada na ação (alias para getActionColor)
   */
  getActionBadgeColor(action: string): string {
    return this.getActionColor(action);
  }
}

export const auditLogsService = new AuditLogsService();
export { AuditLogsService };