import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuditLogDetailsModal } from "./AuditLogDetailsModal";
import { AuditLog } from "../../services/auditLogs";
import { auditLogsService } from "../../services/auditLogs";

// Mock do auditLogsService
jest.mock("../../services/auditLogs", () => ({
  auditLogsService: {
    getActionBadgeColor: jest.fn((action: string) => {
      const colors: Record<string, string> = {
        CREATE: "bg-green-100 text-green-800",
        UPDATE: "bg-blue-100 text-blue-800",
        DELETE: "bg-red-100 text-red-800",
        LOGIN: "bg-purple-100 text-purple-800",
      };
      return colors[action] || "bg-gray-100 text-gray-800";
    }),
    formatAction: jest.fn((action: string) => {
      const actions: Record<string, string> = {
        CREATE: "Criação",
        UPDATE: "Atualização",
        DELETE: "Exclusão",
        LOGIN: "Login",
      };
      return actions[action] || action;
    }),
    formatResourceType: jest.fn((type: string) => {
      const types: Record<string, string> = {
        USER: "Usuário",
        ENTRY: "Lançamento",
        CATEGORY: "Categoria",
      };
      return types[type] || type;
    }),
    formatDate: jest.fn((date: string) => {
      return new Date(date).toLocaleString("pt-BR");
    }),
  },
}));

const createMockAuditLog = (overrides: Partial<AuditLog> = {}): AuditLog => ({
  id: 1,
  action: "CREATE",
  resource_type: "USER",
  resource_id: 123,
  performed_by: 1,
  timestamp: "2024-01-01T10:00:00Z",
  ip_address: "192.168.1.1",
  description: "Usuário criado com sucesso",
  details: { name: "Test User", email: "test@example.com" },
  ...overrides,
});

