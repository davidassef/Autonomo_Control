import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuditLogs } from "./useAuditLogs";
import { auditLogsService } from "../services/auditLogs";
import { toast } from "sonner";

// Mock do serviço de auditoria
jest.mock("../services/auditLogs");
const mockAuditLogsService = auditLogsService as jest.Mocked<
  typeof auditLogsService
>;

// Mock do toast
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));
const mockToast = toast as jest.Mocked<typeof toast>;

// Dados de teste
const mockAuditLogs = [
  {
    id: 1,
    action: "CREATE",
    resource_type: "USER",
    resource_id: 1,
    user_id: "admin-1",
    user_name: "Admin User",
    timestamp: "2024-01-01T10:00:00Z",
    details: { name: "New User" },
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0",
    performed_by: 1,
    description: "Criação de novo usuário",
  },
  {
    id: 2,
    action: "UPDATE",
    resource_type: "ENTRY",
    resource_id: 2,
    user_id: "user-1",
    user_name: "Regular User",
    timestamp: "2024-01-01T11:00:00Z",
    details: { field: "description" },
    ip_address: "192.168.1.2",
    user_agent: "Mozilla/5.0",
    performed_by: 2,
    description: "Atualização de entrada",
  },
];

const mockStats = {
  total_logs: 100,
  unique_users: 25,
  logs_today: 5,
  logs_this_week: 35,
  top_actions: [
    { action: "CREATE", count: 30 },
    { action: "UPDATE", count: 40 },
    { action: "DELETE", count: 20 },
    { action: "LOGIN", count: 10 },
  ],
  top_users: [
    { user: "Admin User", count: 20 },
    { user: "Regular User", count: 15 },
  ],
};

const mockAvailableActions = ["CREATE", "UPDATE", "DELETE", "LOGIN"];
const mockAvailableResourceTypes = ["USER", "ENTRY", "CATEGORY", "SYSTEM"];

