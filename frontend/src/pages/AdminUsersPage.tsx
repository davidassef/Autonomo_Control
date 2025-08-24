import React, { useState } from "react";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { CreateUserForm } from "../components/admin/CreateUserForm";
import { UserTable } from "../components/admin/UserTable";
import { MasterPasswordPrompt } from "../components/admin/MasterPasswordPrompt";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import Layout from "../components/Layout";

const AdminUsersPage: React.FC = () => {
  const {
    users,
    loading,
    actionId,
    create,
    toggleStatus,
    changeUserRole,
    resetPassword,
    block,
    unblock,
    deleteUserAccount,
    reload,
    error,
    updateUser,
  } = useAdminUsers();
  const { user: current } = useAuth();
  const [pendingAction, setPendingAction] = useState<null | {
    type: "changeRole";
    userId: number;
    newRole: "USER" | "ADMIN" | "MASTER";
  }>(null);
  const { push } = useToast();

  async function handleCreate(
    email: string,
    name: string,
    role: "USER" | "ADMIN",
    masterKey?: string,
  ) {
    try {
      await create(email, name, role, masterKey);
      push({ type: "success", message: "Usuário criado" });
    } catch (e: any) {
      push({
        type: "error",
        message: e?.response?.data?.detail || "Falha ao criar usuário",
      });
      throw e;
    }
  }

  async function onChangeRole(
    user: any,
    newRole: "USER" | "ADMIN" | "MASTER",
    masterKey?: string,
  ) {
    if (newRole === "MASTER") {
      setPendingAction({ type: "changeRole", userId: user.id, newRole });
    } else {
      try {
        await changeUserRole(user, newRole, masterKey || "");
        push({
          type: "success",
          message: `Cargo alterado para ${newRole === "ADMIN" ? "Administrador" : "Usuário"} com sucesso!`,
        });
      } catch (e: any) {
        push({
          type: "error",
          message: e?.response?.data?.detail || "Erro ao alterar cargo",
        });
      }
    }
  }

  // Manter funções legacy para compatibilidade com outros componentes
  function onPromote(user: any) {
    onChangeRole(user, "ADMIN");
  }
  function onDemote(user: any) {
    onChangeRole(user, "USER");
  }

  async function executeMasterAction(masterKey: string) {
    if (!pendingAction) return;
    const target = users.find((u) => u.id === pendingAction.userId);
    if (!target) return;
    try {
      if (pendingAction.type === "changeRole") {
        await changeUserRole(target, pendingAction.newRole, masterKey);
        const roleNames = {
          USER: "Usuário",
          ADMIN: "Administrador",
          MASTER: "Master",
        };
        push({
          type: "success",
          message: `Cargo alterado para ${roleNames[pendingAction.newRole]} com sucesso!`,
        });
      }
    } catch (e: any) {
      // MasterPasswordPrompt lida com erro; aqui somente mantemos estado
    } finally {
      setPendingAction(null);
    }
  }

  async function handleResetPassword(user: any) {
    try {
      const result = await resetPassword(user);
      push({
        type: "success",
        message: `Senha resetada! Email enviado para ${user.email}`,
      });
      return result;
    } catch (e: any) {
      push({
        type: "error",
        message: e?.response?.data?.detail || "Falha ao resetar senha",
      });
      throw e;
    }
  }

  async function handleBlock(user: any) {
    try {
      const result = await block(user);
      push({
        type: "success",
        message: `Usuário ${user.name} foi bloqueado com sucesso`,
      });
      return result;
    } catch (e: any) {
      push({
        type: "error",
        message: e?.response?.data?.detail || "Falha ao bloquear usuário",
      });
      throw e;
    }
  }

  async function handleUnblock(user: any) {
    try {
      const result = await unblock(user);
      push({
        type: "success",
        message: `Usuário ${user.name} foi desbloqueado com sucesso`,
      });
      return result;
    } catch (e: any) {
      push({
        type: "error",
        message: e?.response?.data?.detail || "Falha ao desbloquear usuário",
      });
      throw e;
    }
  }

  async function handleDelete(user: any): Promise<void> {
    try {
      await deleteUserAccount(user);
      push({
        type: "success",
        message: `Usuário ${user.name} foi excluído com sucesso`,
      });
    } catch (e: any) {
      push({
        type: "error",
        message: e?.response?.data?.detail || "Falha ao excluir usuário",
      });
      throw e;
    }
  }

  async function handleUpdateUser(user: any): Promise<void> {
    try {
      if (updateUser) {
        await updateUser(user);
        push({ type: "success", message: "Usuário atualizado com sucesso" });
      }
    } catch (e: any) {
      // Tratamento específico para erro 403 ao tentar desativar usuários MASTER
      if (e?.response?.status === 403) {
        const errorMessage = e?.response?.data?.detail;
        if (errorMessage && errorMessage.includes("MASTER")) {
          push({
            type: "error",
            message:
              "Não é possível desativar usuários MASTER. Usuários MASTER são protegidos pelo sistema.",
          });
        } else {
          push({
            type: "error",
            message: "Você não tem permissão para realizar esta ação.",
          });
        }
      } else {
        push({
          type: "error",
          message: e?.response?.data?.detail || "Falha ao atualizar usuário",
        });
      }
      throw e;
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Administração de Usuários</h1>

        {error && (
          <div className="border px-3 py-2 rounded text-sm bg-red-100 border-red-400 text-red-800">
            {error}
          </div>
        )}

        <CreateUserForm
          onCreate={handleCreate}
          canCreateAdmin={current?.role === "MASTER"}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reload}
            className="border px-4 py-2 rounded text-sm"
          >
            Atualizar
          </button>
        </div>

        <UserTable
          users={users}
          loading={loading}
          actionId={actionId}
          currentUserId={current?.id ? parseInt(current.id) : undefined}
          currentUserRole={current?.role}
          onToggleStatus={(u) => {
            toggleStatus(u)
              .then(() =>
                push({ type: "success", message: "Status atualizado" }),
              )
              .catch((e) => {
                // Tratamento específico para erro 403 ao tentar desativar usuários MASTER
                if (e?.response?.status === 403) {
                  const errorMessage = e?.response?.data?.detail;
                  if (errorMessage && errorMessage.includes("MASTER")) {
                    push({
                      type: "error",
                      message:
                        "Não é possível desativar usuários MASTER. Usuários MASTER são protegidos pelo sistema.",
                    });
                  } else {
                    push({
                      type: "error",
                      message:
                        "Você não tem permissão para realizar esta ação.",
                    });
                  }
                } else {
                  push({
                    type: "error",
                    message:
                      e?.response?.data?.detail || "Erro ao alterar status",
                  });
                }
              });
          }}
          onPromote={onPromote}
          onDemote={onDemote}
          onChangeRole={onChangeRole}
          onResetPassword={handleResetPassword}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
          onDelete={handleDelete}
          onUpdateUser={handleUpdateUser}
        />

        {pendingAction && (
          <MasterPasswordPrompt
            title={
              pendingAction.type === "changeRole"
                ? `Confirmar alteração de cargo para ${pendingAction.newRole === "USER" ? "Usuário" : pendingAction.newRole === "ADMIN" ? "Administrador" : "Master"}`
                : "Confirmar ação"
            }
            onConfirm={(mk) => executeMasterAction(mk)}
            onClose={() => setPendingAction(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default AdminUsersPage;