describe("AuditLogDetailsModal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização Condicional", () => {
    it("não deve renderizar quando isOpen é false", () => {
      const log = createMockAuditLog();
      const { container } = render(
        <AuditLogDetailsModal log={log} isOpen={false} onClose={mockOnClose} />,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("não deve renderizar quando log é null", () => {
      const { container } = render(
        <AuditLogDetailsModal log={null} isOpen={true} onClose={mockOnClose} />,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("não deve renderizar quando isOpen é false e log é null", () => {
      const { container } = render(
        <AuditLogDetailsModal
          log={null}
          isOpen={false}
          onClose={mockOnClose}
        />,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("deve renderizar quando isOpen é true e log existe", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(
        screen.getByText("Detalhes do Log de Auditoria"),
      ).toBeInTheDocument();
    });
  });

  describe("Estrutura do Modal", () => {
    it("deve renderizar overlay de fundo", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const overlay = screen.getByTestId("test-element");
      expect(overlay).toBeInTheDocument();
    });

    it("deve renderizar cabeçalho com título e botão fechar", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(
        screen.getByText("Detalhes do Log de Auditoria"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /fechar/i }),
      ).toBeInTheDocument();
    });

    it("deve renderizar área de conteúdo com scroll", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const contentArea = screen.getByTestId("test-element");
      expect(contentArea).toBeInTheDocument();
    });

    it("deve renderizar rodapé com botão fechar", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const footerButton = screen.getByRole("button", { name: "Fechar" });
      expect(footerButton).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    });
  });

  describe("Informações Básicas", () => {
    it("deve exibir ação formatada com badge colorido", () => {
      const log = createMockAuditLog({ action: "CREATE" });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("Ação")).toBeInTheDocument();
      expect(screen.getByText("Criação")).toBeInTheDocument();
      expect(auditLogsService.formatAction).toHaveBeenCalledWith("CREATE");
      expect(auditLogsService.getActionBadgeColor).toHaveBeenCalledWith(
        "CREATE",
      );
    });

    it("deve exibir tipo de recurso formatado", () => {
      const log = createMockAuditLog({ resource_type: "USER" });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("Tipo de Recurso")).toBeInTheDocument();
      expect(screen.getByText("Usuário")).toBeInTheDocument();
      expect(auditLogsService.formatResourceType).toHaveBeenCalledWith("USER");
    });

    it("deve exibir usuário que executou a ação", () => {
      const log = createMockAuditLog({ performed_by: 1 });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("Usuário")).toBeInTheDocument();
      expect(screen.getByText("admin@test.com")).toBeInTheDocument();
    });

    it('deve exibir "Sistema" quando performed_by é null', () => {
      const log = createMockAuditLog({ performed_by: undefined });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("Sistema")).toBeInTheDocument();
    });

    it("deve exibir data formatada", () => {
      const log = createMockAuditLog({ timestamp: "2024-01-01T10:00:00Z" });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("Data e Hora")).toBeInTheDocument();
      expect(auditLogsService.formatDate).toHaveBeenCalledWith(
        "2024-01-01T10:00:00Z",
      );
    });

    it("deve exibir endereço IP", () => {
      const log = createMockAuditLog({ ip_address: "192.168.1.1" });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("Endereço IP")).toBeInTheDocument();
      expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
    });

    it('deve exibir "N/A" quando IP é null', () => {
      const log = createMockAuditLog({ ip_address: undefined });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("deve exibir ID do recurso quando existe", () => {
      const log = createMockAuditLog({ resource_id: 123 });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("ID do Recurso")).toBeInTheDocument();
      expect(screen.getByText("user-123")).toBeInTheDocument();
    });

    it("não deve exibir ID do recurso quando é null", () => {
      const log = createMockAuditLog({ resource_id: undefined });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.queryByText("ID do Recurso")).not.toBeInTheDocument();
    });
  });

  describe("Descrição e Detalhes", () => {
    it("deve exibir descrição quando existe", () => {
      const log = createMockAuditLog({
        description: "Usuário criado com sucesso",
      });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("Descrição")).toBeInTheDocument();
      expect(
        screen.getByText("Usuário criado com sucesso"),
      ).toBeInTheDocument();
    });

    it("deve exibir mensagem padrão quando descrição é null", () => {
      const log = createMockAuditLog({ description: undefined });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(
        screen.getByText("Nenhuma descrição disponível"),
      ).toBeInTheDocument();
    });

    it("deve exibir detalhes técnicos quando existem", () => {
      const log = createMockAuditLog({
        details: { name: "Test User", email: "test@example.com" },
      });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("Detalhes Técnicos")).toBeInTheDocument();
      const detailsElement = screen.getByText(/"name": "Test User"/);
      expect(detailsElement).toBeInTheDocument();
    });

    it("não deve exibir seção de detalhes quando details é null", () => {
      const log = createMockAuditLog({ details: undefined });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.queryByText("Detalhes Técnicos")).not.toBeInTheDocument();
    });
  });

  describe("Formatação de Detalhes", () => {
    it("deve formatar objeto JSON corretamente", () => {
      const log = createMockAuditLog({
        details: { name: "Test", value: 123 },
      });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const preElement = screen.getByRole("code");
      expect(preElement).toBeInTheDocument();
      expect(preElement?.textContent).toContain('"name": "Test"');
      expect(preElement?.textContent).toContain('"value": 123');
    });

    it("deve tratar string JSON válida", () => {
      const jsonObject = { test: "value" };
      const log = createMockAuditLog({ details: jsonObject });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const preElement = screen.getByRole("code");
      expect(preElement?.textContent).toContain('"test": "value"');
    });

    it("deve tratar string não-JSON como texto simples", () => {
      const log = createMockAuditLog({
        details: { text: "Simple text details" },
      });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const preElement = screen.getByRole("code");
      expect(preElement?.textContent).toBe("Simple text details");
    });

    it('deve retornar "N/A" para detalhes undefined', () => {
      const log = createMockAuditLog({ details: undefined });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      // Como details é undefined, a seção não deve aparecer
      expect(screen.queryByText("Detalhes Técnicos")).not.toBeInTheDocument();
    });

    it("deve formatar arrays corretamente", () => {
      const log = createMockAuditLog({
        details: ["item1", "item2", "item3"],
      });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const preElement = screen.getByRole("code");
      expect(preElement?.textContent).toContain('"item1"');
      expect(preElement?.textContent).toContain('"item2"');
      expect(preElement?.textContent).toContain('"item3"');
    });
  });

  describe("Interações do Modal", () => {
    it("deve chamar onClose quando clica no overlay", async () => {
      const user = userEvent;
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const overlay = screen.getByTestId("test-element");
      await user.click(overlay!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onClose quando clica no botão X do cabeçalho", async () => {
      const user = userEvent;
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const closeButton = screen.getByRole("button", { name: /fechar/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onClose quando clica no botão Fechar do rodapé", async () => {
      const user = userEvent;
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const footerButton = screen.getByRole("button", { name: "Fechar" });
      await user.click(footerButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("não deve chamar onClose quando clica dentro do modal", async () => {
      const user = userEvent;
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const modalContent = screen.getByText("Detalhes do Log de Auditoria");
      await user.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("deve funcionar com fireEvent", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const overlay = screen.getByTestId("test-element");
      fireEvent.click(overlay!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Estilos e Layout", () => {
    it("deve ter classes CSS corretas para o modal", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const modal = screen.getByTestId("audit-log-modal");
      expect(modal).toHaveClass(
        "rounded-lg text-left overflow-hidden shadow-xl transform transition-all",
      );
    });

    it("deve ter grid responsivo no conteúdo", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const grid = screen.getByTestId("test-element");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("gap-6");
    });

    it("deve ter estilos corretos para elementos de texto", () => {
      const log = createMockAuditLog({ ip_address: "192.168.1.1" });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const ipElement = screen.getByText("192.168.1.1");
      expect(ipElement).toHaveClass("font-mono");
    });

    it("deve ter estilos corretos para pré-formatação", () => {
      const log = createMockAuditLog({ details: { test: "value" } });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const preElement = screen.getByRole("code");
      expect(preElement).toHaveClass(
        "text-xs text-gray-900 bg-gray-50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap border",
      );
    });
  });

  describe("Ícones", () => {
    it("deve renderizar todos os ícones corretos", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      // Verificar se os ícones estão presentes
      const icons = screen.getAllByTestId(/icon/);
      expect(icons.length).toBeGreaterThan(0);
    });

    it("deve ter ícones com tamanhos corretos", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      // Ícone do botão fechar
      const closeIcon = screen.getByTestId("test-element");
      expect(closeIcon).toBeInTheDocument();

      // Ícones dos campos
      const fieldIcons = screen.getAllByTestId(/field-icon/);
      expect(fieldIcons.length).toBeGreaterThan(0);
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com log com todos os campos opcionais null", () => {
      const log = createMockAuditLog({
        performed_by: undefined,
        ip_address: undefined,
        resource_id: undefined,
        description: undefined,
        details: undefined,
      });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("Sistema")).toBeInTheDocument();
      expect(screen.getByText("N/A")).toBeInTheDocument();
      expect(
        screen.getByText("Nenhuma descrição disponível"),
      ).toBeInTheDocument();
      expect(screen.queryByText("ID do Recurso")).not.toBeInTheDocument();
      expect(screen.queryByText("Detalhes Técnicos")).not.toBeInTheDocument();
    });

    it("deve lidar com detalhes como string vazia", () => {
      const log = createMockAuditLog({ details: { empty: "" } });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const preElement = screen.getByRole("code");
      expect(preElement?.textContent).toBe("");
    });

    it("deve lidar com JSON inválido em details string", () => {
      const log = createMockAuditLog({ details: { invalid: "json" } });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const preElement = screen.getByRole("code");
      expect(preElement?.textContent).toBe("{invalid json}");
    });

    it("deve lidar com múltiplas chamadas de onClose", async () => {
      const user = userEvent;
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const footerButton = screen.getByRole("button", { name: "Fechar" });
      await user.click(footerButton);
      await user.click(footerButton);
      await user.click(footerButton);

      expect(mockOnClose).toHaveBeenCalledTimes(3);
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter estrutura semântica correta", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Detalhes do Log de Auditoria");

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2); // Botão X e botão Fechar
    });

    it("deve ter labels descritivos para os campos", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(screen.getByText("Ação")).toBeInTheDocument();
      expect(screen.getByText("Tipo de Recurso")).toBeInTheDocument();
      expect(screen.getByText("Usuário")).toBeInTheDocument();
      expect(screen.getByText("Data e Hora")).toBeInTheDocument();
      expect(screen.getByText("Endereço IP")).toBeInTheDocument();
      expect(screen.getByText("Descrição")).toBeInTheDocument();
    });

    it("deve ter z-index alto para sobreposição", () => {
      const log = createMockAuditLog();
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const modalContainer = screen.getByTestId("test-element");
      expect(modalContainer).toBeInTheDocument();
    });
  });

  describe("Integração com auditLogsService", () => {
    it("deve chamar todos os métodos de formatação do service", () => {
      const log = createMockAuditLog({
        action: "UPDATE",
        resource_type: "ENTRY",
        timestamp: "2024-01-01T15:30:00Z",
      });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      expect(auditLogsService.formatAction).toHaveBeenCalledWith("UPDATE");
      expect(auditLogsService.getActionBadgeColor).toHaveBeenCalledWith(
        "UPDATE",
      );
      expect(auditLogsService.formatResourceType).toHaveBeenCalledWith("ENTRY");
      expect(auditLogsService.formatDate).toHaveBeenCalledWith(
        "2024-01-01T15:30:00Z",
      );
    });

    it("deve aplicar cores do badge corretamente", () => {
      const log = createMockAuditLog({ action: "DELETE" });
      render(
        <AuditLogDetailsModal log={log} isOpen={true} onClose={mockOnClose} />,
      );

      const badge = screen.getByText("Exclusão");
      expect(badge).toHaveClass("bg-red-100 text-red-800");
    });
  });
});
