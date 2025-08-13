import { useState, useEffect, useCallback } from 'react';
import { auditLogsService, AuditLog, AuditLogFilter, AuditLogStats } from '../services/auditLogs';
import { toast } from 'sonner';

interface UseAuditLogsState {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  totalLogs: number;
  availableActions: string[];
  availableResourceTypes: string[];
  stats: AuditLogStats | null;
  statsLoading: boolean;
}

interface UseAuditLogsReturn extends UseAuditLogsState {
  loadLogs: (filters?: AuditLogFilter) => Promise<void>;
  loadStats: (days?: number) => Promise<void>;
  cleanupLogs: (daysToKeep?: number) => Promise<void>;
  refreshFilters: () => Promise<void>;
  clearError: () => void;
}

export function useAuditLogs(): UseAuditLogsReturn {
  const [state, setState] = useState<UseAuditLogsState>({
    logs: [],
    loading: false,
    error: null,
    totalLogs: 0,
    availableActions: [],
    availableResourceTypes: [],
    stats: null,
    statsLoading: false
  });

  /**
   * Carrega logs de auditoria com filtros
   */
  const loadLogs = useCallback(async (filters: AuditLogFilter = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const logs = await auditLogsService.getAuditLogs(filters);
      setState(prev => ({
        ...prev,
        logs,
        totalLogs: logs.length,
        loading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao carregar logs de auditoria';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      toast.error(errorMessage);
    }
  }, []);

  /**
   * Carrega estatísticas de auditoria
   */
  const loadStats = useCallback(async (days: number = 30) => {
    setState(prev => ({ ...prev, statsLoading: true }));
    
    try {
      const stats = await auditLogsService.getAuditStats(days);
      setState(prev => ({
        ...prev,
        stats,
        statsLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao carregar estatísticas';
      setState(prev => ({ ...prev, statsLoading: false }));
      toast.error(errorMessage);
    }
  }, []);

  /**
   * Remove logs antigos
   */
  const cleanupLogs = useCallback(async (daysToKeep: number = 90) => {
    try {
      const result = await auditLogsService.cleanupOldLogs(daysToKeep);
      toast.success(result.message);
      
      // Recarregar logs após limpeza
      await loadLogs();
      await loadStats();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao limpar logs antigos';
      toast.error(errorMessage);
    }
  }, [loadLogs, loadStats]);

  /**
   * Carrega filtros disponíveis (ações e tipos de recursos)
   */
  const refreshFilters = useCallback(async () => {
    try {
      const [actions, resourceTypes] = await Promise.all([
        auditLogsService.getAvailableActions(),
        auditLogsService.getAvailableResourceTypes()
      ]);
      
      setState(prev => ({
        ...prev,
        availableActions: actions,
        availableResourceTypes: resourceTypes
      }));
    } catch (error: any) {
      console.error('Erro ao carregar filtros:', error);
    }
  }, []);

  /**
   * Limpa erro
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    loadLogs();
    refreshFilters();
  }, [loadLogs, refreshFilters]);

  return {
    ...state,
    loadLogs,
    loadStats,
    cleanupLogs,
    refreshFilters,
    clearError
  };
}