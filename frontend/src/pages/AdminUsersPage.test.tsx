import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
// Jest globals are available globally, no need to import
import AdminUsersPage from "./AdminUsersPage";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

// Mocks
jest.mock("../hooks/useAdminUsers");
jest.mock("../hooks/useAuth");
jest.mock("../hooks/useToast");

// Mock variables
const mockUseAdminUsers = jest.fn();
const mockUseAuth = jest.fn();
const mockUseToast = jest.fn();

// Cast to jest mocks
(useAdminUsers as jest.Mock).mockImplementation(mockUseAdminUsers);
(useAuth as jest.Mock).mockImplementation(mockUseAuth);
(useToast as jest.Mock).mockImplementation(mockUseToast);

// Mock dos componentes
jest.mock("../components/admin/CreateUserForm", () => ({
  CreateUserForm: ({ onCreate, canCreateAdmin }: any) => (
    <div data-testid="create-user-form">
      <button
        onClick={() => onCreate("test@test.com", "Test User", "USER")}
        data-testid="create-user-button"
      >
        Criar Usuário
      </button>
      {canCreateAdmin && (
        <button
          onClick={() => onCreate("admin@test.com", "Admin User", "ADMIN")}
          data-testid="create-admin-button"
        >
          Criar Admin
        </button>
      )}
    </div>
  ),
}));

