import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemReports } from './useSystemReports';
import { systemReportsService } from '../services/systemReports';
import { toast } from 'sonner';

// Mock do serviço de relatórios do sistema
jest.mock('../services/systemReports');
const mockSystemReportsService = systemReportsService as jest.Mocked<typeof systemReportsService>;

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}));
const mockToast = toast as jest.Mocked<typeof toast>;

// Dados de teste
const mockUserStatistics = {
  period_days: 30,
  total_users: 150,
  active_users: 120,
  new_users: 25,
  blocked_users: 5,
  users_by_role: [
    { role: 'admin', count: 5 },
    { role: 'user', count: 145 }
  ],
  most_active_users: [
    { email: 'user1@example.com', name: 'João Silva', entries_count: 50 },
    { email: 'user2@example.com', name: 'Maria Santos', entries_count: 45 }
  ]
};

const mockUsageStatistics = {
  period_days: 30,
  total_entries: 500,
  entries_by_type: [
    { type: 'income', count: 200, total_amount: 15000 },
    { type: 'expense', count: 300, total_amount: 8000 }
  ],
  daily_activity: [
    { date: '2024-01-01', entries_count: 25, active_users: 15 },
    { date: '2024-01-02', entries_count: 30, active_users: 18 }
  ],
  audit_logs_count: 150,
  common_actions: [
    { action: 'create_entry', count: 200 },
    { action: 'update_entry', count: 100 }
  ]
};

const mockFinancialOverview = {
  period_days: 30,
  financial_summary: [
    {
      type: 'income',
      count: 100,
      total_amount: 15000.50,
      avg_amount: 150.00,
      min_amount: 50.00,
      max_amount: 500.00
    },
    {
      type: 'expense',
      count: 80,
      total_amount: 8000.25,
      avg_amount: 100.00,
      min_amount: 25.00,
      max_amount: 300.00
    }
  ],
  monthly_evolution: [
    { year: 2024, month: 1, type: 'income', total_amount: 5000, count: 30 },
    { year: 2024, month: 1, type: 'expense', total_amount: 3000, count: 25 }
  ],
  top_categories: [
    { category_name: 'Alimentação', type: 'expense', count: 20, total_amount: 2000 },
    { category_name: 'Salário', type: 'income', count: 4, total_amount: 8000 }
  ]
};

const mockHealthMetrics = {
  timestamp: '2024-01-01T10:00:00Z',
  activity_24h: {
    new_entries: 50,
    active_users: 25,
    audit_logs: 15
  },
  activity_7d: {
    new_entries: 300,
    active_users: 80,
    new_users: 10,
    audit_logs: 100
  },
  general_stats: {
    total_users: 150,
    total_entries: 2500,
    total_audit_logs: 500,
    blocked_users: 5
  }
};

const mockEngagementReport = {
  period_days: 30,
  user_activity: {
    daily_active_users: 45,
    weekly_active_users: 120,
    monthly_active_users: 350,
    new_users: 25,
    returning_users: 325
  },
  session_metrics: {
    average_session_duration: 25.5,
    total_sessions: 1500,
    bounce_rate: 15.2
  },
  feature_usage: [
    { feature_name: 'dashboard', usage_count: 1200, unique_users: 80 },
    { feature_name: 'reports', usage_count: 800, unique_users: 65 },
    { feature_name: 'settings', usage_count: 400, unique_users: 40 }
  ],
  user_retention: {
    day_1: 85.5,
    day_7: 70.2,
    day_30: 55.8
  },
  engagement_summary: {
    highly_engaged: 120,
    moderately_engaged: 180,
    low_engaged: 50,
    inactive: 25
  },
  highly_engaged_users: [
    { user_id: 1, email: 'user1@example.com', name: 'User One', entries_count: 150, last_entry: '2024-01-01T10:00:00Z', first_entry: '2023-06-01T08:00:00Z' },
    { user_id: 2, email: 'user2@example.com', name: 'User Two', entries_count: 120, last_entry: '2024-01-01T09:30:00Z', first_entry: '2023-07-15T14:00:00Z' }
  ],
  inactive_users: [
    { user_id: 3, email: 'user3@example.com', name: 'User Three', entries_count: 5, last_entry: '2023-12-01T10:00:00Z', first_entry: '2023-10-01T12:00:00Z' },
    { user_id: 4, email: 'user4@example.com', name: 'User Four', entries_count: 2, last_entry: null, first_entry: '2023-11-15T15:00:00Z' }
  ]
};

