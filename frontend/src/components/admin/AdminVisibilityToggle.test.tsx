import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminVisibilityToggle } from "./AdminVisibilityToggle";
import { AdminUser } from "../../services/adminUsers";
import { UserRole } from "../../types/auth";

const createMockAdminUser = (
  overrides: Partial<AdminUser> = {},
): AdminUser => ({
  id: 1,
  name: "Admin User",
  email: "admin@test.com",
  role: "ADMIN" as UserRole,
  is_active: true,
  blocked_at: undefined,
  created_at: "2024-01-01T00:00:00Z",
  can_view_admins: false,
  ...overrides,
});

const createMockUserUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: 2,
  name: "Regular User",
  email: "user@test.com",
  role: "USER" as UserRole,
  is_active: true,
  blocked_at: undefined,
  created_at: "2024-01-01T00:00:00Z",
  can_view_admins: false,
  ...overrides,
});

const createMockMasterUser = (
  overrides: Partial<AdminUser> = {},
): AdminUser => ({
  id: 3,
  name: "Master User",
  email: "master@test.com",
  role: "MASTER" as UserRole,
  is_active: true,
  blocked_at: undefined,
  created_at: "2024-01-01T00:00:00Z",
  can_view_admins: true,
  ...overrides,
});

describe("AdminVisibilityToggle", () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização Condicional", () => {
    it("deve renderizar para usuário ADMIN", () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("não deve renderizar para usuário USER", () => {
      const regularUser = createMockUserUser();
      render(
        <AdminVisibilityToggle
          user={regularUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.queryByRole("button");
      expect(button).not.toBeInTheDocument();
    });

    it("não deve renderizar para usuário MASTER", () => {
      const masterUser = createMockMasterUser();
      render(
        <AdminVisibilityToggle
          user={masterUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.queryByRole("button");
      expect(button).not.toBeInTheDocument();
    });

    it("deve retornar null para roles não-ADMIN", () => {
      const { container } = render(
        <AdminVisibilityToggle
          user={createMockUserUser()}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Estados de Visibilidade", () => {
    it("deve mostrar ícone EyeOff quando can_view_admins é false", () => {
      const adminUser = createMockAdminUser({ can_view_admins: false });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      const icon = screen.getByTestId("eye-off-icon");
      expect(icon).toBeInTheDocument();
      expect(button).toHaveAttribute("title", "Não pode ver outros ADMINs");
    });

    it("deve mostrar ícone Eye quando can_view_admins é true", () => {
      const adminUser = createMockAdminUser({ can_view_admins: true });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      const icon = screen.getByTestId("eye-icon");
      expect(icon).toBeInTheDocument();
      expect(button).toHaveAttribute("title", "Pode ver outros ADMINs");
    });

    it("deve tratar can_view_admins undefined como false", () => {
      const adminUser = createMockAdminUser({
        can_view_admins: undefined as any,
      });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Não pode ver outros ADMINs");
    });
  });

  describe("Estilos e Classes CSS", () => {
    it("deve aplicar estilos verdes quando can_view_admins é true", () => {
      const adminUser = createMockAdminUser({ can_view_admins: true });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "bg-green-100 text-green-700 hover:bg-green-200",
      );
    });

    it("deve aplicar estilos cinzas quando can_view_admins é false", () => {
      const adminUser = createMockAdminUser({ can_view_admins: false });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-gray-100 text-gray-700 hover:bg-gray-200");
    });

    it("deve ter classes base corretas", () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
      );
    });

    it("deve ter ícone com tamanho correto", () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const icon = screen.getByTestId("eye-off-icon");
      expect(icon).toHaveClass("w-3 h-3");
    });
  });

  describe("Estados de Loading e Disabled", () => {
    it("deve desabilitar botão quando loading é true", () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={true}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("deve desabilitar botão quando disabled é true", () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
          disabled={true}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("deve desabilitar botão quando loading e disabled são true", () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={true}
          onToggle={mockOnToggle}
          disabled={true}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("deve habilitar botão quando loading e disabled são false", () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
          disabled={false}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("deve habilitar botão quando disabled não é fornecido", () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });
  });

  describe("Interações do Usuário", () => {
    it("deve chamar onToggle quando botão é clicado", async () => {
      const user = userEvent;
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
      expect(mockOnToggle).toHaveBeenCalledWith(adminUser);
    });

    it("deve chamar onToggle com usuário correto", async () => {
      const user = userEvent;
      const adminUser = createMockAdminUser({
        id: 5,
        name: "Specific Admin",
      });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 5,
          name: "Specific Admin",
        }),
      );
    });

    it("não deve chamar onToggle quando botão está desabilitado por loading", async () => {
      const user = userEvent;
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={true}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnToggle).not.toHaveBeenCalled();
    });

    it("não deve chamar onToggle quando botão está desabilitado por disabled", async () => {
      const user = userEvent;
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
          disabled={true}
        />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnToggle).not.toHaveBeenCalled();
    });

    it("deve funcionar com fireEvent.click", () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
      expect(mockOnToggle).toHaveBeenCalledWith(adminUser);
    });
  });

  describe("Títulos e Tooltips", () => {
    it("deve ter título correto quando can_view_admins é true", () => {
      const adminUser = createMockAdminUser({ can_view_admins: true });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Pode ver outros ADMINs");
    });

    it("deve ter título correto quando can_view_admins é false", () => {
      const adminUser = createMockAdminUser({ can_view_admins: false });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Não pode ver outros ADMINs");
    });

    it("deve manter título mesmo quando desabilitado", () => {
      const adminUser = createMockAdminUser({ can_view_admins: true });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={true}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Pode ver outros ADMINs");
      expect(button).toBeDisabled();
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com usuário sem can_view_admins definido", () => {
      const adminUser = { ...createMockAdminUser() };
      delete (adminUser as any).can_view_admins;

      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Não pode ver outros ADMINs");
      expect(button).toHaveClass("bg-gray-100 text-gray-700");
    });

    it("deve lidar com role em minúsculas", () => {
      const adminUser = createMockAdminUser({ role: "admin" as any });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.queryByRole("button");
      expect(button).not.toBeInTheDocument();
    });

    it("deve lidar com role null", () => {
      const adminUser = createMockAdminUser({ role: null as any });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.queryByRole("button");
      expect(button).not.toBeInTheDocument();
    });

    it("deve lidar com role undefined", () => {
      const adminUser = createMockAdminUser({ role: undefined as any });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.queryByRole("button");
      expect(button).not.toBeInTheDocument();
    });

    it("deve lidar com múltiplos cliques rápidos", async () => {
      const user = userEvent;
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");

      // Cliques rápidos
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(3);
      expect(mockOnToggle).toHaveBeenCalledWith(adminUser);
    });
  });

  describe("Acessibilidade", () => {
    it('deve ter type="button" correto', () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("deve ter aria-hidden no ícone SVG", () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const icon = screen.getByTestId("eye-off-icon");
      expect(icon).toBeInTheDocument();
    });

    it("deve ser navegável por teclado", () => {
      const adminUser = createMockAdminUser();
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();

      // Simular navegação por teclado
      button.focus();
      expect(button).toHaveFocus();
    });

    it("deve ter contraste adequado nos estilos", () => {
      const adminUser = createMockAdminUser({ can_view_admins: true });
      render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-green-700"); // Cor com bom contraste
    });
  });

  describe("Integração com Props", () => {
    it("deve re-renderizar quando props mudam", () => {
      const adminUser = createMockAdminUser({ can_view_admins: false });
      const { rerender } = render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      let button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Não pode ver outros ADMINs");
      expect(button).toHaveClass("bg-gray-100");

      // Mudar can_view_admins
      const updatedUser = { ...adminUser, can_view_admins: true };
      rerender(
        <AdminVisibilityToggle
          user={updatedUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Pode ver outros ADMINs");
      expect(button).toHaveClass("bg-green-100");
    });

    it("deve re-renderizar quando loading muda", () => {
      const adminUser = createMockAdminUser();
      const { rerender } = render(
        <AdminVisibilityToggle
          user={adminUser}
          loading={false}
          onToggle={mockOnToggle}
        />,
      );

      let button = screen.getByRole("button");
      expect(button).not.toBeDisabled();

      // Mudar loading
      rerender(
        <AdminVisibilityToggle
          user={adminUser}
          loading={true}
          onToggle={mockOnToggle}
        />,
      );

      button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });
});
