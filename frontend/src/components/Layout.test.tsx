import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import { AuthContext } from "../contexts/AuthContext";
import { UserRole } from "../types/auth";

// Mock do react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { pathname: "/" };

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ element }: { element: React.ReactNode }) => element,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    children,
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) =>
    children,
}));

interface MockUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  role: UserRole;
  is_active: boolean;
}

const createMockAuthContext = (user: MockUser | null = null) => ({
  user,
  login: jest.fn(),
  googleLogin: jest.fn(),
  logout: jest.fn(),
  register: jest.fn().mockImplementation(async (
    name: string,
    email: string,
    password: string,
    securityQuestions: Array<{ question_id: number; answer: string }>,
    optionalFields?: any,
  ) => Promise.resolve()),
  isLoading: false,
  error: null,
  clearError: jest.fn(),
});

const renderWithAuth = (
  user: MockUser | null = null,
  children: React.ReactNode = <div>Test Content</div>,
) => {
  const authContext = createMockAuthContext(user);
  return {
    ...render(
      <BrowserRouter>
        <AuthContext.Provider value={authContext}>
          <Layout>{children}</Layout>
        </AuthContext.Provider>
      </BrowserRouter>,
    ),
    authContext,
  };
};

const mockUsers = {
  user: {
    id: "user-1",
    name: "João Silva",
    email: "joao@example.com",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    role: "USER" as UserRole,
    is_active: true,
  },
  admin: {
    id: "admin-1",
    name: "Admin User",
    email: "admin@example.com",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    role: "ADMIN" as UserRole,
    is_active: true,
  },
  master: {
    id: "master-1",
    name: "Master User",
    email: "master@example.com",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    role: "MASTER" as UserRole,
    is_active: true,
  },
};