const mockDashboardData = {
  summary: {
    total_users: 130,
    active_users_30d: 85,
    new_users_30d: 15,
    blocked_users: 2,
    total_entries_30d: 280,
    audit_logs_30d: 67
  },
  activity_24h: {
    new_entries: 45,
    active_users: 32,
    audit_logs: 12
  },
  activity_7d: {
    new_entries: 280,
    active_users: 85,
    new_users: 15,
    audit_logs: 67
  },
  users_by_role: [
    { role: 'USER', count: 120 },
    { role: 'ADMIN', count: 8 },
    { role: 'MASTER', count: 2 }
  ],
  entries_by_type: [
    { type: 'RECEITA', count: 150, total_amount: 25000.50 },
    { type: 'DESPESA', count: 130, total_amount: 18500.75 }
  ],
  daily_activity: [
    { date: '2024-01-01', entries_count: 45, active_users: 32 },
    { date: '2024-01-02', entries_count: 38, active_users: 28 },
    { date: '2024-01-03', entries_count: 52, active_users: 35 }
  ],
  most_active_users: [
    { email: 'user1@example.com', name: 'João Silva', entries_count: 150 },
    { email: 'user2@example.com', name: 'Maria Santos', entries_count: 120 },
    { email: 'user3@example.com', name: 'Pedro Costa', entries_count: 95 }
  ],
  common_actions: [
    { action: 'entry_created', count: 280 },
    { action: 'user_login', count: 450 },
    { action: 'profile_updated', count: 65 }
  ]
};

