import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EntryFilters from "./EntryFilters";
import { Category } from "../types";

describe("EntryFilters", () => {
  const mockOnFilterChange = jest.fn();

  const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
    id: "1",
    name: "Alimentação",
    type: "expense",
    color: "#FF6B6B",
    icon: "food",
    is_default: false,
    subcategories: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  const defaultFilters = {
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    type: "" as const,
    categoryId: 0,
    platform: "",
    shift_tag: "",
    city: "",
  };

  const mockCategories = [
    createMockCategory({ id: "1", name: "Alimentação" }),
    createMockCategory({ id: "2", name: "Transporte" }),
    createMockCategory({ id: "3", name: "Saúde" }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização Inicial", () => {
    it("deve renderizar título dos filtros", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.getByText("Filtros")).toBeInTheDocument();
      expect(screen.getByText("Filtros")).toHaveClass("text-lg font-medium");
    });

    it("deve renderizar todos os campos de filtro", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      // Labels
      expect(screen.getByText("Data Inicial")).toBeInTheDocument();
      expect(screen.getByText("Data Final")).toBeInTheDocument();
      expect(screen.getByText("Tipo")).toBeInTheDocument();
      expect(screen.getByText("Categoria")).toBeInTheDocument();
      expect(screen.getByText("Plataforma")).toBeInTheDocument();
      expect(screen.getByText("Turno")).toBeInTheDocument();
      expect(screen.getByText("Cidade")).toBeInTheDocument();

      // Inputs
      expect(screen.getByLabelText("Data Inicial")).toBeInTheDocument();
      expect(screen.getByLabelText("Data Final")).toBeInTheDocument();
      expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
      expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
      expect(screen.getByLabelText("Plataforma")).toBeInTheDocument();
      expect(screen.getByLabelText("Turno")).toBeInTheDocument();
      expect(screen.getByLabelText("Cidade")).toBeInTheDocument();
    });

    it("deve renderizar botão de limpar filtros", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const clearButton = screen.getByText("Limpar Filtros");
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveAttribute("type", "button");
    });

    it("deve ter layout responsivo correto", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const grid = screen.getByTestId("test-element");
      expect(grid).toHaveClass("grid-cols-1 sm:grid-cols-2 lg:grid-cols-7");
    });
  });

  describe("Campos de Data", () => {
    it("deve renderizar campos de data com valores corretos", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const startDateInput = screen.getByLabelText(
        "Data Inicial",
      ) as HTMLInputElement;
      const endDateInput = screen.getByLabelText(
        "Data Final",
      ) as HTMLInputElement;

      expect(startDateInput).toHaveAttribute("type", "date");
      expect(endDateInput).toHaveAttribute("type", "date");
      expect(startDateInput.value).toBe("2024-01-01");
      expect(endDateInput.value).toBe("2024-01-31");
    });

    it("deve chamar onFilterChange quando data inicial é alterada", async () => {
      const user = userEvent;
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const startDateInput = screen.getByLabelText("Data Inicial");
      await user.clear(startDateInput);
      await user.type(startDateInput, "2024-02-01");

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        startDate: "2024-02-01",
      });
    });

    it("deve chamar onFilterChange quando data final é alterada", async () => {
      const user = userEvent;
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const endDateInput = screen.getByLabelText("Data Final");
      await user.clear(endDateInput);
      await user.type(endDateInput, "2024-02-29");

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        endDate: "2024-02-29",
      });
    });
  });

  describe("Campo Tipo", () => {
    it("deve renderizar opções de tipo corretas", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const typeSelect = screen.getByLabelText("Tipo");
      expect(typeSelect).toBeInTheDocument();

      // Verifica opções
      expect(screen.getByText("Todos")).toBeInTheDocument();
      expect(screen.getByText("Receita")).toBeInTheDocument();
      expect(screen.getByText("Despesa")).toBeInTheDocument();
    });

    it("deve chamar onFilterChange quando tipo é alterado", async () => {
      const user = userEvent;
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const typeSelect = screen.getByLabelText("Tipo");
      await user.selectOptions(typeSelect, "INCOME");

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        type: "INCOME",
      });
    });

    it("deve mostrar valor selecionado corretamente", () => {
      const filtersWithType = { ...defaultFilters, type: "EXPENSE" as const };
      render(
        <EntryFilters
          filters={filtersWithType}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const typeSelect = screen.getByLabelText("Tipo") as HTMLSelectElement;
      expect(typeSelect.value).toBe("EXPENSE");
    });
  });

  describe("Campo Categoria", () => {
    it('deve renderizar opção "Todas" por padrão', () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.getByText("Todas")).toBeInTheDocument();
    });

    it("deve renderizar categorias fornecidas", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.getByText("Alimentação")).toBeInTheDocument();
      expect(screen.getByText("Transporte")).toBeInTheDocument();
      expect(screen.getByText("Saúde")).toBeInTheDocument();
    });

    it("deve desabilitar select quando isLoading é true", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={mockCategories}
          isLoading={true}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const categorySelect = screen.getByLabelText("Categoria");
      expect(categorySelect).toBeDisabled();
    });

    it("deve chamar onFilterChange quando categoria é alterada", async () => {
      const user = userEvent;
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const categorySelect = screen.getByLabelText("Categoria");
      await user.selectOptions(categorySelect, "1");

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        categoryId: 1,
      });
    });
  });

  describe("Campo Plataforma", () => {
    it("deve renderizar opções de plataforma corretas", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.getByText("Todas")).toBeInTheDocument();
      expect(screen.getByText("UBER")).toBeInTheDocument();
      expect(screen.getByText("99")).toBeInTheDocument();
      expect(screen.getByText("INDRIVE")).toBeInTheDocument();
      expect(screen.getByText("OUTRA")).toBeInTheDocument();
    });

    it("deve chamar onFilterChange quando plataforma é alterada", async () => {
      const user = userEvent;
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const platformSelect = screen.getByLabelText("Plataforma");
      await user.selectOptions(platformSelect, "UBER");

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        platform: "UBER",
      });
    });
  });

  describe("Campo Turno", () => {
    it("deve renderizar opções de turno corretas", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.getByText("Todos")).toBeInTheDocument();
      expect(screen.getByText("Manhã")).toBeInTheDocument();
      expect(screen.getByText("Tarde")).toBeInTheDocument();
      expect(screen.getByText("Noite")).toBeInTheDocument();
      expect(screen.getByText("Madrugada")).toBeInTheDocument();
    });

    it("deve chamar onFilterChange quando turno é alterado", async () => {
      const user = userEvent;
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const shiftSelect = screen.getByLabelText("Turno");
      await user.selectOptions(shiftSelect, "MANHA");

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        shift_tag: "MANHA",
      });
    });
  });

  describe("Campo Cidade", () => {
    it("deve renderizar input de cidade com placeholder", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const cityInput = screen.getByLabelText("Cidade");
      expect(cityInput).toHaveAttribute("type", "text");
      expect(cityInput).toHaveAttribute("placeholder", "Cidade");
    });

    it("deve chamar onFilterChange quando cidade é alterada", async () => {
      const user = userEvent;
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const cityInput = screen.getByLabelText("Cidade");
      await user.type(cityInput, "São Paulo");

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        city: "São Paulo",
      });
    });

    it("deve mostrar valor atual da cidade", () => {
      const filtersWithCity = { ...defaultFilters, city: "Rio de Janeiro" };
      render(
        <EntryFilters
          filters={filtersWithCity}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const cityInput = screen.getByLabelText("Cidade") as HTMLInputElement;
      expect(cityInput.value).toBe("Rio de Janeiro");
    });
  });

  describe("Funcionalidade de Reset", () => {
    it("deve chamar onFilterChange com valores padrão quando limpar filtros é clicado", () => {
      // Mock da data atual para ter resultado consistente
      const mockDate = new Date("2024-03-15");
      jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);
      Date.now = jest.fn(() => mockDate.getTime());

      const filtersWithValues = {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        type: "INCOME" as const,
        categoryId: 1,
        platform: "UBER",
        shift_tag: "MANHA",
        city: "São Paulo",
      };

      render(
        <EntryFilters
          filters={filtersWithValues}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const clearButton = screen.getByText("Limpar Filtros");
      fireEvent.click(clearButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        startDate: "2024-03-01", // Primeiro dia do mês atual
        endDate: "2024-03-31", // Último dia do mês atual
        type: "",
        categoryId: "",
        platform: "",
        shift_tag: "",
        city: "",
      });

      // Restaura o mock
      jest.restoreAllMocks();
    });

    it("deve calcular datas corretamente para diferentes meses", () => {
      // Teste para fevereiro (mês com menos dias)
      const mockDate = new Date("2024-02-15");
      jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);
      Date.now = jest.fn(() => mockDate.getTime());

      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const clearButton = screen.getByText("Limpar Filtros");
      fireEvent.click(clearButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        startDate: "2024-02-01",
        endDate: "2024-02-29", // 2024 é ano bissexto
        type: "",
        categoryId: "",
        platform: "",
        shift_tag: "",
        city: "",
      });

      jest.restoreAllMocks();
    });
  });

  describe("Estados e Valores", () => {
    it("deve mostrar todos os valores dos filtros corretamente", () => {
      const filtersWithAllValues = {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        type: "EXPENSE" as const,
        categoryId: 2,
        platform: "99",
        shift_tag: "TARDE",
        city: "Brasília",
      };

      render(
        <EntryFilters
          filters={filtersWithAllValues}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(
        (screen.getByLabelText("Data Inicial") as HTMLInputElement).value,
      ).toBe("2024-01-01");
      expect(
        (screen.getByLabelText("Data Final") as HTMLInputElement).value,
      ).toBe("2024-01-31");
      expect((screen.getByLabelText("Tipo") as HTMLSelectElement).value).toBe(
        "EXPENSE",
      );
      expect(
        (screen.getByLabelText("Categoria") as HTMLSelectElement).value,
      ).toBe("2");
      expect(
        (screen.getByLabelText("Plataforma") as HTMLSelectElement).value,
      ).toBe("99");
      expect((screen.getByLabelText("Turno") as HTMLSelectElement).value).toBe(
        "TARDE",
      );
      expect((screen.getByLabelText("Cidade") as HTMLInputElement).value).toBe(
        "Brasília",
      );
    });

    it("deve manter estado consistente entre re-renders", () => {
      const { rerender } = render(
        <EntryFilters
          filters={defaultFilters}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const updatedFilters = { ...defaultFilters, type: "INCOME" as const };
      rerender(
        <EntryFilters
          filters={updatedFilters}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect((screen.getByLabelText("Tipo") as HTMLSelectElement).value).toBe(
        "INCOME",
      );
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com lista de categorias vazia", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={[]}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const categorySelect = screen.getByLabelText("Categoria");
      const options = categorySelect.querySelectorAll("option");
      expect(options).toHaveLength(1); // Apenas "Todas"
      expect(options[0]).toHaveTextContent("Todas");
    });

    it("deve lidar com valores undefined nos filtros", () => {
      const filtersWithUndefined = {
        startDate: undefined as any,
        endDate: undefined as any,
        type: undefined as any,
        categoryId: undefined as any,
        platform: undefined as any,
        shift_tag: undefined as any,
        city: undefined as any,
      };

      render(
        <EntryFilters
          filters={filtersWithUndefined}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      // Deve renderizar sem erros
      expect(screen.getByText("Filtros")).toBeInTheDocument();
    });

    it("deve lidar com múltiplas mudanças rápidas", async () => {
      const user = userEvent;
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const typeSelect = screen.getByLabelText("Tipo");
      const platformSelect = screen.getByLabelText("Plataforma");

      // Múltiplas mudanças rápidas
      await user.selectOptions(typeSelect, "INCOME");
      await user.selectOptions(platformSelect, "UBER");
      await user.selectOptions(typeSelect, "EXPENSE");

      expect(mockOnFilterChange).toHaveBeenCalledTimes(3);
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter labels associados aos inputs", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.getByLabelText("Data Inicial")).toBeInTheDocument();
      expect(screen.getByLabelText("Data Final")).toBeInTheDocument();
      expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
      expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
      expect(screen.getByLabelText("Plataforma")).toBeInTheDocument();
      expect(screen.getByLabelText("Turno")).toBeInTheDocument();
      expect(screen.getByLabelText("Cidade")).toBeInTheDocument();
    });

    it("deve ter IDs únicos para cada campo", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.getByLabelText("Data Inicial")).toHaveAttribute(
        "id",
        "startDate",
      );
      expect(screen.getByLabelText("Data Final")).toHaveAttribute(
        "id",
        "endDate",
      );
      expect(screen.getByLabelText("Tipo")).toHaveAttribute("id", "type");
      expect(screen.getByLabelText("Categoria")).toHaveAttribute(
        "id",
        "categoryId",
      );
      expect(screen.getByLabelText("Plataforma")).toHaveAttribute(
        "id",
        "platform",
      );
      expect(screen.getByLabelText("Turno")).toHaveAttribute("id", "shift_tag");
      expect(screen.getByLabelText("Cidade")).toHaveAttribute("id", "city");
    });

    it("deve ter estilos de foco adequados", () => {
      render(
        <EntryFilters
          filters={defaultFilters}
          categories={mockCategories}
          isLoading={false}
          onFilterChange={mockOnFilterChange}
        />,
      );

      const inputs = [
        screen.getByLabelText("Data Inicial"),
        screen.getByLabelText("Data Final"),
        screen.getByLabelText("Tipo"),
        screen.getByLabelText("Categoria"),
        screen.getByLabelText("Plataforma"),
        screen.getByLabelText("Turno"),
        screen.getByLabelText("Cidade"),
      ];

      inputs.forEach((input) => {
        expect(input).toHaveClass(
          "focus:border-indigo-500 focus:ring-indigo-500",
        );
      });
    });
  });
});
