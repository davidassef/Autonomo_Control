import systemReportsService, {
  UserStatistics,
  SystemUsageStatistics,
  FinancialOverview,
  SystemHealthMetrics,
  UserEngagementReport,
  AdminDashboardData,
} from "./systemReports";
import api from "./api";

// Mock the API module
jest.mock("./api");

const mockApi = api as jest.Mocked<typeof api>;

describe("SystemReportsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserStatistics: UserStatistics = {
    period_days: 30,
    total_users: 150,
    active_users: 120,
    new_users: 25,
    blocked_users: 5,
    users_by_role: [
      { role: "admin", count: 10 },
      { role: "user", count: 140 },
    ],
    most_active_users: [
      { email: "user1@example.com", name: "User One", entries_count: 45 },
      { email: "user2@example.com", name: "User Two", entries_count: 38 },
    ],
  };

  const mockSystemUsageStatistics: SystemUsageStatistics = {
    period_days: 30,
    total_entries: 1250,
    entries_by_type: [
      { type: "income", count: 600, total_amount: 15000.5 },
      { type: "expense", count: 650, total_amount: 12500.75 },
    ],
    daily_activity: [
      { date: "2024-01-15", entries_count: 42, active_users: 15 },
      { date: "2024-01-14", entries_count: 38, active_users: 12 },
    ],
    audit_logs_count: 2500,
    common_actions: [
      { action: "create_entry", count: 800 },
      { action: "update_entry", count: 300 },
    ],
  };

  const mockFinancialOverview: FinancialOverview = {
    period_days: 30,
    financial_summary: [
      {
        type: "income",
        count: 600,
        total_amount: 15000.5,
        avg_amount: 25.0,
        min_amount: 5.0,
        max_amount: 500.0,
      },
      {
        type: "expense",
        count: 650,
        total_amount: 12500.75,
        avg_amount: 19.23,
        min_amount: 2.5,
        max_amount: 300.0,
      },
    ],
    monthly_evolution: [
      {
        year: 2024,
        month: 1,
        type: "income",
        total_amount: 8000.0,
        count: 320,
      },
      {
        year: 2024,
        month: 1,
        type: "expense",
        total_amount: 6500.0,
        count: 280,
      },
    ],
    top_categories: [
      {
        category_name: "Alimentação",
        type: "expense",
        count: 150,
        total_amount: 3500.0,
      },
      {
        category_name: "Salário",
        type: "income",
        count: 50,
        total_amount: 12000.0,
      },
    ],
  };

  const mockSystemHealthMetrics: SystemHealthMetrics = {
    timestamp: "2024-01-15T10:00:00Z",
    activity_24h: {
      new_entries: 45,
      active_users: 25,
      audit_logs: 120,
    },
    activity_7d: {
      new_entries: 280,
      active_users: 85,
      new_users: 12,
      audit_logs: 650,
    },
    general_stats: {
      total_users: 150,
      total_entries: 5000,
      total_audit_logs: 15000,
      blocked_users: 5,
    },
  };

  const mockUserEngagementReport: UserEngagementReport = {
    period_days: 30,
    engagement_summary: {
      highly_engaged: 25,
      moderately_engaged: 45,
      low_engaged: 50,
      inactive: 30,
    },
    highly_engaged_users: [
      {
        user_id: 1,
        email: "active1@example.com",
        name: "Active User 1",
        entries_count: 50,
        last_entry: "2024-01-15T09:00:00Z",
        first_entry: "2023-12-01T10:00:00Z",
      },
    ],
    inactive_users: [
      {
        user_id: 2,
        email: "inactive1@example.com",
        name: "Inactive User 1",
        entries_count: 0,
        last_entry: null,
        first_entry: null,
      },
    ],
  };

  const mockAdminDashboardData: AdminDashboardData = {
    summary: {
      total_users: 150,
      active_users_30d: 120,
      new_users_30d: 25,
      blocked_users: 5,
      total_entries_30d: 1250,
      audit_logs_30d: 2500,
    },
    activity_24h: {
      new_entries: 45,
      active_users: 25,
      audit_logs: 120,
    },
    activity_7d: {
      new_entries: 280,
      active_users: 85,
      new_users: 12,
      audit_logs: 650,
    },
    users_by_role: [
      { role: "admin", count: 10 },
      { role: "user", count: 140 },
    ],
    entries_by_type: [
      { type: "income", count: 600, total_amount: 15000.5 },
      { type: "expense", count: 650, total_amount: 12500.75 },
    ],
    daily_activity: [
      { date: "2024-01-15", entries_count: 42, active_users: 15 },
      { date: "2024-01-14", entries_count: 38, active_users: 12 },
    ],
    most_active_users: [
      { email: "user1@example.com", name: "User One", entries_count: 45 },
      { email: "user2@example.com", name: "User Two", entries_count: 38 },
    ],
    common_actions: [
      { action: "create_entry", count: 800 },
      { action: "update_entry", count: 300 },
    ],
  };

  describe("getUserStatistics", () => {
    it("should fetch user statistics with default days", async () => {
      mockApi.get.mockResolvedValue({ data: mockUserStatistics });

      const result = await systemReportsService.getUserStatistics();

      expect(mockApi.get).toHaveBeenCalledWith("/system-reports/users?days=30");
      expect(result).toEqual(mockUserStatistics);
    });

    it("should fetch user statistics with custom days", async () => {
      mockApi.get.mockResolvedValue({ data: mockUserStatistics });

      const result = await systemReportsService.getUserStatistics(7);

      expect(mockApi.get).toHaveBeenCalledWith("/system-reports/users?days=7");
      expect(result).toEqual(mockUserStatistics);
    });

    it("should handle zero days parameter", async () => {
      mockApi.get.mockResolvedValue({ data: mockUserStatistics });

      const result = await systemReportsService.getUserStatistics(0);

      expect(mockApi.get).toHaveBeenCalledWith("/system-reports/users?days=0");
      expect(result).toEqual(mockUserStatistics);
    });

    it("should handle large days parameter", async () => {
      mockApi.get.mockResolvedValue({ data: mockUserStatistics });

      const result = await systemReportsService.getUserStatistics(365);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-reports/users?days=365",
      );
      expect(result).toEqual(mockUserStatistics);
    });

    it("should handle empty user statistics", async () => {
      const emptyStats: UserStatistics = {
        period_days: 30,
        total_users: 0,
        active_users: 0,
        new_users: 0,
        blocked_users: 0,
        users_by_role: [],
        most_active_users: [],
      };
      mockApi.get.mockResolvedValue({ data: emptyStats });

      const result = await systemReportsService.getUserStatistics();

      expect(result).toEqual(emptyStats);
    });

    it("should handle API errors", async () => {
      const error = new Error("Failed to fetch user statistics");
      mockApi.get.mockRejectedValue(error);

      await expect(systemReportsService.getUserStatistics()).rejects.toThrow(
        "Failed to fetch user statistics",
      );
    });
  });

  describe("getSystemUsageStatistics", () => {
    it("should fetch system usage statistics with default days", async () => {
      mockApi.get.mockResolvedValue({ data: mockSystemUsageStatistics });

      const result = await systemReportsService.getSystemUsageStatistics();

      expect(mockApi.get).toHaveBeenCalledWith("/system-reports/usage?days=30");
      expect(result).toEqual(mockSystemUsageStatistics);
    });

    it("should fetch system usage statistics with custom days", async () => {
      mockApi.get.mockResolvedValue({ data: mockSystemUsageStatistics });

      const result = await systemReportsService.getSystemUsageStatistics(90);

      expect(mockApi.get).toHaveBeenCalledWith("/system-reports/usage?days=90");
      expect(result).toEqual(mockSystemUsageStatistics);
    });

    it("should handle empty usage statistics", async () => {
      const emptyStats: SystemUsageStatistics = {
        period_days: 30,
        total_entries: 0,
        entries_by_type: [],
        daily_activity: [],
        audit_logs_count: 0,
        common_actions: [],
      };
      mockApi.get.mockResolvedValue({ data: emptyStats });

      const result = await systemReportsService.getSystemUsageStatistics();

      expect(result).toEqual(emptyStats);
    });

    it("should handle API errors", async () => {
      const error = new Error("Usage statistics unavailable");
      mockApi.get.mockRejectedValue(error);

      await expect(
        systemReportsService.getSystemUsageStatistics(),
      ).rejects.toThrow("Usage statistics unavailable");
    });
  });

  describe("getFinancialOverview", () => {
    it("should fetch financial overview with default days", async () => {
      mockApi.get.mockResolvedValue({ data: mockFinancialOverview });

      const result = await systemReportsService.getFinancialOverview();

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-reports/financial?days=30",
      );
      expect(result).toEqual(mockFinancialOverview);
    });

    it("should fetch financial overview with custom days", async () => {
      mockApi.get.mockResolvedValue({ data: mockFinancialOverview });

      const result = await systemReportsService.getFinancialOverview(180);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-reports/financial?days=180",
      );
      expect(result).toEqual(mockFinancialOverview);
    });

    it("should handle empty financial data", async () => {
      const emptyOverview: FinancialOverview = {
        period_days: 30,
        financial_summary: [],
        monthly_evolution: [],
        top_categories: [],
      };
      mockApi.get.mockResolvedValue({ data: emptyOverview });

      const result = await systemReportsService.getFinancialOverview();

      expect(result).toEqual(emptyOverview);
    });

    it("should handle API errors", async () => {
      const error = new Error("Financial data not available");
      mockApi.get.mockRejectedValue(error);

      await expect(systemReportsService.getFinancialOverview()).rejects.toThrow(
        "Financial data not available",
      );
    });
  });

  describe("getSystemHealthMetrics", () => {
    it("should fetch system health metrics", async () => {
      mockApi.get.mockResolvedValue({ data: mockSystemHealthMetrics });

      const result = await systemReportsService.getSystemHealthMetrics();

      expect(mockApi.get).toHaveBeenCalledWith("/system-reports/health");
      expect(result).toEqual(mockSystemHealthMetrics);
    });

    it("should handle empty health metrics", async () => {
      const emptyMetrics: SystemHealthMetrics = {
        timestamp: "2024-01-15T10:00:00Z",
        activity_24h: {
          new_entries: 0,
          active_users: 0,
          audit_logs: 0,
        },
        activity_7d: {
          new_entries: 0,
          active_users: 0,
          new_users: 0,
          audit_logs: 0,
        },
        general_stats: {
          total_users: 0,
          total_entries: 0,
          total_audit_logs: 0,
          blocked_users: 0,
        },
      };
      mockApi.get.mockResolvedValue({ data: emptyMetrics });

      const result = await systemReportsService.getSystemHealthMetrics();

      expect(result).toEqual(emptyMetrics);
    });

    it("should handle unauthorized access (non-MASTER users)", async () => {
      const error = new Error("Unauthorized access");
      error.name = "UnauthorizedError";
      mockApi.get.mockRejectedValue(error);

      await expect(
        systemReportsService.getSystemHealthMetrics(),
      ).rejects.toThrow("Unauthorized access");
    });

    it("should handle API errors", async () => {
      const error = new Error("Health metrics unavailable");
      mockApi.get.mockRejectedValue(error);

      await expect(
        systemReportsService.getSystemHealthMetrics(),
      ).rejects.toThrow("Health metrics unavailable");
    });
  });

  describe("getUserEngagementReport", () => {
    it("should fetch user engagement report with default days", async () => {
      mockApi.get.mockResolvedValue({ data: mockUserEngagementReport });

      const result = await systemReportsService.getUserEngagementReport();

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-reports/engagement?days=30",
      );
      expect(result).toEqual(mockUserEngagementReport);
    });

    it("should fetch user engagement report with custom days", async () => {
      mockApi.get.mockResolvedValue({ data: mockUserEngagementReport });

      const result = await systemReportsService.getUserEngagementReport(60);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-reports/engagement?days=60",
      );
      expect(result).toEqual(mockUserEngagementReport);
    });

    it("should handle empty engagement data", async () => {
      const emptyReport: UserEngagementReport = {
        period_days: 30,
        engagement_summary: {
          highly_engaged: 0,
          moderately_engaged: 0,
          low_engaged: 0,
          inactive: 0,
        },
        highly_engaged_users: [],
        inactive_users: [],
      };
      mockApi.get.mockResolvedValue({ data: emptyReport });

      const result = await systemReportsService.getUserEngagementReport();

      expect(result).toEqual(emptyReport);
    });

    it("should handle API errors", async () => {
      const error = new Error("Engagement report unavailable");
      mockApi.get.mockRejectedValue(error);

      await expect(
        systemReportsService.getUserEngagementReport(),
      ).rejects.toThrow("Engagement report unavailable");
    });
  });

  describe("getAdminDashboardData", () => {
    it("should fetch admin dashboard data", async () => {
      mockApi.get.mockResolvedValue({ data: mockAdminDashboardData });

      const result = await systemReportsService.getAdminDashboardData();

      expect(mockApi.get).toHaveBeenCalledWith("/system-reports/dashboard");
      expect(result).toEqual(mockAdminDashboardData);
    });

    it("should handle empty dashboard data", async () => {
      const emptyDashboard: AdminDashboardData = {
        summary: {
          total_users: 0,
          active_users_30d: 0,
          new_users_30d: 0,
          blocked_users: 0,
          total_entries_30d: 0,
          audit_logs_30d: 0,
        },
        activity_24h: {
          new_entries: 0,
          active_users: 0,
          audit_logs: 0,
        },
        activity_7d: {
          new_entries: 0,
          active_users: 0,
          new_users: 0,
          audit_logs: 0,
        },
        users_by_role: [],
        entries_by_type: [],
        daily_activity: [],
        most_active_users: [],
        common_actions: [],
      };
      mockApi.get.mockResolvedValue({ data: emptyDashboard });

      const result = await systemReportsService.getAdminDashboardData();

      expect(result).toEqual(emptyDashboard);
    });

    it("should handle API errors", async () => {
      const error = new Error("Dashboard data unavailable");
      mockApi.get.mockRejectedValue(error);

      await expect(
        systemReportsService.getAdminDashboardData(),
      ).rejects.toThrow("Dashboard data unavailable");
    });
  });

  describe("Service Instance", () => {
    it("should export a singleton instance", () => {
      expect(systemReportsService).toBeDefined();
      expect(typeof systemReportsService).toBe("object");
    });

    it("should have all required methods", () => {
      expect(typeof systemReportsService.getUserStatistics).toBe("function");
      expect(typeof systemReportsService.getSystemUsageStatistics).toBe(
        "function",
      );
      expect(typeof systemReportsService.getFinancialOverview).toBe("function");
      expect(typeof systemReportsService.getSystemHealthMetrics).toBe(
        "function",
      );
      expect(typeof systemReportsService.getUserEngagementReport).toBe(
        "function",
      );
      expect(typeof systemReportsService.getAdminDashboardData).toBe(
        "function",
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle negative days parameter", async () => {
      mockApi.get.mockResolvedValue({ data: mockUserStatistics });

      const result = await systemReportsService.getUserStatistics(-5);

      expect(mockApi.get).toHaveBeenCalledWith("/system-reports/users?days=-5");
      expect(result).toEqual(mockUserStatistics);
    });

    it("should handle very large days parameter", async () => {
      mockApi.get.mockResolvedValue({ data: mockSystemUsageStatistics });

      const result = await systemReportsService.getSystemUsageStatistics(99999);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/system-reports/usage?days=99999",
      );
      expect(result).toEqual(mockSystemUsageStatistics);
    });

    it("should handle malformed API responses", async () => {
      mockApi.get.mockResolvedValue({ data: null });

      const result = await systemReportsService.getUserStatistics();

      expect(result).toBeNull();
    });

    it("should handle network timeouts", async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      mockApi.get.mockRejectedValue(timeoutError);

      await expect(systemReportsService.getFinancialOverview()).rejects.toThrow(
        "Request timeout",
      );
    });

    it("should handle server errors (500)", async () => {
      const serverError = new Error("Internal server error");
      serverError.name = "ServerError";
      mockApi.get.mockRejectedValue(serverError);

      await expect(
        systemReportsService.getSystemHealthMetrics(),
      ).rejects.toThrow("Internal server error");
    });

    it("should handle not found errors (404)", async () => {
      const notFoundError = new Error("Endpoint not found");
      notFoundError.name = "NotFoundError";
      mockApi.get.mockRejectedValue(notFoundError);

      await expect(
        systemReportsService.getUserEngagementReport(),
      ).rejects.toThrow("Endpoint not found");
    });
  });

  describe("Performance", () => {
    it("should handle large datasets efficiently", async () => {
      const largeUserStats: UserStatistics = {
        ...mockUserStatistics,
        most_active_users: Array.from({ length: 1000 }, (_, i) => ({
          email: `user${i}@example.com`,
          name: `User ${i}`,
          entries_count: Math.floor(Math.random() * 100),
        })),
      };

      mockApi.get.mockResolvedValue({ data: largeUserStats });

      const startTime = performance.now();
      const result = await systemReportsService.getUserStatistics();
      const endTime = performance.now();

      expect(result.most_active_users).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it("should handle concurrent requests", async () => {
      mockApi.get.mockImplementation((url) => {
        if (url.includes("users"))
          return Promise.resolve({ data: mockUserStatistics });
        if (url.includes("usage"))
          return Promise.resolve({ data: mockSystemUsageStatistics });
        if (url.includes("financial"))
          return Promise.resolve({ data: mockFinancialOverview });
        if (url.includes("health"))
          return Promise.resolve({ data: mockSystemHealthMetrics });
        if (url.includes("engagement"))
          return Promise.resolve({ data: mockUserEngagementReport });
        if (url.includes("dashboard"))
          return Promise.resolve({ data: mockAdminDashboardData });
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const promises = [
        systemReportsService.getUserStatistics(),
        systemReportsService.getSystemUsageStatistics(),
        systemReportsService.getFinancialOverview(),
        systemReportsService.getSystemHealthMetrics(),
        systemReportsService.getUserEngagementReport(),
        systemReportsService.getAdminDashboardData(),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(6);
      expect(results[0]).toEqual(mockUserStatistics);
      expect(results[1]).toEqual(mockSystemUsageStatistics);
      expect(results[2]).toEqual(mockFinancialOverview);
      expect(results[3]).toEqual(mockSystemHealthMetrics);
      expect(results[4]).toEqual(mockUserEngagementReport);
      expect(results[5]).toEqual(mockAdminDashboardData);
      expect(mockApi.get).toHaveBeenCalledTimes(6);
    });
  });

  describe("Data Validation", () => {
    it("should handle null values in user statistics", async () => {
      const statsWithNulls: UserStatistics = {
        ...mockUserStatistics,
        most_active_users: [
          { email: "user@example.com", name: "User", entries_count: 0 },
        ],
      };
      mockApi.get.mockResolvedValue({ data: statsWithNulls });

      const result = await systemReportsService.getUserStatistics();

      expect(result.most_active_users[0].entries_count).toBe(0);
    });

    it("should handle null dates in engagement report", async () => {
      const reportWithNulls: UserEngagementReport = {
        ...mockUserEngagementReport,
        inactive_users: [
          {
            user_id: 1,
            email: "inactive@example.com",
            name: "Inactive User",
            entries_count: 0,
            last_entry: null,
            first_entry: null,
          },
        ],
      };
      mockApi.get.mockResolvedValue({ data: reportWithNulls });

      const result = await systemReportsService.getUserEngagementReport();

      expect(result.inactive_users[0].last_entry).toBeNull();
      expect(result.inactive_users[0].first_entry).toBeNull();
    });

    it("should handle zero amounts in financial data", async () => {
      const financialWithZeros: FinancialOverview = {
        ...mockFinancialOverview,
        financial_summary: [
          {
            type: "income",
            count: 0,
            total_amount: 0,
            avg_amount: 0,
            min_amount: 0,
            max_amount: 0,
          },
        ],
      };
      mockApi.get.mockResolvedValue({ data: financialWithZeros });

      const result = await systemReportsService.getFinancialOverview();

      expect(result.financial_summary[0].total_amount).toBe(0);
      expect(result.financial_summary[0].count).toBe(0);
    });
  });
});
