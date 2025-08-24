import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EntriesPage from "./EntriesPage";
import {
  mockEntries,
  mockCategories,
  resetAllMocks,
} from "../utils/test-utils";
import * as useEntriesHook from "../hooks/useEntries";
import * as useCategoriesHook from "../hooks/useCategories";

// Mock do AuthContext
jest.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }: any) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: 1, name: "Test User", email: "test@test.com" },
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    error: null,
  }),
}));

// Mock dos hooks
jest.mock("../hooks/useEntries");
jest.mock("../hooks/useCategories");

// Mock dos componentes
jest.mock("../components/EntryForm", () => {
  return function MockEntryForm({
    isOpen,
    onClose,
    onSave,
    entry,
    categories,
  }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="entry-form-modal">
        <h2>{entry ? "Editar Lançamento" : "Novo Lançamento"}</h2>
        <button onClick={onClose} data-testid="close-modal">
          Fechar
        </button>
        <button
          onClick={() =>
            onSave({
              description: "Teste",
              amount: 100,
              type: "EXPENSE",
              date: "2024-01-01",
              category_id: categories[0]?.id || "1",
            })
          }
          data-testid="save-entry"
        >
          Salvar
        </button>
        <div data-testid="categories-count">
          {categories?.length || 0} categorias
        </div>
      </div>
    );
  };
});

