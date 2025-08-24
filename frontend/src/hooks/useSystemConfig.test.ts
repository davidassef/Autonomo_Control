import { renderHook, act, waitFor } from "@testing-library/react";
import { useSystemConfig } from "./useSystemConfig";
import systemConfigService, {
  ConfigHistoryItem,
} from "../services/systemConfigService";
import { toast } from "sonner";

// Mock do serviço de configuração do sistema
jest.mock("../services/systemConfigService");
const mockSystemConfigService = systemConfigService as jest.Mocked<
  typeof systemConfigService
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
const mockConfigs = {
  "app.name": "Autonomo Control",
  "app.version": "1.0.0",
  "security.session_timeout": 3600,
  "ui.theme": "light",
  "notifications.email_enabled": true,
};

const mockCategories = ["app", "security", "ui", "notifications"];

const mockHistory: ConfigHistoryItem[] = [
  {
    config_key: "app.name",
    config_value: "Autonomo Control",
    value_type: "string",
    category: "app",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z",
    is_active: true,
    updated_by: {
      name: "admin",
      email: "admin@example.com",
    },
  },
  {
    config_key: "security.session_timeout",
    config_value: "3600",
    value_type: "number",
    category: "security",
    created_at: "2024-01-01T11:00:00Z",
    updated_at: "2024-01-01T11:00:00Z",
    is_active: true,
    updated_by: {
      name: "admin",
      email: "admin@example.com",
    },
  },
];

const mockUpdateResult = {
  success: true,
  message: "Configurações atualizadas com sucesso",
};

