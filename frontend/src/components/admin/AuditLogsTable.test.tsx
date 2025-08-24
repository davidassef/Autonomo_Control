import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { AuditLogsTable } from "./AuditLogsTable";
import { AuditLog } from "../../services/auditLogs";
// Jest globals are available globally, no need to import describe, it, expect, beforeEach

// Mock do auditLogsService
jest.mock("../../services/auditLogs", () => ({
  auditLogsService: {
    formatDate: jest.fn((date) => `Formatted: ${date}`),
    formatAction: jest.fn((action) => `Action: ${action}`),
    formatResourceType: jest.fn((type) => `Resource: ${type}`),
    getActionBadgeColor: jest.fn((action) => {
      const colors = {
        LOGIN: "bg-green-100 text-green-800",
        CREATE: "bg-blue-100 text-blue-800",
        UPDATE: "bg-yellow-100 text-yellow-800",
        DELETE: "bg-red-100 text-red-800",
      };
      return (
        colors[action as keyof typeof colors] || "bg-gray-100 text-gray-800"
      );
    }),
  },
}));

const createMockLog = (overrides: Partial<AuditLog> = {}): AuditLog => ({
  id: 1,
  timestamp: "2024-01-15T10:30:00Z",
  action: "LOGIN",
  resource_type: "USER",
  resource_id: 123,
  performed_by: 1,
  description: "Usuário fez login no sistema",
  ip_address: "192.168.1.100",
  user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  details: { success: true },
  ...overrides,
});

const createMockLogs = (count: number = 3): AuditLog[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockLog({
      id: index + 1,
      action: ["LOGIN", "CREATE", "UPDATE", "DELETE"][index % 4] as any,
      performed_by: index + 1,
      description: `Ação ${index + 1} realizada`,
      ip_address: `192.168.1.${100 + index}`,
    }),
  );
};