describe("useAuditLogs", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks padrão
    mockAuditLogsService.getAuditLogs.mockResolvedValue(mockAuditLogs);
    mockAuditLogsService.getAuditStats.mockResolvedValue(mockStats);
    mockAuditLogsService.getAvailableActions.mockResolvedValue(
      mockAvailableActions,
    );
    mockAuditLogsService.getAvailableResourceTypes.mockResolvedValue(
      mockAvailableResourceTypes,
    );
    mockAuditLogsService.cleanupOldLogs.mockResolvedValue({
      message: "Logs limpos com sucesso",
      deleted_count: 50,
      cutoff_date: "2024-01-01T00:00:00Z",
    });
  });

  describe("Estado Inicial", () => {
    it("deve inicializar com estado padrão", () => {
      const { result } = renderHook(() => useAuditLogs());

      expect(result.current.logs).toEqual([]);
      expect(result.current.loading).toBe(true); // Loading inicial
      expect(result.current.error).toBe(null);
      expect(result.current.totalLogs).toBe(0);
      expect(result.current.availableActions).toEqual([]);
      expect(result.current.availableResourceTypes).toEqual([]);
      expect(result.current.stats).toBe(null);
      expect(result.current.statsLoading).toBe(false);
    });

    it("deve carregar dados iniciais automaticamente", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockAuditLogsService.getAuditLogs).toHaveBeenCalledWith({});
      expect(mockAuditLogsService.getAvailableActions).toHaveBeenCalled();
      expect(mockAuditLogsService.getAvailableResourceTypes).toHaveBeenCalled();

      expect(result.current.logs).toEqual(mockAuditLogs);
      expect(result.current.totalLogs).toBe(2);
      expect(result.current.availableActions).toEqual(mockAvailableActions);
      expect(result.current.availableResourceTypes).toEqual(
        mockAvailableResourceTypes,
      );
    });

    it("deve expor todas as funções necessárias", () => {
      const { result } = renderHook(() => useAuditLogs());

      expect(typeof result.current.loadLogs).toBe("function");
      expect(typeof result.current.loadStats).toBe("function");
      expect(typeof result.current.cleanupLogs).toBe("function");
      expect(typeof result.current.refreshFilters).toBe("function");
      expect(typeof result.current.clearError).toBe("function");
    });
  });

  describe("loadLogs", () => {
    it("deve carregar logs sem filtros", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadLogs();
      });

      expect(mockAuditLogsService.getAuditLogs).toHaveBeenCalledWith({});
      expect(result.current.logs).toEqual(mockAuditLogs);
      expect(result.current.totalLogs).toBe(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("deve carregar logs com filtros", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const filters = {
        action: "CREATE",
        resource_type: "USER",
        user_id: "admin-1",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        limit: 50,
        offset: 0,
      };

      await act(async () => {
        await result.current.loadLogs(filters);
      });

      expect(mockAuditLogsService.getAuditLogs).toHaveBeenCalledWith(filters);
    });

    it("deve definir loading durante carregamento", async () => {
      const { result } = renderHook(() => useAuditLogs());

      // Aguardar carregamento inicial
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock para simular delay
      mockAuditLogsService.getAuditLogs.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockAuditLogs), 100),
          ),
      );

      act(() => {
        result.current.loadLogs();
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("deve lidar com erro na API", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = "Erro ao carregar logs";
      mockAuditLogsService.getAuditLogs.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      await act(async () => {
        await result.current.loadLogs();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });

    it("deve lidar com erro sem response", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockAuditLogsService.getAuditLogs.mockRejectedValue(
        new Error("Network error"),
      );

      await act(async () => {
        await result.current.loadLogs();
      });

      expect(result.current.error).toBe("Erro ao carregar logs de auditoria");
      expect(mockToast.error).toHaveBeenCalledWith(
        "Erro ao carregar logs de auditoria",
      );
    });

    it("deve limpar erro antes de nova requisição", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simular erro
      mockAuditLogsService.getAuditLogs.mockRejectedValueOnce({
        response: { data: { detail: "Erro teste" } },
      });

      await act(async () => {
        await result.current.loadLogs();
      });

      expect(result.current.error).toBe("Erro teste");

      // Restaurar mock e fazer nova requisição
      mockAuditLogsService.getAuditLogs.mockResolvedValue(mockAuditLogs);

      await act(async () => {
        await result.current.loadLogs();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe("loadStats", () => {
    it("deve carregar estatísticas com período padrão", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadStats();
      });

      expect(mockAuditLogsService.getAuditStats).toHaveBeenCalledWith(30);
      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.statsLoading).toBe(false);
    });

    it("deve carregar estatísticas com período customizado", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadStats(7);
      });

      expect(mockAuditLogsService.getAuditStats).toHaveBeenCalledWith(7);
    });

    it("deve definir statsLoading durante carregamento", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock para simular delay
      mockAuditLogsService.getAuditStats.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockStats), 100)),
      );

      act(() => {
        result.current.loadStats();
      });

      expect(result.current.statsLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.statsLoading).toBe(false);
      });
    });

    it("deve lidar com erro ao carregar estatísticas", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = "Erro ao carregar estatísticas";
      mockAuditLogsService.getAuditStats.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      await act(async () => {
        await result.current.loadStats();
      });

      expect(result.current.statsLoading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });

    it("deve lidar com erro sem response ao carregar estatísticas", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockAuditLogsService.getAuditStats.mockRejectedValue(
        new Error("Network error"),
      );

      await act(async () => {
        await result.current.loadStats();
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        "Erro ao carregar estatísticas",
      );
    });
  });

  describe("cleanupLogs", () => {
    it("deve limpar logs com período padrão", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.cleanupLogs();
      });

      expect(mockAuditLogsService.cleanupOldLogs).toHaveBeenCalledWith(90);
      expect(mockToast.success).toHaveBeenCalledWith("Logs limpos com sucesso");

      // Deve recarregar logs e stats após limpeza
      expect(mockAuditLogsService.getAuditLogs).toHaveBeenCalledTimes(2); // Inicial + após cleanup
    });

    it("deve limpar logs com período customizado", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.cleanupLogs(30);
      });

      expect(mockAuditLogsService.cleanupOldLogs).toHaveBeenCalledWith(30);
    });

    it("deve lidar com erro na limpeza", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = "Erro ao limpar logs";
      mockAuditLogsService.cleanupOldLogs.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      await act(async () => {
        await result.current.cleanupLogs();
      });

      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });

    it("deve lidar com erro sem response na limpeza", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockAuditLogsService.cleanupOldLogs.mockRejectedValue(
        new Error("Network error"),
      );

      await act(async () => {
        await result.current.cleanupLogs();
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        "Erro ao limpar logs antigos",
      );
    });

    it("deve recarregar dados após limpeza bem-sucedida", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Limpar contadores de chamadas
      jest.clearAllMocks();

      await act(async () => {
        await result.current.cleanupLogs();
      });

      expect(mockAuditLogsService.getAuditLogs).toHaveBeenCalledWith({});
      expect(mockAuditLogsService.getAuditStats).toHaveBeenCalledWith(30);
    });
  });

  describe("refreshFilters", () => {
    it("deve carregar filtros disponíveis", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Limpar contadores de chamadas
      jest.clearAllMocks();

      await act(async () => {
        await result.current.refreshFilters();
      });

      expect(mockAuditLogsService.getAvailableActions).toHaveBeenCalled();
      expect(mockAuditLogsService.getAvailableResourceTypes).toHaveBeenCalled();
      expect(result.current.availableActions).toEqual(mockAvailableActions);
      expect(result.current.availableResourceTypes).toEqual(
        mockAvailableResourceTypes,
      );
    });

    it("deve lidar com erro ao carregar filtros", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockAuditLogsService.getAvailableActions.mockRejectedValue(
        new Error("API Error"),
      );
      mockAuditLogsService.getAvailableResourceTypes.mockRejectedValue(
        new Error("API Error"),
      );

      await act(async () => {
        await result.current.refreshFilters();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erro ao carregar filtros:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("deve lidar com erro parcial ao carregar filtros", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Apenas um dos serviços falha
      mockAuditLogsService.getAvailableActions.mockResolvedValue(
        mockAvailableActions,
      );
      mockAuditLogsService.getAvailableResourceTypes.mockRejectedValue(
        new Error("API Error"),
      );

      await act(async () => {
        await result.current.refreshFilters();
      });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("clearError", () => {
    it("deve limpar erro", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simular erro
      mockAuditLogsService.getAuditLogs.mockRejectedValue({
        response: { data: { detail: "Erro teste" } },
      });

      await act(async () => {
        await result.current.loadLogs();
      });

      expect(result.current.error).toBe("Erro teste");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it("deve manter outros estados ao limpar erro", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialLogs = result.current.logs;
      const initialTotalLogs = result.current.totalLogs;

      // Simular erro
      mockAuditLogsService.getAuditLogs.mockRejectedValue({
        response: { data: { detail: "Erro teste" } },
      });

      await act(async () => {
        await result.current.loadLogs();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.logs).toEqual(initialLogs);
      expect(result.current.totalLogs).toBe(initialTotalLogs);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("Integração Completa", () => {
    it("deve funcionar em cenário real de uso", async () => {
      const { result } = renderHook(() => useAuditLogs());

      // Aguardar carregamento inicial
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.logs).toEqual(mockAuditLogs);
      expect(result.current.availableActions).toEqual(mockAvailableActions);
      expect(result.current.availableResourceTypes).toEqual(
        mockAvailableResourceTypes,
      );

      // Carregar estatísticas
      await act(async () => {
        await result.current.loadStats(7);
      });

      expect(result.current.stats).toEqual(mockStats);

      // Aplicar filtros
      const filters = { action: "CREATE", resource_type: "USER" };
      await act(async () => {
        await result.current.loadLogs(filters);
      });

      expect(mockAuditLogsService.getAuditLogs).toHaveBeenCalledWith(filters);

      // Limpar logs antigos
      await act(async () => {
        await result.current.cleanupLogs(60);
      });

      expect(mockToast.success).toHaveBeenCalledWith("Logs limpos com sucesso");

      // Atualizar filtros
      await act(async () => {
        await result.current.refreshFilters();
      });

      expect(result.current.availableActions).toEqual(mockAvailableActions);
      expect(result.current.availableResourceTypes).toEqual(
        mockAvailableResourceTypes,
      );
    });

    it("deve manter referências estáveis das funções", () => {
      const { result, rerender } = renderHook(() => useAuditLogs());

      const initialFunctions = {
        loadLogs: result.current.loadLogs,
        loadStats: result.current.loadStats,
        cleanupLogs: result.current.cleanupLogs,
        refreshFilters: result.current.refreshFilters,
        clearError: result.current.clearError,
      };

      rerender();

      expect(result.current.loadLogs).toBe(initialFunctions.loadLogs);
      expect(result.current.loadStats).toBe(initialFunctions.loadStats);
      expect(result.current.cleanupLogs).toBe(initialFunctions.cleanupLogs);
      expect(result.current.refreshFilters).toBe(
        initialFunctions.refreshFilters,
      );
      expect(result.current.clearError).toBe(initialFunctions.clearError);
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com resposta vazia da API", async () => {
      const { result } = renderHook(() => useAuditLogs());

      mockAuditLogsService.getAuditLogs.mockResolvedValue([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.logs).toEqual([]);
      expect(result.current.totalLogs).toBe(0);
    });

    it("deve lidar com stats nulas", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockAuditLogsService.getAuditStats.mockResolvedValue(null as any);

      await act(async () => {
        await result.current.loadStats();
      });

      expect(result.current.stats).toBe(null);
    });

    it("deve lidar com filtros vazios", async () => {
      const { result } = renderHook(() => useAuditLogs());

      mockAuditLogsService.getAvailableActions.mockResolvedValue([]);
      mockAuditLogsService.getAvailableResourceTypes.mockResolvedValue([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.availableActions).toEqual([]);
      expect(result.current.availableResourceTypes).toEqual([]);
    });

    it("deve lidar com múltiplas chamadas simultâneas", async () => {
      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Fazer múltiplas chamadas simultâneas
      const promises = [
        result.current.loadLogs({ action: "CREATE" }),
        result.current.loadStats(7),
        result.current.refreshFilters(),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      expect(result.current.logs).toEqual(mockAuditLogs);
      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.availableActions).toEqual(mockAvailableActions);
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      renderHook(() => useAuditLogs());

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it("deve lidar com grandes volumes de dados", async () => {
      const largeMockLogs = Array.from({ length: 1000 }, (_, i) => ({
        ...mockAuditLogs[0],
        id: i + 1,
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
      }));

      mockAuditLogsService.getAuditLogs.mockResolvedValue(largeMockLogs);

      const { result } = renderHook(() => useAuditLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.logs).toHaveLength(1000);
      expect(result.current.totalLogs).toBe(1000);
    });
  });
});
