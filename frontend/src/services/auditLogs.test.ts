import { auditLogsService, AuditLogsService } from "./auditLogs";
import api from "./api";
import {
  AuditLog,
  AuditLogFilter,
  AuditLogStats,
  CleanupResponse,
} from "./auditLogs";

// Mock the API module
jest.mock("./api");

const mockApi = api as jest.Mocked<typeof api>;

describe("AuditLogsService", () => {
  let service: AuditLogsService;

  beforeEach(() => {
    service = new AuditLogsService();
    jest.clearAllMocks();
  });

  describe("getAuditLogs", () => {
    const mockLogs: AuditLog[] = [
      {
        id: 1,
        action: "LOGIN_SUCCESS",
        resource_type: "auth",
        resource_id: 123,
        performed_by: 1,
        description: "User logged in successfully",
        details: { browser: "Chrome" },
        ip_address: "192.168.1.100",
        user_agent: "Mozilla/5.0",
        timestamp: "2024-01-15T10:30:00Z",
      },
      {
        id: 2,
        action: "CREATE_ENTRY",
        resource_type: "entry",
        resource_id: 456,
        performed_by: 2,
        description: "Created new entry",
        timestamp: "2024-01-15T11:00:00Z",
      },
    ];

    it("should fetch audit logs without filters", async () => {
      mockApi.get.mockResolvedValue({ data: mockLogs });

      const result = await service.getAuditLogs();

      expect(mockApi.get).toHaveBeenCalledWith("/audit-logs/?");
      expect(result).toEqual(mockLogs);
    });

    it("should fetch audit logs with all filters", async () => {
      mockApi.get.mockResolvedValue({ data: mockLogs });

      const filters: AuditLogFilter = {
        action: "LOGIN_SUCCESS",
        resource_type: "auth",
        performed_by: 1,
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        skip: 10,
        limit: 20,
      };

      const result = await service.getAuditLogs(filters);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/audit-logs/?skip=10&limit=20&action=LOGIN_SUCCESS&resource_type=auth&performed_by=john.doe&start_date=2024-01-01&end_date=2024-01-31",
      );
      expect(result).toEqual(mockLogs);
    });

    it("should fetch audit logs with partial filters", async () => {
      mockApi.get.mockResolvedValue({ data: mockLogs });

      const filters: AuditLogFilter = {
        action: "CREATE_ENTRY",
        limit: 50,
      };

      const result = await service.getAuditLogs(filters);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/audit-logs/?limit=50&action=CREATE_ENTRY",
      );
      expect(result).toEqual(mockLogs);
    });

    it("should handle skip=0 and limit=0 correctly", async () => {
      mockApi.get.mockResolvedValue({ data: mockLogs });

      const filters: AuditLogFilter = {
        skip: 0,
        limit: 0,
      };

      const result = await service.getAuditLogs(filters);

      expect(mockApi.get).toHaveBeenCalledWith("/audit-logs/?skip=0&limit=0");
      expect(result).toEqual(mockLogs);
    });

    it("should handle API errors", async () => {
      const error = new Error("Network error");
      mockApi.get.mockRejectedValue(error);

      await expect(service.getAuditLogs()).rejects.toThrow("Network error");
      expect(mockApi.get).toHaveBeenCalledWith("/audit-logs/?");
    });
  });

  describe("getAvailableActions", () => {
    const mockActions = [
      "LOGIN_SUCCESS",
      "CREATE_ENTRY",
      "UPDATE_USER",
      "DELETE_CATEGORY",
    ];

    it("should fetch available actions", async () => {
      mockApi.get.mockResolvedValue({ data: mockActions });

      const result = await service.getAvailableActions();

      expect(mockApi.get).toHaveBeenCalledWith("/audit-logs/actions");
      expect(result).toEqual(mockActions);
    });

    it("should handle empty actions list", async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const result = await service.getAvailableActions();

      expect(result).toEqual([]);
    });

    it("should handle API errors", async () => {
      const error = new Error("Failed to fetch actions");
      mockApi.get.mockRejectedValue(error);

      await expect(service.getAvailableActions()).rejects.toThrow(
        "Failed to fetch actions",
      );
    });
  });

  describe("getAvailableResourceTypes", () => {
    const mockResourceTypes = ["user", "entry", "category", "auth", "system"];

    it("should fetch available resource types", async () => {
      mockApi.get.mockResolvedValue({ data: mockResourceTypes });

      const result = await service.getAvailableResourceTypes();

      expect(mockApi.get).toHaveBeenCalledWith("/audit-logs/resource-types");
      expect(result).toEqual(mockResourceTypes);
    });

    it("should handle empty resource types list", async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const result = await service.getAvailableResourceTypes();

      expect(result).toEqual([]);
    });

    it("should handle API errors", async () => {
      const error = new Error("Failed to fetch resource types");
      mockApi.get.mockRejectedValue(error);

      await expect(service.getAvailableResourceTypes()).rejects.toThrow(
        "Failed to fetch resource types",
      );
    });
  });

  describe("getAuditStats", () => {
    const mockStats: AuditLogStats = {
      total_logs: 1500,
      unique_users: 25,
      logs_today: 45,
      logs_this_week: 320,
      top_actions: [
        { action: "LOGIN_SUCCESS", count: 500 },
        { action: "CREATE_ENTRY", count: 300 },
        { action: "UPDATE_USER", count: 200 },
      ],
      top_users: [
        { user: "john.doe", count: 150 },
        { user: "jane.smith", count: 120 },
        { user: "admin", count: 100 },
      ],
    };

    it("should fetch audit stats with default days", async () => {
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await service.getAuditStats();

      expect(mockApi.get).toHaveBeenCalledWith("/audit-logs/stats?days=30");
      expect(result).toEqual(mockStats);
    });

    it("should fetch audit stats with custom days", async () => {
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await service.getAuditStats(7);

      expect(mockApi.get).toHaveBeenCalledWith("/audit-logs/stats?days=7");
      expect(result).toEqual(mockStats);
    });

    it("should handle zero days parameter", async () => {
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await service.getAuditStats(0);

      expect(mockApi.get).toHaveBeenCalledWith("/audit-logs/stats?days=0");
      expect(result).toEqual(mockStats);
    });

    it("should handle API errors", async () => {
      const error = new Error("Unauthorized");
      mockApi.get.mockRejectedValue(error);

      await expect(service.getAuditStats()).rejects.toThrow("Unauthorized");
    });
  });

  describe("cleanupOldLogs", () => {
    const mockCleanupResponse: CleanupResponse = {
      message: "Logs cleaned up successfully",
      deleted_count: 150,
      cutoff_date: "2023-10-15T00:00:00Z",
    };

    it("should cleanup old logs with default days", async () => {
      mockApi.delete.mockResolvedValue({ data: mockCleanupResponse });

      const result = await service.cleanupOldLogs();

      expect(mockApi.delete).toHaveBeenCalledWith(
        "/audit-logs/cleanup?days_to_keep=90",
      );
      expect(result).toEqual(mockCleanupResponse);
    });

    it("should cleanup old logs with custom days", async () => {
      mockApi.delete.mockResolvedValue({ data: mockCleanupResponse });

      const result = await service.cleanupOldLogs(30);

      expect(mockApi.delete).toHaveBeenCalledWith(
        "/audit-logs/cleanup?days_to_keep=30",
      );
      expect(result).toEqual(mockCleanupResponse);
    });

    it("should handle zero days parameter", async () => {
      mockApi.delete.mockResolvedValue({ data: mockCleanupResponse });

      const result = await service.cleanupOldLogs(0);

      expect(mockApi.delete).toHaveBeenCalledWith(
        "/audit-logs/cleanup?days_to_keep=0",
      );
      expect(result).toEqual(mockCleanupResponse);
    });

    it("should handle API errors", async () => {
      const error = new Error("Forbidden");
      mockApi.delete.mockRejectedValue(error);

      await expect(service.cleanupOldLogs()).rejects.toThrow("Forbidden");
    });
  });

  describe("formatDate", () => {
    it("should format ISO date string to Brazilian locale", () => {
      const dateString = "2024-01-15T10:30:45Z";
      const result = service.formatDate(dateString);

      // The exact format may vary by environment, but should contain the date components
      expect(result).toMatch(/15\/01\/2024/);
      expect(result).toMatch(/10:30:45/);
    });

    it("should handle different date formats", () => {
      const dateString = "2024-12-25T23:59:59.999Z";
      const result = service.formatDate(dateString);

      expect(result).toMatch(/25\/12\/2024/);
      expect(result).toMatch(/23:59:59/);
    });

    it("should handle invalid date strings gracefully", () => {
      const invalidDate = "invalid-date";
      const result = service.formatDate(invalidDate);

      expect(result).toMatch(/Invalid Date|NaN/);
    });
  });

  describe("formatAction", () => {
    it("should format known actions to Portuguese", () => {
      expect(service.formatAction("CREATE_USER")).toBe("Criar Usuário");
      expect(service.formatAction("UPDATE_USER")).toBe("Atualizar Usuário");
      expect(service.formatAction("DELETE_USER")).toBe("Excluir Usuário");
      expect(service.formatAction("BLOCK_USER")).toBe("Bloquear Usuário");
      expect(service.formatAction("UNBLOCK_USER")).toBe("Desbloquear Usuário");
      expect(service.formatAction("CHANGE_USER_ROLE")).toBe("Alterar Role");
      expect(service.formatAction("CHANGE_USER_STATUS")).toBe("Alterar Status");
      expect(service.formatAction("RESET_USER_PASSWORD")).toBe("Resetar Senha");
    });

    it("should format authentication actions", () => {
      expect(service.formatAction("LOGIN_SUCCESS")).toBe("Login Bem-sucedido");
      expect(service.formatAction("LOGIN_FAILED")).toBe("Falha no Login");
      expect(service.formatAction("LOGOUT")).toBe("Logout");
      expect(service.formatAction("TOKEN_REFRESH")).toBe("Renovar Token");
    });

    it("should format system actions", () => {
      expect(service.formatAction("SYSTEM_BACKUP")).toBe("Backup do Sistema");
      expect(service.formatAction("SYSTEM_RESTORE")).toBe("Restaurar Sistema");
      expect(service.formatAction("CLEANUP_LOGS")).toBe("Limpeza de Logs");
      expect(service.formatAction("SYSTEM_CONFIG_CHANGE")).toBe(
        "Alterar Configuração",
      );
    });

    it("should format entry actions", () => {
      expect(service.formatAction("CREATE_ENTRY")).toBe("Criar Lançamento");
      expect(service.formatAction("UPDATE_ENTRY")).toBe("Atualizar Lançamento");
      expect(service.formatAction("DELETE_ENTRY")).toBe("Excluir Lançamento");
    });

    it("should format category actions", () => {
      expect(service.formatAction("CREATE_CATEGORY")).toBe("Criar Categoria");
      expect(service.formatAction("UPDATE_CATEGORY")).toBe(
        "Atualizar Categoria",
      );
      expect(service.formatAction("DELETE_CATEGORY")).toBe("Excluir Categoria");
    });

    it("should return original action for unknown actions", () => {
      expect(service.formatAction("UNKNOWN_ACTION")).toBe("UNKNOWN_ACTION");
      expect(service.formatAction("CUSTOM_ACTION")).toBe("CUSTOM_ACTION");
      expect(service.formatAction("")).toBe("");
    });
  });

  describe("formatResourceType", () => {
    it("should format known resource types to Portuguese", () => {
      expect(service.formatResourceType("user")).toBe("Usuário");
      expect(service.formatResourceType("entry")).toBe("Lançamento");
      expect(service.formatResourceType("category")).toBe("Categoria");
      expect(service.formatResourceType("auth")).toBe("Autenticação");
      expect(service.formatResourceType("system")).toBe("Sistema");
      expect(service.formatResourceType("audit_log")).toBe("Log de Auditoria");
    });

    it("should return original resource type for unknown types", () => {
      expect(service.formatResourceType("unknown")).toBe("unknown");
      expect(service.formatResourceType("custom_resource")).toBe(
        "custom_resource",
      );
      expect(service.formatResourceType("")).toBe("");
    });
  });

  describe("getActionColor", () => {
    it("should return green color for CREATE actions", () => {
      expect(service.getActionColor("CREATE_USER")).toBe(
        "bg-green-100 text-green-800",
      );
      expect(service.getActionColor("CREATE_ENTRY")).toBe(
        "bg-green-100 text-green-800",
      );
      expect(service.getActionColor("CREATE_CATEGORY")).toBe(
        "bg-green-100 text-green-800",
      );
    });

    it("should return blue color for UPDATE and CHANGE actions", () => {
      expect(service.getActionColor("UPDATE_USER")).toBe(
        "bg-blue-100 text-blue-800",
      );
      expect(service.getActionColor("UPDATE_ENTRY")).toBe(
        "bg-blue-100 text-blue-800",
      );
      expect(service.getActionColor("CHANGE_USER_ROLE")).toBe(
        "bg-blue-100 text-blue-800",
      );
      expect(service.getActionColor("CHANGE_USER_STATUS")).toBe(
        "bg-blue-100 text-blue-800",
      );
    });

    it("should return red color for DELETE and BLOCK actions", () => {
      expect(service.getActionColor("DELETE_USER")).toBe(
        "bg-red-100 text-red-800",
      );
      expect(service.getActionColor("DELETE_ENTRY")).toBe(
        "bg-red-100 text-red-800",
      );
      expect(service.getActionColor("BLOCK_USER")).toBe(
        "bg-red-100 text-red-800",
      );
    });

    it("should return green color for successful login", () => {
      expect(service.getActionColor("LOGIN_SUCCESS")).toBe(
        "bg-green-100 text-green-800",
      );
    });

    it("should return red color for failed login", () => {
      expect(service.getActionColor("LOGIN_FAILED")).toBe(
        "bg-red-100 text-red-800",
      );
    });

    it("should return yellow color for UNBLOCK actions", () => {
      expect(service.getActionColor("UNBLOCK_USER")).toBe(
        "bg-yellow-100 text-yellow-800",
      );
    });

    it("should return purple color for SYSTEM actions", () => {
      expect(service.getActionColor("SYSTEM_BACKUP")).toBe(
        "bg-purple-100 text-purple-800",
      );
      expect(service.getActionColor("SYSTEM_RESTORE")).toBe(
        "bg-purple-100 text-purple-800",
      );
      expect(service.getActionColor("SYSTEM_CONFIG_CHANGE")).toBe(
        "bg-purple-100 text-purple-800",
      );
    });

    it("should return gray color for unknown actions", () => {
      expect(service.getActionColor("UNKNOWN_ACTION")).toBe(
        "bg-gray-100 text-gray-800",
      );
      expect(service.getActionColor("CUSTOM_ACTION")).toBe(
        "bg-gray-100 text-gray-800",
      );
      expect(service.getActionColor("")).toBe("bg-gray-100 text-gray-800");
    });
  });

  describe("getActionBadgeColor", () => {
    it("should be an alias for getActionColor", () => {
      const testActions = [
        "CREATE_USER",
        "UPDATE_ENTRY",
        "DELETE_CATEGORY",
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "UNBLOCK_USER",
        "SYSTEM_BACKUP",
        "UNKNOWN_ACTION",
      ];

      testActions.forEach((action) => {
        expect(service.getActionBadgeColor(action)).toBe(
          service.getActionColor(action),
        );
      });
    });
  });

  describe("Service Instance", () => {
    it("should export a singleton instance", () => {
      expect(auditLogsService).toBeInstanceOf(AuditLogsService);
    });

    it("should export the class constructor", () => {
      expect(AuditLogsService).toBeDefined();
      expect(typeof AuditLogsService).toBe("function");
    });

    it("should allow creating new instances", () => {
      const newInstance = new AuditLogsService();
      expect(newInstance).toBeInstanceOf(AuditLogsService);
      expect(newInstance).not.toBe(auditLogsService);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null and undefined parameters gracefully", async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      // Test with null filters
      await expect(service.getAuditLogs(null as any)).resolves.toEqual([]);

      // Test with undefined filters (should use default)
      await expect(service.getAuditLogs(undefined)).resolves.toEqual([]);
    });

    it("should handle network timeouts", async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      mockApi.get.mockRejectedValue(timeoutError);

      await expect(service.getAuditLogs()).rejects.toThrow("Request timeout");
    });

    it("should handle malformed API responses", async () => {
      mockApi.get.mockResolvedValue({ data: null });

      const result = await service.getAuditLogs();
      expect(result).toBeNull();
    });

    it("should handle very large filter parameters", async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const filters: AuditLogFilter = {
        skip: 999999,
        limit: 999999,
        performed_by: 2, // Test user ID
        action: "VERY_LONG_ACTION_NAME_".repeat(10),
      };

      await expect(service.getAuditLogs(filters)).resolves.toEqual([]);
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining("skip=999999&limit=999999"),
      );
    });
  });

  describe("Performance", () => {
    it("should handle large datasets efficiently", async () => {
      const largeMockLogs = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        action: "LOGIN_SUCCESS",
        resource_type: "auth",
        resource_id: `user${i}`,
        performed_by: `user${i}`,
        description: `Login ${i}`,
        timestamp: "2024-01-15T10:30:00Z",
      }));

      mockApi.get.mockResolvedValue({ data: largeMockLogs });

      const startTime = performance.now();
      const result = await service.getAuditLogs();
      const endTime = performance.now();

      expect(result).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it("should format many actions quickly", () => {
      const actions = Array.from({ length: 1000 }, (_, i) => `ACTION_${i}`);

      const startTime = performance.now();
      const results = actions.map((action) => service.formatAction(action));
      const endTime = performance.now();

      expect(results).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});
