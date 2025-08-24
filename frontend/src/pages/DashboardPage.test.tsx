import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DashboardPage from "./DashboardPage";
import {
  mockEntries,
  mockSummary,
  mockMonthlySummaries,
  resetAllMocks,
} from "../utils/test-utils";
import * as useEntriesHook from "../hooks/useEntries";

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
jest.mock("../components/charts/MonthlyEvolutionChart", () => {
  return function MockMonthlyEvolutionChart({
    monthlySummaries,
    isLoading,
  }: any) {
    if (isLoading)
      return (
        <div data-testid="monthly-chart-loading">
          Carregando gráfico mensal...
        </div>
      );
    return (
      <div data-testid="monthly-evolution-chart">
        Gráfico de Evolução Mensal - {monthlySummaries?.length || 0} meses
      </div>
    );
  };
});

jest.mock("../components/charts/CategoryDistributionChart", () => {
  return function MockCategoryDistributionChart({
    entries,
    type,
    isLoading,
  }: any) {
    if (isLoading)
      return (
        <div data-testid={`category-chart-${type.toLowerCase()}-loading`}>
          Carregando gráfico...
        </div>
      );
    return (
      <div data-testid={`category-distribution-chart-${type.toLowerCase()}`}>
        Gráfico de Distribuição - {type} - {entries?.length || 0} entradas
      </div>
    );
  };
});

const mockUseEntries = useEntriesHook.useEntries as jest.MockedFunction<
  typeof useEntriesHook.useEntries
>;

const renderDashboardPage = () => {
  return render(<DashboardPage />);
};

