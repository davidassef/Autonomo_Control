import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromoteDemoteButton } from "./PromoteDemoteButton";
import { AdminUser } from "../../services/adminUsers";
// Jest globals are available globally, no need to import describe, it, expect, beforeEach

describe("PromoteDemoteButton", () => {
  const mockOnPromote = jest.fn();
const mockOnDemote = jest.fn();
  const user = userEvent;

  const mockUserRole: AdminUser = {
    id: 1,
    name: "Test User",
    email: "user@example.com",
    role: "USER",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  };

  const mockAdminRole: AdminUser = {
    id: 2,
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  };

  const mockMasterRole: AdminUser = {
    id: 3,
    name: "Master User",
    email: "master@example.com",
    role: "MASTER",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização Condicional por Role", () => {
    it('deve renderizar botão "Promover" para usuário USER', () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
       
       
      const promoteButton = screen.getByRole("button", { name: "Promover" });
      expect(promoteButton).toBeInTheDocument();
      expect(promoteButton).toHaveTextContent("Promover");
    });

    it('deve renderizar botão "Rebaixar" para usuário ADMIN', () => {
      render(
        <PromoteDemoteButton
          user={mockAdminRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
       
      const demoteButton = screen.getByRole("button", { name: "Rebaixar" });
      expect(demoteButton).toBeInTheDocument();
      expect(demoteButton).toHaveTextContent("Rebaixar");
    });

    it("não deve renderizar nenhum botão para usuário MASTER", () => {
      render(
        <PromoteDemoteButton
          user={mockMasterRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("deve renderizar null para usuário MASTER", () => {
      render(
        <PromoteDemoteButton
          user={mockMasterRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Estilos CSS", () => {
    it("deve ter classes CSS corretas no botão Promover", () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      const promoteButton = screen.getByRole("button", { name: "Promover" });
      expect(promoteButton).toHaveClass("text-xs border px-2 py-1 rounded");
    });

    it("deve ter classes CSS corretas no botão Rebaixar", () => {
      render(
        <PromoteDemoteButton
          user={mockAdminRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      const demoteButton = screen.getByRole("button", { name: "Rebaixar" });
      expect(demoteButton).toHaveClass("text-xs border px-2 py-1 rounded");
    });

    it("deve ter tamanho de texto pequeno (text-xs)", () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-xs");
    });

    it("deve ter borda e padding adequados", () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("border px-2 py-1 rounded");
    });
  });

  describe("Estados de Loading", () => {
    it("deve desabilitar botão Promover quando loading é true", () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={true}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
      const promoteButtonAfterLoading = screen.getByRole("button", { name: "Promover" });
      expect(promoteButtonAfterLoading).toBeDisabled();
    });

    it("deve desabilitar botão Rebaixar quando loading é true", () => {
      render(
        <PromoteDemoteButton
          user={mockAdminRole}
          loading={true}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
      const demoteButton = screen.getByRole("button", { name: "Rebaixar" });
      expect(demoteButton).toBeDisabled();
    });

    it("deve habilitar botão Promover quando loading é false", () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
      const promoteButton = screen.getByRole("button", { name: "Promover" });
      expect(promoteButton).toBeEnabled();
    });

    it("deve habilitar botão Rebaixar quando loading é false", () => {
      render(
        <PromoteDemoteButton
          user={mockAdminRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      const demoteButton = screen.getByRole("button", { name: "Rebaixar" });
      expect(demoteButton).toBeEnabled();
    });
  });

  describe("Interações do Usuário", () => {
    it("deve chamar onPromote com usuário correto ao clicar em Promover", async () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
       
      await user.click(screen.getByRole("button", { name: "Promover" }));

      expect(mockOnPromote).toHaveBeenCalledTimes(1);
      expect(mockOnPromote).toHaveBeenCalledWith(mockUserRole);
    });

    it("deve chamar onDemote com usuário correto ao clicar em Rebaixar", async () => {
      render(
        <PromoteDemoteButton
          user={mockAdminRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
      await user.click(screen.getByRole("button", { name: "Rebaixar" }));

      expect(mockOnDemote).toHaveBeenCalledTimes(1);
      expect(mockOnDemote).toHaveBeenCalledWith(mockAdminRole);
    });

    it("não deve chamar onDemote ao clicar em Promover", async () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
      await user.click(screen.getByRole("button", { name: "Promover" }));

      expect(mockOnDemote).not.toHaveBeenCalled();
    });

    it("não deve chamar onPromote ao clicar em Rebaixar", async () => {
      render(
        <PromoteDemoteButton
          user={mockAdminRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
      await user.click(screen.getByRole("button", { name: "Rebaixar" }));

      expect(mockOnPromote).not.toHaveBeenCalled();
    });

    it("não deve chamar funções quando botão está desabilitado", async () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={true}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
      await user.click(screen.getByRole("button", { name: "Promover" }));

      expect(mockOnPromote).not.toHaveBeenCalled();
    });
  });

  describe("Múltiplas Interações", () => {
    it("deve permitir múltiplos cliques em Promover", async () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
      const promoteButtonQuery = () => screen.getByRole("button", { name: "Promover" });

      await user.click(promoteButtonQuery());
      await user.click(promoteButtonQuery());
      await user.click(promoteButtonQuery());

      expect(mockOnPromote).toHaveBeenCalledTimes(3);
      expect(mockOnPromote).toHaveBeenCalledWith(mockUserRole);
    });

    it("deve permitir múltiplos cliques em Rebaixar", async () => {
      render(
        <PromoteDemoteButton
          user={mockAdminRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
      const demoteButtonQuery = () => screen.getByRole("button", { name: "Rebaixar" });

      await user.click(demoteButtonQuery());
      await user.click(demoteButtonQuery());

      expect(mockOnDemote).toHaveBeenCalledTimes(2);
      expect(mockOnDemote).toHaveBeenCalledWith(mockAdminRole);
    });
  });

  describe("Mudanças de Props", () => {
    it("deve atualizar botão quando role do usuário muda", () => {
      const { rerender } = render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      expect(
         
        screen.getByRole("button", { name: "Promover" }),
      ).toBeInTheDocument();

      // Mudar para ADMIN
      rerender(
        <PromoteDemoteButton
          user={mockAdminRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      expect(
         
        screen.queryByRole("button", { name: "Promover" }),
      ).not.toBeInTheDocument();
      expect(
         
        screen.getByRole("button", { name: "Rebaixar" }),
      ).toBeInTheDocument();
    });

    it("deve remover botão quando role muda para MASTER", () => {
      const { rerender } = render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      expect(
         
        screen.getByRole("button", { name: "Promover" }),
      ).toBeInTheDocument();

      // Mudar para MASTER
      rerender(
        <PromoteDemoteButton
          user={mockMasterRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("deve atualizar estado de loading dinamicamente", () => {
      const { rerender } = render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      const promoteButton = screen.getByRole("button", { name: "Promover" });
      expect(promoteButton).toBeEnabled();

      // Ativar loading
      rerender(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={true}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
      const promoteButtonWithLoading = screen.getByRole("button", { name: "Promover" });
      expect(promoteButtonWithLoading).toBeDisabled();

      // Desativar loading
      rerender(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      const demoteButton = screen.getByRole("button", { name: "Rebaixar" });
      expect(demoteButton).toBeEnabled();
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com usuário sem role definido", () => {
      const userWithoutRole = { ...mockUserRole, role: undefined as any };

      render(
        <PromoteDemoteButton
          user={userWithoutRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("deve lidar com role inválido", () => {
      const userWithInvalidRole = {
        ...mockUserRole,
        role: "INVALID_ROLE" as any,
      };

      render(
        <PromoteDemoteButton
          user={userWithInvalidRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("deve lidar com usuário null/undefined", () => {
      render(
        <PromoteDemoteButton
          user={null as any}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("deve lidar com funções callback undefined", async () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={undefined as any}
          onDemote={mockOnDemote}
        />,
      );

      // Não deve gerar erro ao clicar
       
      await expect(user.click(screen.getByRole("button", { name: "Promover" }))).resolves.not.toThrow();
    });

    it("deve lidar com loading undefined", () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={undefined as any}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      const promoteButton = screen.getByRole("button", { name: "Promover" });
      expect(promoteButton).toBeEnabled();
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter botão com role correto", () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("deve ter texto descritivo no botão", () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

       
      expect(screen.getByRole("button", { name: "Promover" })).toHaveAccessibleName("Promover");
    });

    it("deve indicar estado desabilitado corretamente", () => {
      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={true}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      const demoteButton = screen.getByRole("button", { name: "Rebaixar" });
      expect(demoteButton).toBeDisabled();
    });
  });

  describe("Integração com Diferentes Usuários", () => {
    it("deve funcionar com usuário com dados mínimos", () => {
      const minimalUser: AdminUser = {
        id: 1,
        name: "",
        email: "",
        role: "USER",
        is_active: true,
        created_at: "",
      };

      render(
        <PromoteDemoteButton
          user={minimalUser}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      const promoteButton = screen.getByRole("button", { name: "Promover" });
      expect(promoteButton).toBeInTheDocument();
    });

    it("deve funcionar com usuário com dados completos", async () => {
      const completeUser: AdminUser = {
        id: 2,
        name: "Complete User Name",
        email: "complete@example.com",
        role: "USER",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        blocked_at: undefined,
      };

      render(
        <PromoteDemoteButton
          user={completeUser}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Promover" }));

      expect(mockOnPromote).toHaveBeenCalledWith(completeUser);
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente com props válidas", () => {
      const startTime = performance.now();

      render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Deve renderizar em menos de 10ms
      expect(renderTime).toBeLessThan(10);
    });

    it("deve lidar com re-renders frequentes", () => {
      const { rerender } = render(
        <PromoteDemoteButton
          user={mockUserRole}
          loading={false}
          onPromote={mockOnPromote}
          onDemote={mockOnDemote}
        />,
      );

      // Simular múltiplos re-renders
      for (let i = 0; i < 10; i++) {
        rerender(
          <PromoteDemoteButton
            user={mockUserRole}
            loading={i % 2 === 0}
            onPromote={mockOnPromote}
            onDemote={mockOnDemote}
          />,
        );
      }

      expect(
         
        screen.getByRole("button", { name: "Promover" }),
      ).toBeInTheDocument();
    });
  });
});
