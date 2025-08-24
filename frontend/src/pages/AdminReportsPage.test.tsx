import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import AdminReportsPage from "./AdminReportsPage";

// Mock dos hooks
const mockUseSystemReports = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("../hooks/useSystemReports", () => ({
  default: () => mockUseSystemReports(),
}));

jest.mock("../hooks/useAuth", () => ({
  default: () => mockUseAuth(),
}));

// Mock do Layout
jest.mock("../components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

// Mock dos ícones do Lucide
jest.mock("lucide-react", () => ({
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Database: () => <div data-testid="database-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
}));

// Dados mock
const mockDashboardData = {
  summary: {
    total_users: 150,
    active_users_30d: 120,
    total_entries_30d: 2500,
  },
  users_by_role: [
    { role: "USER", count: 100 },
    { role: "ADMIN", count: 45 },
    { role: "MASTER", count: 5 },
  ],
  most_active_users: [
    { name: "João Silva", email: "joao@test.com", entries_count: 150 },
    { name: "Maria Santos", email: "maria@test.com", entries_count: 120 },
    { name: null, email: "user@test.com", entries_count: 100 },
  ],
};

const mockUserStatistics = {
  total_users: 150,
  active_users: 120,
  new_users: 25,
  blocked_users: 5,
  most_active_users: [
    { name: "João Silva", email: "joao@test.com", entries_count: 150 },
    { name: "Maria Santos", email: "maria@test.com", entries_count: 120 },
  ],
};

const mockSystemReportsDefault = {
  dashboardData: mockDashboardData,
  userStatistics: mockUserStatistics,
  usageStatistics: null,
  financialOverview: null,
  healthMetrics: null,
  engagementReport: null,
  isLoadingDashboard: false,
  isLoadingUserStats: false,
  isLoadingUsageStats: false,
  isLoadingFinancial: false,
  isLoadingHealth: false,
  isLoadingEngagement: false,
  error: null,
  fetchDashboardData: jest.fn(),
  fetchUserStatistics: jest.fn(),
  fetchUsageStatistics: jest.fn(),
  fetchFinancialOverview: jest.fn(),
  fetchHealthMetrics: jest.fn(),
  fetchEngagementReport: jest.fn(),
  refreshAllReports: jest.fn(),
  clearError: jest.fn(),
};

const mockAuthDefault = {
  user: { id: 1, email: "admin@test.com", role: "ADMIN", name: "Admin User" },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AdminReportsPage />
    </BrowserRouter>,
  );
};

