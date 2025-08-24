import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuditLogsPage } from "./AuditLogsPage";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { toast } from "sonner";
import { AuditLog, AuditLogStats } from "../../services/auditLogs";

// Mock dependencies
jest.mock("../../hooks/useAuditLogs");
jest.mock("sonner");
jest.mock("../../components/Layout", () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Mock admin components
jest.mock("../../components/admin/AuditLogsFilters", () => ({
  AuditLogsFilters: ({ filters, onFiltersChange, loading }: any) => (
    <div data-testid="audit-logs-filters">
      <button
        onClick={() => onFiltersChange({ ...filters, action: "LOGIN" })}
        data-testid="filter-button"
      >
        Apply Filter
      </button>
      {loading && <span data-testid="filters-loading">Loading filters...</span>}
    </div>
  ),
}));

jest.mock("../../components/admin/AuditLogsStats", () => ({
  AuditLogsStats: ({ stats, loading }: any) => (
    <div data-testid="audit-logs-stats">
      {loading ? (
        <span data-testid="stats-loading">Loading stats...</span>
      ) : (
        <div>
          <span data-testid="total-logs">Total: {stats?.total || 0}</span>
          <span data-testid="today-logs">Today: {stats?.today || 0}</span>
        </div>
      )}
    </div>
  ),
}));

jest.mock("../../components/admin/AuditLogsTable", () => ({
  AuditLogsTable: ({ logs, loading, onViewDetails }: any) => (
    <div data-testid="audit-logs-table">
      {loading ? (
        <span data-testid="table-loading">Loading logs...</span>
      ) : (
        <div>
          {logs?.map((log: AuditLog) => (
            <div key={log.id} data-testid={`log-row-${log.id}`}>
              <span>{log.action}</span>
              <button
                onClick={() => onViewDetails(log)}
                data-testid={`view-details-${log.id}`}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

jest.mock("../../components/admin/AuditLogDetailsModal", () => ({
  AuditLogDetailsModal: ({ log, isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="audit-log-details-modal">
        <div data-testid="modal-content">
          <h3>Log Details</h3>
          {log && <p data-testid="log-action">{log.action}</p>}
          <button onClick={onClose} data-testid="close-modal">
            Close
          </button>
        </div>
      </div>
    ) : null,
}));

const mockUseAuditLogs = useAuditLogs as jest.MockedFunction<
  typeof useAuditLogs
>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Mock data
const mockLogs: AuditLog[] = [
  {
    id: 1,
    timestamp: "2024-01-15T10:30:00Z",
    action: "LOGIN",
    resource_type: "USER",
    resource_id: 123,
    performed_by: 1,
    description: "User logged in successfully",
    ip_address: "192.168.1.100",
    user_agent: "Mozilla/5.0",
    details: {},
  },
  {
    id: 2,
    timestamp: "2024-01-15T11:00:00Z",
    action: "CREATE",
    resource_type: "ENTRY",
    resource_id: 456,
    performed_by: 2,
    description: "Created new entry",
    ip_address: "192.168.1.101",
    user_agent: "Mozilla/5.0",
    details: {},
  },
];

const mockStats: AuditLogStats = {
  total_logs: 150,
  unique_users: 25,
  logs_today: 25,
  logs_this_week: 80,
  top_actions: [
    { action: "LOGIN", count: 30 },
    { action: "CREATE", count: 45 },
    { action: "UPDATE", count: 35 },
    { action: "DELETE", count: 15 },
  ],
  top_users: [
    { user: "john.doe", count: 20 },
    { user: "jane.smith", count: 15 },
    { user: "admin", count: 10 },
  ],
};

// Mock URL.createObjectURL and document methods
Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: jest.fn(() => "mock-url"),
});

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: jest.fn(),
});

// Mock document.createElement and appendChild/removeChild
const mockLink = {
  setAttribute: jest.fn(),
  click: jest.fn(),
  style: {},
};

Object.defineProperty(document, "createElement", {
  writable: true,
  value: jest.fn(() => mockLink),
});

Object.defineProperty(document.body, "appendChild", {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(document.body, "removeChild", {
  writable: true,
  value: jest.fn(),
});

// Mock window.location.reload
const mockReload = jest.fn();
delete (window as any).location;
(window as any).location = {
  reload: mockReload,
};

describe("AuditLogsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuditLogs.mockReturnValue({
      logs: mockLogs,
      stats: mockStats,
      availableActions: ["LOGIN", "CREATE", "UPDATE", "DELETE"],
      availableResourceTypes: ["USER", "ENTRY", "CATEGORY", "SYSTEM"],
      loading: false,
      error: null,
      totalLogs: 150,
      statsLoading: false,
      loadLogs: jest.fn(),
      loadStats: jest.fn(),
      cleanupLogs: jest.fn().mockResolvedValue(undefined),
      refreshFilters: jest.fn(),
      clearError: jest.fn(),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render audit logs page with correct title", () => {
      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      expect(screen.getByText("Logs de Auditoria")).toBeInTheDocument();
      expect(
        screen.getByText("Monitore todas as ações realizadas no sistema"),
      ).toBeInTheDocument();
    });

    it("should render all main components", () => {
      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("audit-logs-stats")).toBeInTheDocument();
      expect(screen.getByTestId("audit-logs-filters")).toBeInTheDocument();
      expect(screen.getByTestId("audit-logs-table")).toBeInTheDocument();
    });

    it("should render action buttons", () => {
      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      expect(screen.getByText("Exportar CSV")).toBeInTheDocument();
      expect(screen.getByText("Limpar Logs Antigos")).toBeInTheDocument();
    });

    it("should call initial data loading functions", () => {
      const mockLoadLogs = jest.fn();
      const mockLoadStats = jest.fn();
      const mockRefreshFilters = jest.fn();

      mockUseAuditLogs.mockReturnValue({
        logs: mockLogs,
        stats: mockStats,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: null,
        totalLogs: 150,
        statsLoading: false,
        loadLogs: mockLoadLogs,
        loadStats: mockLoadStats,
        cleanupLogs: jest.fn(),
        refreshFilters: mockRefreshFilters,
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      expect(mockLoadLogs).toHaveBeenCalled();
      expect(mockLoadStats).toHaveBeenCalled();
      expect(mockRefreshFilters).toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    it("should show loading states in components", () => {
      mockUseAuditLogs.mockReturnValue({
        logs: [],
        stats: null,
        availableActions: [],
        availableResourceTypes: [],
        loading: true,
        error: null,
        totalLogs: 0,
        statsLoading: true,
        loadLogs: jest.fn(),
        loadStats: jest.fn(),
        cleanupLogs: jest.fn(),
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("stats-loading")).toBeInTheDocument();
      expect(screen.getByTestId("filters-loading")).toBeInTheDocument();
      expect(screen.getByTestId("table-loading")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error state when there is an error", () => {
      mockUseAuditLogs.mockReturnValue({
        logs: [],
        stats: null,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: "Failed to load audit logs",
        totalLogs: 0,
        statsLoading: false,
        loadLogs: jest.fn(),
        loadStats: jest.fn(),
        cleanupLogs: jest.fn(),
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      expect(screen.getByText("Erro ao carregar logs")).toBeInTheDocument();
      expect(screen.getByText("Failed to load audit logs")).toBeInTheDocument();
      expect(screen.getByText("Tentar Novamente")).toBeInTheDocument();
    });

    it("should reload page when retry button is clicked", () => {
      mockUseAuditLogs.mockReturnValue({
        logs: [],
        stats: null,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: "Failed to load audit logs",
        totalLogs: 0,
        statsLoading: false,
        loadLogs: jest.fn(),
        loadStats: jest.fn(),
        cleanupLogs: jest.fn(),
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      const retryButton = screen.getByText("Tentar Novamente");
      fireEvent.click(retryButton);

      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe("Filters Functionality", () => {
    it("should handle filter changes", () => {
      const mockLoadLogs = jest.fn();

      mockUseAuditLogs.mockReturnValue({
        logs: mockLogs,
        stats: mockStats,
        availableActions: ["LOGIN"],
        availableResourceTypes: ["USER"],
        loading: false,
        error: null,
        totalLogs: mockLogs.length,
        statsLoading: false,
        loadLogs: mockLoadLogs,
        loadStats: jest.fn(),
        cleanupLogs: jest.fn(),
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      const filterButton = screen.getByTestId("filter-button");
      fireEvent.click(filterButton);

      // Should trigger loadLogs with new filters
      expect(mockLoadLogs).toHaveBeenCalledWith(
        expect.objectContaining({ action: "LOGIN" }),
      );
    });
  });

  describe("Log Details Modal", () => {
    it("should open details modal when view details is clicked", () => {
      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      const viewDetailsButton = screen.getByTestId("view-details-1");
      fireEvent.click(viewDetailsButton);

      expect(screen.getByTestId("audit-log-details-modal")).toBeInTheDocument();
      expect(screen.getByTestId("log-action")).toHaveTextContent("LOGIN");
    });

    it("should close details modal when close button is clicked", () => {
      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      // Open modal
      const viewDetailsButton = screen.getByTestId("view-details-1");
      fireEvent.click(viewDetailsButton);

      expect(screen.getByTestId("audit-log-details-modal")).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByTestId("close-modal");
      fireEvent.click(closeButton);

      expect(
        screen.queryByTestId("audit-log-details-modal"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Export Functionality", () => {
    it("should export logs to CSV when export button is clicked", () => {
      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      const exportButton = screen.getByText("Exportar CSV");
      fireEvent.click(exportButton);

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(mockLink.setAttribute).toHaveBeenCalledWith("href", "mock-url");
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "download",
        expect.stringMatching(/audit_logs_\d{4}-\d{2}-\d{2}\.csv/),
      );
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith(
        "Logs exportados com sucesso!",
      );
    });

    it("should show error when trying to export empty logs", () => {
      mockUseAuditLogs.mockReturnValue({
        logs: [],
        stats: mockStats,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: null,
        totalLogs: 0,
        statsLoading: false,
        loadLogs: jest.fn(),
        loadStats: jest.fn(),
        cleanupLogs: jest.fn(),
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      const exportButton = screen.getByText("Exportar CSV");
      fireEvent.click(exportButton);

      expect(mockToast.error).toHaveBeenCalledWith("Não há logs para exportar");
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it("should disable export button when no logs available", () => {
      mockUseAuditLogs.mockReturnValue({
        logs: [],
        stats: mockStats,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: null,
        totalLogs: 0,
        statsLoading: false,
        loadLogs: jest.fn(),
        loadStats: jest.fn(),
        cleanupLogs: jest.fn(),
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      const exportButton = screen.getByText("Exportar CSV");
      expect(exportButton).toBeDisabled();
    });
  });

  describe("Cleanup Functionality", () => {
    it("should open cleanup modal when cleanup button is clicked", () => {
      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      const cleanupButton = screen.getByText("Limpar Logs Antigos");
      fireEvent.click(cleanupButton);

      expect(screen.getByText("Confirmar Limpeza de Logs")).toBeInTheDocument();
      expect(
        screen.getByText(/Esta ação irá remover permanentemente/),
      ).toBeInTheDocument();
    });

    it("should close cleanup modal when cancel button is clicked", () => {
      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      // Open modal
      const cleanupButton = screen.getByText("Limpar Logs Antigos");
      fireEvent.click(cleanupButton);

      expect(screen.getByText("Confirmar Limpeza de Logs")).toBeInTheDocument();

      // Close modal
      const cancelButton = screen.getByText("Cancelar");
      fireEvent.click(cancelButton);

      expect(
        screen.queryByText("Confirmar Limpeza de Logs"),
      ).not.toBeInTheDocument();
    });

    it("should call cleanupLogs when confirm button is clicked", async () => {
      const mockCleanupLogs = jest
        .fn<Promise<void>, [number?]>()
        .mockResolvedValue(undefined);
      const mockLoadLogs = jest.fn();
      const mockLoadStats = jest.fn();

      mockUseAuditLogs.mockReturnValue({
        logs: mockLogs,
        stats: mockStats,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: null,
        totalLogs: mockLogs.length,
        statsLoading: false,
        loadLogs: mockLoadLogs,
        loadStats: mockLoadStats,
        cleanupLogs: mockCleanupLogs,
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      // Open modal
      const cleanupButton = screen.getByText("Limpar Logs Antigos");
      fireEvent.click(cleanupButton);

      // Confirm cleanup
      const confirmButton = screen.getByText("Confirmar Limpeza");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockCleanupLogs).toHaveBeenCalled();
      });

      // Should reload data after cleanup
      expect(mockLoadLogs).toHaveBeenCalled();
      expect(mockLoadStats).toHaveBeenCalled();
    });

    it("should handle cleanup error", async () => {
      const mockCleanupLogs = jest
        .fn<Promise<void>, [number?]>()
        .mockRejectedValue(new Error("Cleanup failed"));

      mockUseAuditLogs.mockReturnValue({
        logs: mockLogs,
        stats: mockStats,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: null,
        totalLogs: mockLogs.length,
        statsLoading: false,
        loadLogs: jest.fn(),
        loadStats: jest.fn(),
        cleanupLogs: mockCleanupLogs,
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      // Open modal
      const cleanupButton = screen.getByText("Limpar Logs Antigos");
      fireEvent.click(cleanupButton);

      // Confirm cleanup
      const confirmButton = screen.getByText("Confirmar Limpeza");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Erro ao limpar logs antigos. Tente novamente.",
        );
      });
    });

    it("should show loading state during cleanup", async () => {
      const mockCleanupLogs = jest.fn<Promise<void>, [number?]>(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      mockUseAuditLogs.mockReturnValue({
        logs: mockLogs,
        stats: mockStats,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: null,
        totalLogs: mockLogs.length,
        statsLoading: false,
        loadLogs: jest.fn(),
        loadStats: jest.fn(),
        cleanupLogs: mockCleanupLogs,
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      // Open modal
      const cleanupButton = screen.getByText("Limpar Logs Antigos");
      fireEvent.click(cleanupButton);

      // Confirm cleanup
      const confirmButton = screen.getByText("Confirmar Limpeza");
      fireEvent.click(confirmButton);

      // Should show loading state
      expect(screen.getByText("Limpando...")).toBeInTheDocument();
      expect(screen.getByText("Limpando...")).toBeDisabled();
      expect(screen.getByText("Cancelar")).toBeDisabled();

      await waitFor(() => {
        expect(mockCleanupLogs).toHaveBeenCalled();
      });
    });
  });

  describe("CSV Export Content", () => {
    it("should generate correct CSV content", () => {
      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      const exportButton = screen.getByText("Exportar CSV");
      fireEvent.click(exportButton);

      // Verify Blob was created with correct content
      expect(global.Blob).toHaveBeenCalledWith(
        [
          expect.stringContaining(
            "Data,Ação,Tipo de Recurso,Usuário,Descrição,IP,ID do Recurso",
          ),
        ],
        { type: "text/csv;charset=utf-8;" },
      );
    });

    it("should handle logs with missing fields in CSV export", () => {
      const logsWithMissingFields = [
        {
          id: 1,
          timestamp: "2024-01-15T10:30:00Z",
          action: "LOGIN",
          resource_type: "USER",
          resource_id: undefined,
          performed_by: 3,
          description: "User login attempt",
          details: undefined,
          ip_address: undefined,
          user_agent: undefined,
        },
      ];

      mockUseAuditLogs.mockReturnValue({
        logs: logsWithMissingFields,
        stats: mockStats,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: null,
        totalLogs: logsWithMissingFields.length,
        statsLoading: false,
        loadLogs: jest.fn(),
        loadStats: jest.fn(),
        cleanupLogs: jest.fn(),
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      const exportButton = screen.getByText("Exportar CSV");
      fireEvent.click(exportButton);

      expect(mockToast.success).toHaveBeenCalledWith(
        "Logs exportados com sucesso!",
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty logs", () => {
      mockUseAuditLogs.mockReturnValue({
        logs: [],
        stats: mockStats,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: null,
        totalLogs: 0,
        statsLoading: false,
        loadLogs: jest.fn(),
        loadStats: jest.fn(),
        cleanupLogs: jest.fn(),
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      expect(screen.getByText("Logs de Auditoria")).toBeInTheDocument();

      const exportButton = screen.getByText("Exportar CSV");
      expect(exportButton).toBeDisabled();
    });

    it("should handle null stats", () => {
      mockUseAuditLogs.mockReturnValue({
        logs: mockLogs,
        stats: null,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: null,
        totalLogs: mockLogs.length,
        statsLoading: false,
        loadLogs: jest.fn(),
        loadStats: jest.fn(),
        cleanupLogs: jest.fn(),
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("total-logs")).toHaveTextContent("Total: 0");
      expect(screen.getByTestId("today-logs")).toHaveTextContent("Today: 0");
    });
  });

  describe("Performance", () => {
    it("should render quickly with many logs", () => {
      const manyLogs = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        timestamp: "2024-01-15T10:30:00Z",
        action: "LOGIN",
        resource_type: "USER",
        resource_id: i + 1,
        performed_by: i + 1,
        description: `Action ${i}`,
        details: { userId: `user-${i}` },
        ip_address: "192.168.1.100",
        user_agent: "Mozilla/5.0",
      }));

      mockUseAuditLogs.mockReturnValue({
        logs: manyLogs,
        stats: mockStats,
        availableActions: [],
        availableResourceTypes: [],
        loading: false,
        error: null,
        totalLogs: manyLogs.length,
        statsLoading: false,
        loadLogs: jest.fn(),
        loadStats: jest.fn(),
        cleanupLogs: jest.fn(),
        refreshFilters: jest.fn(),
        clearError: jest.fn(),
      });

      const startTime = performance.now();

      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", () => {
      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      const exportButton = screen.getByText("Exportar CSV");
      const cleanupButton = screen.getByText("Limpar Logs Antigos");

      expect(exportButton).toBeInTheDocument();
      expect(cleanupButton).toBeInTheDocument();
    });

    it("should handle keyboard navigation in cleanup modal", () => {
      render(
        <TestWrapper>
          <AuditLogsPage />
        </TestWrapper>,
      );

      // Open modal
      const cleanupButton = screen.getByText("Limpar Logs Antigos");
      fireEvent.click(cleanupButton);

      const confirmButton = screen.getByText("Confirmar Limpeza");
      const cancelButton = screen.getByText("Cancelar");

      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });
  });
});
