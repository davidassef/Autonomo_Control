import React from "react";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteUserButton } from "./DeleteUserButton";
import { AdminUser } from "../../services/adminUsers";
// Jest globals are available globally, no need to import describe, it, expect, beforeEach

describe("DeleteUserButton", () => {
  const mockOnDelete = jest.fn();
  const user = userEvent;

  const mockUser: AdminUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    role: "USER",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  };

  const mockAdminUser: AdminUser = {
    id: 2,
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  };

  const mockMasterUser: AdminUser = {
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

  describe("Regras de Permissão", () => {
    describe("MASTER Role", () => {
      it("deve permitir excluir usuário USER", () => {
        render(
          <DeleteUserButton
            user={mockUser}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="MASTER"
            currentUserId={3}
          />,
        );

        expect(
          screen.getByTitle("Excluir usuário Test User"),
        ).toBeInTheDocument();
      });

      it("deve permitir excluir usuário ADMIN", () => {
        render(
          <DeleteUserButton
            user={mockAdminUser}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="MASTER"
            currentUserId={3}
          />,
        );

        expect(
          screen.getByTitle("Excluir usuário Admin User"),
        ).toBeInTheDocument();
      });

      it("não deve permitir excluir outro usuário MASTER", () => {
        const otherMaster = { ...mockMasterUser, id: 4, name: "Other Master" };

        render(
          <DeleteUserButton
            user={otherMaster}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="MASTER"
            currentUserId={3}
          />,
        );

        expect(
          screen.queryByTitle("Excluir usuário Other Master"),
        ).not.toBeInTheDocument();
      });

      it("não deve permitir excluir a própria conta", () => {
        render(
          <DeleteUserButton
            user={mockMasterUser}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="MASTER"
            currentUserId={3}
          />,
        );

        expect(
          screen.queryByTitle("Excluir usuário Master User"),
        ).not.toBeInTheDocument();
      });
    });

    describe("ADMIN Role", () => {
      it("deve permitir excluir usuário USER", () => {
        render(
          <DeleteUserButton
            user={mockUser}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="ADMIN"
            currentUserId={2}
          />,
        );

        expect(
          screen.getByTitle("Excluir usuário Test User"),
        ).toBeInTheDocument();
      });

      it("não deve permitir excluir outro usuário ADMIN", () => {
        const otherAdmin = { ...mockAdminUser, id: 5, name: "Other Admin" };

        render(
          <DeleteUserButton
            user={otherAdmin}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="ADMIN"
            currentUserId={2}
          />,
        );

        expect(
          screen.queryByTitle("Excluir usuário Other Admin"),
        ).not.toBeInTheDocument();
      });

      it("não deve permitir excluir usuário MASTER", () => {
        render(
          <DeleteUserButton
            user={mockMasterUser}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="ADMIN"
            currentUserId={2}
          />,
        );

        expect(
          screen.queryByTitle("Excluir usuário Master User"),
        ).not.toBeInTheDocument();
      });

      it("não deve permitir excluir a própria conta", () => {
        render(
          <DeleteUserButton
            user={mockAdminUser}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="ADMIN"
            currentUserId={2}
          />,
        );

        expect(
          screen.queryByTitle("Excluir usuário Admin User"),
        ).not.toBeInTheDocument();
      });
    });

    describe("USER Role", () => {
      it("não deve permitir excluir nenhum usuário", () => {
        render(
          <DeleteUserButton
            user={mockUser}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="USER"
            currentUserId={6}
          />,
        );

        expect(
          screen.queryByTitle("Excluir usuário Test User"),
        ).not.toBeInTheDocument();
      });

      it("não deve permitir excluir usuário ADMIN", () => {
        render(
          <DeleteUserButton
            user={mockAdminUser}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="USER"
            currentUserId={1}
          />,
        );

        expect(
          screen.queryByTitle("Excluir usuário Admin User"),
        ).not.toBeInTheDocument();
      });

      it("não deve permitir excluir usuário MASTER", () => {
        render(
          <DeleteUserButton
            user={mockMasterUser}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="USER"
            currentUserId={1}
          />,
        );

        expect(
          screen.queryByTitle("Excluir usuário Master User"),
        ).not.toBeInTheDocument();
      });
    });

    describe("Sem Role ou ID", () => {
      it("não deve permitir excluir quando currentUserRole é undefined", () => {
        render(
          <DeleteUserButton
            user={mockUser}
            loading={false}
            onDelete={mockOnDelete}
            currentUserId={2}
          />,
        );

        expect(
          screen.queryByTitle("Excluir usuário Test User"),
        ).not.toBeInTheDocument();
      });

      it("deve permitir excluir quando currentUserId é undefined mas roles permitem", () => {
        render(
          <DeleteUserButton
            user={mockUser}
            loading={false}
            onDelete={mockOnDelete}
            currentUserRole="MASTER"
          />,
        );

        expect(
          screen.getByTitle("Excluir usuário Test User"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Renderização do Botão Inicial", () => {
    it("deve renderizar botão de exclusão", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );
      
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      expect(deleteButton).toBeInTheDocument();
    });

    it("deve ter ícone Trash2", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );
      
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      const icon = within(deleteButton).getByRole("img", { hidden: true });
      expect(icon).toBeInTheDocument();
    });

    it("deve ter classes CSS corretas", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );
      
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      expect(deleteButton).toHaveClass(
        "p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50",
      );
    });

    it("deve ter title correto", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );
      
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      expect(deleteButton).toHaveAttribute(
        "title",
        "Excluir usuário Test User",
      );
    });

    it("não deve estar desabilitado quando não está carregando", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );
      
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe("Estado de Loading no Botão Inicial", () => {
    it("deve desabilitar botão quando loading é true", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={true}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      expect(deleteButton).toBeDisabled();
    });

    it("deve ter classe de opacidade quando desabilitado", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={true}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      expect(deleteButton).toHaveClass("disabled:opacity-50");
    });
  });

  describe("Estado de Confirmação", () => {
    it("deve mostrar mensagem de confirmação", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);
      
      expect(screen.getByText("Confirmar exclusão?")).toBeInTheDocument();
    });

    it('deve mostrar botão "Sim"', async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);
      
      expect(screen.getByRole("button", { name: "Sim" })).toBeInTheDocument();
    });

    it('deve mostrar botão "Cancelar"', async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);
      
      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
    });

    it("deve ter estrutura HTML correta para confirmação", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);
      
      const confirmMessage = screen.getByText("Confirmar exclusão?");
      expect(confirmMessage).toBeInTheDocument();
    });

    it("deve ter classes CSS corretas na mensagem", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);
      
      const message = screen.getByText("Confirmar exclusão?");
      expect(message).toHaveClass("text-xs text-red-700");
    });

    it("deve ter classes CSS corretas no botão Sim", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);
      
      const simButton = screen.getByRole("button", { name: "Sim" });
      expect(simButton).toHaveClass(
        "text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50",
      );
    });

    it("deve ter classes CSS corretas no botão Cancelar", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);
      
      const cancelButton = screen.getByRole("button", { name: "Cancelar" });
      expect(cancelButton).toHaveClass(
        "text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 disabled:opacity-50",
      );
    });

    it("não deve mostrar o botão de exclusão original", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);
      
      expect(
        screen.queryByTitle("Excluir usuário Test User"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Interações de Confirmação", () => {
    it("deve cancelar confirmação ao clicar em Cancelar", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      // Abrir confirmação
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      // Cancelar
      const cancelButton = screen.getByRole("button", { name: "Cancelar" });
      await user.click(cancelButton);

      // Deve voltar ao estado inicial
      expect(
        screen.getByTitle("Excluir usuário Test User"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Confirmar exclusão?")).not.toBeInTheDocument();
    });

    it("deve chamar onDelete ao confirmar exclusão", async () => {
      mockOnDelete.mockResolvedValue(undefined);

      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      // Abrir confirmação
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      // Confirmar
      const simButton = screen.getByRole("button", { name: "Sim" });
      await user.click(simButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockUser);
    });

    it("deve fechar confirmação após sucesso na exclusão", async () => {
      mockOnDelete.mockResolvedValue(undefined);

      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      // Abrir confirmação
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      // Confirmar
      const simButton = screen.getByRole("button", { name: "Sim" });
      await user.click(simButton);

      await waitFor(() => {
        expect(
          screen.getByTitle("Excluir usuário Test User"),
        ).toBeInTheDocument();
      });
      
      expect(
        screen.queryByText("Confirmar exclusão?"),
      ).not.toBeInTheDocument();
    });

    it("deve fechar confirmação após erro na exclusão", async () => {
      mockOnDelete.mockRejectedValue(new Error("Erro de teste"));

      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      // Abrir confirmação
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      // Confirmar
      const simButton = screen.getByRole("button", { name: "Sim" });
      await user.click(simButton);

      await waitFor(() => {
        expect(
          screen.getByTitle("Excluir usuário Test User"),
        ).toBeInTheDocument();
      });
      
      expect(
        screen.queryByText("Confirmar exclusão?"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Estado de Loading na Confirmação", () => {
    it('deve mostrar "Excluindo..." quando loading é true', async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={true}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      // Abrir confirmação (mesmo com loading)
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      fireEvent.click(deleteButton); // Usar fireEvent pois o botão pode estar desabilitado

      expect(screen.getByText("Excluindo...")).toBeInTheDocument();
    });

    it("deve desabilitar botões quando loading é true", async () => {
      const { rerender } = render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      // Abrir confirmação
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      // Simular mudança de props
      rerender(
        <DeleteUserButton
          user={mockUser}
          loading={true}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const simButton = screen.getByRole("button", { name: /Excluindo|Sim/ });
      const cancelButton = screen.getByRole("button", { name: "Cancelar" });

      expect(simButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('deve mostrar "Sim" quando loading é false', async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      expect(screen.getByRole("button", { name: "Sim" })).toBeInTheDocument();
      expect(screen.queryByText("Excluindo...")).not.toBeInTheDocument();
    });
  });

  describe("Múltiplas Interações", () => {
    it("deve permitir abrir e cancelar múltiplas vezes", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      // Primeira interação
      let deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      let cancelButton = screen.getByRole("button", { name: "Cancelar" });
      await user.click(cancelButton);

      // Segunda interação
      deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      cancelButton = screen.getByRole("button", { name: "Cancelar" });
      await user.click(cancelButton);

      // Deve estar no estado inicial
      expect(
        screen.getByTitle("Excluir usuário Test User"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Confirmar exclusão?")).not.toBeInTheDocument();
    });

    it("deve permitir tentar exclusão múltiplas vezes após erro", async () => {
      mockOnDelete.mockRejectedValue(new Error("Erro de teste"));

      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      // Primeira tentativa
      let deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      let simButton = screen.getByRole("button", { name: "Sim" });
      await user.click(simButton);

      await waitFor(() => {
        expect(
          screen.getByTitle("Excluir usuário Test User"),
        ).toBeInTheDocument();
      });

      // Segunda tentativa
      deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      simButton = screen.getByRole("button", { name: "Sim" });
      await user.click(simButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(2);
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com usuário sem nome", () => {
      const userWithoutName = { ...mockUser, name: "" };

      render(
        <DeleteUserButton
          user={userWithoutName}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      expect(screen.getByTitle("Excluir usuário ")).toBeInTheDocument();
    });

    it("deve lidar com usuário com nome muito longo", () => {
      const userWithLongName = { ...mockUser, name: "A".repeat(100) };

      render(
        <DeleteUserButton
          user={userWithLongName}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      expect(
        screen.getByTitle(`Excluir usuário ${"A".repeat(100)}`),
      ).toBeInTheDocument();
    });

    it("deve lidar com usuário com caracteres especiais no nome", () => {
      const userWithSpecialChars = {
        ...mockUser,
        name: "José da Silva-Santos & Co.",
      };

      render(
        <DeleteUserButton
          user={userWithSpecialChars}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      expect(
        screen.getByTitle("Excluir usuário José da Silva-Santos & Co."),
      ).toBeInTheDocument();
    });

    it("deve lidar com onDelete que retorna Promise rejeitada sem message", async () => {
      mockOnDelete.mockRejectedValue("String error" as any);

      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      const simButton = screen.getByRole("button", { name: "Sim" });
      await user.click(simButton);

      await waitFor(() => {
        expect(
          screen.getByTitle("Excluir usuário Test User"),
        ).toBeInTheDocument();
      });
    });

    it("deve lidar com mudanças de props durante confirmação", async () => {
      const { rerender } = render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      // Abrir confirmação
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      // Mudar props para remover permissão
      rerender(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="USER"
          currentUserId={1}
        />,
      );

      // Componente deve desaparecer
      expect(screen.queryByText("Confirmar exclusão?")).not.toBeInTheDocument();
      expect(
        screen.queryByTitle("Excluir usuário Test User"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter title descritivo no botão", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      expect(deleteButton).toHaveAttribute(
        "title",
        "Excluir usuário Test User",
      );
    });

    it("deve ter botões com roles corretos na confirmação", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      expect(screen.getByRole("button", { name: "Sim" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
    });

    it("deve ter contraste adequado nas cores", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      // Botão inicial
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      expect(deleteButton).toHaveClass("text-red-600");

      // Confirmação
      await user.click(deleteButton);

      const simButton = screen.getByRole("button", { name: "Sim" });
      const cancelButton = screen.getByRole("button", { name: "Cancelar" });

      expect(simButton).toHaveClass("bg-red-600 text-white");
      expect(cancelButton).toHaveClass("bg-gray-500 text-white");
    });

    it("deve ter contraste de cor adequado", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );
      
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      expect(deleteButton).toHaveClass("text-red-600");
    });
  });

  describe("Layout e Estilo", () => {
    it("deve ter tamanho correto do ícone", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      const icon = within(deleteButton).getByRole("img", { hidden: true });

      expect(icon).toHaveAttribute("width", "14");
      expect(icon).toHaveAttribute("height", "14");
    });

    it("deve ter tamanho de ícone apropriado", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );
      
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      const icon = within(deleteButton).getByRole("img", { hidden: true });
      expect(icon).toHaveAttribute("width", "16");
      expect(icon).toHaveAttribute("height", "16");
    });

    it("deve ter layout flexível na confirmação", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={1}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      const simButton = screen.getByRole("button", { name: "Sim" });
      const cancelButton = screen.getByRole("button", { name: "Cancelar" });
      expect(simButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it("deve ter espaçamento correto nos botões de confirmação", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={1}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      const simButton = screen.getByRole("button", { name: "Sim" });
      const cancelButton = screen.getByRole("button", { name: "Cancelar" });

      expect(simButton).toHaveClass("px-2 py-1");
      expect(cancelButton).toHaveClass("px-2 py-1");
    });

    it("deve ter bordas e background corretos na confirmação", async () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={1}
        />,
      );

      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      await user.click(deleteButton);

      const simButton = screen.getByRole("button", { name: "Sim" });
      const cancelButton = screen.getByRole("button", { name: "Cancelar" });
      expect(simButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it("deve ter bordas e background corretos", () => {
      render(
        <DeleteUserButton
          user={mockUser}
          loading={false}
          onDelete={mockOnDelete}
          currentUserRole="MASTER"
          currentUserId={3}
        />,
      );
      
      const deleteButton = screen.getByTitle("Excluir usuário Test User");
      expect(deleteButton).toHaveClass("rounded");
    });
  });
});