jest.mock("../components/EntryList", () => {
  return function MockEntryList({ entries, isLoading, onEdit, onDelete }: any) {
    if (isLoading)
      return (
        <div data-testid="entry-list-loading">Carregando lançamentos...</div>
      );

    return (
      <div data-testid="entry-list">
        <div data-testid="entries-count">
          {entries?.length || 0} lançamentos
        </div>
        {entries?.map((entry: any) => (
          <div key={entry.id} data-testid={`entry-${entry.id}`}>
            <span>{entry.description}</span>
            <button
              onClick={() => onEdit(entry)}
              data-testid={`edit-${entry.id}`}
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              data-testid={`delete-${entry.id}`}
            >
              Excluir
            </button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock("../components/EntryFilters", () => {
  return function MockEntryFilters({
    filters,
    categories,
    isLoading,
    onFilterChange,
  }: any) {
    return (
      <div data-testid="entry-filters">
        <input
          data-testid="filter-type"
          value={filters.type}
          onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
          placeholder="Tipo"
        />
        <input
          data-testid="filter-category"
          value={filters.categoryId}
          onChange={(e) =>
            onFilterChange({ ...filters, categoryId: e.target.value })
          }
          placeholder="Categoria"
        />
        <div data-testid="filter-categories-count">
          {categories?.length || 0} categorias
        </div>
      </div>
    );
  };
});

const mockUseEntries = useEntriesHook.useEntries as jest.MockedFunction<
  typeof useEntriesHook.useEntries
>;
const mockUseCategories =
  useCategoriesHook.useCategories as jest.MockedFunction<
    typeof useCategoriesHook.useCategories
  >;

const renderEntriesPage = () => {
  return render(<EntriesPage />);
};

describe("EntriesPage", () => {
  const mockRefreshEntries = jest.fn();
  const mockAddEntry = jest.fn();
  const mockUpdateEntry = jest.fn();
  const mockDeleteEntry = jest.fn();
  const mockRefreshCategories = jest.fn();

  beforeEach(() => {
    resetAllMocks();

    mockUseEntries.mockReturnValue({
      entries: mockEntries,
      isLoading: false,
      error: null,
      refreshEntries: mockRefreshEntries,
      addEntry: mockAddEntry,
      updateEntry: mockUpdateEntry,
      deleteEntry: mockDeleteEntry,
      summary: null,
      monthlySummaries: [],
      isSummaryLoading: false,
      fetchLastSixMonthsSummaries: jest.fn(),
    });

    mockUseCategories.mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      refreshCategories: mockRefreshCategories,
      addCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
    });

    // Mock do window.confirm
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve renderizar o título da página", () => {
    renderEntriesPage();
    expect(screen.getByText("Lançamentos")).toBeInTheDocument();
  });

  it('deve renderizar o botão "Novo Lançamento"', () => {
    renderEntriesPage();
    expect(screen.getByText("Novo Lançamento")).toBeInTheDocument();
  });

  it('deve abrir o modal ao clicar em "Novo Lançamento"', () => {
    renderEntriesPage();

    const newEntryButton = screen.getByText("Novo Lançamento");
    fireEvent.click(newEntryButton);

    expect(screen.getByTestId("entry-form-modal")).toBeInTheDocument();
    expect(screen.getByText("Novo Lançamento")).toBeInTheDocument();
  });

  it("deve fechar o modal ao clicar em fechar", () => {
    renderEntriesPage();

    // Abre o modal
    const newEntryButton = screen.getByText("Novo Lançamento");
    fireEvent.click(newEntryButton);

    // Fecha o modal
    const closeButton = screen.getByTestId("close-modal");
    fireEvent.click(closeButton);

    expect(screen.queryByTestId("entry-form-modal")).not.toBeInTheDocument();
  });

  it("deve renderizar os filtros de entrada", () => {
    renderEntriesPage();
    expect(screen.getByTestId("entry-filters")).toBeInTheDocument();
  });

  it("deve renderizar a lista de lançamentos", () => {
    renderEntriesPage();
    expect(screen.getByTestId("entry-list")).toBeInTheDocument();
    expect(screen.getByTestId("entries-count")).toHaveTextContent(
      "3 lançamentos",
    );
  });

  it("deve exibir loading quando isLoading é true", () => {
    mockUseEntries.mockReturnValue({
      entries: [],
      isLoading: true,
      error: null,
      refreshEntries: mockRefreshEntries,
      addEntry: mockAddEntry,
      updateEntry: mockUpdateEntry,
      deleteEntry: mockDeleteEntry,
      summary: null,
      monthlySummaries: [],
      isSummaryLoading: false,
      fetchLastSixMonthsSummaries: jest.fn(),
    });

    renderEntriesPage();
    expect(screen.getByTestId("entry-list-loading")).toBeInTheDocument();
  });

  it("deve exibir mensagem de erro quando houver erro", () => {
    mockUseEntries.mockReturnValue({
      entries: [],
      isLoading: false,
      error: "Erro ao carregar lançamentos",
      refreshEntries: mockRefreshEntries,
      addEntry: mockAddEntry,
      updateEntry: mockUpdateEntry,
      deleteEntry: mockDeleteEntry,
      summary: null,
      monthlySummaries: [],
      isSummaryLoading: false,
      fetchLastSixMonthsSummaries: jest.fn(),
    });

    renderEntriesPage();

    expect(screen.getByText("Erro:")).toBeInTheDocument();
    expect(
      screen.getByText("Erro ao carregar lançamentos"),
    ).toBeInTheDocument();
  });

  it("deve aplicar filtros corretamente", () => {
    renderEntriesPage();

    const typeFilter = screen.getByTestId("filter-type");
    fireEvent.change(typeFilter, { target: { value: "INCOME" } });

    expect(typeFilter).toHaveValue("INCOME");
  });

  it("deve abrir modal de edição ao clicar em editar lançamento", () => {
    renderEntriesPage();

    const editButton = screen.getByTestId("edit-1");
    fireEvent.click(editButton);

    expect(screen.getByTestId("entry-form-modal")).toBeInTheDocument();
    expect(screen.getByText("Editar Lançamento")).toBeInTheDocument();
  });

  it("deve chamar addEntry ao salvar novo lançamento", async () => {
    renderEntriesPage();

    // Abre modal para novo lançamento
    const newEntryButton = screen.getByText("Novo Lançamento");
    fireEvent.click(newEntryButton);

    // Salva o lançamento
    const saveButton = screen.getByTestId("save-entry");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAddEntry).toHaveBeenCalledWith({
        description: "Teste",
        amount: 100,
        type: "EXPENSE",
        date: "2024-01-01",
        category_id: 1,
      });
    });

    expect(mockRefreshEntries).toHaveBeenCalled();
  });

  it("deve chamar updateEntry ao salvar lançamento editado", async () => {
    renderEntriesPage();

    // Abre modal para editar lançamento
    const editButton = screen.getByTestId("edit-1");
    fireEvent.click(editButton);

    // Salva o lançamento
    const saveButton = screen.getByTestId("save-entry");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateEntry).toHaveBeenCalledWith("1", {
        description: "Teste",
        amount: 100,
        type: "EXPENSE",
        date: "2024-01-01",
        category_id: 1,
      });
    });

    expect(mockRefreshEntries).toHaveBeenCalled();
  });

  it("deve chamar deleteEntry ao confirmar exclusão", async () => {
    renderEntriesPage();

    const deleteButton = screen.getByTestId("delete-1");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith(
        "Tem certeza que deseja excluir este lançamento?",
      );
    });

    await waitFor(() => {
      expect(mockDeleteEntry).toHaveBeenCalledWith("1");
    });
  });

  it("não deve chamar deleteEntry se usuário cancelar confirmação", async () => {
    global.confirm = jest.fn(() => false);

    renderEntriesPage();

    const deleteButton = screen.getByTestId("delete-1");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
    });

    expect(mockDeleteEntry).not.toHaveBeenCalled();
  });

  it("deve passar categorias para os componentes", () => {
    renderEntriesPage();

    expect(screen.getByTestId("filter-categories-count")).toHaveTextContent(
      "2 categorias",
    );

    // Abre modal para verificar se categorias são passadas
    const newEntryButton = screen.getByText("Novo Lançamento");
    fireEvent.click(newEntryButton);

    expect(screen.getByTestId("categories-count")).toHaveTextContent(
      "2 categorias",
    );
  });

  it("deve inicializar filtros com datas do mês atual", () => {
    renderEntriesPage();

    // Verifica se useEntries foi chamado com filtros de data do mês atual
    const currentDate = new Date();
    const expectedStartDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    )
      .toISOString()
      .split("T")[0];
    const expectedEndDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    )
      .toISOString()
      .split("T")[0];

    expect(mockUseEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expectedStartDate,
        endDate: expectedEndDate,
      }),
    );
  });

  it("deve converter filtros vazios para undefined", () => {
    renderEntriesPage();

    // Verifica se filtros vazios são convertidos para undefined
    expect(mockUseEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        type: undefined,
        platform: undefined,
        shift_tag: undefined,
        city: undefined,
      }),
    );
  });

  it("deve tratar erros ao salvar lançamento", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockAddEntry.mockRejectedValue(new Error("Erro ao salvar"));

    renderEntriesPage();

    // Abre modal e tenta salvar
    const newEntryButton = screen.getByText("Novo Lançamento");
    fireEvent.click(newEntryButton);

    const saveButton = screen.getByTestId("save-entry");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error saving entry:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  it("deve tratar erros ao excluir lançamento", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockDeleteEntry.mockRejectedValue(new Error("Erro ao excluir"));

    renderEntriesPage();

    const deleteButton = screen.getByTestId("delete-1");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error deleting entry:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  it("deve fechar modal após salvar com sucesso", async () => {
    renderEntriesPage();

    // Abre modal
    const newEntryButton = screen.getByText("Novo Lançamento");
    fireEvent.click(newEntryButton);

    expect(screen.getByTestId("entry-form-modal")).toBeInTheDocument();

    // Salva
    const saveButton = screen.getByTestId("save-entry");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByTestId("entry-form-modal")).not.toBeInTheDocument();
    });
  });
});
