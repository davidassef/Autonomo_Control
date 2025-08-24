import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportsPage from "./ReportsPage";
import { useEntries } from "../hooks/useEntries";

// Mock dos hooks e componentes
jest.mock("../hooks/useEntries");
jest.mock(
  "../components/Layout",
  () =>
    ({ children }: { children: React.ReactNode }) => (
      <div data-testid="layout">{children}</div>
    ),
);
jest.mock(
  "../components/charts/MonthlyEvolutionChart",
  () =>
    ({ monthlySummaries, isLoading }: any) => (
      <div data-testid="monthly-evolution-chart">
        {isLoading
          ? "Loading..."
          : `Chart with ${monthlySummaries?.length || 0} months`}
      </div>
    ),
);
jest.mock(
  "../components/charts/CategoryDistributionChart",
  () =>
    ({ entries, type, isLoading }: any) => (
      <div data-testid={`category-distribution-chart-${type}`}>
        {isLoading
          ? "Loading..."
          : `${type} chart with ${entries?.length || 0} entries`}
      </div>
    ),
);

const mockUseEntries = useEntries as jest.MockedFunction<typeof useEntries>;

const mockEntriesData = {
  entries: [
    {
      id: "1",
      amount: 1000,
      date: "2023-01-15",
      type: "INCOME" as const,
      description: "Salário",
      category_id: "1",
      user_id: "1",
      created_at: "2023-01-15T10:00:00Z",
      updated_at: "2023-01-15T10:00:00Z",
    },
    {
      id: "2",
      amount: 500,
      date: "2023-01-20",
      type: "EXPENSE" as const,
      description: "Compras",
      category_id: "2",
      user_id: "1",
      created_at: "2023-01-20T10:00:00Z",
      updated_at: "2023-01-20T10:00:00Z",
    },
  ],
  summary: {
    total_income: 1000,
    total_expense: 500,
    balance: 500,
    count_income: 1,
    count_expense: 1,
    total_count: 2,
  },
  monthlySummaries: [
    {
      month: "01",
      year: 2023,
      total_income: 1000,
      total_expense: 500,
      balance: 500,
      count_income: 1,
      count_expense: 1,
      total_count: 2,
    },
  ],
  isLoading: false,
  isSummaryLoading: false,
  error: null,
  fetchLastSixMonthsSummaries: jest.fn(),
  refreshEntries: jest.fn(),
  addEntry: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
};

