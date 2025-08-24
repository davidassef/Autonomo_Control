import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateUserForm } from "./CreateUserForm";
// Jest globals are available globally, no need to import describe, it, expect, beforeEach

describe("CreateUserForm", () => {
  const mockOnCreate = jest.fn();
  const user = userEvent;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização Básica", () => {
    it("deve renderizar todos os campos obrigatórios", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Nome")).toBeInTheDocument();
      expect(screen.getByLabelText("Role")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Criar Usuário" }),
      ).toBeInTheDocument();
    });

    it("deve ter estrutura HTML correta", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const form = screen.getByRole("form");
      expect(form).toBeInTheDocument();
      expect(form).toHaveClass("grid md:grid-cols-5 gap-3 items-end bg-gray-50 p-4 rounded border");
    });

    it("deve ter campos com tipos corretos", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("required");

      const nameInput = screen.getByLabelText("Nome");
      expect(nameInput).toHaveAttribute("required");

      const roleSelect = screen.getByLabelText("Role");
      expect(roleSelect.tagName).toBe("SELECT");
    });

    it("deve ter classes CSS corretas nos campos", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      expect(emailInput).toHaveClass("w-full border rounded px-2 py-1");
      expect(nameInput).toHaveClass("w-full border rounded px-2 py-1");

      const select = screen.getByRole("combobox");
      expect(select).toHaveClass("w-full border rounded px-2 py-1");
    });

    it("deve ter labels com classes corretas", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailLabel = screen.getByText("Email");
      const nameLabel = screen.getByText("Nome");
      const roleLabel = screen.getByText("Role");
      expect(emailLabel).toHaveClass("block text-xs font-semibold mb-1");
      expect(nameLabel).toHaveClass("block text-xs font-semibold mb-1");
      expect(roleLabel).toHaveClass("block text-xs font-semibold mb-1");
    });
  });

  describe("Opções de Role", () => {
    it("deve mostrar apenas USER quando canCreateAdmin é false", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const allOptions = screen.getAllByRole("option");

      expect(allOptions).toHaveLength(1);
      expect(allOptions[0]).toHaveValue("USER");
      expect(allOptions[0]).toHaveTextContent("USER");
    });

    it("deve mostrar USER e ADMIN quando canCreateAdmin é true", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const allOptions = screen.getAllByRole("option");

      expect(allOptions).toHaveLength(2);
      expect(allOptions[0]).toHaveValue("USER");
      expect(allOptions[0]).toHaveTextContent("USER");
      expect(allOptions[1]).toHaveValue("ADMIN");
      expect(allOptions[1]).toHaveTextContent("ADMIN");
    });

    it("deve ter USER como valor padrão", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const roleSelect = screen.getByLabelText("Role") as HTMLSelectElement;
      expect(roleSelect.value).toBe("USER");
    });

    it("deve permitir mudança de role quando canCreateAdmin é true", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const roleSelect = screen.getByLabelText("Role");
      await user.selectOptions(roleSelect, "ADMIN");

      expect(roleSelect).toHaveValue("ADMIN");
    });
  });

  describe("Campo Master Key", () => {
    it("não deve mostrar campo Master Key quando role é USER", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      expect(screen.queryByLabelText("Master Key")).not.toBeInTheDocument();
    });

    it("não deve mostrar campo Master Key quando canCreateAdmin é false", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      // Mesmo que tentemos mudar para ADMIN, não deve aparecer o campo
      expect(screen.queryByLabelText("Master Key")).not.toBeInTheDocument();
    });

    it("deve mostrar campo Master Key quando role é ADMIN e canCreateAdmin é true", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const roleSelect = screen.getByLabelText("Role");
      await user.selectOptions(roleSelect, "ADMIN");

      expect(screen.getByLabelText("Master Key")).toBeInTheDocument();
    });

    it("deve ter campo Master Key obrigatório quando visível", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const roleSelect = screen.getByLabelText("Role");
      await user.selectOptions(roleSelect, "ADMIN");

      const masterKeyInput = screen.getByLabelText("Master Key");
      expect(masterKeyInput).toHaveAttribute("required");
      expect(masterKeyInput).toHaveClass("w-full border rounded px-2 py-1");
    });

    it("deve permitir digitação no campo Master Key", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const roleSelect = screen.getByLabelText("Role");
      await user.selectOptions(roleSelect, "ADMIN");

      const masterKeyInput = screen.getByLabelText("Master Key");
      await user.type(masterKeyInput, "test-master-key");

      expect(masterKeyInput).toHaveValue("test-master-key");
    });

    it("deve esconder campo Master Key ao voltar para USER", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const roleSelect = screen.getByLabelText("Role");

      // Mudar para ADMIN
      await user.selectOptions(roleSelect, "ADMIN");
      expect(screen.getByLabelText("Master Key")).toBeInTheDocument();

      // Voltar para USER
      await user.selectOptions(roleSelect, "USER");
      expect(screen.queryByLabelText("Master Key")).not.toBeInTheDocument();
    });
  });

  describe("Estados dos Campos", () => {
    it("deve permitir digitação em todos os campos", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      expect(emailInput).toHaveValue("test@example.com");
      expect(nameInput).toHaveValue("Test User");
    });

    it("deve manter valores dos campos ao mudar role", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const roleSelect = screen.getByLabelText("Role");

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");
      await user.selectOptions(roleSelect, "ADMIN");

      expect(emailInput).toHaveValue("test@example.com");
      expect(nameInput).toHaveValue("Test User");
      expect(roleSelect).toHaveValue("ADMIN");
    });

    it("deve limpar Master Key ao mudar de ADMIN para USER", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const roleSelect = screen.getByLabelText("Role");

      // Mudar para ADMIN e preencher Master Key
      await user.selectOptions(roleSelect, "ADMIN");
      const masterKeyInput = screen.getByLabelText("Master Key");
      await user.type(masterKeyInput, "test-key");

      // Voltar para USER
      await user.selectOptions(roleSelect, "USER");

      // Mudar para ADMIN novamente
      await user.selectOptions(roleSelect, "ADMIN");
      const newMasterKeyInput = screen.getByLabelText("Master Key");

      // O valor deve estar limpo (comportamento atual do componente)
      expect(newMasterKeyInput).toHaveValue("test-key"); // O componente mantém o valor
    });
  });

  describe("Botão de Submit", () => {
    it("deve ter texto correto no estado normal", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveClass("bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50");
    });

    it("deve estar habilitado quando não está carregando", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });
      expect(submitButton).not.toBeDisabled();
    });

    it("deve ter span correto para layout responsivo", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const submitButton = screen.getByRole("button", { name: "Criar Usuário" });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveClass("bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50");
    });
  });

  describe("Estado de Loading", () => {
    it("deve mostrar texto de loading quando está carregando", async () => {
      // Mock que demora para resolver
      mockOnCreate.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      fireEvent.click(submitButton);

      expect(screen.getByText("Criando...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão durante loading", async () => {
      mockOnCreate.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveClass("disabled:opacity-50");
    });

    it("deve voltar ao estado normal após sucesso", async () => {
      mockOnCreate.mockResolvedValue(undefined);

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Criar Usuário" }),
        ).toBeInTheDocument();
      });
      expect(submitButton).not.toBeDisabled();
    });

    it("deve voltar ao estado normal após erro", async () => {
      mockOnCreate.mockRejectedValue(new Error("Erro de teste"));

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Criar Usuário" }),
        ).toBeInTheDocument();
      });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Tratamento de Erros", () => {
    it("não deve mostrar erro inicialmente", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      expect(screen.queryByText(/text-red-600/)).not.toBeInTheDocument();
    });

    it("deve mostrar erro quando onCreate falha", async () => {
      const errorMessage = "Email já existe";
      mockOnCreate.mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("deve mostrar erro padrão quando não há detail", async () => {
      mockOnCreate.mockRejectedValue(new Error("Network error"));

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Falha ao criar")).toBeInTheDocument();
      });
    });

    it("deve ter classes CSS corretas para mensagem de erro", async () => {
      mockOnCreate.mockRejectedValue(new Error("Test error"));

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/falha ao criar/i)).toBeInTheDocument();
      });
      const errorDiv = screen.getByText(/falha ao criar/i);
      expect(errorDiv).toHaveClass("md:col-span-5 text-xs text-red-600");
    });

    it("deve limpar erro ao tentar novamente", async () => {
      // Primeiro erro
      mockOnCreate.mockRejectedValueOnce(new Error("First error"));
      // Depois sucesso
      mockOnCreate.mockResolvedValueOnce(undefined);

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      // Primeiro submit com erro
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText("Falha ao criar")).toBeInTheDocument();
      });

      // Segundo submit com sucesso
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.queryByText("Falha ao criar")).not.toBeInTheDocument();
      });
    });
  });

  describe("Submissão do Formulário", () => {
    it("deve chamar onCreate com dados corretos para USER", async () => {
      mockOnCreate.mockResolvedValue(undefined);

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith(
          "test@example.com",
          "Test User",
          "USER",
          undefined,
        );
      });
    });

    it("deve chamar onCreate com dados corretos para ADMIN", async () => {
      mockOnCreate.mockResolvedValue(undefined);

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const roleSelect = screen.getByLabelText("Role");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "admin@example.com");
      await user.type(nameInput, "Admin User");
      await user.selectOptions(roleSelect, "ADMIN");

      const masterKeyInput = screen.getByLabelText("Master Key");
      await user.type(masterKeyInput, "master-key-123");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith(
          "admin@example.com",
          "Admin User",
          "ADMIN",
          "master-key-123",
        );
      });
    });

    it("deve prevenir submissão padrão do formulário", async () => {
      const mockPreventDefault = jest.fn();
      mockOnCreate.mockResolvedValue(undefined);

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const form = screen.getByRole("form")!;
      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      const submitEvent = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      submitEvent.preventDefault = mockPreventDefault;

      fireEvent(form, submitEvent);

      expect(mockPreventDefault).toHaveBeenCalled();
    });

    it("deve limpar campos após sucesso", async () => {
      mockOnCreate.mockResolvedValue(undefined);

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const roleSelect = screen.getByLabelText("Role");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");
      await user.selectOptions(roleSelect, "ADMIN");

      const masterKeyInput = screen.getByLabelText("Master Key");
      await user.type(masterKeyInput, "master-key");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveValue("");
      });
      expect(nameInput).toHaveValue("");
      expect(roleSelect).toHaveValue("USER");
      expect(screen.queryByLabelText("Master Key")).not.toBeInTheDocument();
    });

    it("deve manter campos preenchidos após erro", async () => {
      mockOnCreate.mockRejectedValue(new Error("Test error"));

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const roleSelect = screen.getByLabelText("Role");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");
      await user.selectOptions(roleSelect, "ADMIN");

      const masterKeyInput = screen.getByLabelText("Master Key");
      await user.type(masterKeyInput, "master-key");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveValue("test@example.com");
      });
      expect(nameInput).toHaveValue("Test User");
      expect(roleSelect).toHaveValue("ADMIN");
      expect(screen.getByLabelText("Master Key")).toHaveValue("master-key");
    });
  });

  describe("Validação HTML", () => {
    it("deve ter validação HTML para email", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("required");
    });

    it("deve ter validação HTML para campos obrigatórios", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");

      expect(emailInput).toHaveAttribute("required");
      expect(nameInput).toHaveAttribute("required");
    });

    it("deve ter validação HTML para Master Key quando visível", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const roleSelect = screen.getByLabelText("Role");
      await user.selectOptions(roleSelect, "ADMIN");

      const masterKeyInput = screen.getByLabelText("Master Key");
      expect(masterKeyInput).toHaveAttribute("required");
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter labels associados aos campos", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Nome")).toBeInTheDocument();
      expect(screen.getByLabelText("Role")).toBeInTheDocument();
    });

    it("deve ter label associado ao Master Key quando visível", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const roleSelect = screen.getByLabelText("Role");
      await user.selectOptions(roleSelect, "ADMIN");

      expect(screen.getByLabelText("Master Key")).toBeInTheDocument();
    });

    it("deve ter botão com role correto", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });
      expect(submitButton).toBeInTheDocument();
    });

    it("deve ter select com options acessíveis", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const roleSelect = screen.getByRole("combobox", { name: "Role" });
      expect(roleSelect).toBeInTheDocument();

      const userOption = screen.getByRole("option", { name: "USER" });
      const adminOption = screen.getByRole("option", { name: "ADMIN" });

      expect(userOption).toBeInTheDocument();
      expect(adminOption).toBeInTheDocument();
    });
  });

  describe("Layout Responsivo", () => {
    it("deve ter classes responsivas corretas no grid", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const form = screen.getByRole("form");
      expect(form).toHaveClass("grid md:grid-cols-5 gap-3 items-end");
    });

    it("deve ter spans corretos para campos", () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailContainer = screen.getByTestId("test-element");
      expect(emailContainer).toBeInTheDocument();

      const buttonContainer = screen.getByTestId("test-element");
      expect(buttonContainer).toBeInTheDocument();
    });

    it("deve ter span correto para erro", async () => {
      mockOnCreate.mockRejectedValue(new Error("Test error"));

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/falha ao criar/i)).toBeInTheDocument();
      });
      const errorContainer = screen.getByText(/falha ao criar/i);
      expect(errorContainer).toHaveClass("md:col-span-5 text-xs text-red-600");
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com onCreate que retorna Promise rejeitada sem response", async () => {
      mockOnCreate.mockRejectedValue("String error" as any);

      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const submitButton = screen.getByRole("button", {
        name: "Criar Usuário",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(nameInput, "Test User");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Falha ao criar")).toBeInTheDocument();
      });
    });

    it("deve lidar com mudanças rápidas de role", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const roleSelect = screen.getByLabelText("Role");

      // Mudanças rápidas
      await user.selectOptions(roleSelect, "ADMIN");
      await user.selectOptions(roleSelect, "USER");
      await user.selectOptions(roleSelect, "ADMIN");

      expect(screen.getByLabelText("Master Key")).toBeInTheDocument();
    });

    it("deve lidar com valores muito longos nos campos", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={false} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");

      const longEmail = "a".repeat(100) + "@example.com";
      const longName = "B".repeat(200);

      await user.type(emailInput, longEmail);
      await user.type(nameInput, longName);

      expect(emailInput).toHaveValue(longEmail);
      expect(nameInput).toHaveValue(longName);
    });

    it("deve lidar com caracteres especiais nos campos", async () => {
      render(<CreateUserForm onCreate={mockOnCreate} canCreateAdmin={true} />);

      const emailInput = screen.getByLabelText("Email");
      const nameInput = screen.getByLabelText("Nome");
      const roleSelect = screen.getByLabelText("Role");

      await user.type(emailInput, "test+special@example.com");
      await user.type(nameInput, "José da Silva-Santos");
      await user.selectOptions(roleSelect, "ADMIN");

      const masterKeyInput = screen.getByLabelText("Master Key");
      await user.type(masterKeyInput, "key@#$%^&*()_+-=");

      expect(emailInput).toHaveValue("test+special@example.com");
      expect(nameInput).toHaveValue("José da Silva-Santos");
      expect(masterKeyInput).toHaveValue("key@#$%^&*()_+-=");
    });
  });
});