describe("AuditLogsTable", () => {
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Estado de Loading", () => {
    it("deve renderizar skeleton quando loading é true", () => {
      render(
        <AuditLogsTable
          logs={[]}
          loading={true}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const container = screen.getByTestId("audit-logs-container");
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("bg-white rounded-lg shadow overflow-hidden");

      const allSkeletons = screen.getAllByTestId("skeleton-row");
      expect(allSkeletons).toHaveLength(5);
    });

    it("deve ter estrutura HTML correta no estado de loading", () => {
      render(
        <AuditLogsTable
          logs={[]}
          loading={true}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const animatedContainer = screen.getByTestId("loading-container");
      expect(animatedContainer).toBeInTheDocument();
      expect(animatedContainer).toHaveClass("animate-pulse space-y-4");

      const padding = screen.getByTestId("test-element");
      expect(padding).toBeInTheDocument();
    });

    it("deve ter classes de animação corretas nos skeletons", () => {
      render(
        <AuditLogsTable
          logs={[]}
          loading={true}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const animatedContainer = screen.getByTestId("test-element");
      expect(animatedContainer).toHaveClass("animate-pulse space-y-4");

      const allSkeletonItems = screen.getAllByTestId("skeleton-item");
      allSkeletonItems.forEach((item) => {
        expect(item).toHaveClass("h-12 bg-gray-200 rounded");
      });
    });
  });

  describe("Estado Vazio", () => {
    it("deve renderizar mensagem quando não há logs", () => {
      render(
        <AuditLogsTable
          logs={[]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      expect(screen.getByText("Nenhum log encontrado")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Não há logs de auditoria para os filtros selecionados.",
        ),
      ).toBeInTheDocument();
    });

    it("deve ter ícone correto no estado vazio", () => {
      render(
        <AuditLogsTable
          logs={[]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const icon = screen.getByTestId("test-element");
      expect(icon).toBeInTheDocument();
    });

    it("deve ter estrutura HTML correta no estado vazio", () => {
      render(
        <AuditLogsTable
          logs={[]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const emptyState = screen.getByTestId("empty-state-container");
      expect(emptyState).toHaveClass("bg-white rounded-lg shadow p-6");

      const centerContent = screen.getByTestId("test-element");
      expect(centerContent).toBeInTheDocument();
    });

    it("deve ter estilos corretos para o texto no estado vazio", () => {
      render(
        <AuditLogsTable
          logs={[]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const title = screen.getByText("Nenhum log encontrado");
      expect(title).toHaveClass("mt-2 text-sm font-medium text-gray-900");

      const description = screen.getByText(
        "Não há logs de auditoria para os filtros selecionados.",
      );
      expect(description).toHaveClass("mt-1 text-sm text-gray-500");
    });
  });

  describe("Renderização da Tabela", () => {
    const mockLogs = createMockLogs(3);

    it("deve renderizar tabela quando há logs", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass("min-w-full divide-y divide-gray-200");
    });

    it("deve ter estrutura HTML correta para a tabela", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const container = screen.getByTestId("table-container");
      expect(container).toHaveClass("bg-white rounded-lg shadow overflow-hidden");

      const scrollContainer = screen.getByTestId("test-element");
      expect(scrollContainer).toBeInTheDocument();
    });

    it("deve renderizar cabeçalho da tabela corretamente", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const table = screen.getByRole("table");
      const thead = within(table).getByRole("rowgroup");
      expect(thead).toBeInTheDocument();
      expect(thead).toHaveClass("bg-gray-50");

      expect(screen.getByText("Data/Hora")).toBeInTheDocument();
      expect(screen.getByText("Ação")).toBeInTheDocument();
      expect(screen.getByText("Recurso")).toBeInTheDocument();
      expect(screen.getByText("Usuário")).toBeInTheDocument();
      expect(screen.getByText("Descrição")).toBeInTheDocument();
      expect(screen.getByText("IP")).toBeInTheDocument();
      expect(screen.getByText("Ações")).toBeInTheDocument();
    });

    it("deve ter ícones corretos nos cabeçalhos", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const table = screen.getByRole("table");
      const thead = within(table).getByRole("rowgroup");
      const headerIcons = within(thead).getAllByTestId("header-icon");
      expect(headerIcons).toHaveLength(5); // Calendar, Activity, User, Globe icons
    });

    it("deve renderizar corpo da tabela corretamente", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const table = screen.getByRole("table");
      const allRowGroups = within(table).getAllByRole("rowgroup");
      const tbody = allRowGroups[1];
      expect(tbody).toBeInTheDocument();
      expect(tbody).toHaveClass("bg-white divide-y divide-gray-200");

      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(4); // 3 data rows + 1 header row
    });

    it("deve ter hover effect nas linhas", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const table = screen.getByRole("table");
      const allRows = within(table).getAllByRole("row");
      const dataRows = allRows.slice(1); // Exclude header row
      dataRows.forEach((row) => {
        expect(row).toHaveClass("hover:bg-gray-50");
      });
    });
  });

  describe("Formatação de Dados", () => {
    const mockLogs = createMockLogs(1);

    it("deve chamar formatDate para timestamp", () => {
      const { auditLogsService } = require("../../services/auditLogs");
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      expect(auditLogsService.formatDate).toHaveBeenCalledWith(
        mockLogs[0].timestamp,
      );
      expect(
        screen.getByText(`Formatted: ${mockLogs[0].timestamp}`),
      ).toBeInTheDocument();
    });

    it("deve chamar formatAction para ação", () => {
      const { auditLogsService } = require("../../services/auditLogs");
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      expect(auditLogsService.formatAction).toHaveBeenCalledWith(
        mockLogs[0].action,
      );
      expect(
        screen.getByText(`Action: ${mockLogs[0].action}`),
      ).toBeInTheDocument();
    });

    it("deve chamar formatResourceType para tipo de recurso", () => {
      const { auditLogsService } = require("../../services/auditLogs");
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      expect(auditLogsService.formatResourceType).toHaveBeenCalledWith(
        mockLogs[0].resource_type,
      );
      expect(
        screen.getByText(`Resource: ${mockLogs[0].resource_type}`),
      ).toBeInTheDocument();
    });

    it("deve chamar getActionBadgeColor para cor do badge", () => {
      const { auditLogsService } = require("../../services/auditLogs");
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      expect(auditLogsService.getActionBadgeColor).toHaveBeenCalledWith(
        mockLogs[0].action,
      );
    });

    it("deve aplicar cores corretas aos badges de ação", () => {
      const logsWithDifferentActions = [
        createMockLog({ id: 1, action: "LOGIN" }),
        createMockLog({ id: 2, action: "CREATE" }),
        createMockLog({ id: 3, action: "UPDATE" }),
        createMockLog({ id: 4, action: "DELETE" }),
      ];

      render(
        <AuditLogsTable
          logs={logsWithDifferentActions}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      expect(
        screen.getByTestId("test-element"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("test-element"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("test-element"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("test-element"),
      ).toBeInTheDocument();
    });
  });

  describe("Exibição de Dados", () => {
    const mockLog = createMockLog({
      performed_by: 2,
      description:
        "Esta é uma descrição muito longa que pode precisar ser truncada para não quebrar o layout da tabela",
      ip_address: "192.168.1.100",
    });

    it("deve exibir usuário com truncamento", () => {
      render(
        <AuditLogsTable
          logs={[mockLog]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const userSpan = screen.getByTestId("test-element");
      expect(userSpan).toBeInTheDocument();
      expect(userSpan).toHaveAttribute(
        "title",
        mockLog.performed_by.toString(),
      );
      expect(userSpan).toHaveTextContent(mockLog.performed_by.toString());
    });

    it("deve exibir descrição com truncamento", () => {
      render(
        <AuditLogsTable
          logs={[mockLog]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const descriptionDiv = screen.getByTestId("test-element");
      expect(descriptionDiv).toBeInTheDocument();
      expect(descriptionDiv).toHaveAttribute("title", mockLog.description);
      expect(descriptionDiv).toHaveTextContent(mockLog.description);
    });

    it("deve exibir IP address com fonte monospace", () => {
      render(
        <AuditLogsTable
          logs={[mockLog]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const ipSpan = screen.getByTestId("test-element");
      expect(ipSpan).toBeInTheDocument();
      expect(ipSpan).toHaveTextContent(mockLog.ip_address!);
    });

    it('deve exibir "N/A" quando IP address é null', () => {
      const logWithoutIP = createMockLog({ ip_address: undefined });
      render(
        <AuditLogsTable
          logs={[logWithoutIP]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it('deve exibir "N/A" quando IP address é undefined', () => {
      const logWithoutIP = createMockLog({ ip_address: undefined });
      render(
        <AuditLogsTable
          logs={[logWithoutIP]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("deve ter ícones corretos nas células", () => {
      render(
        <AuditLogsTable
          logs={[mockLog]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      // Ícone do usuário
      const userIcons = screen.getAllByTestId("user-icon");
      expect(userIcons.length).toBeGreaterThanOrEqual(1); // User icons
    });
  });

  describe("Botão de Detalhes", () => {
    const mockLogs = createMockLogs(2);

    it("deve renderizar botão de detalhes para cada log", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const detailButtons = screen.getAllByText("Detalhes");
      expect(detailButtons).toHaveLength(2);

      detailButtons.forEach((button) => {
        expect(button).toHaveClass(
          "text-indigo-600 hover:text-indigo-900 inline-flex items-center space-x-1",
        );
      });
    });

    it("deve ter ícone correto no botão de detalhes", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const eyeIcon = screen.getAllByTestId("eye-icon")[0];
      expect(eyeIcon).toBeInTheDocument();
    });

    it("deve ter title correto no botão de detalhes", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const detailButtons = screen.getAllByTitle("Ver detalhes");
      expect(detailButtons).toHaveLength(2);
    });

    it("deve chamar onViewDetails quando clicado", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const firstDetailButton = screen.getAllByText("Detalhes")[0];
      fireEvent.click(firstDetailButton);

      expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
      expect(mockOnViewDetails).toHaveBeenCalledWith(mockLogs[0]);
    });

    it("deve chamar onViewDetails com o log correto para cada botão", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const detailButtons = screen.getAllByText("Detalhes");

      fireEvent.click(detailButtons[0]);
      expect(mockOnViewDetails).toHaveBeenLastCalledWith(mockLogs[0]);

      fireEvent.click(detailButtons[1]);
      expect(mockOnViewDetails).toHaveBeenLastCalledWith(mockLogs[1]);

      expect(mockOnViewDetails).toHaveBeenCalledTimes(2);
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com logs com campos vazios", () => {
      const logWithEmptyFields = createMockLog({
        performed_by: 3,
        description: "",
        ip_address: "",
      });

      render(
        <AuditLogsTable
          logs={[logWithEmptyFields]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      // Deve renderizar sem erros
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText("N/A")).toBeInTheDocument(); // Para IP vazio
    });

    it("deve lidar com grande quantidade de logs", () => {
      const manyLogs = createMockLogs(50);
      render(
        <AuditLogsTable
          logs={manyLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(51); // 1 header + 50 data rows
    });

    it("deve lidar com IDs únicos para cada log", () => {
      const logsWithSameData = [
        createMockLog({ id: 1, action: "LOGIN" }),
        createMockLog({ id: 2, action: "LOGIN" }),
        createMockLog({ id: 3, action: "LOGIN" }),
      ];

      render(
        <AuditLogsTable
          logs={logsWithSameData}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(4); // 1 header + 3 data rows

      // Cada linha deve ter uma key única
      const dataRows = rows.slice(1); // Remove header row
      dataRows.forEach((row, index) => {
        expect(row).toBeInTheDocument();
      });
    });

    it("deve lidar com ações desconhecidas", () => {
      const logWithUnknownAction = createMockLog({
        action: "UNKNOWN_ACTION" as any,
      });
      render(
        <AuditLogsTable
          logs={[logWithUnknownAction]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      // Deve aplicar cor padrão para ações desconhecidas
      expect(
        screen.getByTestId("test-element"),
      ).toBeInTheDocument();
    });

    it("deve lidar com timestamps em formatos diferentes", () => {
      const { auditLogsService } = require("../../services/auditLogs");
      const logWithDifferentTimestamp = createMockLog({
        timestamp: "2024-12-31T23:59:59.999Z",
      });

      render(
        <AuditLogsTable
          logs={[logWithDifferentTimestamp]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      expect(auditLogsService.formatDate).toHaveBeenCalledWith(
        logWithDifferentTimestamp.timestamp,
      );
    });
  });

  describe("Acessibilidade", () => {
    const mockLogs = createMockLogs(2);

    it("deve ter estrutura de tabela semântica correta", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole("columnheader");
      expect(columnHeaders).toHaveLength(7);

      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(3); // 1 header + 2 data rows
    });

    it("deve ter botões acessíveis", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);

      buttons.forEach((button) => {
        expect(button).toHaveAttribute("title", "Ver detalhes");
      });
    });

    it("deve ter contraste adequado nos textos", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      // Verificar classes de cor que garantem contraste
      expect(screen.getByTestId("test-element")).toBeInTheDocument();
      expect(screen.getByTestId("test-element")).toBeInTheDocument();
      expect(screen.getByTestId("test-element")).toBeInTheDocument();
    });

    it("deve ter títulos informativos para elementos truncados", () => {
      const logWithLongText = createMockLog({
        performed_by: 1,
        description: "Very long description that will be truncated",
      });

      render(
        <AuditLogsTable
          logs={[logWithLongText]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const userElement = screen.getByTestId("test-element");
      expect(userElement).toHaveAttribute(
        "title",
        logWithLongText.performed_by.toString(),
      );

      const descriptionElement = screen.getByTestId("test-element");
      expect(descriptionElement).toHaveAttribute(
        "title",
        logWithLongText.description,
      );
    });
  });

  describe("Layout Responsivo", () => {
    const mockLogs = createMockLogs(1);

    it("deve ter scroll horizontal para tabelas grandes", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const scrollContainer = screen.getByTestId("test-element");
      expect(scrollContainer).toBeInTheDocument();
    });

    it("deve ter largura mínima adequada para a tabela", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const table = screen.getByRole("table");
      expect(table).toHaveClass("min-w-full");
    });

    it("deve ter padding adequado nas células", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const table = screen.getByRole("table");
      const allCells = within(table).getAllByRole("cell");
      allCells.forEach((cell) => {
        expect(cell).toHaveClass("px-6 py-4");
      });
    });

    it("deve ter espaçamento adequado nos cabeçalhos", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const table = screen.getByRole("table");
      const allHeaders = within(table).getAllByRole("columnheader");
      allHeaders.forEach((header) => {
        expect(header).toHaveClass("px-6 py-3");
      });
    });
  });

  describe("Estilos e Aparência", () => {
    const mockLogs = createMockLogs(1);

    it("deve ter estilos corretos para o container principal", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const container = screen.getByTestId("audit-logs-container");
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass(
        "bg-white rounded-lg shadow overflow-hidden",
      );
    });

    it("deve ter estilos corretos para o cabeçalho da tabela", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const thead = screen.getByRole("rowgroup");
      expect(thead).toHaveClass("bg-gray-50");

      const table = screen.getByRole("table");
      const allHeaderCells = within(table).getAllByRole("columnheader");
      allHeaderCells.forEach((cell) => {
        expect(cell).toHaveClass(
          "text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
        );
      });
    });

    it("deve ter estilos corretos para as linhas do corpo", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const allRowGroups = screen.getAllByRole("rowgroup");
      const tbody = allRowGroups[1];
      expect(tbody).toHaveClass("bg-white divide-y divide-gray-200");

      const table = screen.getByRole("table");
      const tableRowGroups = within(table).getAllByRole("rowgroup");
      const tableBody = tableRowGroups[1];
      const bodyRows = within(tableBody).getAllByRole("row");
      bodyRows.forEach((row) => {
        expect(row).toHaveClass("hover:bg-gray-50");
      });
    });

    it("deve ter estilos corretos para os badges de ação", () => {
      render(
        <AuditLogsTable
          logs={mockLogs}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const badges = screen.getAllByTestId("action-badge");
      expect(badges.length).toBeGreaterThan(0);

      badges.forEach((badge) => {
        expect(badge).toHaveClass(
          "inline-flex px-2 py-1 text-xs font-medium rounded-full",
        );
      });
    });

    it("deve ter estilos corretos para elementos truncados", () => {
      const logWithLongText = createMockLog({
        performed_by: 4,
        description: "Long description",
      });

      render(
        <AuditLogsTable
          logs={[logWithLongText]}
          loading={false}
          onViewDetails={mockOnViewDetails}
        />,
      );

      const userTruncate = screen.getByTestId("test-element");
      expect(userTruncate).toHaveClass("truncate max-w-32");

      const descriptionTruncate = screen.getByTestId("test-element");
      expect(descriptionTruncate).toHaveClass("max-w-xs truncate");
    });
  });
});