describe("ReportsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(mockUseEntries).mockReturnValue(mockEntriesData);
  });

  it("deve renderizar o título da página", () => {
    render(<ReportsPage />);
    expect(screen.getByText("Relatórios Financeiros")).toBeInTheDocument();
  });

  it("deve renderizar os botões de seleção de período", () => {
    render(<ReportsPage />);
    expect(screen.getByText("Mês")).toBeInTheDocument();
    expect(screen.getByText("Trimestre")).toBeInTheDocument();
    expect(screen.getByText("Ano")).toBeInTheDocument();
  });

  it("deve renderizar os cards de resumo com valores corretos", () => {
    render(<ReportsPage />);

    expect(screen.getByText("R$ 1000.00")).toBeInTheDocument(); // Receitas
    expect(screen.getByText("R$ 500.00")).toBeInTheDocument(); // Despesas
    expect(screen.getByText("2")).toBeInTheDocument(); // Transações
  });

  it("deve calcular e exibir o saldo corretamente", () => {
    render(<ReportsPage />);

    // Saldo positivo deve aparecer em verde
    const balanceElement = screen.getByText("R$ 500.00");
    expect(balanceElement).toHaveClass("text-green-600");
  });

  it("deve exibir saldo negativo em vermelho", () => {
    jest.mocked(mockUseEntries).mockReturnValue({
      ...mockEntriesData,
      summary: {
        ...mockEntriesData.summary,
        total_income: 300,
        total_expense: 500,
        balance: -200,
      },
    });

    render(<ReportsPage />);

    const balanceElement = screen.getByText("R$ -200.00");
    expect(balanceElement).toHaveClass("text-red-600");
  });

  it("deve alterar o período selecionado", () => {
    render(<ReportsPage />);

    const monthButton = screen.getByText("Mês");
    fireEvent.click(monthButton);

    expect(monthButton).toHaveClass("bg-indigo-600 text-white");
    expect(screen.getByText("Este Mês")).toBeInTheDocument();
  });

  it("deve alterar para período anual", () => {
    render(<ReportsPage />);

    const yearButton = screen.getByText("Ano");
    fireEvent.click(yearButton);

    expect(yearButton).toHaveClass("bg-indigo-600 text-white");
    expect(screen.getByText("Este Ano")).toBeInTheDocument();
  });

  it("deve renderizar os botões de tipo de relatório", () => {
    render(<ReportsPage />);

    expect(screen.getByText("Visão Geral")).toBeInTheDocument();
    expect(screen.getByText("Receitas")).toBeInTheDocument();
    expect(screen.getByText("Despesas")).toBeInTheDocument();
  });

  it("deve alterar o tipo de relatório para receitas", () => {
    render(<ReportsPage />);

    const incomeButton = screen.getByText("Receitas");
    fireEvent.click(incomeButton);

    expect(incomeButton).toHaveClass("bg-green-100 text-green-700");
    expect(
      screen.getByText("Análise Detalhada de Receitas"),
    ).toBeInTheDocument();
  });

  it("deve alterar o tipo de relatório para despesas", () => {
    render(<ReportsPage />);

    const expenseButton = screen.getByText("Despesas");
    fireEvent.click(expenseButton);

    expect(expenseButton).toHaveClass("bg-red-100 text-red-700");
    expect(
      screen.getByText("Análise Detalhada de Despesas"),
    ).toBeInTheDocument();
  });

  it("deve renderizar gráficos na visão geral", () => {
    render(<ReportsPage />);

    expect(screen.getByTestId("monthly-evolution-chart")).toBeInTheDocument();
    expect(
      screen.getByTestId("category-distribution-chart-INCOME"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("category-distribution-chart-EXPENSE"),
    ).toBeInTheDocument();
  });

  it("deve exibir estado de carregamento nos cards", () => {
    jest.mocked(mockUseEntries).mockReturnValue({
      ...mockEntriesData,
      isSummaryLoading: true,
      isLoading: true,
    });

    render(<ReportsPage />);

    const loadingElements = screen.getAllByRole("generic", { hidden: true });
    const animatedElements = loadingElements.filter((el) =>
      el.className.includes("animate-pulse"),
    );
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it("deve exibir mensagem de erro quando houver erro", () => {
    jest.mocked(mockUseEntries).mockReturnValue({
      ...mockEntriesData,
      error: "Erro ao carregar dados",
    });

    render(<ReportsPage />);

    expect(screen.getByText("Erro:")).toBeInTheDocument();
    expect(screen.getByText("Erro ao carregar dados")).toBeInTheDocument();
  });

  it("deve calcular receita média corretamente", () => {
    render(<ReportsPage />);

    // Verifica se existe o texto "Receita Média:" seguido do valor
    expect(screen.getByText("Receita Média:")).toBeInTheDocument();
    expect(screen.getByText("R$ 1000.00")).toBeInTheDocument();
  });

  it("deve calcular despesa média corretamente", () => {
    render(<ReportsPage />);

    // Verifica se existe o texto "Despesa Média:" seguido do valor
    expect(screen.getByText("Despesa Média:")).toBeInTheDocument();
    expect(screen.getByText("R$ 500.00")).toBeInTheDocument();
  });

  it("deve exibir 0.00 para médias quando não há transações", () => {
    jest.mocked(mockUseEntries).mockReturnValue({
      ...mockEntriesData,
      entries: [],
      summary: {
        total_income: 0,
        total_expense: 0,
        balance: 0,
        count_income: 0,
        count_expense: 0,
        total_count: 0,
      },
    });

    render(<ReportsPage />);

    const zeroValues = screen.getAllByText("R$ 0.00");
    expect(zeroValues.length).toBeGreaterThan(0);
  });

  it("deve chamar fetchLastSixMonthsSummaries no mount", async () => {
    const mockFetch = jest.fn();
    jest.mocked(mockUseEntries).mockReturnValue({
      ...mockEntriesData,
      fetchLastSixMonthsSummaries: mockFetch,
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it("deve renderizar análise detalhada com indicadores", () => {
    render(<ReportsPage />);

    expect(screen.getByText("Análise Detalhada")).toBeInTheDocument();
    expect(screen.getByText("Resumo do Período")).toBeInTheDocument();
    expect(screen.getByText("Indicadores")).toBeInTheDocument();
    expect(screen.getByText("Número de Transações:")).toBeInTheDocument();
    expect(screen.getByText("Receita Média:")).toBeInTheDocument();
    expect(screen.getByText("Despesa Média:")).toBeInTheDocument();
  });

  it("deve exibir estado de carregamento na análise detalhada", () => {
    jest.mocked(mockUseEntries).mockReturnValue({
      ...mockEntriesData,
      isSummaryLoading: true,
    });

    render(<ReportsPage />);

    const loadingElements = screen.getAllByRole("generic", { hidden: true });
    const animatedElements = loadingElements.filter((el) =>
      el.className.includes("animate-pulse"),
    );
    expect(animatedElements.length).toBeGreaterThan(0);
  });
});