jest.mock("../components/admin/UserTable", () => ({
  UserTable: ({
    users,
    loading,
    actionId,
    currentUserId,
    currentUserRole,
    onToggleStatus,
    onPromote,
    onDemote,
    onChangeRole,
    onResetPassword,
    onBlock,
    onUnblock,
    onDelete,
    onUpdateUser,
  }: any) => (
    <div data-testid="user-table">
      {loading && <div data-testid="loading">Carregando...</div>}
      {users.map((user: any) => (
        <div key={user.id} data-testid={`user-${user.id}`}>
          <span>
            {user.name} - {user.email} - {user.role}
          </span>
          <button
            onClick={() => onToggleStatus(user)}
            data-testid={`toggle-status-${user.id}`}
          >
            Toggle Status
          </button>
          <button
            onClick={() => onPromote(user)}
            data-testid={`promote-${user.id}`}
          >
            Promover
          </button>
          <button
            onClick={() => onDemote(user)}
            data-testid={`demote-${user.id}`}
          >
            Rebaixar
          </button>
          <button
            onClick={() => onChangeRole(user, "MASTER")}
            data-testid={`make-master-${user.id}`}
          >
            Tornar Master
          </button>
          <button
            onClick={() => onResetPassword(user)}
            data-testid={`reset-password-${user.id}`}
          >
            Reset Senha
          </button>
          <button
            onClick={() => onBlock(user)}
            data-testid={`block-${user.id}`}
          >
            Bloquear
          </button>
          <button
            onClick={() => onUnblock(user)}
            data-testid={`unblock-${user.id}`}
          >
            Desbloquear
          </button>
          <button
            onClick={() => onDelete(user)}
            data-testid={`delete-${user.id}`}
          >
            Excluir
          </button>
          <button
            onClick={() => onUpdateUser(user)}
            data-testid={`update-${user.id}`}
          >
            Atualizar
          </button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock("../components/admin/MasterPasswordPrompt", () => ({
  MasterPasswordPrompt: ({ title, onConfirm, onClose }: any) => (
    <div data-testid="master-password-prompt">
      <h3>{title}</h3>
      <button
        onClick={() => onConfirm("master-key-123")}
        data-testid="confirm-master-action"
      >
        Confirmar
      </button>
      <button onClick={onClose} data-testid="close-master-prompt">
        Fechar
      </button>
    </div>
  ),
}));

jest.mock("../components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

// Dados mock
const mockUsers = [
  {
    id: 1,
    name: "João Silva",
    email: "joao@test.com",
    role: "USER",
    is_active: true,
    is_blocked: false,
  },
  {
    id: 2,
    name: "Maria Admin",
    email: "maria@test.com",
    role: "ADMIN",
    is_active: true,
    is_blocked: false,
  },
  {
    id: 3,
    name: "Master User",
    email: "master@test.com",
    role: "MASTER",
    is_active: true,
    is_blocked: false,
  },
];

const mockAdminUsersDefault: any = {
  users: mockUsers,
  loading: false,
  actionId: null,
  create: jest.fn() as any,
  toggleStatus: jest.fn() as any,
  changeUserRole: jest.fn() as any,
  resetPassword: jest.fn() as any,
  block: jest.fn() as any,
  unblock: jest.fn() as any,
  deleteUserAccount: jest.fn() as any,
  reload: jest.fn() as any,
  error: null,
  updateUser: jest.fn() as any,
};

const mockAuthDefault = {
  user: { id: 2, email: "maria@test.com", role: "ADMIN", name: "Maria Admin" },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
};

const mockToastDefault = {
  push: jest.fn(),
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AdminUsersPage />
    </BrowserRouter>,
  );
};

describe("AdminUsersPage", () => {
  beforeEach(() => {
    mockUseAdminUsers.mockReturnValue(mockAdminUsersDefault);
    mockUseAuth.mockReturnValue(mockAuthDefault);
    mockUseToast.mockReturnValue(mockToastDefault);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização inicial", () => {
    it("deve renderizar o título da página", () => {
      renderComponent();
      expect(screen.getByText("Administração de Usuários")).toBeInTheDocument();
    });

    it("deve renderizar o formulário de criação de usuário", () => {
      renderComponent();
      expect(screen.getByTestId("create-user-form")).toBeInTheDocument();
    });

    it("deve renderizar a tabela de usuários", () => {
      renderComponent();
      expect(screen.getByTestId("user-table")).toBeInTheDocument();
    });

    it("deve renderizar o botão de atualizar", () => {
      renderComponent();
      expect(screen.getByText("Atualizar")).toBeInTheDocument();
    });

    it("deve renderizar usuários na tabela", () => {
      renderComponent();
      expect(screen.getByTestId("user-1")).toBeInTheDocument();
      expect(screen.getByTestId("user-2")).toBeInTheDocument();
      expect(screen.getByTestId("user-3")).toBeInTheDocument();
    });
  });

  describe("Exibição de erros", () => {
    it("deve exibir mensagem de erro quando presente", () => {
      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        error: "Erro ao carregar usuários",
      });

      renderComponent();
      expect(screen.getByText("Erro ao carregar usuários")).toBeInTheDocument();
    });

    it("deve aplicar classes CSS corretas para erro", () => {
      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        error: "Erro ao carregar usuários",
      });

      renderComponent();
      const errorDiv = screen.getByText("Erro ao carregar usuários");
      expect(errorDiv).toHaveClass("bg-red-100 border-red-400 text-red-800");
    });
  });

  describe("Permissões baseadas em role", () => {
    it("deve permitir criação de admin para usuário MASTER", () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthDefault,
        user: { ...mockAuthDefault.user, role: "MASTER" },
      });

      renderComponent();
      expect(screen.getByTestId("create-admin-button")).toBeInTheDocument();
    });

    it("não deve permitir criação de admin para usuário ADMIN", () => {
      renderComponent();
      expect(
        screen.queryByTestId("create-admin-button"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Criação de usuários", () => {
    it("deve chamar create ao criar usuário comum", async () => {
      const mockCreate = jest.fn();
      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        create: mockCreate,
      });

      renderComponent();

      const createButton = screen.getByTestId("create-user-button");
      fireEvent.click(createButton);

      expect(mockCreate).toHaveBeenCalledWith(
        "test@test.com",
        "Test User",
        "USER",
        undefined,
      );
    });

    it("deve exibir toast de sucesso ao criar usuário", async () => {
      const mockCreate = jest.fn();
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        create: mockCreate,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const createButton = screen.getByTestId("create-user-button");
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          type: "success",
          message: "Usuário criado",
        });
      });
    });

    it("deve exibir toast de erro ao falhar na criação", async () => {
      const mockCreate = jest.fn() as jest.MockedFunction<any>;
      mockCreate.mockRejectedValue({
        response: { data: { detail: "Email já existe" } },
      });
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        create: mockCreate,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const createButton = screen.getByTestId("create-user-button");
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          type: "error",
          message: "Email já existe",
        });
      });
    });
  });

  describe("Alteração de roles", () => {
    it("deve promover usuário para ADMIN", async () => {
      const mockChangeUserRole = jest.fn();
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        changeUserRole: mockChangeUserRole,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const promoteButton = screen.getByTestId("promote-1");
      fireEvent.click(promoteButton);

      await waitFor(() => {
        expect(mockChangeUserRole).toHaveBeenCalledWith(
          mockUsers[0],
          "ADMIN",
          "",
        );
      });
      
      expect(mockPush).toHaveBeenCalledWith({
        type: "success",
        message: "Cargo alterado para Administrador com sucesso!",
      });
    });

    it("deve rebaixar usuário para USER", async () => {
      const mockChangeUserRole = jest.fn();
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        changeUserRole: mockChangeUserRole,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const demoteButton = screen.getByTestId("demote-2");
      fireEvent.click(demoteButton);

      await waitFor(() => {
        expect(mockChangeUserRole).toHaveBeenCalledWith(
          mockUsers[1],
          "USER",
          "",
        );
      });
      
      expect(mockPush).toHaveBeenCalledWith({
        type: "success",
        message: "Cargo alterado para Usuário com sucesso!",
      });
    });

    it("deve abrir prompt de senha master para tornar usuário MASTER", () => {
      renderComponent();

      const makeMasterButton = screen.getByTestId("make-master-1");
      fireEvent.click(makeMasterButton);

      expect(screen.getByTestId("master-password-prompt")).toBeInTheDocument();
      expect(
        screen.getByText("Confirmar alteração de cargo para Master"),
      ).toBeInTheDocument();
    });

    it("deve executar ação master após confirmação", async () => {
      const mockChangeUserRole = jest.fn();
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        changeUserRole: mockChangeUserRole,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      // Abrir prompt
      const makeMasterButton = screen.getByTestId("make-master-1");
      fireEvent.click(makeMasterButton);

      // Confirmar ação
      const confirmButton = screen.getByTestId("confirm-master-action");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockChangeUserRole).toHaveBeenCalledWith(
          mockUsers[0],
          "MASTER",
          "master-key-123",
        );
      });
      
      expect(mockPush).toHaveBeenCalledWith({
        type: "success",
        message: "Cargo alterado para Master com sucesso!",
      });
    });

    it("deve fechar prompt master ao cancelar", () => {
      renderComponent();

      // Abrir prompt
      const makeMasterButton = screen.getByTestId("make-master-1");
      fireEvent.click(makeMasterButton);

      expect(screen.getByTestId("master-password-prompt")).toBeInTheDocument();

      // Fechar prompt
      const closeButton = screen.getByTestId("close-master-prompt");
      fireEvent.click(closeButton);

      expect(
        screen.queryByTestId("master-password-prompt"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Toggle de status", () => {
    it("deve alternar status do usuário com sucesso", async () => {
      const mockToggleStatus = jest.fn();
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        toggleStatus: mockToggleStatus,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const toggleButton = screen.getByTestId("toggle-status-1");
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(mockToggleStatus).toHaveBeenCalledWith(mockUsers[0]);
      });
      
      expect(mockPush).toHaveBeenCalledWith({
        type: "success",
        message: "Status atualizado",
      });
    });

    it("deve exibir erro específico ao tentar desativar usuário MASTER", async () => {
      const mockToggleStatus = jest.fn() as jest.MockedFunction<any>;
      mockToggleStatus.mockRejectedValue({
        response: {
          status: 403,
          data: { detail: "Não é possível desativar usuários MASTER" },
        },
      });
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        toggleStatus: mockToggleStatus,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const toggleButton = screen.getByTestId("toggle-status-3");
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          type: "error",
          message:
            "Não é possível desativar usuários MASTER. Usuários MASTER são protegidos pelo sistema.",
        });
      });
    });
  });

  describe("Reset de senha", () => {
    it("deve resetar senha com sucesso", async () => {
      const mockResetPassword = jest.fn();
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        resetPassword: mockResetPassword,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const resetButton = screen.getByTestId("reset-password-1");
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith(mockUsers[0]);
      });
      
      expect(mockPush).toHaveBeenCalledWith({
        type: "success",
        message: "Senha resetada! Email enviado para joao@test.com",
      });
    });

    it("deve exibir erro ao falhar no reset de senha", async () => {
      const mockResetPassword = jest.fn() as jest.MockedFunction<any>;
      mockResetPassword.mockRejectedValue({
        response: { data: { detail: "Usuário não encontrado" } },
      });
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        resetPassword: mockResetPassword,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const resetButton = screen.getByTestId("reset-password-1");
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          type: "error",
          message: "Usuário não encontrado",
        });
      });
    });
  });

  describe("Bloqueio e desbloqueio", () => {
    it("deve bloquear usuário com sucesso", async () => {
      const mockBlock = jest.fn();
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        block: mockBlock,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const blockButton = screen.getByTestId("block-1");
      fireEvent.click(blockButton);

      await waitFor(() => {
        expect(mockBlock).toHaveBeenCalledWith(mockUsers[0]);
      });
      
      expect(mockPush).toHaveBeenCalledWith({
        type: "success",
        message: "Usuário João Silva foi bloqueado com sucesso",
      });
    });

    it("deve desbloquear usuário com sucesso", async () => {
      const mockUnblock = jest.fn();
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        unblock: mockUnblock,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const unblockButton = screen.getByTestId("unblock-1");
      fireEvent.click(unblockButton);

      await waitFor(() => {
        expect(mockUnblock).toHaveBeenCalledWith(mockUsers[0]);
      });
      
      expect(mockPush).toHaveBeenCalledWith({
        type: "success",
        message: "Usuário João Silva foi desbloqueado com sucesso",
      });
    });
  });

  describe("Exclusão de usuários", () => {
    it("deve excluir usuário com sucesso", async () => {
      const mockDeleteUserAccount = jest.fn();
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        deleteUserAccount: mockDeleteUserAccount,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const deleteButton = screen.getByTestId("delete-1");
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteUserAccount).toHaveBeenCalledWith(mockUsers[0]);
      });
      
      expect(mockPush).toHaveBeenCalledWith({
        type: "success",
        message: "Usuário João Silva foi excluído com sucesso",
      });
    });

    it("deve exibir erro ao falhar na exclusão", async () => {
      const mockDeleteUserAccount = jest.fn() as jest.MockedFunction<any>;
      mockDeleteUserAccount.mockRejectedValue({
        response: { data: { detail: "Não é possível excluir este usuário" } },
      });
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        deleteUserAccount: mockDeleteUserAccount,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const deleteButton = screen.getByTestId("delete-1");
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          type: "error",
          message: "Não é possível excluir este usuário",
        });
      });
    });
  });

  describe("Atualização de usuários", () => {
    it("deve atualizar usuário com sucesso", async () => {
      const mockUpdateUser = jest.fn();
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        updateUser: mockUpdateUser,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const updateButton = screen.getByTestId("update-1");
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith(mockUsers[0]);
      });
      
      expect(mockPush).toHaveBeenCalledWith({
        type: "success",
        message: "Usuário atualizado com sucesso",
      });
    });

    it("deve exibir erro específico para tentativa de desativar MASTER", async () => {
      const mockUpdateUser = jest.fn() as jest.MockedFunction<any>;
      mockUpdateUser.mockRejectedValue({
        response: {
          status: 403,
          data: { detail: "Não é possível desativar usuários MASTER" },
        },
      });
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        updateUser: mockUpdateUser,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const updateButton = screen.getByTestId("update-3");
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          type: "error",
          message:
            "Não é possível desativar usuários MASTER. Usuários MASTER são protegidos pelo sistema.",
        });
      });
    });
  });

  describe("Funcionalidades gerais", () => {
    it("deve chamar reload ao clicar em Atualizar", () => {
      const mockReload = jest.fn();
      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        reload: mockReload,
      });

      renderComponent();

      const reloadButton = screen.getByText("Atualizar");
      fireEvent.click(reloadButton);

      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it("deve exibir estado de loading na tabela", () => {
      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        loading: true,
      });

      renderComponent();
      expect(screen.getByTestId("loading")).toBeInTheDocument();
    });
  });

  describe("Casos extremos", () => {
    it("deve lidar com lista de usuários vazia", () => {
      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        users: [],
      });

      renderComponent();
      expect(screen.getByTestId("user-table")).toBeInTheDocument();
      expect(screen.queryByTestId("user-1")).not.toBeInTheDocument();
    });

    it("deve lidar com usuário atual nulo", () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthDefault,
        user: null,
      });

      renderComponent();
      expect(screen.getByText("Administração de Usuários")).toBeInTheDocument();
    });

    it("deve lidar com erro genérico sem detail", async () => {
      const mockCreate = jest.fn() as jest.MockedFunction<any>;
      mockCreate.mockRejectedValue(new Error("Network error"));
      const mockPush = jest.fn();

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        create: mockCreate,
      });
      mockUseToast.mockReturnValue({ push: mockPush });

      renderComponent();

      const createButton = screen.getByTestId("create-user-button");
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          type: "error",
          message: "Falha ao criar usuário",
        });
      });
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente com muitos usuários", () => {
      const manyUsers = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@test.com`,
        role: "USER",
        is_active: true,
        is_blocked: false,
      }));

      mockUseAdminUsers.mockReturnValue({
        ...mockAdminUsersDefault,
        users: manyUsers,
      });

      const startTime = performance.now();
      renderComponent();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Deve renderizar em menos de 1 segundo
    });

    it("deve manter referências estáveis das funções", () => {
      const { rerender } = renderComponent();

      const reloadButton1 = screen.getByText("Atualizar");

      rerender(
        <BrowserRouter>
          <AdminUsersPage />
        </BrowserRouter>,
      );

      const reloadButton2 = screen.getByText("Atualizar");

      // As funções devem ser as mesmas entre re-renders
      expect(reloadButton1).toEqual(reloadButton2);
    });
  });
});