describe("useSystemConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks padrão
    mockSystemConfigService.getAllConfigs.mockResolvedValue(mockConfigs);
    mockSystemConfigService.getCategories.mockResolvedValue(mockCategories);
    mockSystemConfigService.getConfigsByCategory.mockResolvedValue(mockConfigs);
    mockSystemConfigService.getConfigHistory.mockResolvedValue(mockHistory);
    mockSystemConfigService.updateConfig.mockResolvedValue(
      "Configuração atualizada com sucesso",
    );
    mockSystemConfigService.updateMultipleConfigs.mockResolvedValue(
      mockUpdateResult,
    );
    mockSystemConfigService.resetToDefaults.mockResolvedValue(
      "Configurações resetadas com sucesso",
    );
    mockSystemConfigService.initializeDefaults.mockResolvedValue(
      "Configurações inicializadas com sucesso",
    );
  });

  describe("Estado Inicial", () => {
    it("deve inicializar com estado padrão", () => {
      const { result } = renderHook(() => useSystemConfig());

      expect(result.current.configs).toEqual({});
      expect(result.current.categories).toEqual([]);
      expect(result.current.history).toEqual([]);
      expect(result.current.loading).toBe(true); // Loading inicial
      expect(result.current.error).toBe(null);
      expect(result.current.updating).toBe(false);
    });

    it("deve carregar dados iniciais automaticamente", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSystemConfigService.getAllConfigs).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
      expect(mockSystemConfigService.getCategories).toHaveBeenCalled();

      expect(result.current.configs).toEqual(mockConfigs);
      expect(result.current.categories).toEqual(mockCategories);
    });

    it("deve expor todas as funções necessárias", () => {
      const { result } = renderHook(() => useSystemConfig());

      expect(typeof result.current.loadConfigs).toBe("function");
      expect(typeof result.current.loadConfigsByCategory).toBe("function");
      expect(typeof result.current.loadCategories).toBe("function");
      expect(typeof result.current.loadHistory).toBe("function");
      expect(typeof result.current.updateConfig).toBe("function");
      expect(typeof result.current.updateMultipleConfigs).toBe("function");
      expect(typeof result.current.resetToDefaults).toBe("function");
      expect(typeof result.current.initializeDefaults).toBe("function");
      expect(typeof result.current.getConfigValue).toBe("function");
      expect(typeof result.current.refresh).toBe("function");
    });
  });

  describe("loadConfigs", () => {
    it("deve carregar todas as configurações", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadConfigs();
      });

      expect(mockSystemConfigService.getAllConfigs).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
      expect(result.current.configs).toEqual(mockConfigs);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("deve carregar configurações por categoria", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadConfigs("security");
      });

      expect(mockSystemConfigService.getAllConfigs).toHaveBeenCalledWith(
        "security",
        undefined,
      );
    });

    it("deve carregar apenas configurações públicas", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadConfigs(undefined, true);
      });

      expect(mockSystemConfigService.getAllConfigs).toHaveBeenCalledWith(
        undefined,
        true,
      );
    });

    it("deve carregar configurações com categoria e publicOnly", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadConfigs("ui", true);
      });

      expect(mockSystemConfigService.getAllConfigs).toHaveBeenCalledWith(
        "ui",
        true,
      );
    });

    it("deve definir loading durante carregamento", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock para simular delay
      mockSystemConfigService.getAllConfigs.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockConfigs), 100)),
      );

      act(() => {
        result.current.loadConfigs();
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("deve lidar com erro na API", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = "Erro ao carregar configurações";
      mockSystemConfigService.getAllConfigs.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      await act(async () => {
        await result.current.loadConfigs();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });

    it("deve lidar com erro sem response", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockSystemConfigService.getAllConfigs.mockRejectedValue(
        new Error("Network error"),
      );

      await act(async () => {
        await result.current.loadConfigs();
      });

      expect(result.current.error).toBe("Erro ao carregar configurações");
      expect(mockToast.error).toHaveBeenCalledWith(
        "Erro ao carregar configurações",
      );
    });
  });

  describe("loadConfigsByCategory", () => {
    it("deve carregar configurações por categoria", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadConfigsByCategory("security");
      });

      expect(mockSystemConfigService.getConfigsByCategory).toHaveBeenCalledWith(
        "security",
      );
      expect(result.current.configs).toEqual(mockConfigs);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("deve definir loading durante carregamento", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock para simular delay
      mockSystemConfigService.getConfigsByCategory.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockConfigs), 100)),
      );

      act(() => {
        result.current.loadConfigsByCategory("ui");
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("deve lidar com erro na API", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = "Erro ao carregar configurações da categoria";
      mockSystemConfigService.getConfigsByCategory.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      await act(async () => {
        await result.current.loadConfigsByCategory("security");
      });

      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe("loadCategories", () => {
    it("deve carregar categorias disponíveis", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Limpar contadores de chamadas
      jest.clearAllMocks();

      await act(async () => {
        await result.current.loadCategories();
      });

      expect(mockSystemConfigService.getCategories).toHaveBeenCalled();
      expect(result.current.categories).toEqual(mockCategories);
    });

    it("deve lidar com erro ao carregar categorias", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const errorMessage = "Erro ao carregar categorias";
      mockSystemConfigService.getCategories.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      await act(async () => {
        await result.current.loadCategories();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erro ao carregar categorias:",
        errorMessage,
      );

      consoleSpy.mockRestore();
    });
  });

  describe("loadHistory", () => {
    it("deve carregar histórico completo", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadHistory();
      });

      expect(mockSystemConfigService.getConfigHistory).toHaveBeenCalledWith(
        undefined,
        50,
      );
      expect(result.current.history).toEqual(mockHistory);
    });

    it("deve carregar histórico de uma chave específica", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadHistory("app.name");
      });

      expect(mockSystemConfigService.getConfigHistory).toHaveBeenCalledWith(
        "app.name",
        50,
      );
    });

    it("deve carregar histórico com limite customizado", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadHistory("app.name", 10);
      });

      expect(mockSystemConfigService.getConfigHistory).toHaveBeenCalledWith(
        "app.name",
        10,
      );
    });

    it("deve lidar com erro ao carregar histórico", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const errorMessage = "Erro ao carregar histórico";
      mockSystemConfigService.getConfigHistory.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      await act(async () => {
        await result.current.loadHistory();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erro ao carregar histórico:",
        errorMessage,
      );

      consoleSpy.mockRestore();
    });
  });

  describe("updateConfig", () => {
    it("deve atualizar configuração com sucesso", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateConfig(
          "app.name",
          "New App Name",
        );
      });

      expect(mockSystemConfigService.updateConfig).toHaveBeenCalledWith(
        "app.name",
        "New App Name",
      );
      expect(result.current.configs["app.name"]).toBe("New App Name");
      expect(result.current.updating).toBe(false);
      expect(mockToast.success).toHaveBeenCalledWith(
        "Configuração atualizada com sucesso",
      );
      expect(updateResult).toBe(true);
    });

    it("deve definir updating durante atualização", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock para simular delay
      mockSystemConfigService.updateConfig.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve("Sucesso"), 100)),
      );

      act(() => {
        result.current.updateConfig("app.name", "New Name");
      });

      expect(result.current.updating).toBe(true);

      await waitFor(() => {
        expect(result.current.updating).toBe(false);
      });
    });

    it("deve lidar com erro na atualização", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = "Erro ao atualizar configuração";
      mockSystemConfigService.updateConfig.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateConfig(
          "app.name",
          "New Name",
        );
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.updating).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
      expect(updateResult).toBe(false);
    });
  });

  describe("updateMultipleConfigs", () => {
    it("deve atualizar múltiplas configurações com sucesso", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const configsToUpdate = {
        "app.name": "New App Name",
        "app.version": "2.0.0",
      };

      let updateResult;
      await act(async () => {
        updateResult =
          await result.current.updateMultipleConfigs(configsToUpdate);
      });

      expect(
        mockSystemConfigService.updateMultipleConfigs,
      ).toHaveBeenCalledWith(configsToUpdate);
      expect(result.current.configs["app.name"]).toBe("New App Name");
      expect(result.current.configs["app.version"]).toBe("2.0.0");
      expect(result.current.updating).toBe(false);
      expect(mockToast.success).toHaveBeenCalledWith(mockUpdateResult.message);
      expect(updateResult).toBe(true);
    });

    it("deve lidar com falha no resultado do serviço", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const failureResult = {
        success: false,
        message: "Falha na atualização",
      };

      mockSystemConfigService.updateMultipleConfigs.mockResolvedValue(
        failureResult,
      );

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateMultipleConfigs({
          "app.name": "Test",
        });
      });

      expect(result.current.error).toBe(failureResult.message);
      expect(mockToast.error).toHaveBeenCalledWith(failureResult.message);
      expect(updateResult).toBe(false);
    });

    it("deve lidar com erro na API", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = "Erro ao atualizar configurações";
      mockSystemConfigService.updateMultipleConfigs.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateMultipleConfigs({
          "app.name": "Test",
        });
      });

      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
      expect(updateResult).toBe(false);
    });
  });

  describe("resetToDefaults", () => {
    it("deve resetar configurações para padrões", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetToDefaults();
      });

      expect(mockSystemConfigService.resetToDefaults).toHaveBeenCalled();
      expect(mockSystemConfigService.getAllConfigs).toHaveBeenCalledTimes(2); // Inicial + após reset
      expect(mockToast.success).toHaveBeenCalledWith(
        "Configurações resetadas com sucesso",
      );
      expect(resetResult).toBe(true);
    });

    it("deve lidar com erro no reset", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = "Erro ao resetar configurações";
      mockSystemConfigService.resetToDefaults.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetToDefaults();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
      expect(resetResult).toBe(false);
    });
  });

  describe("initializeDefaults", () => {
    it("deve inicializar configurações padrão", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let initResult;
      await act(async () => {
        initResult = await result.current.initializeDefaults();
      });

      expect(mockSystemConfigService.initializeDefaults).toHaveBeenCalled();
      expect(mockSystemConfigService.getAllConfigs).toHaveBeenCalledTimes(2); // Inicial + após init
      expect(mockToast.success).toHaveBeenCalledWith(
        "Configurações inicializadas com sucesso",
      );
      expect(initResult).toBe(true);
    });

    it("deve lidar com erro na inicialização", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = "Erro ao inicializar configurações";
      mockSystemConfigService.initializeDefaults.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      let initResult;
      await act(async () => {
        initResult = await result.current.initializeDefaults();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
      expect(initResult).toBe(false);
    });
  });

  describe("getConfigValue", () => {
    it("deve retornar valor da configuração existente", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const value = result.current.getConfigValue("app.name");
      expect(value).toBe("Autonomo Control");
    });

    it("deve retornar undefined para configuração inexistente", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const value = result.current.getConfigValue("nonexistent.key");
      expect(value).toBeUndefined();
    });

    it("deve retornar valor atualizado após mudança", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateConfig("app.name", "Updated Name");
      });

      const value = result.current.getConfigValue("app.name");
      expect(value).toBe("Updated Name");
    });
  });

  describe("refresh", () => {
    it("deve recarregar configurações e categorias", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Limpar contadores de chamadas
      jest.clearAllMocks();

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockSystemConfigService.getAllConfigs).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
      expect(mockSystemConfigService.getCategories).toHaveBeenCalled();
    });

    it("deve lidar com erro no refresh", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = "Erro no refresh";
      mockSystemConfigService.getAllConfigs.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe("Integração Completa", () => {
    it("deve funcionar em cenário real de uso", async () => {
      const { result } = renderHook(() => useSystemConfig());

      // Aguardar carregamento inicial
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.configs).toEqual(mockConfigs);
      expect(result.current.categories).toEqual(mockCategories);

      // Carregar histórico
      await act(async () => {
        await result.current.loadHistory("app.name", 10);
      });

      expect(result.current.history).toEqual(mockHistory);

      // Atualizar configuração
      await act(async () => {
        await result.current.updateConfig("app.name", "New Name");
      });

      expect(result.current.getConfigValue("app.name")).toBe("New Name");

      // Carregar configurações por categoria
      await act(async () => {
        await result.current.loadConfigsByCategory("security");
      });

      expect(mockSystemConfigService.getConfigsByCategory).toHaveBeenCalledWith(
        "security",
      );

      // Atualizar múltiplas configurações
      const multipleConfigs = {
        "ui.theme": "dark",
        "notifications.email_enabled": false,
      };
      await act(async () => {
        await result.current.updateMultipleConfigs(multipleConfigs);
      });

      expect(result.current.getConfigValue("ui.theme")).toBe("dark");
      expect(result.current.getConfigValue("notifications.email_enabled")).toBe(
        false,
      );
    });

    it("deve manter referências estáveis das funções", () => {
      const { result, rerender } = renderHook(() => useSystemConfig());

      const initialFunctions = {
        loadConfigs: result.current.loadConfigs,
        loadConfigsByCategory: result.current.loadConfigsByCategory,
        loadCategories: result.current.loadCategories,
        loadHistory: result.current.loadHistory,
        updateConfig: result.current.updateConfig,
        updateMultipleConfigs: result.current.updateMultipleConfigs,
        resetToDefaults: result.current.resetToDefaults,
        initializeDefaults: result.current.initializeDefaults,
        getConfigValue: result.current.getConfigValue,
        refresh: result.current.refresh,
      };

      rerender();

      expect(result.current.loadConfigs).toBe(initialFunctions.loadConfigs);
      expect(result.current.loadConfigsByCategory).toBe(
        initialFunctions.loadConfigsByCategory,
      );
      expect(result.current.loadCategories).toBe(
        initialFunctions.loadCategories,
      );
      expect(result.current.loadHistory).toBe(initialFunctions.loadHistory);
      expect(result.current.updateConfig).toBe(initialFunctions.updateConfig);
      expect(result.current.updateMultipleConfigs).toBe(
        initialFunctions.updateMultipleConfigs,
      );
      expect(result.current.resetToDefaults).toBe(
        initialFunctions.resetToDefaults,
      );
      expect(result.current.initializeDefaults).toBe(
        initialFunctions.initializeDefaults,
      );
      expect(result.current.getConfigValue).toBe(
        initialFunctions.getConfigValue,
      );
      expect(result.current.refresh).toBe(initialFunctions.refresh);
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com configurações vazias", async () => {
      const { result } = renderHook(() => useSystemConfig());

      mockSystemConfigService.getAllConfigs.mockResolvedValue({});

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.configs).toEqual({});
      expect(result.current.getConfigValue("any.key")).toBeUndefined();
    });

    it("deve lidar com categorias vazias", async () => {
      const { result } = renderHook(() => useSystemConfig());

      mockSystemConfigService.getCategories.mockResolvedValue([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categories).toEqual([]);
    });

    it("deve lidar com histórico vazio", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockSystemConfigService.getConfigHistory.mockResolvedValue([]);

      await act(async () => {
        await result.current.loadHistory();
      });

      expect(result.current.history).toEqual([]);
    });

    it("deve lidar com múltiplas chamadas simultâneas", async () => {
      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Fazer múltiplas chamadas simultâneas
      const promises = [
        result.current.loadConfigs("app"),
        result.current.loadHistory("app.name"),
        result.current.updateConfig("test.key", "test.value"),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      expect(result.current.configs).toEqual(mockConfigs);
      expect(result.current.history).toEqual(mockHistory);
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      renderHook(() => useSystemConfig());

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it("deve lidar com grandes volumes de configurações", async () => {
      const largeMockConfigs = Array.from({ length: 1000 }, (_, i) => ({
        [`config.${i}`]: `value-${i}`,
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

      mockSystemConfigService.getAllConfigs.mockResolvedValue(largeMockConfigs);

      const { result } = renderHook(() => useSystemConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Object.keys(result.current.configs)).toHaveLength(1000);
      expect(result.current.getConfigValue("config.500")).toBe("value-500");
    });
  });
});
