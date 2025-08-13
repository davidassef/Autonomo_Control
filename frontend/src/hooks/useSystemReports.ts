import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  systemReportsService,
  UserStatistics,
  SystemUsageStatistics,
  FinancialOverview,
  SystemHealthMetrics,
  UserEngagementReport,
  AdminDashboardData
} from '../services/systemReports';

export interface UseSystemReportsReturn {
  // Estados de carregamento
  isLoadingUserStats: boolean;
  isLoadingUsageStats: boolean;
  isLoadingFinancialOverview: boolean;
  isLoadingHealthMetrics: boolean;
  isLoadingEngagementReport: boolean;
  isLoadingDashboard: boolean;
  
  // Dados
  userStatistics: UserStatistics | null;
  usageStatistics: SystemUsageStatistics | null;
  financialOverview: FinancialOverview | null;
  healthMetrics: SystemHealthMetrics | null;
  engagementReport: UserEngagementReport | null;
  dashboardData: AdminDashboardData | null;
  
  // Erros
  error: string | null;
  
  // Funções
  fetchUserStatistics: (days?: number) => Promise<void>;
  fetchUsageStatistics: (days?: number) => Promise<void>;
  fetchFinancialOverview: (days?: number) => Promise<void>;
  fetchHealthMetrics: () => Promise<void>;
  fetchEngagementReport: (days?: number) => Promise<void>;
  fetchDashboardData: () => Promise<void>;
  refreshAllReports: (days?: number) => Promise<void>;
  clearError: () => void;
}

export const useSystemReports = (): UseSystemReportsReturn => {
  // Estados de carregamento
  const [isLoadingUserStats, setIsLoadingUserStats] = useState(false);
  const [isLoadingUsageStats, setIsLoadingUsageStats] = useState(false);
  const [isLoadingFinancialOverview, setIsLoadingFinancialOverview] = useState(false);
  const [isLoadingHealthMetrics, setIsLoadingHealthMetrics] = useState(false);
  const [isLoadingEngagementReport, setIsLoadingEngagementReport] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  
  // Dados
  const [userStatistics, setUserStatistics] = useState<UserStatistics | null>(null);
  const [usageStatistics, setUsageStatistics] = useState<SystemUsageStatistics | null>(null);
  const [financialOverview, setFinancialOverview] = useState<FinancialOverview | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics | null>(null);
  const [engagementReport, setEngagementReport] = useState<UserEngagementReport | null>(null);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  
  // Erro
  const [error, setError] = useState<string | null>(null);
  
  // Função para limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Função para buscar estatísticas de usuários
  const fetchUserStatistics = useCallback(async (days: number = 30) => {
    setIsLoadingUserStats(true);
    setError(null);
    
    try {
      const data = await systemReportsService.getUserStatistics(days);
      setUserStatistics(data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao carregar estatísticas de usuários';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingUserStats(false);
    }
  }, []);
  
  // Função para buscar estatísticas de uso
  const fetchUsageStatistics = useCallback(async (days: number = 30) => {
    setIsLoadingUsageStats(true);
    setError(null);
    
    try {
      const data = await systemReportsService.getSystemUsageStatistics(days);
      setUsageStatistics(data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao carregar estatísticas de uso';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingUsageStats(false);
    }
  }, []);
  
  // Função para buscar visão geral financeira
  const fetchFinancialOverview = useCallback(async (days: number = 30) => {
    setIsLoadingFinancialOverview(true);
    setError(null);
    
    try {
      const data = await systemReportsService.getFinancialOverview(days);
      setFinancialOverview(data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao carregar visão geral financeira';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingFinancialOverview(false);
    }
  }, []);
  
  // Função para buscar métricas de saúde
  const fetchHealthMetrics = useCallback(async () => {
    setIsLoadingHealthMetrics(true);
    setError(null);
    
    try {
      const data = await systemReportsService.getSystemHealthMetrics();
      setHealthMetrics(data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao carregar métricas de saúde';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingHealthMetrics(false);
    }
  }, []);
  
  // Função para buscar relatório de engajamento
  const fetchEngagementReport = useCallback(async (days: number = 30) => {
    setIsLoadingEngagementReport(true);
    setError(null);
    
    try {
      const data = await systemReportsService.getUserEngagementReport(days);
      setEngagementReport(data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao carregar relatório de engajamento';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingEngagementReport(false);
    }
  }, []);
  
  // Função para buscar dados do dashboard
  const fetchDashboardData = useCallback(async () => {
    setIsLoadingDashboard(true);
    setError(null);
    
    try {
      const data = await systemReportsService.getAdminDashboardData();
      setDashboardData(data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao carregar dados do dashboard';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);
  
  // Função para atualizar todos os relatórios
  const refreshAllReports = useCallback(async (days: number = 30) => {
    await Promise.all([
      fetchUserStatistics(days),
      fetchUsageStatistics(days),
      fetchFinancialOverview(days),
      fetchEngagementReport(days),
      fetchDashboardData()
    ]);
    
    // Métricas de saúde apenas para MASTER (será tratado no componente)
    try {
      await fetchHealthMetrics();
    } catch {
      // Ignorar erro se não for MASTER
    }
  }, [fetchUserStatistics, fetchUsageStatistics, fetchFinancialOverview, fetchEngagementReport, fetchDashboardData, fetchHealthMetrics]);
  
  return {
    // Estados de carregamento
    isLoadingUserStats,
    isLoadingUsageStats,
    isLoadingFinancialOverview,
    isLoadingHealthMetrics,
    isLoadingEngagementReport,
    isLoadingDashboard,
    
    // Dados
    userStatistics,
    usageStatistics,
    financialOverview,
    healthMetrics,
    engagementReport,
    dashboardData,
    
    // Erro
    error,
    
    // Funções
    fetchUserStatistics,
    fetchUsageStatistics,
    fetchFinancialOverview,
    fetchHealthMetrics,
    fetchEngagementReport,
    fetchDashboardData,
    refreshAllReports,
    clearError
  };
};