describe('useSystemReports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks padrão
    mockSystemReportsService.getUserStatistics.mockResolvedValue(mockUserStatistics);
    mockSystemReportsService.getSystemUsageStatistics.mockResolvedValue(mockUsageStatistics);
    mockSystemReportsService.getFinancialOverview.mockResolvedValue(mockFinancialOverview);
    mockSystemReportsService.getSystemHealthMetrics.mockResolvedValue(mockHealthMetrics);
    mockSystemReportsService.getUserEngagementReport.mockResolvedValue(mockEngagementReport);
    mockSystemReportsService.getAdminDashboardData.mockResolvedValue(mockDashboardData);
  });

  describe('Estado Inicial', () => {
    it('deve inicializar com estado padrão', () => {
      const { result } = renderHook(() => useSystemReports());
      
      // Estados de carregamento
      expect(result.current.isLoadingUserStats).toBe(false);
      expect(result.current.isLoadingUsageStats).toBe(false);
      expect(result.current.isLoadingFinancialOverview).toBe(false);
      expect(result.current.isLoadingHealthMetrics).toBe(false);
      expect(result.current.isLoadingEngagementReport).toBe(false);
      expect(result.current.isLoadingDashboard).toBe(false);
      
      // Dados
      expect(result.current.userStatistics).toBe(null);
      expect(result.current.usageStatistics).toBe(null);
      expect(result.current.financialOverview).toBe(null);
      expect(result.current.healthMetrics).toBe(null);
      expect(result.current.engagementReport).toBe(null);
      expect(result.current.dashboardData).toBe(null);
      
      // Erro
      expect(result.current.error).toBe(null);
    });

    it('deve expor todas as funções necessárias', () => {
      const { result } = renderHook(() => useSystemReports());
      
      expect(typeof result.current.fetchUserStatistics).toBe('function');
      expect(typeof result.current.fetchUsageStatistics).toBe('function');
      expect(typeof result.current.fetchFinancialOverview).toBe('function');
      expect(typeof result.current.fetchHealthMetrics).toBe('function');
      expect(typeof result.current.fetchEngagementReport).toBe('function');
      expect(typeof result.current.fetchDashboardData).toBe('function');
      expect(typeof result.current.refreshAllReports).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('fetchUserStatistics', () => {
    it('deve buscar estatísticas de usuários com período padrão', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      await act(async () => {
        await result.current.fetchUserStatistics();
      });
      
      expect(mockSystemReportsService.getUserStatistics).toHaveBeenCalledWith(30);
      expect(result.current.userStatistics).toEqual(mockUserStatistics);
      expect(result.current.isLoadingUserStats).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('deve buscar estatísticas com período customizado', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      await act(async () => {
        await result.current.fetchUserStatistics(7);
      });
      
      expect(mockSystemReportsService.getUserStatistics).toHaveBeenCalledWith(7);
    });

    it('deve definir loading durante busca', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      // Mock para simular delay
      mockSystemReportsService.getUserStatistics.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUserStatistics), 100))
      );
      
      act(() => {
        result.current.fetchUserStatistics();
      });
      
      expect(result.current.isLoadingUserStats).toBe(true);
      expect(result.current.error).toBe(null);
      
      await waitFor(() => {
        expect(result.current.isLoadingUserStats).toBe(false);
      });
    });

    it('deve lidar com erro na API', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      const errorMessage = 'Erro ao carregar estatísticas';
      mockSystemReportsService.getUserStatistics.mockRejectedValue({
        response: { data: { detail: errorMessage } }
      });
      
      await act(async () => {
        await result.current.fetchUserStatistics();
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoadingUserStats).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });

    it('deve lidar com erro sem response', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      mockSystemReportsService.getUserStatistics.mockRejectedValue(new Error('Network error'));
      
      await act(async () => {
        await result.current.fetchUserStatistics();
      });
      
      expect(result.current.error).toBe('Erro ao carregar estatísticas de usuários');
      expect(mockToast.error).toHaveBeenCalledWith('Erro ao carregar estatísticas de usuários');
    });
  });

  describe('fetchUsageStatistics', () => {
    it('deve buscar estatísticas de uso', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      await act(async () => {
        await result.current.fetchUsageStatistics(15);
      });
      
      expect(mockSystemReportsService.getSystemUsageStatistics).toHaveBeenCalledWith(15);
      expect(result.current.usageStatistics).toEqual(mockUsageStatistics);
      expect(result.current.isLoadingUsageStats).toBe(false);
    });

    it('deve lidar com erro', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      const errorMessage = 'Erro nas estatísticas de uso';
      mockSystemReportsService.getSystemUsageStatistics.mockRejectedValue({
        response: { data: { detail: errorMessage } }
      });
      
      await act(async () => {
        await result.current.fetchUsageStatistics();
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('fetchFinancialOverview', () => {
    it('deve buscar visão geral financeira', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      await act(async () => {
        await result.current.fetchFinancialOverview(60);
      });
      
      expect(mockSystemReportsService.getFinancialOverview).toHaveBeenCalledWith(60);
      expect(result.current.financialOverview).toEqual(mockFinancialOverview);
      expect(result.current.isLoadingFinancialOverview).toBe(false);
    });

    it('deve lidar com erro', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      const errorMessage = 'Erro na visão financeira';
      mockSystemReportsService.getFinancialOverview.mockRejectedValue({
        response: { data: { detail: errorMessage } }
      });
      
      await act(async () => {
        await result.current.fetchFinancialOverview();
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('fetchHealthMetrics', () => {
    it('deve buscar métricas de saúde', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      await act(async () => {
        await result.current.fetchHealthMetrics();
      });
      
      expect(mockSystemReportsService.getSystemHealthMetrics).toHaveBeenCalled();
      expect(result.current.healthMetrics).toEqual(mockHealthMetrics);
      expect(result.current.isLoadingHealthMetrics).toBe(false);
    });

    it('deve lidar com erro', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      const errorMessage = 'Erro nas métricas de saúde';
      mockSystemReportsService.getSystemHealthMetrics.mockRejectedValue({
        response: { data: { detail: errorMessage } }
      });
      
      await act(async () => {
        await result.current.fetchHealthMetrics();
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('fetchEngagementReport', () => {
    it('deve buscar relatório de engajamento', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      await act(async () => {
        await result.current.fetchEngagementReport(14);
      });
      
      expect(mockSystemReportsService.getUserEngagementReport).toHaveBeenCalledWith(14);
      expect(result.current.engagementReport).toEqual(mockEngagementReport);
      expect(result.current.isLoadingEngagementReport).toBe(false);
    });

    it('deve lidar com erro', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      const errorMessage = 'Erro no relatório de engajamento';
      mockSystemReportsService.getUserEngagementReport.mockRejectedValue({
        response: { data: { detail: errorMessage } }
      });
      
      await act(async () => {
        await result.current.fetchEngagementReport();
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('fetchDashboardData', () => {
    it('deve buscar dados do dashboard', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      await act(async () => {
        await result.current.fetchDashboardData();
      });
      
      expect(mockSystemReportsService.getAdminDashboardData).toHaveBeenCalled();
      expect(result.current.dashboardData).toEqual(mockDashboardData);
      expect(result.current.isLoadingDashboard).toBe(false);
    });

    it('deve lidar com erro', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      const errorMessage = 'Erro nos dados do dashboard';
      mockSystemReportsService.getAdminDashboardData.mockRejectedValue({
        response: { data: { detail: errorMessage } }
      });
      
      await act(async () => {
        await result.current.fetchDashboardData();
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('refreshAllReports', () => {
    it('deve atualizar todos os relatórios com sucesso', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      await act(async () => {
        await result.current.refreshAllReports(7);
      });
      
      expect(mockSystemReportsService.getUserStatistics).toHaveBeenCalledWith(7);
      expect(mockSystemReportsService.getSystemUsageStatistics).toHaveBeenCalledWith(7);
      expect(mockSystemReportsService.getFinancialOverview).toHaveBeenCalledWith(7);
      expect(mockSystemReportsService.getUserEngagementReport).toHaveBeenCalledWith(7);
      expect(mockSystemReportsService.getAdminDashboardData).toHaveBeenCalled();
      expect(mockSystemReportsService.getSystemHealthMetrics).toHaveBeenCalled();
      
      expect(result.current.userStatistics).toEqual(mockUserStatistics);
      expect(result.current.usageStatistics).toEqual(mockUsageStatistics);
      expect(result.current.financialOverview).toEqual(mockFinancialOverview);
      expect(result.current.engagementReport).toEqual(mockEngagementReport);
      expect(result.current.dashboardData).toEqual(mockDashboardData);
      expect(result.current.healthMetrics).toEqual(mockHealthMetrics);
    });

    it('deve usar período padrão quando não especificado', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      await act(async () => {
        await result.current.refreshAllReports();
      });
      
      expect(mockSystemReportsService.getUserStatistics).toHaveBeenCalledWith(30);
      expect(mockSystemReportsService.getSystemUsageStatistics).toHaveBeenCalledWith(30);
      expect(mockSystemReportsService.getFinancialOverview).toHaveBeenCalledWith(30);
      expect(mockSystemReportsService.getUserEngagementReport).toHaveBeenCalledWith(30);
    });

    it('deve ignorar erro nas métricas de saúde (para não-MASTER)', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      // Mock para simular erro apenas nas métricas de saúde
      mockSystemReportsService.getSystemHealthMetrics.mockRejectedValue(new Error('Acesso negado'));
      
      await act(async () => {
        await result.current.refreshAllReports();
      });
      
      // Outros dados devem ter sido carregados normalmente
      expect(result.current.userStatistics).toEqual(mockUserStatistics);
      expect(result.current.usageStatistics).toEqual(mockUsageStatistics);
      expect(result.current.financialOverview).toEqual(mockFinancialOverview);
      expect(result.current.engagementReport).toEqual(mockEngagementReport);
      expect(result.current.dashboardData).toEqual(mockDashboardData);
      
      // Métricas de saúde devem permanecer null
      expect(result.current.healthMetrics).toBe(null);
      
      // Não deve mostrar toast de erro para métricas de saúde
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('deve lidar com erro em outros relatórios', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      const errorMessage = 'Erro ao carregar estatísticas';
      mockSystemReportsService.getUserStatistics.mockRejectedValue({
        response: { data: { detail: errorMessage } }
      });
      
      await act(async () => {
        await result.current.refreshAllReports();
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('clearError', () => {
    it('deve limpar erro', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      // Primeiro, causar um erro
      mockSystemReportsService.getUserStatistics.mockRejectedValue({
        response: { data: { detail: 'Erro de teste' } }
      });
      
      await act(async () => {
        await result.current.fetchUserStatistics();
      });
      
      expect(result.current.error).toBe('Erro de teste');
      
      // Limpar erro
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBe(null);
    });

    it('deve manter outros estados ao limpar erro', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      // Carregar dados primeiro
      await act(async () => {
        await result.current.fetchUserStatistics();
      });
      
      expect(result.current.userStatistics).toEqual(mockUserStatistics);
      
      // Causar erro em outra função
      mockSystemReportsService.getSystemUsageStatistics.mockRejectedValue({
        response: { data: { detail: 'Erro de teste' } }
      });
      
      await act(async () => {
        await result.current.fetchUsageStatistics();
      });
      
      expect(result.current.error).toBe('Erro de teste');
      
      // Limpar erro
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBe(null);
      expect(result.current.userStatistics).toEqual(mockUserStatistics); // Deve manter dados
    });
  });

  describe('Integração Completa', () => {
    it('deve funcionar em cenário real de uso', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      // Carregar estatísticas de usuários
      await act(async () => {
        await result.current.fetchUserStatistics(7);
      });
      
      expect(result.current.userStatistics).toEqual(mockUserStatistics);
      
      // Carregar dados do dashboard
      await act(async () => {
        await result.current.fetchDashboardData();
      });
      
      expect(result.current.dashboardData).toEqual(mockDashboardData);
      
      // Atualizar todos os relatórios
      await act(async () => {
        await result.current.refreshAllReports(30);
      });
      
      expect(result.current.userStatistics).toEqual(mockUserStatistics);
      expect(result.current.usageStatistics).toEqual(mockUsageStatistics);
      expect(result.current.financialOverview).toEqual(mockFinancialOverview);
      expect(result.current.healthMetrics).toEqual(mockHealthMetrics);
      expect(result.current.engagementReport).toEqual(mockEngagementReport);
      expect(result.current.dashboardData).toEqual(mockDashboardData);
    });

    it('deve manter referências estáveis das funções', () => {
      const { result, rerender } = renderHook(() => useSystemReports());
      
      const initialFunctions = {
        fetchUserStatistics: result.current.fetchUserStatistics,
        fetchUsageStatistics: result.current.fetchUsageStatistics,
        fetchFinancialOverview: result.current.fetchFinancialOverview,
        fetchHealthMetrics: result.current.fetchHealthMetrics,
        fetchEngagementReport: result.current.fetchEngagementReport,
        fetchDashboardData: result.current.fetchDashboardData,
        refreshAllReports: result.current.refreshAllReports,
        clearError: result.current.clearError
      };
      
      rerender();
      
      expect(result.current.fetchUserStatistics).toBe(initialFunctions.fetchUserStatistics);
      expect(result.current.fetchUsageStatistics).toBe(initialFunctions.fetchUsageStatistics);
      expect(result.current.fetchFinancialOverview).toBe(initialFunctions.fetchFinancialOverview);
      expect(result.current.fetchHealthMetrics).toBe(initialFunctions.fetchHealthMetrics);
      expect(result.current.fetchEngagementReport).toBe(initialFunctions.fetchEngagementReport);
      expect(result.current.fetchDashboardData).toBe(initialFunctions.fetchDashboardData);
      expect(result.current.refreshAllReports).toBe(initialFunctions.refreshAllReports);
      expect(result.current.clearError).toBe(initialFunctions.clearError);
    });
  });

  describe('Casos de Borda', () => {
    it('deve lidar com dados vazios', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      const emptyUserStats = {
        period_days: 30,
        total_users: 0,
        active_users: 0,
        new_users: 0,
        blocked_users: 0,
        users_by_role: [],
        most_active_users: []
      };
      
      mockSystemReportsService.getUserStatistics.mockResolvedValue(emptyUserStats);
      
      await act(async () => {
        await result.current.fetchUserStatistics();
      });
      
      expect(result.current.userStatistics).toEqual(emptyUserStats);
    });

    it('deve lidar com múltiplas chamadas simultâneas', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      // Fazer múltiplas chamadas simultâneas
      const promises = [
        result.current.fetchUserStatistics(),
        result.current.fetchUsageStatistics(),
        result.current.fetchDashboardData()
      ];
      
      await act(async () => {
        await Promise.all(promises);
      });
      
      expect(result.current.userStatistics).toEqual(mockUserStatistics);
      expect(result.current.usageStatistics).toEqual(mockUsageStatistics);
      expect(result.current.dashboardData).toEqual(mockDashboardData);
    });

    it('deve lidar com erro de rede', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      mockSystemReportsService.getUserStatistics.mockRejectedValue(new Error('Network Error'));
      
      await act(async () => {
        await result.current.fetchUserStatistics();
      });
      
      expect(result.current.error).toBe('Erro ao carregar estatísticas de usuários');
      expect(result.current.userStatistics).toBe(null);
    });

    it('deve lidar com timeout', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      mockSystemReportsService.getUserStatistics.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      } as any);
      
      await act(async () => {
        await result.current.fetchUserStatistics();
      });
      
      expect(result.current.error).toBe('Erro ao carregar estatísticas de usuários');
    });
  });

  describe('Performance', () => {
    it('deve renderizar rapidamente', () => {
      const startTime = performance.now();
      
      renderHook(() => useSystemReports());
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it('deve lidar com grandes volumes de dados', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      const largeUserStats = {
        ...mockUserStatistics,
        most_active_users: Array.from({ length: 1000 }, (_, i) => ({
          email: `user${i}@example.com`,
          name: `User ${i}`,
          entries_count: Math.floor(Math.random() * 100)
        }))
      };
      
      mockSystemReportsService.getUserStatistics.mockResolvedValue(largeUserStats);
      
      await act(async () => {
        await result.current.fetchUserStatistics();
      });
      
      expect(result.current.userStatistics?.most_active_users).toHaveLength(1000);
    });

    it('deve lidar com atualizações frequentes', async () => {
      const { result } = renderHook(() => useSystemReports());
      
      // Simular múltiplas atualizações rápidas
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.fetchUserStatistics();
        });
      }
      
      expect(result.current.userStatistics).toEqual(mockUserStatistics);
      expect(result.current.isLoadingUserStats).toBe(false);
    });
  });
});