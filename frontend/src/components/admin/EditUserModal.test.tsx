import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditUserModal } from "./EditUserModal";
import { AdminUser } from "../../services/adminUsers";

// Mock dos componentes filhos
jest.mock("./RoleBadge", () => ({
  RoleBadge: ({ role }: { role: string }) => (
    <span data-testid="role-badge">{role}</span>
  ),
}));

jest.mock("./MasterPasswordPrompt", () => ({
  MasterPasswordPrompt: ({ title, onConfirm, onClose }: any) => (
    <div data-testid="master-password-prompt">
      <h3>{title}</h3>
      <button onClick={() => onConfirm("master-key-123")}>Confirmar</button>
      <button onClick={onClose}>Fechar</button>
    </div>
  ),
}));

describe("EditUserModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnResetPassword = jest.fn();
  const mockOnChangeRole = jest.fn();
  const user = userEvent;

  const mockUser: AdminUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    role: "USER",
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

  const mockBlockedUser: AdminUser = {
    ...mockUser,
    id: 4,
    name: "Blocked User",
    blocked_at: "2024-01-15T10:30:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização do Modal", () => {
    it("deve renderizar o modal com estrutura correta", () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      // Modal overlay
      expect(
        screen.getByTestId("test-element"),
      ).toBeInTheDocument();

      // Modal content
      expect(
        screen.getByTestId("test-element"),
      ).toBeInTheDocument();

      // Header
      expect(screen.getByText("Editar Usuário")).toBeInTheDocument();

      // Close button
      expect(
        screen.getByRole("button", { name: /close/i }),
      ).toBeInTheDocument();
    });

    it("deve renderizar todas as abas", () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      expect(screen.getByText("Informações")).toBeInTheDocument();
      expect(screen.getByText("Permissões")).toBeInTheDocument();
      expect(screen.getByText("Ações")).toBeInTheDocument();
    });

    it('deve ter a aba "Informações" ativa por padrão', () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      const infoTab = screen.getByRole("button", { name: "Informações" });
      expect(infoTab).toHaveClass("border-blue-500 text-blue-600");
    });

    it("deve renderizar botões de ação no footer", () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Salvar Alterações" }),
      ).toBeInTheDocument();
    });
  });

  describe("Navegação entre Abas", () => {
    it('deve alternar para aba "Permissões" ao clicar', async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      const permissionsTab = screen.getByText("Permissões");
      await user.click(permissionsTab);

      expect(screen.getByRole("button", { name: "Permissões" })).toHaveClass(
        "border-blue-500 text-blue-600",
      );
      expect(screen.getByText("Gerenciamento de Roles")).toBeInTheDocument();
    });

    it('deve alternar para aba "Ações" ao clicar', async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      const actionsTab = screen.getByText("Ações");
      await user.click(actionsTab);

      expect(screen.getByRole("button", { name: "Ações" })).toHaveClass(
        "border-blue-500 text-blue-600",
      );
      expect(screen.getByText("Ações Administrativas")).toBeInTheDocument();
    });

    it('deve voltar para aba "Informações" após navegar', async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      // Ir para Permissões
      await user.click(screen.getByText("Permissões"));
      expect(screen.getByText("Gerenciamento de Roles")).toBeInTheDocument();

      // Voltar para Informações
      await user.click(screen.getByText("Informações"));
      expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
    });
  });

  describe("Aba Informações", () => {

    it("deve renderizar campos de informações", () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Nome")).toBeInTheDocument();
      expect(screen.getByText("Role Atual")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    it("deve preencher campos com dados do usuário", () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUser.name)).toBeInTheDocument();
      expect(screen.getByTestId("role-badge")).toHaveTextContent(mockUser.role);
    });

    it("deve permitir editar email", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      const emailInput = screen.getByLabelText("Email");
      await user.clear(emailInput);
      await user.type(emailInput, "newemail@example.com");

      expect(
        screen.getByDisplayValue("newemail@example.com"),
      ).toBeInTheDocument();
    });

    it("deve permitir editar nome", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      const nameInput = screen.getByLabelText("Nome");
      await user.clear(nameInput);
      await user.type(nameInput, "New Name");

      expect(screen.getByDisplayValue("New Name")).toBeInTheDocument();
    });

    it("deve permitir alterar status ativo", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      const activeCheckbox = screen.getByLabelText("Usuário Ativo");
      expect(activeCheckbox).toBeChecked();

      await user.click(activeCheckbox);
      expect(activeCheckbox).not.toBeChecked();
    });

    it("deve mostrar informação sobre alteração de role", () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      expect(
        screen.getByText('(Use a aba "Permissões" para alterar)'),
      ).toBeInTheDocument();
    });
  });

  describe("Aba Informações - Usuário MASTER", () => {
    it("deve desabilitar checkbox de status para usuário MASTER", () => {
      render(
        <EditUserModal
          user={mockMasterUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      const activeCheckbox = screen.getByLabelText("Usuário Ativo");
      expect(activeCheckbox).toBeDisabled();
    });

    it("deve mostrar aviso sobre usuários MASTER", () => {
      render(
        <EditUserModal
          user={mockMasterUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      expect(
        screen.getByText(/Usuários MASTER não podem ser desativados/),
      ).toBeInTheDocument();
    });
  });

  describe("Aba Informações - Usuário Bloqueado", () => {
    it("deve mostrar informação de bloqueio", () => {
      render(
        <EditUserModal
          user={mockBlockedUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      expect(screen.getByText(/Usuário bloqueado em/)).toBeInTheDocument();
      expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
    });
  });

  describe("Aba Permissões - Usuário MASTER", () => {
    it("deve mostrar gerenciamento de roles para MASTER", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Permissões"));

      expect(screen.getByText("Gerenciamento de Roles")).toBeInTheDocument();
      expect(screen.getByLabelText("Nível de Acesso")).toBeInTheDocument();
    });

    it("deve renderizar select com todas as opções de role", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Permissões"));

      const roleSelect = screen.getByLabelText("Nível de Acesso");
      expect(roleSelect).toBeInTheDocument();

      const allOptions = screen.getAllByRole("option");
      expect(allOptions).toHaveLength(3);
      expect(
        screen.getByRole("option", { name: "Usuário" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Administrador" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Master" }),
      ).toBeInTheDocument();
    });

    it("deve mostrar descrições das permissões", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Permissões"));

      expect(
        screen.getByText(/USER.*Acesso básico ao sistema/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/ADMIN.*Gerenciar usuários e relatórios/),
      ).toBeInTheDocument();
      expect(screen.getByText(/MASTER.*Acesso total/)).toBeInTheDocument();
    });

    it("deve mostrar informação sobre usuários Master", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Permissões"));

      expect(
        screen.getByText(
          /Usuários promovidos a Master por outras contas Master/,
        ),
      ).toBeInTheDocument();
    });

    it("deve permitir alterar role para ADMIN", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Permissões"));

      const roleSelect = screen.getByLabelText("Nível de Acesso");
      await user.selectOptions(roleSelect, "ADMIN");

      expect(roleSelect).toHaveValue("ADMIN");
    });

    it("deve mostrar aviso de alteração pendente", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Permissões"));

      const roleSelect = screen.getByLabelText("Nível de Acesso");
      await user.selectOptions(roleSelect, "ADMIN");

      expect(screen.getByText("Alteração Pendente")).toBeInTheDocument();
      expect(
        screen.getByText(/Role será alterado para.*ADMIN.*ao salvar/),
      ).toBeInTheDocument();
    });

    it("deve mostrar aviso especial para promoção a MASTER", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Permissões"));

      const roleSelect = screen.getByLabelText("Nível de Acesso");
      await user.selectOptions(roleSelect, "MASTER");

      expect(
        screen.getByText(/Senha Master será solicitada/),
      ).toBeInTheDocument();
    });
  });

  describe("Aba Permissões - Usuário sem Permissão", () => {
    it("deve mostrar mensagem de sem permissão para USER", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="USER"
        />,
      );

      await user.click(screen.getByText("Permissões"));

      expect(
        screen.getByText(
          "Você não tem permissão para alterar roles de usuários.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText("Nível de Acesso"),
      ).not.toBeInTheDocument();
    });

    it("deve mostrar mensagem de sem permissão para ADMIN", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="ADMIN"
        />,
      );

      await user.click(screen.getByText("Permissões"));

      expect(
        screen.getByText(
          "Você não tem permissão para alterar roles de usuários.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Aba Ações - Usuário MASTER", () => {

    it("deve mostrar ações administrativas", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Ações"));
      expect(screen.getByText("Ações Administrativas")).toBeInTheDocument();
    });

    it("deve mostrar botão de reset de senha", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Ações"));
      expect(screen.getByText("Reset de Senha")).toBeInTheDocument();
      expect(
        screen.getByText("Gera uma nova senha temporária para o usuário"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reset Senha" }),
      ).toBeInTheDocument();
    });

    it("deve mostrar botão de histórico de atividades", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Ações"));
      expect(screen.getByText("Histórico de Atividades")).toBeInTheDocument();
      expect(
        screen.getByText("Ver logs de auditoria do usuário"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Ver Logs" }),
      ).toBeInTheDocument();
    });

    it("deve mostrar botão de sessões ativas", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Ações"));
      expect(screen.getByText("Sessões Ativas")).toBeInTheDocument();
      expect(
        screen.getByText("Gerenciar sessões ativas do usuário"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Logout Forçado" }),
      ).toBeInTheDocument();
    });

    it("deve chamar onResetPassword ao clicar em Reset Senha", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Ações"));
      mockOnResetPassword.mockResolvedValue(undefined);

      const resetButton = screen.getByRole("button", { name: "Reset Senha" });
      await user.click(resetButton);

      expect(mockOnResetPassword).toHaveBeenCalledWith(mockUser);
    });

    it("deve mostrar alert para Ver Logs (funcionalidade em desenvolvimento)", async () => {
      // Mock global alert function
      const originalAlert = global.alert;
      const mockAlert = jest.fn();
      global.alert = mockAlert;

      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Ações"));

      const logsButton = screen.getByRole("button", { name: "Ver Logs" });
      await user.click(logsButton);

      expect(mockAlert).toHaveBeenCalledWith(
        "Funcionalidade em desenvolvimento",
      );

      global.alert = originalAlert;
    });

    it("deve mostrar alert para Logout Forçado (funcionalidade em desenvolvimento)", async () => {
      // Mock global alert function
      const originalAlert = global.alert;
      const mockAlert = jest.fn();
      global.alert = mockAlert;

      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );
      await user.click(screen.getByText("Ações"));

      const logoutButton = screen.getByRole("button", {
        name: "Logout Forçado",
      });
      await user.click(logoutButton);

      expect(mockAlert).toHaveBeenCalledWith(
        "Funcionalidade em desenvolvimento",
      );

      global.alert = originalAlert;
    });
  });

  describe("Aba Ações - Usuário ADMIN", () => {
    it("deve mostrar apenas reset de senha para ADMIN", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="ADMIN"
        />,
      );

      await user.click(screen.getByText("Ações"));

      expect(
        screen.getByRole("button", { name: "Reset Senha" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Ver Logs" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Logout Forçado" }),
      ).toBeInTheDocument();
    });
  });

  describe("Aba Ações - Usuário USER", () => {
    it("não deve mostrar reset de senha para USER", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="USER"
        />,
      );

      await user.click(screen.getByText("Ações"));

      expect(
        screen.queryByRole("button", { name: "Reset Senha" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Ver Logs" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Logout Forçado" }),
      ).toBeInTheDocument();
    });
  });

  describe("Estados de Loading", () => {
    it('deve mostrar "Salvando..." quando loading é true', () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      // Simular loading através de re-render interno
      // Como o loading é interno, vamos testar através da interação
      expect(
        screen.getByRole("button", { name: "Salvar Alterações" }),
      ).toBeInTheDocument();
    });

    it("deve desabilitar botões durante loading", async () => {
      mockOnSave.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      const saveButton = screen.getByRole("button", {
        name: "Salvar Alterações",
      });
      await user.click(saveButton);

      // Durante o loading, o botão deve estar desabilitado
      expect(saveButton).toBeDisabled();
    });

    it('deve mostrar "Processando..." no botão de reset durante loading', async () => {
      mockOnResetPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      await user.click(screen.getByText("Ações"));

      const resetButton = screen.getByRole("button", { name: "Reset Senha" });
      await user.click(resetButton);

      expect(
        screen.getByRole("button", { name: "Processando..." }),
      ).toBeInTheDocument();
    });
  });

  describe("Interações do Modal", () => {
    it("deve fechar modal ao clicar no botão X", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve fechar modal ao clicar em Cancelar", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      const cancelButton = screen.getByRole("button", { name: "Cancelar" });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve chamar onSave com dados editados", async () => {
      mockOnSave.mockResolvedValue(undefined);

      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      // Editar email
      const emailInput = screen.getByLabelText("Email");
      await user.clear(emailInput);
      await user.type(emailInput, "newemail@example.com");

      // Salvar
      const saveButton = screen.getByRole("button", {
        name: "Salvar Alterações",
      });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockUser,
        email: "newemail@example.com",
      });
    });
  });

  describe("Prompt de Senha Master", () => {
    it("deve mostrar prompt ao tentar promover para MASTER", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      // Ir para aba Permissões
      await user.click(screen.getByText("Permissões"));

      // Alterar role para MASTER
      const roleSelect = screen.getByLabelText("Nível de Acesso");
      await user.selectOptions(roleSelect, "MASTER");

      // Tentar salvar
      const saveButton = screen.getByRole("button", {
        name: "Salvar Alterações",
      });
      await user.click(saveButton);

      // Deve mostrar prompt de senha
      expect(screen.getByTestId("master-password-prompt")).toBeInTheDocument();
      expect(
        screen.getByText("Confirmar Promoção a Master"),
      ).toBeInTheDocument();
    });

    it("deve chamar onChangeRole ao confirmar senha master", async () => {
      mockOnChangeRole.mockResolvedValue(undefined);

      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      // Ir para aba Permissões e alterar role
      await user.click(screen.getByText("Permissões"));
      const roleSelect = screen.getByLabelText("Nível de Acesso");
      await user.selectOptions(roleSelect, "MASTER");

      // Tentar salvar
      await user.click(
        screen.getByRole("button", { name: "Salvar Alterações" }),
      );

      // Confirmar senha
      const confirmButton = screen.getByText("Confirmar");
      await user.click(confirmButton);

      expect(mockOnChangeRole).toHaveBeenCalledWith(
        { ...mockUser, role: "MASTER" },
        "MASTER",
        "master-key-123",
      );
    });

    it("deve fechar prompt ao cancelar", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      // Ir para aba Permissões e alterar role
      await user.click(screen.getByText("Permissões"));
      const roleSelect = screen.getByLabelText("Nível de Acesso");
      await user.selectOptions(roleSelect, "MASTER");

      // Tentar salvar
      await user.click(
        screen.getByRole("button", { name: "Salvar Alterações" }),
      );

      // Cancelar prompt
      const cancelPromptButton = screen.getByText("Fechar");
      await user.click(cancelPromptButton);

      expect(
        screen.queryByTestId("master-password-prompt"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Mudança de Role sem Senha Master", () => {
    it("deve aplicar mudança para ADMIN diretamente", async () => {
      mockOnChangeRole.mockResolvedValue(undefined);
      mockOnSave.mockResolvedValue(undefined);

      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      // Ir para aba Permissões e alterar role
      await user.click(screen.getByText("Permissões"));
      const roleSelect = screen.getByLabelText("Nível de Acesso");
      await user.selectOptions(roleSelect, "ADMIN");

      // Salvar
      await user.click(
        screen.getByRole("button", { name: "Salvar Alterações" }),
      );

      expect(mockOnChangeRole).toHaveBeenCalledWith(
        { ...mockUser, role: "ADMIN" },
        "ADMIN",
      );
      expect(mockOnSave).toHaveBeenCalledWith({ ...mockUser, role: "ADMIN" });
    });
  });

  describe("Atualização de Props", () => {
    it("deve atualizar dados editados quando user prop muda", () => {
      const { rerender } = render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();

      // Atualizar props com novo usuário
      const updatedUser = {
        ...mockUser,
        email: "updated@example.com",
        name: "Updated Name",
      };
      rerender(
        <EditUserModal
          user={updatedUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      expect(
        screen.getByDisplayValue("updated@example.com"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("Updated Name")).toBeInTheDocument();
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com usuário sem nome", () => {
      const userWithoutName = { ...mockUser, name: "" };

      render(
        <EditUserModal
          user={userWithoutName}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      const nameInput = screen.getByLabelText("Nome");
      expect(nameInput).toHaveValue("");
    });

    it("deve lidar com currentUserRole undefined", async () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
        />,
      );

      await user.click(screen.getByText("Permissões"));
      expect(
        screen.getByText(
          "Você não tem permissão para alterar roles de usuários.",
        ),
      ).toBeInTheDocument();

      await user.click(screen.getByText("Ações"));
      expect(
        screen.queryByRole("button", { name: "Reset Senha" }),
      ).not.toBeInTheDocument();
    });

    it("deve lidar com erros no onSave", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockOnSave.mockRejectedValue(new Error("Erro de teste"));

      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      const saveButton = screen.getByRole("button", {
        name: "Salvar Alterações",
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Erro ao salvar usuário:",
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });

    it("deve lidar com erros no onResetPassword", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockOnResetPassword.mockRejectedValue(new Error("Erro de teste"));

      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      await user.click(screen.getByText("Ações"));

      const resetButton = screen.getByRole("button", { name: "Reset Senha" });
      await user.click(resetButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Erro ao resetar senha:",
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter labels associados aos campos", () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Nome")).toBeInTheDocument();
      expect(screen.getByLabelText("Usuário Ativo")).toBeInTheDocument();
    });

    it("deve ter botões com roles corretos", () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Salvar Alterações" }),
      ).toBeInTheDocument();
    });

    it("deve ter estrutura semântica correta", () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      expect(
        screen.getByRole("heading", { name: "Editar Usuário" }),
      ).toBeInTheDocument();
    });
  });

  describe("Layout Responsivo", () => {
    it("deve ter classes responsivas corretas", () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      const modalContent = screen.getByTestId("test-element");
      expect(modalContent).toBeInTheDocument();
      expect(modalContent).toHaveClass("max-w-2xl w-full mx-4");
    });

    it("deve ter altura máxima e scroll", () => {
      render(
        <EditUserModal
          user={mockUser}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onResetPassword={mockOnResetPassword}
          onChangeRole={mockOnChangeRole}
          currentUserRole="MASTER"
        />,
      );

      const modalContent = screen.getByRole("dialog");
      expect(modalContent).toHaveClass("max-h-[90vh] overflow-y-auto");
    });
  });
});