describe("Layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.pathname = "/";
  });

  describe("Renderização Básica", () => {
    it("deve renderizar o layout com conteúdo", () => {
      renderWithAuth(
        mockUsers.user,
        <div data-testid="test-content">Test Content</div>,
      );

      expect(screen.getByTestId("test-content")).toBeInTheDocument();
      expect(screen.getByText("Autônomo Control")).toBeInTheDocument();
    });

    it("deve renderizar sem usuário logado", () => {
      renderWithAuth(null, <div data-testid="test-content">Test Content</div>);

      expect(screen.getByTestId("test-content")).toBeInTheDocument();
      expect(screen.getByText("Autônomo Control")).toBeInTheDocument();
    });

    it("deve ter estrutura HTML correta", () => {
      renderWithAuth(mockUsers.user);

      const mainContainer = document.querySelector('.h-screen.flex.overflow-hidden.bg-gray-100');
      expect(mainContainer).toHaveClass(
        "h-screen flex overflow-hidden bg-gray-100",
      );
    });
  });

  describe("Navegação Principal", () => {
    it("deve renderizar todos os itens de navegação básicos", () => {
      renderWithAuth(mockUsers.user);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Lançamentos")).toBeInTheDocument();
      expect(screen.getByText("Categorias")).toBeInTheDocument();
      expect(screen.getByText("Relatórios")).toBeInTheDocument();
    });

    it("deve destacar item ativo na navegação", () => {
      mockLocation.pathname = "/entries";
      renderWithAuth(mockUsers.user);

      const entriesLink = screen.getByRole("link", { name: "Lançamentos" });
      expect(entriesLink).toHaveClass("bg-indigo-800 text-white");
    });

    it("deve aplicar estilos hover em itens não ativos", () => {
      mockLocation.pathname = "/";
      renderWithAuth(mockUsers.user);

      const categoriesLink = screen.getByRole("link", { name: "Categorias" });
      expect(categoriesLink).toHaveClass("text-indigo-100 hover:bg-indigo-600");
    });

    it("deve ter links corretos para cada item", () => {
      renderWithAuth(mockUsers.user);

      expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
        "href",
        "/",
      );
      expect(screen.getByRole("link", { name: "Lançamentos" })).toHaveAttribute(
        "href",
        "/entries",
      );
      expect(screen.getByRole("link", { name: "Categorias" })).toHaveAttribute(
        "href",
        "/categories",
      );
      expect(screen.getByRole("link", { name: "Relatórios" })).toHaveAttribute(
        "href",
        "/reports",
      );
    });

    it("deve renderizar ícones SVG para cada item", () => {
      renderWithAuth(mockUsers.user);

      const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
      const dashboardIcon = dashboardLink.querySelector("svg");
      expect(dashboardIcon).toBeInTheDocument();
      expect(dashboardIcon?.tagName).toBe("svg");
    });
  });

  describe("Navegação Admin", () => {
    it("não deve mostrar itens admin para usuário comum", () => {
      renderWithAuth(mockUsers.user);

      expect(screen.queryByText("Usuários")).not.toBeInTheDocument();
      expect(screen.queryByText("Logs de Auditoria")).not.toBeInTheDocument();
      expect(screen.queryByText("Relatórios Admin")).not.toBeInTheDocument();
    });

    it("deve mostrar itens admin para usuário ADMIN", () => {
      renderWithAuth(mockUsers.admin);

      expect(screen.getByText("Usuários")).toBeInTheDocument();
      expect(screen.getByText("Logs de Auditoria")).toBeInTheDocument();
      expect(screen.getByText("Relatórios Admin")).toBeInTheDocument();
    });

    it("deve mostrar itens admin para usuário MASTER", () => {
      renderWithAuth(mockUsers.master);

      expect(screen.getByText("Usuários")).toBeInTheDocument();
      expect(screen.getByText("Logs de Auditoria")).toBeInTheDocument();
      expect(screen.getByText("Relatórios Admin")).toBeInTheDocument();
    });

    it("deve ter links corretos para itens admin", () => {
      renderWithAuth(mockUsers.admin);

      expect(screen.getByRole("link", { name: "Usuários" })).toHaveAttribute(
        "href",
        "/admin/users",
      );
      expect(
        screen.getByRole("link", { name: "Logs de Auditoria" }),
      ).toHaveAttribute("href", "/admin/audit-logs");
      expect(screen.getByRole("link", { name: "Relatórios Admin" })).toHaveAttribute(
        "href",
        "/admin/reports",
      );
    });

    it("deve destacar item admin ativo", () => {
      mockLocation.pathname = "/admin/users";
      renderWithAuth(mockUsers.admin);

      const usersLink = screen.getByRole("link", { name: "Usuários" });
      expect(usersLink).toHaveClass("bg-indigo-800 text-white");
    });
  });

  describe("Sidebar Mobile", () => {
    it("deve iniciar com sidebar fechada", () => {
      renderWithAuth(mockUsers.user);

      const sidebar = screen.getByTestId("sidebar") || screen.getByText("Autônomo Control").parentElement;
      expect(sidebar).toHaveClass("-translate-x-full");
    });

    it("deve abrir sidebar quando botão mobile é clicado", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      const mobileButton = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.querySelector('svg path[d="M4 6h16M4 12h16M4 18h16"]'),
        );

      expect(mobileButton).toBeInTheDocument();
      await user.click(mobileButton!);

      const sidebar = screen.getByTestId("sidebar") || screen.getByText("Autônomo Control").parentElement;
      expect(sidebar).toHaveClass("translate-x-0");
    });

    it("deve fechar sidebar quando botão X é clicado", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      // Abrir sidebar
      const mobileButton = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.querySelector('svg path[d="M4 6h16M4 12h16M4 18h16"]'),
        );
      await user.click(mobileButton!);

      // Fechar sidebar
      const closeButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector('svg path[d="M6 18L18 6M6 6l12 12"]'));
      expect(closeButton).toBeInTheDocument();
      await user.click(closeButton!);

      const sidebar = screen.getByTestId("sidebar") || screen.getByText("Autônomo Control").parentElement;
      expect(sidebar).toHaveClass("-translate-x-full");
    });

    it("deve fechar sidebar quando overlay é clicado", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      // Abrir sidebar
      const mobileButton = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.querySelector('svg path[d="M4 6h16M4 12h16M4 18h16"]'),
        );
      await user.click(mobileButton!);

      // Verificar se overlay existe
      const overlay = screen.getByTestId("test-element");
      expect(overlay).toBeInTheDocument();

      // Clicar no overlay
      fireEvent.click(overlay!);

      const sidebar = screen.getByTestId("sidebar") || screen.getByText("Autônomo Control").parentElement;
      expect(sidebar).toHaveClass("-translate-x-full");
    });

    it("deve mostrar título da página no header mobile", () => {
      mockLocation.pathname = "/entries";
      renderWithAuth(mockUsers.user);

      expect(screen.getByText("Lançamentos")).toBeInTheDocument();
    });

    it("deve mostrar Dashboard como padrão para rota desconhecida", () => {
      mockLocation.pathname = "/unknown-route";
      renderWithAuth(mockUsers.user);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  describe("Menu do Usuário", () => {
    it("deve mostrar inicial do nome do usuário", () => {
      renderWithAuth(mockUsers.user);

      expect(screen.getByText("J")).toBeInTheDocument(); // Primeira letra de João
    });

    it("deve mostrar nome completo do usuário", () => {
      renderWithAuth(mockUsers.user);

      expect(screen.getByText("João Silva")).toBeInTheDocument();
    });

    it("deve mostrar U como padrão quando não há nome", () => {
      const userWithoutName = { ...mockUsers.user, name: "" };
      renderWithAuth(userWithoutName);

      expect(screen.getByText("U")).toBeInTheDocument();
    });

    it("deve abrir menu dropdown quando nome é clicado", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      const userButton = screen.getByRole("button", { name: /joão silva/i });
      await user.click(userButton);

      expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
      expect(screen.getByText("Sair")).toBeInTheDocument();
    });

    it("deve fechar menu dropdown quando clicado novamente", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      const userButton = screen.getByRole("button", { name: /joão silva/i });

      // Abrir
      await user.click(userButton);
      expect(screen.getByText("Meu Perfil")).toBeInTheDocument();

      // Fechar
      await user.click(userButton);
      expect(screen.queryByText("Meu Perfil")).not.toBeInTheDocument();
    });

    it("deve rotacionar ícone quando menu está aberto", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      const userButton = screen.getByRole("button", { name: /joão silva/i });
      const icon = userButton.querySelector("svg");

      expect(icon).not.toHaveClass("rotate-180");

      await user.click(userButton);
      expect(icon).toHaveClass("rotate-180");
    });

    it("deve ter link para perfil no dropdown", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      const userButton = screen.getByRole("button", { name: /joão silva/i });
      await user.click(userButton);

      const profileLink = screen.getByRole("link", { name: "Meu Perfil" });
      expect(profileLink).toHaveAttribute("href", "/profile");
    });

    it("deve fechar menu ao clicar em Meu Perfil", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      const userButton = screen.getByRole("button", { name: /joão silva/i });
      await user.click(userButton);

      const profileLink = screen.getByText("Meu Perfil");
      await user.click(profileLink);

      expect(screen.queryByText("Sair")).not.toBeInTheDocument();
    });
  });

  describe("Funcionalidade de Logout", () => {
    it("deve chamar logout quando botão Sair é clicado", async () => {
      const user = userEvent;
      const { authContext } = renderWithAuth(mockUsers.user);

      const userButton = screen.getByRole("button", { name: /joão silva/i });
      await user.click(userButton);

      const logoutButton = screen.getByText("Sair");
      await user.click(logoutButton);

      expect(authContext.logout).toHaveBeenCalledTimes(1);
    });

    it("deve navegar para login após logout", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      const userButton = screen.getByRole("button", { name: /joão silva/i });
      await user.click(userButton);

      const logoutButton = screen.getByText("Sair");
      await user.click(logoutButton);

      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("deve fechar menu antes de fazer logout", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      const userButton = screen.getByRole("button", { name: /joão silva/i });
      await user.click(userButton);

      const logoutButton = screen.getByText("Sair");
      await user.click(logoutButton);

      expect(screen.queryByText("Meu Perfil")).not.toBeInTheDocument();
    });
  });

  describe("Responsividade", () => {
    it("deve ter classes responsivas corretas na sidebar", () => {
      renderWithAuth(mockUsers.user);

      const sidebar = document.querySelector('.fixed.inset-y-0.left-0');
      expect(sidebar).toHaveClass(
        "fixed inset-y-0 left-0 lg:translate-x-0 lg:static lg:inset-0",
      );
    });

    it("deve esconder botão de fechar em desktop", () => {
      renderWithAuth(mockUsers.user);

      const closeButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector('svg path[d="M6 18L18 6M6 6l12 12"]'));
      expect(closeButton).toHaveClass("lg:hidden");
    });

    it("deve esconder botão mobile em desktop", () => {
      renderWithAuth(mockUsers.user);

      const mobileButton = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.querySelector('svg path[d="M4 6h16M4 12h16M4 18h16"]'),
        );
      expect(mobileButton).toHaveClass("lg:hidden");
    });

    it("deve esconder título mobile em desktop", () => {
      renderWithAuth(mockUsers.user);

      const mobileTitle = screen
        .getAllByText("Dashboard")
        .find((el) => el.classList.contains("lg:hidden"));
      expect(mobileTitle).toHaveClass("lg:hidden");
    });
  });

  describe("Estados e Interações", () => {
    it("deve manter estado da sidebar independente", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      const mobileButton = screen
        .getAllByRole("button")
        .find((btn) =>
          btn.querySelector('svg path[d="M4 6h16M4 12h16M4 18h16"]'),
        )!;

      // Abrir e fechar múltiplas vezes
      await user.click(mobileButton);
      let sidebar = document.querySelector('.translate-x-0');
      expect(sidebar).toHaveClass("translate-x-0");

      await user.click(mobileButton);
      sidebar = document.querySelector('.-translate-x-full');
      expect(sidebar).toHaveClass("-translate-x-full");
    });

    it("deve manter estado do menu de usuário independente", async () => {
      const user = userEvent;
      renderWithAuth(mockUsers.user);

      const userButton = screen.getByRole("button", { name: /joão silva/i });

      // Abrir e fechar múltiplas vezes
      await user.click(userButton);
      expect(screen.getByText("Meu Perfil")).toBeInTheDocument();

      await user.click(userButton);
      expect(screen.queryByText("Meu Perfil")).not.toBeInTheDocument();
    });

    it("deve lidar com mudanças de usuário", () => {
      const { rerender } = renderWithAuth(mockUsers.user);
      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("J")).toBeInTheDocument();

      // Mudar usuário
      const authContext = createMockAuthContext(mockUsers.admin);
      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={authContext}>
            <Layout>
              <div>Test Content</div>
            </Layout>
          </AuthContext.Provider>
        </BrowserRouter>,
      );

      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("Usuários")).toBeInTheDocument(); // Item admin
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com usuário sem nome", () => {
      const userWithoutName = { ...mockUsers.user, name: undefined as any };
      renderWithAuth(userWithoutName);

      expect(screen.getByText("U")).toBeInTheDocument();
    });

    it("deve lidar com usuário null", () => {
      renderWithAuth(null);

      expect(screen.getByText("Autônomo Control")).toBeInTheDocument();
      expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
    });

    it("deve lidar com role undefined", () => {
      const userWithoutRole = { ...mockUsers.user, role: undefined as any };
      renderWithAuth(userWithoutRole);

      // Não deve mostrar itens admin
      expect(screen.queryByText("Usuários")).not.toBeInTheDocument();
    });

    it("deve lidar com pathname não encontrado", () => {
      mockLocation.pathname = "/non-existent-route";
      renderWithAuth(mockUsers.user);

      // Nenhum item deve estar ativo
      const links = screen.getAllByRole("link");
      const activeLinks = links.filter((link) =>
        link.classList.contains("bg-indigo-800"),
      );
      expect(activeLinks).toHaveLength(0);
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter estrutura semântica adequada", () => {
      renderWithAuth(mockUsers.user);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("deve ter botões com aria-hidden nos ícones", () => {
      renderWithAuth(mockUsers.user);

      const icons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it("deve ter links navegáveis por teclado", () => {
      renderWithAuth(mockUsers.user);

      const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink?.getAttribute("href")).toBe("/");
    });

    it("deve ter botões acessíveis por teclado", () => {
      renderWithAuth(mockUsers.user);

      const userButton = screen.getByRole("button", { name: /joão silva/i });
      expect(userButton).toBeInTheDocument();
      expect(userButton?.getAttribute("type")).toBe("button");
    });
  });
});