describe("DashboardPage", () => {
  beforeEach(() => {
    resetAllMocks();
    mockUseEntries.mockReturnValue({
      entries: mockEntries,
      summary: mockSummary,
      monthlySummaries: mockMonthlySummaries,
      isLoading: false,
      isSummaryLoading: false,
      error: null,
      fetchLastSixMonthsSummaries: jest.fn(),
      refreshEntries: jest.fn(),
      addEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
    });
  });

  it("deve renderizar o título da página", () => {
    renderDashboardPage();
    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
  });

  it("deve renderizar os botões de seleção de período", () => {
    renderDashboardPage();
    expect(screen.getByText("Este Mês")).toBeInTheDocument();
    expect(screen.getByText("Este Ano")).toBeInTheDocument();
  });

  it('deve ter o período "Este Mês" selecionado por padrão', () => {
    renderDashboardPage();
    const monthButton = screen.getByText("Este Mês");
    expect(monthButton).toHaveClass("bg-indigo-600 text-white");
  });

  it("deve alternar entre períodos ao clicar nos botões", () => {
    renderDashboardPage();

    const yearButton = screen.getByText("Este Ano");
    fireEvent.click(yearButton);

    expect(yearButton).toHaveClass("bg-indigo-600 text-white");
    expect(screen.getByText("Este Mês")).toHaveClass("bg-white text-gray-700");
  });

  it("deve exibir os cards de resumo com valores corretos", () => {
    renderDashboardPage();

    expect(screen.getByText("Receitas do Mês")).toBeInTheDocument();
    expect(screen.getByText("Despesas do Mês")).toBeInTheDocument();
    expect(screen.getByText("Saldo do Mês")).toBeInTheDocument();

    // Verifica os valores nos cards específicos
    expect(screen.getByText("R$ 50.00")).toBeInTheDocument();
    expect(screen.getByText("R$ 25.00")).toBeInTheDocument();
    expect(screen.getByText("R$ 25.00")).toBeInTheDocument();
  });

  it("deve alterar os labels dos cards ao mudar o período", () => {
    renderDashboardPage();

    const yearButton = screen.getByText("Este Ano");
    fireEvent.click(yearButton);

    expect(screen.getByText("Receitas do Ano")).toBeInTheDocument();
    expect(screen.getByText("Despesas do Ano")).toBeInTheDocument();
    expect(screen.getByText("Saldo do Ano")).toBeInTheDocument();
  });

  it("deve exibir saldo positivo em verde e negativo em vermelho", () => {
    // Teste com saldo positivo
    renderDashboardPage();
    const positiveBalance = screen.getByText("R$ 25.00");
    expect(positiveBalance).toHaveClass("text-indigo-600");

    // Teste com saldo negativo
    mockUseEntries.mockReturnValue({
      entries: mockEntries,
      summary: { ...mockSummary, balance: -500 },
      monthlySummaries: mockMonthlySummaries,
      isLoading: false,
      isSummaryLoading: false,
      error: null,
      fetchLastSixMonthsSummaries: jest.fn(),
      refreshEntries: jest.fn(),
      addEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
    });

    render(<DashboardPage />);

    const negativeBalance = screen.getByText("R$ -500.00");
    expect(negativeBalance).toHaveClass("text-red-600");
  });

  it("deve exibir loading nos cards quando isSummaryLoading é true", () => {
    mockUseEntries.mockReturnValue({
      entries: mockEntries,
      summary: mockSummary,
      monthlySummaries: mockMonthlySummaries,
      isLoading: false,
      isSummaryLoading: true,
      error: null,
      fetchLastSixMonthsSummaries: jest.fn(),
      refreshEntries: jest.fn(),
      addEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
    });

    renderDashboardPage();

    const loadingElements = screen.getAllByRole("generic", { hidden: true });
    const skeletonElements = loadingElements.filter((el) =>
      el.classList.contains("animate-pulse"),
    );
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("deve renderizar os gráficos", () => {
    renderDashboardPage();

    expect(screen.getByTestId("monthly-evolution-chart")).toBeInTheDocument();
    expect(
      screen.getByTestId("category-distribution-chart-expense"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("category-distribution-chart-income"),
    ).toBeInTheDocument();
  });

  it("deve exibir loading nos gráficos quando necessário", () => {
    mockUseEntries.mockReturnValue({
      entries: mockEntries,
      summary: mockSummary,
      monthlySummaries: mockMonthlySummaries,
      isLoading: true,
      isSummaryLoading: true,
      error: null,
      fetchLastSixMonthsSummaries: jest.fn(),
      refreshEntries: jest.fn(),
      addEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
    });

    renderDashboardPage();

    expect(screen.getByTestId("monthly-chart-loading")).toBeInTheDocument();
    expect(
      screen.getByTestId("category-chart-expense-loading"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("category-chart-income-loading"),
    ).toBeInTheDocument();
  });

  it("deve exibir transações recentes", () => {
    renderDashboardPage();

    expect(screen.getByText("Transações Recentes")).toBeInTheDocument();
    expect(screen.getByText("Ver todas")).toBeInTheDocument();

    // Verifica se as primeiras 5 transações são exibidas
    expect(screen.getByText("Corrida Uber")).toBeInTheDocument();
    expect(screen.getByText("Almoço")).toBeInTheDocument();
  });

  it("deve exibir loading para transações recentes", () => {
    mockUseEntries.mockReturnValue({
      entries: [],
      summary: mockSummary,
      monthlySummaries: mockMonthlySummaries,
      isLoading: true,
      isSummaryLoading: false,
      error: null,
      fetchLastSixMonthsSummaries: jest.fn(),
      refreshEntries: jest.fn(),
      addEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
    });

    renderDashboardPage();

    const loadingElements = screen.getAllByRole("generic", { hidden: true });
    const skeletonElements = loadingElements.filter((el) =>
      el.classList.contains("animate-pulse"),
    );
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("deve exibir mensagem de erro quando houver erro", () => {
    mockUseEntries.mockReturnValue({
      entries: [],
      summary: null,
      monthlySummaries: [],
      isLoading: false,
      isSummaryLoading: false,
      error: "Erro ao carregar dados",
      fetchLastSixMonthsSummaries: jest.fn(),
      refreshEntries: jest.fn(),
      addEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
    });

    renderDashboardPage();

    expect(screen.getByText("Erro:")).toBeInTheDocument();
    expect(screen.getByText("Erro ao carregar dados")).toBeInTheDocument();
  });

  it("deve formatar valores monetários corretamente", () => {
    renderDashboardPage();

    // Verifica formatação nas transações
    expect(screen.getByText("+ R$ 50.00")).toBeInTheDocument();
    expect(screen.getByText("- R$ 25.00")).toBeInTheDocument();
  });

  it("deve exibir ícones corretos para receitas e despesas", () => {
    renderDashboardPage();

    const incomeIcons = screen
      .getAllByRole("generic")
      .filter(
        (el) =>
          el.classList.contains("bg-green-100") &&
          el.classList.contains("text-green-600"),
      );
    const expenseIcons = screen
      .getAllByRole("generic")
      .filter(
        (el) =>
          el.classList.contains("bg-red-100") &&
          el.classList.contains("text-red-600"),
      );

    expect(incomeIcons.length).toBeGreaterThan(0);
    expect(expenseIcons.length).toBeGreaterThan(0);
  });

  it("deve chamar fetchLastSixMonthsSummaries no mount", async () => {
    const mockFetchLastSixMonthsSummaries = jest.fn();
    mockUseEntries.mockReturnValue({
      entries: mockEntries,
      summary: mockSummary,
      monthlySummaries: mockMonthlySummaries,
      isLoading: false,
      isSummaryLoading: false,
      error: null,
      fetchLastSixMonthsSummaries: mockFetchLastSixMonthsSummaries,
      refreshEntries: jest.fn(),
      addEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
    });

    renderDashboardPage();

    await waitFor(() => {
      expect(mockFetchLastSixMonthsSummaries).toHaveBeenCalled();
    });
  });

  it('deve ter link funcional para "Ver todas" as transações', () => {
    renderDashboardPage();

    const verTodasLink = screen.getByText("Ver todas");
    expect(verTodasLink).toHaveAttribute("href", "/entries");
  });
});
