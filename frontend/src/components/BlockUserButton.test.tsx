import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BlockUserButton } from "./BlockUserButton";
import { AdminUser } from "../services/adminUsers";

// Mock dos ícones do lucide-react
jest.mock("lucide-react", () => ({
  Ban: ({ className }: { className?: string }) => (
    <div data-testid="ban-icon" className={className} />
  ),
  Shield: ({ className }: { className?: string }) => (
    <div data-testid="shield-icon" className={className} />
  ),
}));

describe("BlockUserButton", () => {
  const mockOnBlock = jest.fn();
  const mockOnUnblock = jest.fn();

  const createMockUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
    id: 1,
    email: "test@example.com",
    name: "Test User",
    role: "USER",
    is_active: true,
    blocked_at: undefined,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização", () => {
    it("deve renderizar botão de bloquear para usuário não bloqueado", () => {
      const user = createMockUser();
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("Bloquear")).toBeInTheDocument();
      expect(screen.getByTestId("ban-icon")).toBeInTheDocument();
      expect(screen.getByTitle("Bloquear usuário")).toBeInTheDocument();
    });

    it("deve renderizar botão de desbloquear para usuário bloqueado", () => {
      const user = createMockUser({ blocked_at: "2024-01-01T00:00:00Z" });
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("Desbloquear")).toBeInTheDocument();
      expect(screen.getByTestId("shield-icon")).toBeInTheDocument();
      expect(screen.getByTitle("Desbloquear usuário")).toBeInTheDocument();
    });

    it("não deve renderizar nada para usuário MASTER", () => {
      const user = createMockUser({ role: "MASTER" });
      const { container } = render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("deve aplicar classes CSS corretas para usuário não bloqueado", () => {
      const user = createMockUser();
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-red-100 text-red-700 border-red-300");
    });

    it("deve aplicar classes CSS corretas para usuário bloqueado", () => {
      const user = createMockUser({ blocked_at: "2024-01-01T00:00:00Z" });
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "bg-green-100 text-green-700 border-green-300",
      );
    });
  });

  describe("Estados de Loading", () => {
    it("deve desabilitar botão quando loading é true", () => {
      const user = createMockUser();
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
          loading={true}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        "disabled:opacity-50 disabled:cursor-not-allowed",
      );
    });

    it("deve habilitar botão quando loading é false", () => {
      const user = createMockUser();
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
          loading={false}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("deve habilitar botão quando loading não é fornecido", () => {
      const user = createMockUser();
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });
  });

  describe("Interações", () => {
    it("deve chamar onBlock quando clicado em usuário não bloqueado", async () => {
      const user = createMockUser();
      mockOnBlock.mockResolvedValue(undefined);

      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnBlock).toHaveBeenCalledWith(user);
        expect(mockOnBlock).toHaveBeenCalledTimes(1);
        expect(mockOnUnblock).not.toHaveBeenCalled();
      });
    });

    it("deve chamar onUnblock quando clicado em usuário bloqueado", async () => {
      const user = createMockUser({ blocked_at: "2024-01-01T00:00:00Z" });
      mockOnUnblock.mockResolvedValue(undefined);

      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnUnblock).toHaveBeenCalledWith(user);
        expect(mockOnUnblock).toHaveBeenCalledTimes(1);
        expect(mockOnBlock).not.toHaveBeenCalled();
      });
    });

    it("não deve chamar callbacks quando botão está desabilitado", () => {
      const user = createMockUser();
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
          loading={true}
        />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnBlock).not.toHaveBeenCalled();
      expect(mockOnUnblock).not.toHaveBeenCalled();
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve tratar erro ao bloquear usuário", async () => {
      const user = createMockUser();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Erro ao bloquear");
      mockOnBlock.mockRejectedValue(error);

      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Erro ao alterar status de bloqueio:",
          error,
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("deve tratar erro ao desbloquear usuário", async () => {
      const user = createMockUser({ blocked_at: "2024-01-01T00:00:00Z" });
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Erro ao desbloquear");
      mockOnUnblock.mockRejectedValue(error);

      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Erro ao alterar status de bloqueio:",
          error,
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Diferentes Roles", () => {
    it("deve renderizar para usuário com role USER", () => {
      const user = createMockUser({ role: "USER" });
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("deve renderizar para usuário com role ADMIN", () => {
      const user = createMockUser({ role: "ADMIN" });
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("não deve renderizar para usuário com role MASTER", () => {
      const user = createMockUser({ role: "MASTER" });
      const { container } = render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Casos de Borda", () => {
    it("deve tratar blocked_at como string vazia", () => {
      const user = createMockUser({ blocked_at: "" });
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      expect(screen.getByText("Bloquear")).toBeInTheDocument();
      expect(screen.getByTestId("ban-icon")).toBeInTheDocument();
    });

    it("deve tratar blocked_at como undefined", () => {
      const user = createMockUser({ blocked_at: undefined });
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      expect(screen.getByText("Bloquear")).toBeInTheDocument();
      expect(screen.getByTestId("ban-icon")).toBeInTheDocument();
    });

    it("deve funcionar com múltiplos cliques rápidos", async () => {
      const user = createMockUser();
      mockOnBlock.mockResolvedValue(undefined);

      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnBlock).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter atributos de acessibilidade corretos", () => {
      const user = createMockUser();
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Bloquear usuário");
    });

    it("deve ter título correto para usuário bloqueado", () => {
      const user = createMockUser({ blocked_at: "2024-01-01T00:00:00Z" });
      render(
        <BlockUserButton
          user={user}
          onBlock={mockOnBlock}
          onUnblock={mockOnUnblock}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Desbloquear usuário");
    });
  });
});
