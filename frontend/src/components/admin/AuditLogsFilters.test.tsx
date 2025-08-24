import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuditLogsFilters } from "./AuditLogsFilters";
import { AuditLogFilter } from "../../services/auditLogs";

const createMockFilters = (
  overrides: Partial<AuditLogFilter> = {},
): AuditLogFilter => ({
  skip: 0,
  limit: 100,
  ...overrides,
});

const mockAvailableActions = ["CREATE", "UPDATE", "DELETE", "LOGIN"];
const mockAvailableResourceTypes = ["USER", "ENTRY", "CATEGORY"];

describe("AuditLogsFilters", () => {
  const mockOnFiltersChange = jest.fn();

  const defaultProps = {
    filters: createMockFilters(),
    onFiltersChange: mockOnFiltersChange,
    availableActions: mockAvailableActions,
    availableResourceTypes: mockAvailableResourceTypes,
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização Básica", () => {
    it("deve renderizar o componente corretamente", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      expect(screen.getByText("Filtros")).toBeInTheDocument();
      expect(screen.getByText("Buscar por usuário")).toBeInTheDocument();
      expect(screen.getByText("Ação")).toBeInTheDocument();
      expect(screen.getByText("Tipo de Recurso")).toBeInTheDocument();
    });

    it("deve renderizar com estrutura HTML correta", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      const container = screen.getByTestId("test-element");
      expect(container).toBeInTheDocument();

      const grid = screen.getByTestId("test-element");
      expect(grid).toBeInTheDocument();
    });

    it("deve renderizar ícones corretos", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      // Ícone de filtro no cabeçalho
      const filterIcon = screen.getByTestId("test-element");
      expect(filterIcon).toBeInTheDocument();

      // Ícone de busca no input
      const searchIcon = screen.getByTestId("test-element");
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe("Estado de Expansão", () => {
    it("deve iniciar com filtros avançados ocultos", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      expect(screen.queryByText("Data Inicial")).not.toBeInTheDocument();
      expect(screen.queryByText("Data Final")).not.toBeInTheDocument();
      expect(screen.getByText("Expandir")).toBeInTheDocument();
    });

    it("deve expandir filtros avançados ao clicar em Expandir", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      const expandButton = screen.getByText("Expandir");
      await user.click(expandButton);

      expect(screen.getByText("Data Inicial")).toBeInTheDocument();
      expect(screen.getByText("Data Final")).toBeInTheDocument();
      expect(screen.getByText("Ocultar")).toBeInTheDocument();
    });

    it("deve ocultar filtros avançados ao clicar em Ocultar", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      // Expandir primeiro
      const expandButton = screen.getByText("Expandir");
      await user.click(expandButton);

      // Depois ocultar
      const hideButton = screen.getByText("Ocultar");
      await user.click(hideButton);

      expect(screen.queryByText("Data Inicial")).not.toBeInTheDocument();
      expect(screen.queryByText("Data Final")).not.toBeInTheDocument();
      expect(screen.getByText("Expandir")).toBeInTheDocument();
    });

    it("deve alternar entre expandir e ocultar múltiplas vezes", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      // Expandir
      await user.click(screen.getByText("Expandir"));
      expect(screen.getByText("Data Inicial")).toBeInTheDocument();

      // Ocultar
      await user.click(screen.getByText("Ocultar"));
      expect(screen.queryByText("Data Inicial")).not.toBeInTheDocument();

      // Expandir novamente
      await user.click(screen.getByText("Expandir"));
      expect(screen.getByText("Data Inicial")).toBeInTheDocument();
    });
  });

  describe("Filtros Básicos", () => {
    it("deve renderizar campo de busca por usuário", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      const input = screen.getByPlaceholderText("Email do usuário...");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("deve renderizar select de ações com opções corretas", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      const select = screen.getByDisplayValue("Todas as ações");
      expect(select).toBeInTheDocument();

      // Verificar se todas as ações estão presentes
      mockAvailableActions.forEach((action) => {
        expect(
          screen.getByRole("option", { name: action }),
        ).toBeInTheDocument();
      });
    });

    it("deve renderizar select de tipos de recurso com opções corretas", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      const select = screen.getByDisplayValue("Todos os tipos");
      expect(select).toBeInTheDocument();

      // Verificar se todos os tipos estão presentes
      mockAvailableResourceTypes.forEach((type) => {
        expect(screen.getByRole("option", { name: type })).toBeInTheDocument();
      });
    });

    it("deve atualizar campo de usuário ao digitar", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      const input = screen.getByPlaceholderText("Email do usuário...");
      await user.type(input, "admin@test.com");

      expect(input).toHaveValue("admin@test.com");
    });

    it("deve atualizar select de ação ao selecionar", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      const select = screen.getByDisplayValue("Todas as ações");
      await user.selectOptions(select, "CREATE");

      expect(select).toHaveValue("CREATE");
    });

    it("deve atualizar select de tipo de recurso ao selecionar", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      const select = screen.getByDisplayValue("Todos os tipos");
      await user.selectOptions(select, "USER");

      expect(select).toHaveValue("USER");
    });
  });

  describe("Filtros Avançados", () => {
    const renderAndExpand = async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      // Expandir filtros avançados
      const expandButton = screen.getByText("Expandir");
      await user.click(expandButton);
    };

    it("deve renderizar campos de data quando expandido", async () => {
      await renderAndExpand();
      
      expect(screen.getByText("Data Inicial")).toBeInTheDocument();
      expect(screen.getByText("Data Final")).toBeInTheDocument();

      const startDateInput = screen.getByDisplayValue("");
      expect(startDateInput).toBeInTheDocument();
    });

    it("deve ter ícones de calendário nos labels de data", async () => {
      await renderAndExpand();
      
      const calendarIcons = screen.getAllByTestId("calendar-icon");
      expect(calendarIcons.length).toBeGreaterThan(0);
    });

    it("deve atualizar data inicial ao selecionar", async () => {
      await renderAndExpand();
      
      const user = userEvent;
      const startDateInput = screen.getAllByRole("textbox")[0] as HTMLInputElement;

      await user.type(startDateInput, "2024-01-01");
      expect(startDateInput).toHaveValue("2024-01-01");
    });

    it("deve atualizar data final ao selecionar", async () => {
      await renderAndExpand();
      
      const user = userEvent;
      const endDateInput = screen.getAllByRole("textbox")[1] as HTMLInputElement;

      await user.type(endDateInput, "2024-12-31");
      expect(endDateInput).toHaveValue("2024-12-31");
    });
  });

  describe("Indicador de Filtros Ativos", () => {
    it("não deve mostrar indicador quando não há filtros ativos", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      expect(screen.queryByText("Filtros ativos")).not.toBeInTheDocument();
    });

    it("deve mostrar indicador quando há filtros ativos", () => {
      const filtersWithData = createMockFilters({
        performed_by: 1,
      });

      render(<AuditLogsFilters {...defaultProps} filters={filtersWithData} />);

      expect(screen.getByText("Filtros ativos")).toBeInTheDocument();
    });

    it("deve mostrar indicador com diferentes tipos de filtros", () => {
      const filtersWithData = createMockFilters({
        action: "CREATE",
        resource_type: "USER",
      });

      render(<AuditLogsFilters {...defaultProps} filters={filtersWithData} />);

      expect(screen.getByText("Filtros ativos")).toBeInTheDocument();
    });

    it("não deve considerar skip e limit como filtros ativos", () => {
      const filtersWithPagination = createMockFilters({
        skip: 50,
        limit: 200,
      });

      render(
        <AuditLogsFilters {...defaultProps} filters={filtersWithPagination} />,
      );

      expect(screen.queryByText("Filtros ativos")).not.toBeInTheDocument();
    });

    it("não deve considerar strings vazias como filtros ativos", () => {
      const filtersWithEmptyStrings = createMockFilters({
        performed_by: undefined,
        action: "",
      });

      render(
        <AuditLogsFilters
          {...defaultProps}
          filters={filtersWithEmptyStrings}
        />,
      );

      expect(screen.queryByText("Filtros ativos")).not.toBeInTheDocument();
    });
  });

  describe("Botões de Ação", () => {
    it("deve renderizar botão Aplicar Filtros", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      const applyButton = screen.getByText("Aplicar Filtros");
      expect(applyButton).toBeInTheDocument();
      expect(applyButton).toHaveClass("bg-blue-600");
    });

    it("deve chamar onFiltersChange ao clicar em Aplicar Filtros", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      const applyButton = screen.getByText("Aplicar Filtros");
      await user.click(applyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(defaultProps.filters);
    });

    it('deve mostrar "Buscando..." quando loading é true', () => {
      render(<AuditLogsFilters {...defaultProps} loading={true} />);

      expect(screen.getByText("Buscando...")).toBeInTheDocument();
      expect(screen.queryByText("Aplicar Filtros")).not.toBeInTheDocument();
    });

    it("deve desabilitar botão quando loading é true", () => {
      render(<AuditLogsFilters {...defaultProps} loading={true} />);

      const button = screen.getByText("Buscando...");
      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        "disabled:opacity-50 disabled:cursor-not-allowed",
      );
    });

    it("não deve mostrar botão Limpar Filtros quando não há filtros ativos", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      expect(screen.queryByText("Limpar Filtros")).not.toBeInTheDocument();
    });

    it("deve mostrar botão Limpar Filtros quando há filtros ativos", () => {
      const filtersWithData = createMockFilters({
        performed_by: 1,
      });

      render(<AuditLogsFilters {...defaultProps} filters={filtersWithData} />);

      expect(screen.getByText("Limpar Filtros")).toBeInTheDocument();
    });

    it("deve limpar filtros ao clicar em Limpar Filtros", async () => {
      const user = userEvent;
      const filtersWithData = createMockFilters({
        performed_by: 1,
        action: "CREATE",
      });

      render(<AuditLogsFilters {...defaultProps} filters={filtersWithData} />);

      const clearButton = screen.getByText("Limpar Filtros");
      await user.click(clearButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        skip: 0,
        limit: 100,
      });
    });
  });

  describe("Seletor de Limite", () => {
    it("deve renderizar seletor de limite com valor padrão", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      expect(screen.getByText("Limite:")).toBeInTheDocument();
      const limitSelect = screen.getByDisplayValue("100");
      expect(limitSelect).toBeInTheDocument();
    });

    it("deve ter todas as opções de limite disponíveis", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      expect(screen.getByRole("option", { name: "50" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "100" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "200" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "500" })).toBeInTheDocument();
    });

    it("deve atualizar limite ao selecionar nova opção", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      const limitSelect = screen.getByDisplayValue("100");
      await user.selectOptions(limitSelect, "200");

      expect(limitSelect).toHaveValue("200");
    });

    it("deve mostrar limite personalizado dos filtros", () => {
      const filtersWithCustomLimit = createMockFilters({ limit: 50 });

      render(
        <AuditLogsFilters {...defaultProps} filters={filtersWithCustomLimit} />,
      );

      const limitSelect = screen.getByDisplayValue("50");
      expect(limitSelect).toBeInTheDocument();
    });
  });

  describe("Integração de Filtros", () => {
    it("deve aplicar filtros com dados atualizados", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      // Preencher campos
      const userInput = screen.getByPlaceholderText("Email do usuário...");
      await user.type(userInput, "test@example.com");

      const actionSelect = screen.getByDisplayValue("Todas as ações");
      await user.selectOptions(actionSelect, "CREATE");

      // Aplicar filtros
      const applyButton = screen.getByText("Aplicar Filtros");
      await user.click(applyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        skip: 0,
        limit: 100,
        performed_by: 2,
        action: "CREATE",
      });
    });

    it("deve aplicar filtros avançados quando expandido", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      // Expandir filtros
      await user.click(screen.getByText("Expandir"));

      // Preencher datas
      const dateInputs = screen.getAllByRole("textbox");
      await user.type(dateInputs[0] as HTMLElement, "2024-01-01");
      await user.type(dateInputs[1] as HTMLElement, "2024-12-31");

      // Aplicar filtros
      const applyButton = screen.getByText("Aplicar Filtros");
      await user.click(applyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        skip: 0,
        limit: 100,
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      });
    });

    it("deve manter filtros locais independentes até aplicar", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      // Preencher campo mas não aplicar
      const userInput = screen.getByPlaceholderText("Email do usuário...");
      await user.type(userInput, "test@example.com");

      // onFiltersChange não deve ter sido chamado ainda
      expect(mockOnFiltersChange).not.toHaveBeenCalled();

      // Aplicar agora
      const applyButton = screen.getByText("Aplicar Filtros");
      await user.click(applyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com arrays vazios de ações e tipos", () => {
      render(
        <AuditLogsFilters
          {...defaultProps}
          availableActions={[]}
          availableResourceTypes={[]}
        />,
      );

      // Selects devem ainda ter opções padrão
      expect(screen.getByText("Todas as ações")).toBeInTheDocument();
      expect(screen.getByText("Todos os tipos")).toBeInTheDocument();
    });

    it("deve lidar com filtros undefined", () => {
      const filtersWithUndefined = {
        skip: 0,
        limit: 100,
        performed_by: undefined,
        action: undefined,
      } as AuditLogFilter;

      render(
        <AuditLogsFilters {...defaultProps} filters={filtersWithUndefined} />,
      );

      const userInput = screen.getByPlaceholderText("Email do usuário...");
      expect(userInput).toHaveValue("");
    });

    it("deve remover valores vazios ao aplicar filtros", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      // Preencher e depois limpar campo
      const userInput = screen.getByPlaceholderText("Email do usuário...");
      await user.type(userInput, "test");
      await user.clear(userInput);

      const applyButton = screen.getByText("Aplicar Filtros");
      await user.click(applyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        skip: 0,
        limit: 100,
      });
    });

    it("deve lidar com múltiplas aplicações de filtros", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      const applyButton = screen.getByText("Aplicar Filtros");

      // Aplicar múltiplas vezes
      await user.click(applyButton);
      await user.click(applyButton);
      await user.click(applyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledTimes(3);
    });

    it("deve lidar com múltiplas limpezas de filtros", async () => {
      const user = userEvent;
      const filtersWithData = createMockFilters({
        performed_by: 1,
      });

      render(<AuditLogsFilters {...defaultProps} filters={filtersWithData} />);

      const clearButton = screen.getByText("Limpar Filtros");

      // Limpar múltiplas vezes
      await user.click(clearButton);
      await user.click(clearButton);

      expect(mockOnFiltersChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter labels corretos para todos os campos", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      expect(screen.getByLabelText("Buscar por usuário")).toBeInTheDocument();
      expect(screen.getByLabelText("Ação")).toBeInTheDocument();
      expect(screen.getByLabelText("Tipo de Recurso")).toBeInTheDocument();
      expect(screen.getByLabelText("Limite:")).toBeInTheDocument();
    });

    it("deve ter labels corretos para campos de data quando expandido", async () => {
      const user = userEvent;
      render(<AuditLogsFilters {...defaultProps} />);

      await user.click(screen.getByText("Expandir"));

      expect(screen.getByText("Data Inicial")).toBeInTheDocument();
      expect(screen.getByText("Data Final")).toBeInTheDocument();
    });

    it("deve ter placeholders descritivos", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      expect(
        screen.getByPlaceholderText("Email do usuário..."),
      ).toBeInTheDocument();
    });

    it("deve ter botões com texto claro", () => {
      const filtersWithData = createMockFilters({
        performed_by: 1,
      });

      render(<AuditLogsFilters {...defaultProps} filters={filtersWithData} />);

      expect(
        screen.getByRole("button", { name: "Aplicar Filtros" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Limpar Filtros" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Expandir" }),
      ).toBeInTheDocument();
    });

    it("deve ter foco adequado nos elementos interativos", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      const userInput = screen.getByPlaceholderText("Email do usuário...");
      const actionSelect = screen.getByDisplayValue("Todas as ações");
      const applyButton = screen.getByText("Aplicar Filtros");

      expect(userInput).toHaveClass(
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
      );
      expect(actionSelect).toHaveClass(
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
      );
      expect(applyButton).toHaveClass(
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
      );
    });
  });

  describe("Estilos e Layout", () => {
    it("deve ter classes CSS corretas para o container principal", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      const container = screen.getByTestId("filters-container");
      expect(container).toBeInTheDocument();
    });

    it("deve ter grid responsivo para filtros básicos", () => {
      render(<AuditLogsFilters {...defaultProps} />);

      const grid = screen.getByTestId("filters-grid");
      expect(grid).toBeInTheDocument();
    });

    it("deve ter estilos corretos para indicador de filtros ativos", () => {
      const filtersWithData = createMockFilters({
        performed_by: 1,
      });

      render(<AuditLogsFilters {...defaultProps} filters={filtersWithData} />);

      const indicator = screen.getByText("Filtros ativos");
      expect(indicator).toHaveClass(
        "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800",
      );
    });

    it("deve ter estilos corretos para botões", () => {
      const filtersWithData = createMockFilters({
        performed_by: 1,
      });

      render(<AuditLogsFilters {...defaultProps} filters={filtersWithData} />);

      const applyButton = screen.getByText("Aplicar Filtros");
      expect(applyButton).toHaveClass(
        "bg-blue-600 hover:bg-blue-700 text-white",
      );

      const clearButton = screen.getByText("Limpar Filtros");
      expect(clearButton).toHaveClass(
        "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
      );
    });
  });
});