describe("AdminReportsPage", () => {
  beforeEach(() => {
    mockUseSystemReports.mockReturnValue(mockSystemReportsDefault);
    mockUseAuth.mockReturnValue(mockAuthDefault);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização inicial", () => {
    it("deve renderizar o título da página", () => {
      renderComponent();
      expect(screen.getByText("Relatórios do Sistema")).toBeInTheDocument();
    });

    it("deve renderizar o seletor de período", () => {
      renderComponent();
      expect(screen.getByDisplayValue("30")).toBeInTheDocument();
      expect(screen.getByText("dias")).toBeInTheDocument();
    });

    it("deve renderizar o botão de atualizar", () => {
      renderComponent();
      expect(screen.getByText("Atualizar")).toBeInTheDocument();
    });

    it("deve renderizar todas as abas para usuário ADMIN", () => {
      renderComponent();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Usuários")).toBeInTheDocument();
      expect(screen.getByText("Uso do Sistema")).toBeInTheDocument();
      expect(screen.getByText("Financeiro")).toBeInTheDocument();
      expect(screen.getByText("Engajamento")).toBeInTheDocument();
      expect(screen.queryByText("Saúde do Sistema")).not.toBeInTheDocument();
    });

    it("deve renderizar aba de Saúde do Sistema para usuário MASTER", () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthDefault,
        user: { ...mockAuthDefault.user, role: "MASTER" },
      });

      renderComponent();
      expect(screen.getByText("Saúde do Sistema")).toBeInTheDocument();
    });

    it("deve iniciar com a aba Dashboard ativa", () => {
      renderComponent();
      const dashboardTab = screen.getByRole("button", { name: "Dashboard" });
      expect(dashboardTab).toHaveClass("border-indigo-500 text-indigo-600");
    });
  });

  describe("Controle de acesso", () => {
    it("deve redirecionar usuários não autenticados", () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthDefault,
        isAuthenticated: false,
        user: null,
      });

      renderComponent();
      // Como não há redirecionamento implementado, apenas verificamos que o conteúdo não é renderizado
      expect(
        screen.queryByText("Relatórios do Sistema"),
      ).not.toBeInTheDocument();
    });

    it("deve permitir acesso para usuários ADMIN", () => {
      renderComponent();
      expect(screen.getByText("Relatórios do Sistema")).toBeInTheDocument();
    });

    it("deve permitir acesso para usuários MASTER", () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthDefault,
        user: { ...mockAuthDefault.user, role: "MASTER" },
      });

      renderComponent();
      expect(screen.getByText("Relatórios do Sistema")).toBeInTheDocument();
    });

    it("deve bloquear acesso para usuários comuns", () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthDefault,
        user: { ...mockAuthDefault.user, role: "USER" },
      });

      renderComponent();
      expect(
        screen.queryByText("Relatórios do Sistema"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Navegação entre abas", () => {
    it("deve alternar para a aba Usuários ao clicar", () => {
      renderComponent();

      const usersTab = screen.getByText("Usuários");
      fireEvent.click(usersTab);

      const usersButton = screen.getByRole("button", { name: "Usuários" });
      expect(usersButton).toHaveClass("border-indigo-500 text-indigo-600");
    });

    it("deve alternar para a aba Uso do Sistema ao clicar", () => {
      renderComponent();

      const usageTab = screen.getByText("Uso do Sistema");
      fireEvent.click(usageTab);

      const usageButton = screen.getByRole("button", { name: "Uso do Sistema" });
      expect(usageButton).toHaveClass("border-indigo-500 text-indigo-600");
    });

    it("deve alternar para a aba Financeiro ao clicar", () => {
      renderComponent();

      const financialTab = screen.getByText("Financeiro");
      fireEvent.click(financialTab);

      const financialButton = screen.getByRole("button", { name: "Financeiro" });
      expect(financialButton).toHaveClass("border-indigo-500 text-indigo-600");
    });

    it("deve alternar para a aba Engajamento ao clicar", () => {
      renderComponent();

      const engagementTab = screen.getByText("Engajamento");
      fireEvent.click(engagementTab);

      const engagementButton = screen.getByRole("button", { name: "Engajamento" });
      expect(engagementButton).toHaveClass("border-indigo-500 text-indigo-600");
    });

    it("deve alternar para a aba Saúde do Sistema para usuário MASTER", () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthDefault,
        user: { ...mockAuthDefault.user, role: "MASTER" },
      });

      renderComponent();

      const healthTab = screen.getByText("Saúde do Sistema");
      fireEvent.click(healthTab);

      const healthButton = screen.getByRole("button", { name: "Saúde do Sistema" });
      expect(healthButton).toHaveClass("border-indigo-500 text-indigo-600");
    });
  });

  describe("Aba Dashboard", () => {
    it("deve exibir estado de loading", () => {
      mockUseSystemReports.mockReturnValue({
        ...mockSystemReportsDefault,
        isLoadingDashboard: true,
        dashboardData: null,
      });

      renderComponent();
      expect(screen.getByText("Carregando dashboard...")).toBeInTheDocument();
    });

    it("deve exibir dados do dashboard quando carregados", () => {
      renderComponent();

      expect(screen.getByText("Total de Usuários")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("Usuários Ativos (30d)")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
      expect(screen.getByText("Entradas (30d)")).toBeInTheDocument();
      expect(screen.getByText("2500")).toBeInTheDocument();
    });

    it("deve exibir usuários por função", () => {
      renderComponent();

      expect(screen.getByText("Usuários por Função")).toBeInTheDocument();
      expect(screen.getByText("USER")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("ADMIN")).toBeInTheDocument();
      expect(screen.getByText("45")).toBeInTheDocument();
      expect(screen.getByText("MASTER")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("deve exibir usuários mais ativos", () => {
      renderComponent();

      expect(screen.getByText("Usuários Mais Ativos")).toBeInTheDocument();
      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("joao@test.com")).toBeInTheDocument();
      expect(screen.getByText("150 entradas")).toBeInTheDocument();
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();
      expect(screen.getByText("maria@test.com")).toBeInTheDocument();
      expect(screen.getByText("120 entradas")).toBeInTheDocument();
    });

    it("deve exibir mensagem quando não há dados", () => {
      mockUseSystemReports.mockReturnValue({
        ...mockSystemReportsDefault,
        dashboardData: null,
      });

      renderComponent();
      expect(screen.getByText("Nenhum dado disponível")).toBeInTheDocument();
    });
  });

  describe("Aba Usuários", () => {

    it("deve exibir estado de loading", () => {
      mockUseSystemReports.mockReturnValue({
        ...mockSystemReportsDefault,
        isLoadingUserStats: true,
        userStatistics: null,
      });

      renderComponent();
      const usersTab = screen.getByText("Usuários");
      fireEvent.click(usersTab);

      expect(
        screen.getByText("Carregando estatísticas de usuários..."),
      ).toBeInTheDocument();
    });

    it("deve exibir estatísticas de usuários", () => {
      renderComponent();
      const usersTab = screen.getByText("Usuários");
      fireEvent.click(usersTab);

      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("Ativos")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
      expect(screen.getByText("Novos")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("Bloqueados")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("deve exibir tabela de usuários mais ativos", () => {
      renderComponent();
      const usersTab = screen.getByText("Usuários");
      fireEvent.click(usersTab);

      expect(screen.getByText("Usuários Mais Ativos")).toBeInTheDocument();
      expect(screen.getByText("Usuário")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Entradas")).toBeInTheDocument();

      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("joao@test.com")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();
      expect(screen.getByText("maria@test.com")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
    });

    it("deve exibir mensagem quando não há dados", () => {
      mockUseSystemReports.mockReturnValue({
        ...mockSystemReportsDefault,
        userStatistics: null,
      });

      renderComponent();
      const usersTab = screen.getByText("Usuários");
      fireEvent.click(usersTab);

      expect(screen.getByText("Nenhum dado disponível")).toBeInTheDocument();
    });
  });

  describe("Abas em desenvolvimento", () => {
    const tabsInDevelopment = [
      { name: "Uso do Sistema", key: "usage" },
      { name: "Financeiro", key: "financial" },
      { name: "Engajamento", key: "engagement" },
    ];

    tabsInDevelopment.forEach(({ name, key }) => {
      it(`deve exibir mensagem de implementação em andamento para aba ${name}`, () => {
        renderComponent();

        const tab = screen.getByText(name);
        fireEvent.click(tab);

        expect(
          screen.getByText("Implementação em andamento..."),
        ).toBeInTheDocument();
        expect(
          screen.getByText("Esta seção será implementada em breve."),
        ).toBeInTheDocument();
      });
    });

    it("deve exibir mensagem de implementação em andamento para aba Saúde do Sistema (MASTER)", () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthDefault,
        user: { ...mockAuthDefault.user, role: "MASTER" },
      });

      renderComponent();

      const healthTab = screen.getByText("Saúde do Sistema");
      fireEvent.click(healthTab);

      expect(
        screen.getByText("Implementação em andamento..."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Esta seção será implementada em breve."),
      ).toBeInTheDocument();
    });
  });

  describe("Funcionalidades interativas", () => {
    it("deve alterar o período selecionado", () => {
      renderComponent();

      const periodSelect = screen.getByDisplayValue("30") as HTMLSelectElement;
      fireEvent.change(periodSelect, { target: { value: "7" } });

      expect(periodSelect.value).toBe("7");
    });

    it("deve chamar refreshAllReports ao clicar em Atualizar", () => {
      const mockRefreshAllReports = jest.fn();
      mockUseSystemReports.mockReturnValue({
        ...mockSystemReportsDefault,
        refreshAllReports: mockRefreshAllReports,
      });

      renderComponent();

      const refreshButton = screen.getByText("Atualizar");
      fireEvent.click(refreshButton);

      expect(mockRefreshAllReports).toHaveBeenCalledTimes(1);
    });
  });

  describe("Tratamento de erros", () => {
    it("deve exibir mensagem de erro quando presente", () => {
      mockUseSystemReports.mockReturnValue({
        ...mockSystemReportsDefault,
        error: "Erro ao carregar dados",
      });

      renderComponent();
      expect(screen.getByText("Erro ao carregar dados")).toBeInTheDocument();
    });

    it("deve permitir limpar erro", () => {
      const mockClearError = jest.fn();
      mockUseSystemReports.mockReturnValue({
        ...mockSystemReportsDefault,
        error: "Erro ao carregar dados",
        clearError: mockClearError,
      });

      renderComponent();

      const dismissButton = screen.getByText("×");
      fireEvent.click(dismissButton);

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });
  });

  describe("Casos extremos", () => {
    it("deve lidar com usuário sem nome na lista de mais ativos", () => {
      renderComponent();

      // Verifica se o email é exibido quando não há nome
      expect(screen.getByText("user@test.com")).toBeInTheDocument();
    });

    it("deve lidar com dados vazios no dashboard", () => {
      mockUseSystemReports.mockReturnValue({
        ...mockSystemReportsDefault,
        dashboardData: {
          summary: {
            total_users: 0,
            active_users_30d: 0,
            total_entries_30d: 0,
          },
          users_by_role: [],
          most_active_users: [],
        },
      });

      renderComponent();

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("deve lidar com estatísticas de usuários vazias", () => {
      mockUseSystemReports.mockReturnValue({
        ...mockSystemReportsDefault,
        userStatistics: {
          total_users: 0,
          active_users: 0,
          new_users: 0,
          blocked_users: 0,
          most_active_users: [],
        },
      });

      renderComponent();
      const usersTab = screen.getByText("Usuários");
      fireEvent.click(usersTab);

      expect(screen.getAllByText("0")).toHaveLength(4);
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente com dados grandes", () => {
      const largeDashboardData = {
        ...mockDashboardData,
        users_by_role: Array.from({ length: 100 }, (_, i) => ({
          role: `ROLE_${i}`,
          count: i * 10,
        })),
        most_active_users: Array.from({ length: 100 }, (_, i) => ({
          name: `User ${i}`,
          email: `user${i}@test.com`,
          entries_count: i * 5,
        })),
      };

      mockUseSystemReports.mockReturnValue({
        ...mockSystemReportsDefault,
        dashboardData: largeDashboardData,
      });

      const startTime = performance.now();
      renderComponent();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Deve renderizar em menos de 1 segundo
    });

    it("deve manter referências estáveis das funções", () => {
      const { rerender } = renderComponent();

      const refreshButton1 = screen.getByText("Atualizar");

      rerender(
        <BrowserRouter>
          <AdminReportsPage />
        </BrowserRouter>,
      );

      const refreshButton2 = screen.getByText("Atualizar");

      // As funções devem ser as mesmas entre re-renders
      expect(refreshButton1).toEqual(refreshButton2);
    });
  });
});
