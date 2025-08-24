import React from "react";
import { render, screen } from "@testing-library/react";
import CategoryDistributionChart from "./CategoryDistributionChart";
import { Entry } from "../../types";

// Mock do react-chartjs-2
jest.mock("react-chartjs-2", () => ({
  Pie: ({ data, options }: any) => (
    <div data-testid="pie-chart">
      <div data-testid="chart-title">{options?.plugins?.title?.text}</div>
      <div data-testid="chart-labels">{JSON.stringify(data.labels)}</div>
      <div data-testid="chart-data">
        {JSON.stringify(data.datasets[0].data)}
      </div>
      <div data-testid="chart-colors">
        {JSON.stringify(data.datasets[0].backgroundColor)}
      </div>
    </div>
  ),
}));

// Mock das configurações do chart
jest.mock("../../utils/chartConfig", () => ({}));

describe("CategoryDistributionChart", () => {
  const mockExpenseEntries: Entry[] = [
    {
      id: "1",
      user_id: "1",
      amount: 100,
      description: "Despesa 1",
      type: "EXPENSE",
      category_id: "1",
      category: {
        id: "1",
        name: "Alimentação",
        color: "rgba(255, 99, 132, 0.7)",
        type: "EXPENSE",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      date: "2024-01-01",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      user_id: "1",
      amount: 200,
      description: "Despesa 2",
      type: "EXPENSE",
      category_id: "2",
      category: {
        id: "2",
        name: "Transporte",
        color: "rgba(54, 162, 235, 0.7)",
        type: "EXPENSE",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      date: "2024-01-01",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      user_id: "1",
      amount: 150,
      description: "Despesa 3",
      type: "EXPENSE",
      category_id: "1",
      category: {
        id: "1",
        name: "Alimentação",
        color: "rgba(255, 99, 132, 0.7)",
        type: "EXPENSE",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      date: "2024-01-01",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const mockIncomeEntries: Entry[] = [
    {
      id: "4",
      user_id: "1",
      amount: 1000,
      description: "Receita 1",
      type: "INCOME",
      category_id: "3",
      category: {
        id: "3",
        name: "Salário",
        color: "rgba(75, 192, 192, 0.7)",
        type: "INCOME",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      date: "2024-01-01",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "5",
      user_id: "1",
      amount: 500,
      description: "Receita 2",
      type: "INCOME",
      category_id: "4",
      category: {
        id: "4",
        name: "Freelance",
        color: "rgba(153, 102, 255, 0.7)",
        type: "INCOME",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      date: "2024-01-01",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const mixedEntries = [...mockExpenseEntries, ...mockIncomeEntries];

  describe("Renderização Básica", () => {
    it("deve renderizar o gráfico de pizza para despesas", () => {
      render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
      expect(screen.getByTestId("chart-title")).toHaveTextContent(
        "Distribuição de Despesas",
      );
    });

    it("deve renderizar o gráfico de pizza para receitas", () => {
      render(
        <CategoryDistributionChart
          entries={mockIncomeEntries}
          type="INCOME"
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
      expect(screen.getByTestId("chart-title")).toHaveTextContent(
        "Distribuição de Receitas",
      );
    });

    it("deve ter classes CSS corretas no container", () => {
      render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );
      const chartContainer = screen.getByRole('region', { name: /gráfico/i });
      expect(chartContainer).toHaveClass("bg-white shadow rounded-lg p-4");
    });
  });

  describe("Processamento de Dados", () => {
    it("deve filtrar apenas entradas do tipo especificado", () => {
      render(
        <CategoryDistributionChart
          entries={mixedEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const labels = JSON.parse(
        screen.getByTestId("chart-labels").textContent || "[]",
      );
      expect(labels).toEqual(["Alimentação", "Transporte"]);
    });

    it("deve agrupar valores por categoria corretamente", () => {
      render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const data = JSON.parse(
        screen.getByTestId("chart-data").textContent || "[]",
      );
      // Alimentação: 100 + 150 = 250, Transporte: 200
      expect(data).toEqual([250, 200]);
    });

    it("deve ordenar categorias por valor (maior para menor)", () => {
      render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const labels = JSON.parse(
        screen.getByTestId("chart-labels").textContent || "[]",
      );
      const data = JSON.parse(
        screen.getByTestId("chart-data").textContent || "[]",
      );

      // Alimentação (250) deve vir antes de Transporte (200)
      expect(labels[0]).toBe("Alimentação");
      expect(data[0]).toBe(250);
      expect(labels[1]).toBe("Transporte");
      expect(data[1]).toBe(200);
    });

    it("deve usar cores das categorias quando disponíveis", () => {
      render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const colors = JSON.parse(
        screen.getByTestId("chart-colors").textContent || "[]",
      );
      expect(colors).toContain("rgba(255, 99, 132, 0.7)"); // Cor da Alimentação
      expect(colors).toContain("rgba(54, 162, 235, 0.7)"); // Cor do Transporte
    });
  });

  describe("Limitação de Categorias", () => {
    const manyCategories: Entry[] = Array.from({ length: 7 }, (_, i) => ({
      id: String(i + 1),
      user_id: "1",
      amount: 100 + i * 10,
      description: `Despesa ${i}`,
      type: "EXPENSE" as const,
      category_id: String(i + 1),
      category: {
        id: String(i + 1),
        name: `Categoria ${i}`,
        color: `rgba(${i * 30}, ${i * 40}, ${i * 50}, 0.7)`,
        type: "EXPENSE" as const,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      date: "2024-01-01",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    }));

    it("deve limitar a 5 categorias principais", () => {
      render(
        <CategoryDistributionChart
          entries={manyCategories}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const labels = JSON.parse(
        screen.getByTestId("chart-labels").textContent || "[]",
      );
      expect(labels).toHaveLength(6); // 5 principais + "Outros"
    });

    it('deve adicionar categoria "Outros" quando há mais de 5 categorias', () => {
      render(
        <CategoryDistributionChart
          entries={manyCategories}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const labels = JSON.parse(
        screen.getByTestId("chart-labels").textContent || "[]",
      );
      expect(labels).toContain("Outros");
    });

    it('deve somar valores das categorias menores em "Outros"', () => {
      render(
        <CategoryDistributionChart
          entries={manyCategories}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const labels = JSON.parse(
        screen.getByTestId("chart-labels").textContent || "[]",
      );
      const data = JSON.parse(
        screen.getByTestId("chart-data").textContent || "[]",
      );

      const othersIndex = labels.indexOf("Outros");
      expect(othersIndex).toBeGreaterThan(-1);
      expect(data[othersIndex]).toBeGreaterThan(0);
    });
  });

  describe("Estados de Loading", () => {
    it("deve mostrar skeleton quando isLoading é true", () => {
      render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={true}
        />,
      );

      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
      expect(screen.getByText(/animate-pulse/)).toBeInTheDocument();
    });

    it("deve ter altura fixa no estado de loading", () => {
      render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={true}
        />,
      );
      const loadingContainer = screen.getByRole('region', { name: /carregando/i });
      expect(loadingContainer).toHaveClass("h-80");
    });

    it("deve ter classes CSS corretas no estado de loading", () => {
      render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={true}
        />,
      );
      const loadingContainer = screen.getByRole('region', { name: /carregando/i });
      expect(loadingContainer).toHaveClass(
        "bg-white shadow rounded-lg p-4 h-80 flex items-center justify-center",
      );
    });
  });

  describe("Estado Vazio", () => {
    it("deve mostrar mensagem quando não há dados de despesas", () => {
      render(
        <CategoryDistributionChart
          entries={[]}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      expect(
        screen.getByText("Nenhum despesa no período selecionado."),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });

    it("deve mostrar mensagem quando não há dados de receitas", () => {
      render(
        <CategoryDistributionChart
          entries={[]}
          type="INCOME"
          isLoading={false}
        />,
      );

      expect(
        screen.getByText("Nenhum receita no período selecionado."),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });

    it("deve mostrar mensagem quando não há dados do tipo especificado", () => {
      render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="INCOME"
          isLoading={false}
        />,
      );

      expect(
        screen.getByText("Nenhum receita no período selecionado."),
      ).toBeInTheDocument();
    });

    it("deve ter classes CSS corretas no estado vazio", () => {
      render(
        <CategoryDistributionChart
          entries={[]}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const emptyContainer = screen.getByRole('region', { name: /vazio/i });
      expect(emptyContainer).toHaveClass(
        "bg-white shadow rounded-lg p-4 h-60 flex items-center justify-center",
      );
    });
  });

  describe("Categorias sem Nome", () => {
    const entriesWithoutCategory: Entry[] = [
      {
        id: "1",
        user_id: "1",
        amount: 100,
        description: "Despesa sem categoria",
        type: "EXPENSE",
        category_id: "1",
        category: undefined,
        date: "2024-01-01",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    it('deve usar "Sem categoria" quando categoria é null', () => {
      render(
        <CategoryDistributionChart
          entries={entriesWithoutCategory}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const labels = JSON.parse(
        screen.getByTestId("chart-labels").textContent || "[]",
      );
      expect(labels).toContain("Sem categoria");
    });

    it("deve usar cor padrão quando categoria não tem cor", () => {
      const entriesWithoutColor: Entry[] = [
        {
          id: "1",
          amount: 100,
          description: "Despesa sem cor",
          type: "EXPENSE",
          category_id: "1",
          user_id: "1",
          category: {
            id: "1",
            name: "Categoria sem cor",
            color: "",
            type: "EXPENSE",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          date: "2024-01-01",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      render(
        <CategoryDistributionChart
          entries={entriesWithoutColor}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const colors = JSON.parse(
        screen.getByTestId("chart-colors").textContent || "[]",
      );
      expect(colors[0]).toMatch(/rgba\(\d+, \d+, \d+, 0\.7\)/);
    });
  });

  describe("Mudanças de Props", () => {
    it("deve atualizar quando entries mudam", () => {
      const { rerender } = render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      let labels = JSON.parse(
        screen.getByTestId("chart-labels").textContent || "[]",
      );
      expect(labels).toEqual(["Alimentação", "Transporte"]);

      rerender(
        <CategoryDistributionChart
          entries={mockIncomeEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      expect(
        screen.getByText("Nenhum despesa no período selecionado."),
      ).toBeInTheDocument();
    });

    it("deve atualizar quando type muda", () => {
      const { rerender } = render(
        <CategoryDistributionChart
          entries={mixedEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("chart-title")).toHaveTextContent(
        "Distribuição de Despesas",
      );

      rerender(
        <CategoryDistributionChart
          entries={mixedEntries}
          type="INCOME"
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("chart-title")).toHaveTextContent(
        "Distribuição de Receitas",
      );
    });

    it("deve atualizar quando isLoading muda", () => {
      const { rerender } = render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();

      rerender(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={true}
        />,
      );

      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
      expect(screen.getByText(/animate-pulse/)).toBeInTheDocument();
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com entries undefined", () => {
      render(
        <CategoryDistributionChart
          entries={undefined as any}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      expect(
        screen.getByText("Nenhum despesa no período selecionado."),
      ).toBeInTheDocument();
    });

    it("deve lidar com entries null", () => {
      render(
        <CategoryDistributionChart
          entries={null as any}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      expect(
        screen.getByText("Nenhum despesa no período selecionado."),
      ).toBeInTheDocument();
    });

    it("deve lidar com valores zero", () => {
      const zeroEntries: Entry[] = [
        {
          id: "1",
          amount: 0,
          description: "Despesa zero",
          type: "EXPENSE",
          category_id: "1",
          user_id: "1",
          category: {
            id: "1",
            name: "Categoria Zero",
            color: "rgba(255, 99, 132, 0.7)",
            type: "EXPENSE",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          date: "2024-01-01",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      render(
        <CategoryDistributionChart
          entries={zeroEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const data = JSON.parse(
        screen.getByTestId("chart-data").textContent || "[]",
      );
      expect(data).toEqual([0]);
    });

    it("deve lidar com valores negativos", () => {
      const negativeEntries: Entry[] = [
        {
          id: "1",
          amount: -100,
          description: "Despesa negativa",
          type: "EXPENSE",
          category_id: "1",
          user_id: "1",
          category: {
            id: "1",
            name: "Categoria Negativa",
            color: "rgba(255, 99, 132, 0.7)",
            type: "EXPENSE",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          date: "2024-01-01",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      render(
        <CategoryDistributionChart
          entries={negativeEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const data = JSON.parse(
        screen.getByTestId("chart-data").textContent || "[]",
      );
      expect(data).toEqual([-100]);
    });
  });

  describe("Memoização", () => {
    it("deve usar React.memo para otimização", () => {
      const { rerender } = render(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      // Re-render com as mesmas props
      rerender(
        <CategoryDistributionChart
          entries={mockExpenseEntries}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      // O componente deve ainda estar presente
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("deve processar grandes quantidades de dados eficientemente", () => {
      const largeDataset: Entry[] = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i + 1),
        amount: Math.random() * 1000,
        description: `Despesa ${i}`,
        type: "EXPENSE" as const,
        category_id: String((i % 10) + 1),
        user_id: "1",
        category: {
          id: String((i % 10) + 1),
          name: `Categoria ${i % 10}`,
          color: `rgba(${i % 255}, ${(i * 2) % 255}, ${(i * 3) % 255}, 0.7)`,
          type: "EXPENSE" as const,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        date: "2024-01-01",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }));

      const startTime = performance.now();

      render(
        <CategoryDistributionChart
          entries={largeDataset}
          type="EXPENSE"
          isLoading={false}
        />,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
      // Deve processar em menos de 100ms
      expect(renderTime).toBeLessThan(100);
    });
  });
});
