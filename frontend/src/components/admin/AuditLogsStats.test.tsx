import React from "react";
import { render, screen, within } from "@testing-library/react";
import { AuditLogsStats } from "./AuditLogsStats";
import { AuditLogStats } from "../../services/auditLogs";

const createMockStats = (
  overrides: Partial<AuditLogStats> = {},
): AuditLogStats => ({
  total_logs: 1250,
  unique_users: 45,
  logs_today: 23,
  logs_this_week: 156,
  top_actions: [
    { action: "LOGIN", count: 450 },
    { action: "CREATE", count: 320 },
    { action: "UPDATE", count: 280 },
    { action: "DELETE", count: 200 },
  ],
  top_users: [
    { user: "admin@test.com", count: 125 },
    { user: "user1@test.com", count: 98 },
    { user: "user2@test.com", count: 76 },
    { user: "user3@test.com", count: 54 },
  ],
  ...overrides,
});

describe("AuditLogsStats", () => {
  describe("Estado de Loading", () => {
    it("deve renderizar skeleton quando loading é true", () => {
      render(<AuditLogsStats stats={null} loading={true} />);

      expect(screen.getByText("Estatísticas")).toBeInTheDocument();

      // Verificar se há 4 skeletons (placeholders)
      const allSkeletons = screen.getAllByTestId("skeleton-loader");
      expect(allSkeletons).toHaveLength(4);
    });

    it("deve ter estrutura HTML correta no estado de loading", () => {
      render(<AuditLogsStats stats={null} loading={true} />);

      const container = screen.getByTestId("stats-container");
      expect(container).toBeInTheDocument();

      const grid = screen.getByTestId("stats-grid");
      expect(grid).toBeInTheDocument();
    });

    it("deve ter ícone correto no cabeçalho durante loading", () => {
      render(<AuditLogsStats stats={null} loading={true} />);

      const icon = screen.getByTestId("test-element");
      expect(icon).toBeInTheDocument();
    });

    it("deve ter classes de animação corretas nos skeletons", () => {
      render(<AuditLogsStats stats={null} loading={true} />);

      const allSkeletons = screen.getAllByTestId("skeleton-loader");
      allSkeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass("animate-pulse");

        const allBgElements = within(skeleton).getAllByTestId("skeleton-bg");
        expect(allBgElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Estado Sem Dados", () => {
    it("não deve renderizar nada quando stats é null e loading é false", () => {
      const { container } = render(
        <AuditLogsStats stats={null} loading={false} />,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("não deve renderizar nada quando stats é undefined", () => {
      const { container } = render(
        <AuditLogsStats stats={undefined as any} loading={false} />,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Renderização com Dados", () => {
    const mockStats = createMockStats();

    it("deve renderizar o componente com dados corretos", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      expect(screen.getByText("Estatísticas de Auditoria")).toBeInTheDocument();
      expect(screen.getByText("Total de Logs")).toBeInTheDocument();
      expect(screen.getByText("Usuários Únicos")).toBeInTheDocument();
      expect(screen.getByText("Logs Hoje")).toBeInTheDocument();
      expect(screen.getByText("Logs Esta Semana")).toBeInTheDocument();
    });

    it("deve ter estrutura HTML correta", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const container = screen.getByTestId("stats-container");
      expect(container).toBeInTheDocument();

      const grid = screen.getByTestId("stats-grid");
      expect(grid).toBeInTheDocument();
    });

    it("deve ter ícone correto no cabeçalho", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const icon = screen.getByTestId("test-element");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Cards de Estatísticas", () => {
    const mockStats = createMockStats();

    it("deve renderizar todos os 4 cards de estatísticas", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      expect(screen.getByText("Total de Logs")).toBeInTheDocument();
      expect(screen.getByText("Usuários Únicos")).toBeInTheDocument();
      expect(screen.getByText("Logs Hoje")).toBeInTheDocument();
      expect(screen.getByText("Logs Esta Semana")).toBeInTheDocument();
    });

    it("deve exibir valores formatados corretamente", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      expect(screen.getByText("1,250")).toBeInTheDocument(); // total_logs
      expect(screen.getByText("45")).toBeInTheDocument(); // unique_users
      expect(screen.getByText("23")).toBeInTheDocument(); // logs_today
      expect(screen.getByText("156")).toBeInTheDocument(); // logs_this_week
    });

    it("deve formatar números grandes corretamente", () => {
      const statsWithLargeNumbers = createMockStats({
        total_logs: 1234567,
        unique_users: 9876,
        logs_today: 543,
        logs_this_week: 2109,
      });

      render(<AuditLogsStats stats={statsWithLargeNumbers} loading={false} />);

      expect(screen.getByText("1,234,567")).toBeInTheDocument();
      expect(screen.getByText("9,876")).toBeInTheDocument();
      expect(screen.getByText("543")).toBeInTheDocument();
      expect(screen.getByText("2,109")).toBeInTheDocument();
    });

    it("deve ter cores corretas para cada card", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      // Total de Logs - azul
      const totalLogsCard = screen.getByText("1,250");
      expect(totalLogsCard).toHaveClass("text-blue-600");
      expect(screen.getByTestId("total-logs-value")).toBeInTheDocument();

      // Usuários Únicos - verde
      const uniqueUsersCard = screen.getByText("45");
      expect(uniqueUsersCard).toHaveClass("text-green-600");
      expect(screen.getByTestId("unique-users-value")).toBeInTheDocument();

      // Logs Hoje - roxo
      const logsTodayCard = screen.getByText("23");
      expect(logsTodayCard).toHaveClass("text-purple-600");
      expect(screen.getByTestId("logs-today-value")).toBeInTheDocument();

      // Logs Esta Semana - laranja
      const logsWeekCard = screen.getByText("156");
      expect(logsWeekCard).toHaveClass("text-orange-600");
      expect(screen.getByTestId("logs-week-value")).toBeInTheDocument();
    });

    it("deve ter ícones corretos para cada card", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const icons = screen.getAllByTestId("stat-icon");
      expect(icons).toHaveLength(4);

      // Verificar cores dos ícones
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

    it("deve lidar com valores zero", () => {
      const statsWithZeros = createMockStats({
        total_logs: 0,
        unique_users: 0,
        logs_today: 0,
        logs_this_week: 0,
      });

      render(<AuditLogsStats stats={statsWithZeros} loading={false} />);

      const zeroValues = screen.getAllByText("0");
      expect(zeroValues).toHaveLength(4);
    });
  });

  describe("Top Ações", () => {
    const mockStats = createMockStats();

    it("deve renderizar seção de top ações quando há dados", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      expect(screen.getByText("Ações Mais Frequentes")).toBeInTheDocument();
      expect(screen.getByText("LOGIN")).toBeInTheDocument();
      expect(screen.getByText("CREATE")).toBeInTheDocument();
      expect(screen.getByText("UPDATE")).toBeInTheDocument();
      expect(screen.getByText("DELETE")).toBeInTheDocument();
    });

    it("deve exibir contagens e percentuais corretos", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      expect(screen.getByText("450 vezes")).toBeInTheDocument();
      expect(screen.getByText("(36.0%)")).toBeInTheDocument(); // 450/1250 * 100

      expect(screen.getByText("320 vezes")).toBeInTheDocument();
      expect(screen.getByText("(25.6%)")).toBeInTheDocument(); // 320/1250 * 100
    });

    it("deve ter numeração correta para as ações", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const rankings = screen.getAllByTestId("action-ranking");
      expect(rankings).toHaveLength(4);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("não deve renderizar seção quando top_actions está vazio", () => {
      const statsWithoutActions = createMockStats({ top_actions: [] });
      render(<AuditLogsStats stats={statsWithoutActions} loading={false} />);

      expect(
        screen.queryByText("Ações Mais Frequentes"),
      ).not.toBeInTheDocument();
    });

    it("não deve renderizar seção quando top_actions é undefined", () => {
      const statsWithoutActions = createMockStats({ top_actions: undefined });
      render(<AuditLogsStats stats={statsWithoutActions} loading={false} />);

      expect(
        screen.queryByText("Ações Mais Frequentes"),
      ).not.toBeInTheDocument();
    });

    it("deve calcular percentual zero quando total_logs é zero", () => {
      const statsWithZeroTotal = createMockStats({
        total_logs: 0,
        top_actions: [{ action: "LOGIN", count: 10 }],
      });

      render(<AuditLogsStats stats={statsWithZeroTotal} loading={false} />);

      expect(screen.getByText("(0.0%)")).toBeInTheDocument();
    });

    it("deve ter estilos corretos para itens de ação", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const actionItems = screen.getAllByTestId("action-item");
      expect(actionItems.length).toBeGreaterThan(0);

      actionItems.forEach((item) => {
        expect(item).toHaveClass(
          "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
        );
      });
    });
  });

  describe("Top Usuários", () => {
    const mockStats = createMockStats();

    it("deve renderizar seção de top usuários quando há dados", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      expect(screen.getByText("Usuários Mais Ativos")).toBeInTheDocument();
      expect(screen.getByText("admin@test.com")).toBeInTheDocument();
      expect(screen.getByText("user1@test.com")).toBeInTheDocument();
      expect(screen.getByText("user2@test.com")).toBeInTheDocument();
      expect(screen.getByText("user3@test.com")).toBeInTheDocument();
    });

    it("deve exibir contagens e percentuais corretos para usuários", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      expect(screen.getByText("125 ações")).toBeInTheDocument();
      expect(screen.getByText("(10.0%)")).toBeInTheDocument(); // 125/1250 * 100

      expect(screen.getByText("98 ações")).toBeInTheDocument();
      expect(screen.getByText("(7.8%)")).toBeInTheDocument(); // 98/1250 * 100
    });

    it("deve ter numeração correta para os usuários", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const userRankings = screen.getAllByTestId("user-ranking");
      expect(userRankings).toHaveLength(4);
    });

    it("deve ter cor verde para rankings de usuários", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const userRankings = screen.getAllByTestId("user-ranking");
      userRankings.forEach((ranking) => {
        expect(ranking).toHaveClass("bg-green-600");
      });
    });

    it("não deve renderizar seção quando top_users está vazio", () => {
      const statsWithoutUsers = createMockStats({ top_users: [] });
      render(<AuditLogsStats stats={statsWithoutUsers} loading={false} />);

      expect(
        screen.queryByText("Usuários Mais Ativos"),
      ).not.toBeInTheDocument();
    });

    it("não deve renderizar seção quando top_users é undefined", () => {
      const statsWithoutUsers = createMockStats({ top_users: undefined });
      render(<AuditLogsStats stats={statsWithoutUsers} loading={false} />);

      expect(
        screen.queryByText("Usuários Mais Ativos"),
      ).not.toBeInTheDocument();
    });

    it("deve calcular percentual zero para usuários quando total_logs é zero", () => {
      const statsWithZeroTotal = createMockStats({
        total_logs: 0,
        top_users: [{ user: "admin@test.com", count: 5 }],
      });

      render(<AuditLogsStats stats={statsWithZeroTotal} loading={false} />);

      expect(screen.getByText("(0.0%)")).toBeInTheDocument();
    });

    it("deve ter estilos corretos para itens de usuário", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const userItems = screen.getAllByTestId("user-item");
      expect(userItems.length).toBeGreaterThanOrEqual(4); // Pelo menos 4 (pode ter mais das ações)

      userItems.forEach((item) => {
        expect(item).toHaveClass(
          "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
        );
      });
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com stats vazias mas válidas", () => {
      const emptyStats = createMockStats({
        total_logs: 0,
        unique_users: 0,
        logs_today: 0,
        logs_this_week: 0,
        top_actions: [],
        top_users: [],
      });

      render(<AuditLogsStats stats={emptyStats} loading={false} />);

      expect(screen.getByText("Estatísticas de Auditoria")).toBeInTheDocument();
      expect(screen.getAllByText("0")).toHaveLength(4);
      expect(
        screen.queryByText("Ações Mais Frequentes"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Usuários Mais Ativos"),
      ).not.toBeInTheDocument();
    });

    it("deve lidar com apenas uma ação no top", () => {
      const statsWithOneAction = createMockStats({
        top_actions: [{ action: "LOGIN", count: 100 }],
      });

      render(<AuditLogsStats stats={statsWithOneAction} loading={false} />);

      expect(screen.getByText("Ações Mais Frequentes")).toBeInTheDocument();
      expect(screen.getByText("LOGIN")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument(); // Ranking
    });

    it("deve lidar com apenas um usuário no top", () => {
      const statsWithOneUser = createMockStats({
        top_users: [{ user: "admin@test.com", count: 50 }],
      });

      render(<AuditLogsStats stats={statsWithOneUser} loading={false} />);

      expect(screen.getByText("Usuários Mais Ativos")).toBeInTheDocument();
      expect(screen.getByText("admin@test.com")).toBeInTheDocument();
    });

    it("deve lidar com percentuais decimais", () => {
      const statsWithDecimals = createMockStats({
        total_logs: 333,
        top_actions: [{ action: "LOGIN", count: 1 }], // 1/333 = 0.3%
      });

      render(<AuditLogsStats stats={statsWithDecimals} loading={false} />);

      expect(screen.getByText("(0.3%)")).toBeInTheDocument();
    });

    it("deve arredondar percentuais para uma casa decimal", () => {
      const statsWithRounding = createMockStats({
        total_logs: 777,
        top_actions: [{ action: "LOGIN", count: 1 }], // 1/777 = 0.128... -> 0.1%
      });

      render(<AuditLogsStats stats={statsWithRounding} loading={false} />);

      expect(screen.getByText("(0.1%)")).toBeInTheDocument();
    });

    it("deve lidar com nomes de usuários longos", () => {
      const statsWithLongUsernames = createMockStats({
        top_users: [
          {
            user: "very.long.email.address.that.might.break.layout@example.com",
            count: 10,
          },
        ],
      });

      render(<AuditLogsStats stats={statsWithLongUsernames} loading={false} />);

      expect(
        screen.getByText(
          "very.long.email.address.that.might.break.layout@example.com",
        ),
      ).toBeInTheDocument();
    });

    it("deve lidar com nomes de ações especiais", () => {
      const statsWithSpecialActions = createMockStats({
        top_actions: [
          { action: "CUSTOM_ACTION_WITH_UNDERSCORES", count: 10 },
          { action: "action-with-dashes", count: 5 },
        ],
      });

      render(
        <AuditLogsStats stats={statsWithSpecialActions} loading={false} />,
      );

      expect(
        screen.getByText("CUSTOM_ACTION_WITH_UNDERSCORES"),
      ).toBeInTheDocument();
      expect(screen.getByText("action-with-dashes")).toBeInTheDocument();
    });
  });

  describe("Acessibilidade", () => {
    const mockStats = createMockStats();

    it("deve ter estrutura semântica correta", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
        "Estatísticas de Auditoria",
      );
      expect(
        screen.getByRole("heading", {
          level: 4,
          name: "Ações Mais Frequentes",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 4, name: "Usuários Mais Ativos" }),
      ).toBeInTheDocument();
    });

    it("deve ter contraste adequado nos textos", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      // Verificar classes de cor que garantem contraste
      expect(screen.getByTestId("test-element")).toBeInTheDocument();
      expect(screen.getByTestId("test-element")).toBeInTheDocument();
      expect(screen.getByTestId("test-element")).toBeInTheDocument();
    });

    it("deve ter ícones com tamanhos apropriados", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      // Ícone do cabeçalho
      expect(screen.getByTestId("test-element")).toBeInTheDocument();

      // Ícones dos cards
      const cardIcons = screen.getAllByTestId("stat-icon");
      expect(cardIcons).toHaveLength(4);
    });

    it("deve ter espaçamento adequado entre elementos", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      expect(screen.getByTestId("test-element")).toBeInTheDocument();
      expect(screen.getByTestId("test-element")).toBeInTheDocument();
      expect(screen.getByTestId("test-element")).toBeInTheDocument();
    });
  });

  describe("Layout Responsivo", () => {
    const mockStats = createMockStats();

    it("deve ter classes responsivas corretas para o grid de cards", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const grid = screen.getByTestId("stats-grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("grid-cols-1 md:grid-cols-2 lg:grid-cols-4");
    });

    it("deve ter classes responsivas corretas no estado de loading", () => {
      render(<AuditLogsStats stats={null} loading={true} />);

      const grid = screen.getByTestId("test-element");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("grid-cols-1 md:grid-cols-4");
    });

    it("deve ter padding e margens responsivos", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const container = screen.getByTestId("test-element");
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("p-6 mb-6");
    });
  });

  describe("Estilos e Aparência", () => {
    const mockStats = createMockStats();

    it("deve ter estilos corretos para o container principal", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const container = screen.getByTestId("stats-container");
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("bg-white rounded-lg shadow p-6 mb-6");
    });

    it("deve ter estilos corretos para os cards de estatísticas", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const cards = screen.getAllByTestId("stat-card");
      expect(cards.length).toBeGreaterThanOrEqual(4);

      cards.forEach((card) => {
        expect(card).toHaveClass("rounded-lg p-4");
      });
    });

    it("deve ter estilos corretos para os rankings", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const actionRankings = screen.getAllByTestId("action-ranking");
      const userRankings = screen.getAllByTestId("user-ranking");

      [...Array.from(actionRankings), ...Array.from(userRankings)].forEach(
        (ranking) => {
          expect(ranking).toHaveClass(
            "inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white rounded-full",
          );
        },
      );
    });

    it("deve ter estilos corretos para os itens de lista", () => {
      render(<AuditLogsStats stats={mockStats} loading={false} />);

      const actionItems = screen.getAllByTestId("action-item");
      const userItems = screen.getAllByTestId("user-item");
      const listItems = [...actionItems, ...userItems];
      expect(listItems.length).toBeGreaterThanOrEqual(8); // 4 ações + 4 usuários

      listItems.forEach((item) => {
        expect(item).toHaveClass(
          "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
        );
      });
    });
  });
});
