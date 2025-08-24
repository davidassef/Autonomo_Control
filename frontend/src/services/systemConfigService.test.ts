import systemConfigService, {
  SystemConfig,
  ConfigHistoryItem,
  ApiResponse,
} from "./systemConfigService";
import api from "./api";

// Mock the API module
jest.mock("./api");

const mockApi = api as jest.Mocked<typeof api>;

describe("SystemConfigService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockConfigs: SystemConfig = {
    "app.name": "Autonomo Control",
    "app.version": "1.0.0",
    "app.debug": true,
    "email.smtp_host": "smtp.gmail.com",
    "email.smtp_port": 587,
    "backup.enabled": true,
    "backup.frequency": "daily",
    "security.session_timeout": 3600,
    "logging.level": "info",
  };

  // const mockApiResponse = <T>(data: T): ApiResponse<T> => ({
  //   success: true,
  //   data,
  //   message: "Success",
  // });

  describe("getAllConfigs", () => {
    it("should fetch all configs without filters", async () => {
      mockApi.get.mockResolvedValue({ data: mockApiResponse(mockConfigs) });

      const result = await systemConfigService.getAllConfigs();

      expect(mockApi.get).toHaveBeenCalledWith("/system-config/?");
      expect(result).toEqual(mockConfigs);
    });

    it("should fetch configs with category filter", async () => {
      const emailConfigs = {
        "email.smtp_host": "smtp.gmail.com",
        "email.smtp_port": 587,
      };
      mockApi.get.mockResolvedValue({ data: mockApiResponse(emailConfigs) });

      const result = await systemConfigService.getAllConfigs("email");

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-config/?category=email",
      );
      expect(result).toEqual(emailConfigs);
    });

    it("should fetch only public configs", async () => {
      const publicConfigs = {
        "app.name": "Autonomo Control",
        "app.version": "1.0.0",
      };
      mockApi.get.mockResolvedValue({ data: mockApiResponse(publicConfigs) });

      const result = await systemConfigService.getAllConfigs(undefined, true);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-config/?public_only=true",
      );
      expect(result).toEqual(publicConfigs);
    });

    it("should fetch configs with both category and public filters", async () => {
      const filteredConfigs = { "app.name": "Autonomo Control" };
      mockApi.get.mockResolvedValue({ data: mockApiResponse(filteredConfigs) });

      const result = await systemConfigService.getAllConfigs("app", true);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-config/?category=app&public_only=true",
      );
      expect(result).toEqual(filteredConfigs);
    });

    it("should handle API errors", async () => {
      const error = new Error("Network error");
      mockApi.get.mockRejectedValue(error);

      await expect(systemConfigService.getAllConfigs()).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("getPublicConfigs", () => {
    it("should fetch public configs", async () => {
      const publicConfigs = {
        "app.name": "Autonomo Control",
        "app.version": "1.0.0",
      };
      mockApi.get.mockResolvedValue({ data: mockApiResponse(publicConfigs) });

      const result = await systemConfigService.getPublicConfigs();

      expect(mockApi.get).toHaveBeenCalledWith("/system-config/public");
      expect(result).toEqual(publicConfigs);
    });

    it("should handle empty public configs", async () => {
      mockApi.get.mockResolvedValue({ data: mockApiResponse({}) });

      const result = await systemConfigService.getPublicConfigs();

      expect(result).toEqual({});
    });

    it("should handle API errors", async () => {
      const error = new Error("Unauthorized");
      mockApi.get.mockRejectedValue(error);

      await expect(systemConfigService.getPublicConfigs()).rejects.toThrow(
        "Unauthorized",
      );
    });
  });

  describe("getConfigsByCategory", () => {
    it("should fetch configs by category", async () => {
      const emailConfigs = {
        "email.smtp_host": "smtp.gmail.com",
        "email.smtp_port": 587,
        "email.enabled": true,
      };
      mockApi.get.mockResolvedValue({ data: mockApiResponse(emailConfigs) });

      const result = await systemConfigService.getConfigsByCategory("email");

      expect(mockApi.get).toHaveBeenCalledWith("/system-config/category/email");
      expect(result).toEqual(emailConfigs);
    });

    it("should handle empty category", async () => {
      mockApi.get.mockResolvedValue({ data: mockApiResponse({}) });

      const result =
        await systemConfigService.getConfigsByCategory("nonexistent");

      expect(result).toEqual({});
    });

    it("should handle special characters in category name", async () => {
      systemConfigService.getConfigsByCategory("email-smtp");

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-config/category/email-smtp",
      );
    });

    it("should handle API errors", async () => {
      const error = new Error("Category not found");
      mockApi.get.mockRejectedValue(error);

      await expect(
        systemConfigService.getConfigsByCategory("invalid"),
      ).rejects.toThrow("Category not found");
    });
  });

  describe("getConfigByKey", () => {
    it("should fetch config by key", async () => {
      const configData = { "app.name": "Autonomo Control" };
      mockApi.get.mockResolvedValue({ data: mockApiResponse(configData) });

      const result = await systemConfigService.getConfigByKey("app.name");

      expect(mockApi.get).toHaveBeenCalledWith("/system-config/key/app.name");
      expect(result).toBe("Autonomo Control");
    });

    it("should handle boolean config values", async () => {
      const configData = { "app.debug": true };
      mockApi.get.mockResolvedValue({ data: mockApiResponse(configData) });

      const result = await systemConfigService.getConfigByKey("app.debug");

      expect(result).toBe(true);
    });

    it("should handle numeric config values", async () => {
      const configData = { "email.smtp_port": 587 };
      mockApi.get.mockResolvedValue({ data: mockApiResponse(configData) });

      const result =
        await systemConfigService.getConfigByKey("email.smtp_port");

      expect(result).toBe(587);
    });

    it("should handle null config values", async () => {
      const configData = { "optional.setting": null };
      mockApi.get.mockResolvedValue({ data: mockApiResponse(configData) });

      const result =
        await systemConfigService.getConfigByKey("optional.setting");

      expect(result).toBeNull();
    });

    it("should handle nonexistent keys", async () => {
      const configData = {};
      mockApi.get.mockResolvedValue({ data: mockApiResponse(configData) });

      const result =
        await systemConfigService.getConfigByKey("nonexistent.key");

      expect(result).toBeUndefined();
    });

    it("should handle API errors", async () => {
      const error = new Error("Key not found");
      mockApi.get.mockRejectedValue(error);

      await expect(
        systemConfigService.getConfigByKey("invalid.key"),
      ).rejects.toThrow("Key not found");
    });
  });

  describe("updateConfig", () => {
    it("should update a string config", async () => {
      const successMessage = "Configuration updated successfully";
      mockApi.put.mockResolvedValue({
        data: { success: true, data: null, message: successMessage },
      });

      const result = await systemConfigService.updateConfig(
        "app.name",
        "New App Name",
      );

      expect(mockApi.put).toHaveBeenCalledWith("/system-config/", {
        key: "app.name",
        value: "New App Name",
      });
      expect(result).toBe(successMessage);
    });

    it("should update a boolean config", async () => {
      const successMessage = "Debug mode updated";
      mockApi.put.mockResolvedValue({
        data: { success: true, data: null, message: successMessage },
      });

      const result = await systemConfigService.updateConfig("app.debug", false);

      expect(mockApi.put).toHaveBeenCalledWith("/system-config/", {
        key: "app.debug",
        value: false,
      });
      expect(result).toBe(successMessage);
    });

    it("should update a numeric config", async () => {
      const successMessage = "Port updated";
      mockApi.put.mockResolvedValue({
        data: { success: true, data: null, message: successMessage },
      });

      const result = await systemConfigService.updateConfig(
        "email.smtp_port",
        465,
      );

      expect(mockApi.put).toHaveBeenCalledWith("/system-config/", {
        key: "email.smtp_port",
        value: 465,
      });
      expect(result).toBe(successMessage);
    });

    it("should handle null values", async () => {
      const successMessage = "Config cleared";
      mockApi.put.mockResolvedValue({
        data: { success: true, data: null, message: successMessage },
      });

      const result = await systemConfigService.updateConfig(
        "optional.setting",
        null,
      );

      expect(mockApi.put).toHaveBeenCalledWith("/system-config/", {
        key: "optional.setting",
        value: null,
      });
      expect(result).toBe(successMessage);
    });

    it("should handle API errors", async () => {
      const error = new Error("Validation failed");
      mockApi.put.mockRejectedValue(error);

      await expect(
        systemConfigService.updateConfig("invalid.key", "value"),
      ).rejects.toThrow("Validation failed");
    });
  });

  describe("updateMultipleConfigs", () => {
    it("should update multiple configs successfully", async () => {
      const configs = {
        "app.name": "Updated App",
        "app.debug": false,
        "email.smtp_port": 465,
      };
      const results = {
        "app.name": true,
        "app.debug": true,
        "email.smtp_port": true,
      };
      const successMessage = "All configurations updated successfully";

      mockApi.put.mockResolvedValue({
        data: { success: true, data: results, message: successMessage },
      });

      const result = await systemConfigService.updateMultipleConfigs(configs);

      expect(mockApi.put).toHaveBeenCalledWith("/system-config/multiple", {
        configs,
      });
      expect(result).toEqual({
        success: true,
        message: successMessage,
        results,
      });
    });

    it("should handle partial success", async () => {
      const configs = {
        "app.name": "Updated App",
        "invalid.key": "invalid value",
      };
      const results = {
        "app.name": true,
        "invalid.key": false,
      };
      const partialMessage = "Some configurations failed to update";

      mockApi.put.mockResolvedValue({
        data: { success: false, data: results, message: partialMessage },
      });

      const result = await systemConfigService.updateMultipleConfigs(configs);

      expect(result).toEqual({
        success: false,
        message: partialMessage,
        results,
      });
    });

    it("should handle empty configs object", async () => {
      const successMessage = "No configurations to update";

      mockApi.put.mockResolvedValue({
        data: { success: true, data: {}, message: successMessage },
      });

      const result = await systemConfigService.updateMultipleConfigs({});

      expect(mockApi.put).toHaveBeenCalledWith("/system-config/multiple", {
        configs: {},
      });
      expect(result.success).toBe(true);
    });

    it("should handle API errors", async () => {
      const error = new Error("Server error");
      mockApi.put.mockRejectedValue(error);

      await expect(
        systemConfigService.updateMultipleConfigs({ key: "value" }),
      ).rejects.toThrow("Server error");
    });
  });

  describe("resetToDefaults", () => {
    it("should reset all configs to defaults", async () => {
      const successMessage = "All configurations reset to defaults";
      mockApi.post.mockResolvedValue({
        data: { success: true, data: null, message: successMessage },
      });

      const result = await systemConfigService.resetToDefaults();

      expect(mockApi.post).toHaveBeenCalledWith("/system-config/reset");
      expect(result).toBe(successMessage);
    });

    it("should handle API errors", async () => {
      const error = new Error("Reset failed");
      mockApi.post.mockRejectedValue(error);

      await expect(systemConfigService.resetToDefaults()).rejects.toThrow(
        "Reset failed",
      );
    });
  });

  describe("initializeDefaults", () => {
    it("should initialize default configs", async () => {
      const successMessage = "Default configurations initialized";
      mockApi.post.mockResolvedValue({
        data: { success: true, data: null, message: successMessage },
      });

      const result = await systemConfigService.initializeDefaults();

      expect(mockApi.post).toHaveBeenCalledWith("/system-config/initialize");
      expect(result).toBe(successMessage);
    });

    it("should handle API errors", async () => {
      const error = new Error("Initialization failed");
      mockApi.post.mockRejectedValue(error);

      await expect(systemConfigService.initializeDefaults()).rejects.toThrow(
        "Initialization failed",
      );
    });
  });

  describe("getConfigHistory", () => {
    const mockHistory: ConfigHistoryItem[] = [
      {
        config_key: "app.name",
        config_value: "Autonomo Control",
        value_type: "string",
        category: "app",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        is_active: true,
        updated_by: {
          name: "Admin User",
          email: "admin@example.com",
        },
      },
      {
        config_key: "app.debug",
        config_value: "true",
        value_type: "boolean",
        category: "app",
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T11:00:00Z",
        is_active: false,
        updated_by: {
          name: "Developer",
          email: "dev@example.com",
        },
      },
    ];

    it("should fetch config history with default limit", async () => {
      mockApi.get.mockResolvedValue({ data: mockApiResponse(mockHistory) });

      const result = await systemConfigService.getConfigHistory();

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-config/history?limit=50",
      );
      expect(result).toEqual(mockHistory);
    });

    it("should fetch config history with custom limit", async () => {
      mockApi.get.mockResolvedValue({ data: mockApiResponse(mockHistory) });

      const result = await systemConfigService.getConfigHistory(undefined, 100);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-config/history?limit=100",
      );
      expect(result).toEqual(mockHistory);
    });

    it("should fetch config history for specific key", async () => {
      const filteredHistory = [mockHistory[0]];
      mockApi.get.mockResolvedValue({ data: mockApiResponse(filteredHistory) });

      const result = await systemConfigService.getConfigHistory("app.name");

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-config/history?key=app.name&limit=50",
      );
      expect(result).toEqual(filteredHistory);
    });

    it("should fetch config history with both key and limit", async () => {
      mockApi.get.mockResolvedValue({ data: mockApiResponse(mockHistory) });

      const result = await systemConfigService.getConfigHistory(
        "app.debug",
        25,
      );

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-config/history?key=app.debug&limit=25",
      );
      expect(result).toEqual(mockHistory);
    });

    it("should handle empty history", async () => {
      mockApi.get.mockResolvedValue({ data: mockApiResponse([]) });

      const result = await systemConfigService.getConfigHistory();

      expect(result).toEqual([]);
    });

    it("should handle API errors", async () => {
      const error = new Error("History not available");
      mockApi.get.mockRejectedValue(error);

      await expect(systemConfigService.getConfigHistory()).rejects.toThrow(
        "History not available",
      );
    });
  });

  describe("getCategories", () => {
    const mockCategories = ["app", "email", "backup", "security", "logging"];

    it("should fetch all categories", async () => {
      mockApi.get.mockResolvedValue({ data: mockApiResponse(mockCategories) });

      const result = await systemConfigService.getCategories();

      expect(mockApi.get).toHaveBeenCalledWith("/system-config/categories");
      expect(result).toEqual(mockCategories);
    });

    it("should handle empty categories", async () => {
      mockApi.get.mockResolvedValue({ data: mockApiResponse([]) });

      const result = await systemConfigService.getCategories();

      expect(result).toEqual([]);
    });

    it("should handle API errors", async () => {
      const error = new Error("Categories not available");
      mockApi.get.mockRejectedValue(error);

      await expect(systemConfigService.getCategories()).rejects.toThrow(
        "Categories not available",
      );
    });
  });

  describe("Service Instance", () => {
    it("should export a singleton instance", () => {
      expect(systemConfigService).toBeDefined();
      expect(typeof systemConfigService).toBe("object");
    });

    it("should have all required methods", () => {
      expect(typeof systemConfigService.getAllConfigs).toBe("function");
      expect(typeof systemConfigService.getPublicConfigs).toBe("function");
      expect(typeof systemConfigService.updateConfig).toBe("function");
    });

    it("should be the default export", () => {
      expect(systemConfigService).toBeDefined();
      expect(systemConfigService.getAllConfigs).toBeDefined();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle malformed API responses", async () => {
      mockApi.get.mockResolvedValue({ data: null });

      await expect(systemConfigService.getAllConfigs()).rejects.toThrow();
    });

    it("should handle network timeouts", async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      mockApi.get.mockRejectedValue(timeoutError);

      await expect(systemConfigService.getAllConfigs()).rejects.toThrow(
        "Request timeout",
      );
    });

    it("should handle very long config keys", async () => {
      const longKey = "a".repeat(1000);
      const configData = { [longKey]: "value" };
      mockApi.get.mockResolvedValue({ data: mockApiResponse(configData) });

      const result = await systemConfigService.getConfigByKey(longKey);
      expect(result).toBe("value");
    });

    it("should handle special characters in config values", async () => {
      const specialValue = "Value with special chars: !@#$%^&*()[]{}|;:,.<>?";
      const successMessage = "Config updated";
      mockApi.put.mockResolvedValue({
        data: { success: true, data: null, message: successMessage },
      });

      const result = await systemConfigService.updateConfig(
        "test.key",
        specialValue,
      );
      expect(result).toBe(successMessage);
    });

    it("should handle unicode characters in config values", async () => {
      const unicodeValue = "Configuração com acentos: ção, ã, é, ü";
      const successMessage = "Config updated";
      mockApi.put.mockResolvedValue({
        data: { success: true, data: null, message: successMessage },
      });

      const result = await systemConfigService.updateConfig(
        "test.unicode",
        unicodeValue,
      );
      expect(result).toBe(successMessage);
    });
  });

  describe("Performance", () => {
    it("should handle large config objects efficiently", async () => {
      const largeConfigs: SystemConfig = {};
      for (let i = 0; i < 1000; i++) {
        largeConfigs[`config.key.${i}`] = `value${i}`;
      }

      mockApi.get.mockResolvedValue({ data: mockApiResponse(largeConfigs) });

      const startTime = performance.now();
      const result = await systemConfigService.getAllConfigs();
      const endTime = performance.now();

      expect(Object.keys(result)).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it("should handle concurrent requests", async () => {
      mockApi.get.mockResolvedValue({ data: mockApiResponse(mockConfigs) });

      const promises = Array.from({ length: 10 }, () =>
        systemConfigService.getAllConfigs(),
      );
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toEqual(mockConfigs);
      });
      expect(mockApi.get).toHaveBeenCalledTimes(10);
    });
  });
});

// Helper function to create mock API response with custom message
function mockApiResponse<T>(
  data: T,
  message: string = "Success",
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}
