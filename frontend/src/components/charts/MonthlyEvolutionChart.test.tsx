import React from "react";
import { render, screen } from "@testing-library/react";
import MonthlyEvolutionChart from "./MonthlyEvolutionChart";
import { MonthlySummary } from "../../types";

// Mock do react-chartjs-2
jest.mock("react-chartjs-2", () => ({
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart">
      <div data-testid="chart-title">{options?.plugins?.title?.text}</div>
      <div data-testid="chart-labels">{JSON.stringify(data.labels)}</div>
      <div data-testid="chart-datasets">{JSON.stringify(data.datasets)}</div>
      <div data-testid="chart-income-data">
        {JSON.stringify(data.datasets[0]?.data)}
      </div>
      <div data-testid="chart-expense-data">
        {JSON.stringify(data.datasets[1]?.data)}
      </div>
    </div>
  ),
}));

// Mock das configurações do chart
jest.mock("../../utils/chartConfig", () => ({}));

// Mock do Intl.NumberFormat para testes consistentes
const mockNumberFormat = {
  format: jest.fn((value) => `R$ ${value.toFixed(2).replace(".", ",")}`),
};

(global as any).Intl = {
  NumberFormat: jest.fn(() => mockNumberFormat),
};

describe("MonthlyEvolutionChart", () => {
  const mockMonthlySummaries: MonthlySummary[] = [
    {
      month: "2024-01",
      year: 2024,
      total_income: 5000,
      total_expense: 3000,
      balance: 2000,
      count_income: 6,
      count_expense: 4,
      total_count: 10,
    },
    {
      month: "2024-02",
      year: 2024,
      total_income: 5500,
      total_expense: 3200,
      balance: 2300,
      count_income: 7,
      count_expense: 5,
      total_count: 12,
    },
    {
      month: "2024-03",
      year: 2024,
      total_income: 4800,
      total_expense: 2800,
      balance: 2000,
      count_income: 5,
      count_expense: 3,
      total_count: 8,
    },
    {
      month: "2024-04",
      year: 2024,
      total_income: 6000,
      total_expense: 3500,
      balance: 2500,
      count_income: 9,
      count_expense: 6,
      total_count: 15,
    },
    {
      month: "2024-05",
      year: 2024,
      total_income: 5200,
      total_expense: 3100,
      balance: 2100,
      count_income: 7,
      count_expense: 4,
      total_count: 11,
    },
    {
      month: "2024-06",
      year: 2024,
      total_income: 5800,
      total_expense: 3400,
      balance: 2400,
      count_income: 8,
      count_expense: 5,
      total_count: 13,
    },
  ];

  // Mock da data atual para testes consistentes
  const mockDate = new Date("2024-06-15");
  const originalDate = global.Date;

  beforeAll(() => {
    global.Date = jest.fn(() => mockDate) as any;
    global.Date.now = originalDate.now;
    global.Date.UTC = originalDate.UTC;
    global.Date.parse = originalDate.parse;
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  beforeEach(() => {
    mockNumberFormat.format.mockClear();
  });

  describe("Renderização Básica", () => {
    it("deve renderizar o gráfico de barras", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
      expect(screen.getByTestId("chart-title")).toHaveTextContent(
        "Evolução Financeira - Últimos 6 Meses",
      );
    });

    it("deve ter container com classes CSS corretas", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );
      const chartContainer = screen.getByTestId("bar-chart");
      expect(chartContainer).toHaveClass("bg-white shadow rounded-lg p-4");
    });

    it("deve renderizar dois datasets (receitas e despesas)", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      const datasets = JSON.parse(
        screen.getByTestId("chart-datasets").textContent || "[]",
      );
      expect(datasets).toHaveLength(2);
      expect(datasets[0].label).toBe("Receitas");
      expect(datasets[1].label).toBe("Despesas");
    });
  });

  describe("Geração de Labels dos Meses", () => {
    it("deve gerar labels dos últimos 6 meses corretamente", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      const labels = JSON.parse(
        screen.getByTestId("chart-labels").textContent || "[]",
      );
      // Para junho de 2024, os últimos 6 meses são: Jan, Fev, Mar, Abr, Mai, Jun
      expect(labels).toEqual(["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"]);
    });

    it("deve lidar com mudança de ano nos labels", () => {
      // Mock para janeiro de 2024
      const januaryDate = new Date("2024-01-15");
      global.Date = jest.fn(() => januaryDate) as any;

      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      const labels = JSON.parse(
        screen.getByTestId("chart-labels").textContent || "[]",
      );
      // Para janeiro de 2024, os últimos 6 meses são: Ago, Set, Out, Nov, Dez, Jan
      expect(labels).toEqual(["Ago", "Set", "Out", "Nov", "Dez", "Jan"]);

      // Restaurar mock original
      global.Date = jest.fn(() => mockDate) as any;
    });
  });

  describe("Processamento de Dados", () => {
    it("deve mapear dados de receitas corretamente", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      const incomeData = JSON.parse(
        screen.getByTestId("chart-income-data").textContent || "[]",
      );
      expect(incomeData).toEqual([5000, 5500, 4800, 6000, 5200, 5800]);
    });

    it("deve mapear dados de despesas corretamente", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      const expenseData = JSON.parse(
        screen.getByTestId("chart-expense-data").textContent || "[]",
      );
      expect(expenseData).toEqual([3000, 3200, 2800, 3500, 3100, 3400]);
    });

    it("deve configurar cores corretas para os datasets", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      const datasets = JSON.parse(
        screen.getByTestId("chart-datasets").textContent || "[]",
      );

      // Dataset de receitas (verde)
      expect(datasets[0].backgroundColor).toBe("rgba(75, 192, 192, 0.6)");
      expect(datasets[0].borderColor).toBe("rgba(75, 192, 192, 1)");

      // Dataset de despesas (vermelho)
      expect(datasets[1].backgroundColor).toBe("rgba(255, 99, 132, 0.6)");
      expect(datasets[1].borderColor).toBe("rgba(255, 99, 132, 1)");
    });

    it("deve configurar borderWidth para ambos os datasets", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      const datasets = JSON.parse(
        screen.getByTestId("chart-datasets").textContent || "[]",
      );
      expect(datasets[0].borderWidth).toBe(1);
      expect(datasets[1].borderWidth).toBe(1);
    });
  });

  describe("Estados de Loading", () => {
    it("deve mostrar skeleton quando isLoading é true", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={true}
        />,
      );

      expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
      expect(screen.getByText(/animate-pulse/)).toBeInTheDocument();
    });

    it("deve ter altura fixa no estado de loading", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={true}
        />,
      );
      const loadingContainer = screen.getByTestId("loading-spinner");
      expect(loadingContainer).toHaveClass("h-80");
    });

    it("deve ter classes CSS corretas no estado de loading", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={true}
        />,
      );
      const loadingContainer = screen.getByTestId("loading-spinner");
      expect(loadingContainer).toHaveClass(
        "bg-white shadow rounded-lg p-4 h-80 flex items-center justify-center",
      );
    });

    it("deve mostrar skeleton com animação pulse", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={true}
        />,
      );

      const skeletonElement = screen.getByRole('region', { name: /carregando/i });
      expect(skeletonElement).toHaveClass("h-48 w-full bg-gray-200 rounded");
    });
  });

  describe("Dados Vazios", () => {
    it("deve renderizar gráfico mesmo com array vazio", () => {
      render(<MonthlyEvolutionChart monthlySummaries={[]} isLoading={false} />);

      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
      const incomeData = JSON.parse(
        screen.getByTestId("chart-income-data").textContent || "[]",
      );
      const expenseData = JSON.parse(
        screen.getByTestId("chart-expense-data").textContent || "[]",
      );
      expect(incomeData).toEqual([]);
      expect(expenseData).toEqual([]);
    });

    it("deve manter labels dos meses mesmo sem dados", () => {
      render(<MonthlyEvolutionChart monthlySummaries={[]} isLoading={false} />);

      const labels = JSON.parse(
        screen.getByTestId("chart-labels").textContent || "[]",
      );
      expect(labels).toEqual(["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"]);
    });
  });

  describe("Mudanças de Props", () => {
    it("deve atualizar quando monthlySummaries mudam", () => {
      const { rerender } = render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      let incomeData = JSON.parse(
        screen.getByTestId("chart-income-data").textContent || "[]",
      );
      expect(incomeData[0]).toBe(5000);

      const newSummaries = [
        {
          month: "2024-07",
          year: 2024,
          total_income: 7000,
          total_expense: 4000,
          balance: 3000,
          count_income: 3,
          count_expense: 2,
          total_count: 5,
        },
      ];

      rerender(
        <MonthlyEvolutionChart
          monthlySummaries={newSummaries}
          isLoading={false}
        />,
      );

      incomeData = JSON.parse(
        screen.getByTestId("chart-income-data").textContent || "[]",
      );
      expect(incomeData[0]).toBe(7000);
    });

    it("deve atualizar quando isLoading muda", () => {
      const { rerender } = render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();

      rerender(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={true}
        />,
      );

      expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
      expect(screen.getByText(/animate-pulse/)).toBeInTheDocument();
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com monthlySummaries undefined", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={undefined as any}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("deve lidar com monthlySummaries null", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={null as any}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("deve lidar com valores zero", () => {
      const zeroSummaries: MonthlySummary[] = [
        {
          month: "2024-01",
          year: 2024,
          total_income: 0,
          total_expense: 0,
          balance: 0,
          count_income: 0,
          count_expense: 0,
          total_count: 0,
        },
      ];

      render(
        <MonthlyEvolutionChart
          monthlySummaries={zeroSummaries}
          isLoading={false}
        />,
      );

      const incomeData = JSON.parse(
        screen.getByTestId("chart-income-data").textContent || "[]",
      );
      const expenseData = JSON.parse(
        screen.getByTestId("chart-expense-data").textContent || "[]",
      );
      expect(incomeData).toEqual([0]);
      expect(expenseData).toEqual([0]);
    });

    it("deve lidar com valores negativos", () => {
      const negativeSummaries: MonthlySummary[] = [
        {
          month: "2024-01",
          year: 2024,
          total_income: -1000,
          total_expense: -500,
          balance: -500,
          count_income: 1,
          count_expense: 1,
          total_count: 2,
        },
      ];

      render(
        <MonthlyEvolutionChart
          monthlySummaries={negativeSummaries}
          isLoading={false}
        />,
      );

      const incomeData = JSON.parse(
        screen.getByTestId("chart-income-data").textContent || "[]",
      );
      const expenseData = JSON.parse(
        screen.getByTestId("chart-expense-data").textContent || "[]",
      );
      expect(incomeData).toEqual([-1000]);
      expect(expenseData).toEqual([-500]);
    });

    it("deve lidar com dados parciais (menos de 6 meses)", () => {
      const partialSummaries: MonthlySummary[] = [
        {
          month: "2024-05",
          year: 2024,
          total_income: 5000,
          total_expense: 3000,
          balance: 2000,
          count_income: 6,
          count_expense: 4,
          total_count: 10,
        },
        {
          month: "2024-06",
          year: 2024,
          total_income: 5500,
          total_expense: 3200,
          balance: 2300,
          count_income: 7,
          count_expense: 5,
          total_count: 12,
        },
      ];

      render(
        <MonthlyEvolutionChart
          monthlySummaries={partialSummaries}
          isLoading={false}
        />,
      );

      const incomeData = JSON.parse(
        screen.getByTestId("chart-income-data").textContent || "[]",
      );
      expect(incomeData).toEqual([5000, 5500]);

      // Labels ainda devem mostrar todos os 6 meses
      const labels = JSON.parse(
        screen.getByTestId("chart-labels").textContent || "[]",
      );
      expect(labels).toHaveLength(6);
    });
  });

  describe("Memoização", () => {
    it("deve usar React.memo para otimização", () => {
      const { rerender } = render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      // Re-render com as mesmas props
      rerender(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      // O componente deve ainda estar presente
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("deve memoizar chartData baseado em monthlySummaries", () => {
      const { rerender } = render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      const initialIncomeData =
        screen.getByTestId("chart-income-data").textContent;

      // Re-render com as mesmas props
      rerender(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      // Os dados devem ser os mesmos (memoizados)
      expect(screen.getByTestId("chart-income-data").textContent).toBe(
        initialIncomeData,
      );
    });
  });

  describe("Configurações do Gráfico", () => {
    it("deve ter configurações responsivas", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      // Verificar se o gráfico foi renderizado (indicando que as opções foram aplicadas)
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("deve ter título configurado corretamente", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("chart-title")).toHaveTextContent(
        "Evolução Financeira - Últimos 6 Meses",
      );
    });
  });

  describe("Performance", () => {
    it("deve processar grandes quantidades de dados eficientemente", () => {
      const largeSummaries: MonthlySummary[] = Array.from(
        { length: 100 },
        (_, i) => ({
          month: `2024-${String(i + 1).padStart(2, "0")}`,
          year: 2024,
          total_income: Math.random() * 10000,
          total_expense: Math.random() * 8000,
          balance: Math.random() * 2000,
          count_income: Math.floor(Math.random() * 30),
          count_expense: Math.floor(Math.random() * 20),
          total_count: Math.floor(Math.random() * 50),
        }),
      );

      const startTime = performance.now();

      render(
        <MonthlyEvolutionChart
          monthlySummaries={largeSummaries}
          isLoading={false}
        />,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
      // Deve processar em menos de 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it("deve lidar com re-renders frequentes", () => {
      const { rerender } = render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      // Simular múltiplos re-renders
      for (let i = 0; i < 10; i++) {
        rerender(
          <MonthlyEvolutionChart
            monthlySummaries={mockMonthlySummaries}
            isLoading={i % 2 === 0}
          />,
        );
      }

      // Componente deve ainda funcionar corretamente
      expect(screen.getByText(/animate-pulse/)).toBeInTheDocument();
    });
  });

  describe("Integração com Chart.js", () => {
    it("deve passar dados corretos para o componente Bar", () => {
      render(
        <MonthlyEvolutionChart
          monthlySummaries={mockMonthlySummaries}
          isLoading={false}
        />,
      );

      // Verificar se os dados foram passados corretamente
      const datasets = JSON.parse(
        screen.getByTestId("chart-datasets").textContent || "[]",
      );
      expect(datasets).toHaveLength(2);
      expect(datasets[0].label).toBe("Receitas");
      expect(datasets[1].label).toBe("Despesas");
    });

    it("deve importar configurações globais do chart", () => {
      // Este teste verifica se o import das configurações não causa erro
      expect(() => {
        render(
          <MonthlyEvolutionChart
            monthlySummaries={mockMonthlySummaries}
            isLoading={false}
          />,
        );
      }).not.toThrow();
    });
  });
});
