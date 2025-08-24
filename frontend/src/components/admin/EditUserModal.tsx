import React, { useState, useEffect } from "react";
import { AdminUser } from "../../services/adminUsers";
import { RoleBadge } from "./RoleBadge";
import { MasterPasswordPrompt } from "./MasterPasswordPrompt";

interface Props {
  user: AdminUser;
  onClose: () => void;
  onSave: (userId: number, data: Partial<AdminUser>) => void;
  onResetPassword: (user: AdminUser) => Promise<any>;
  onChangeRole: (
    user: AdminUser,
    newRole: AdminUser["role"],
    masterKey?: string,
  ) => void;
  currentUserRole?: AdminUser["role"];
}

export const EditUserModal: React.FC<Props> = ({
  user,
  onClose,
  onSave,
  onResetPassword,
  onChangeRole,
  currentUserRole,
}) => {
  const [editedUser, setEditedUser] = useState<AdminUser>({ ...user });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "info" | "permissions" | "actions"
  >("info");
  const [pendingRoleChange, setPendingRoleChange] = useState<
    AdminUser["role"] | null
  >(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  useEffect(() => {
    setEditedUser({ ...user });
  }, [user]);

  const handleSave = async () => {
    // Se há mudança de role pendente, solicitar senha master
    if (pendingRoleChange && pendingRoleChange !== user.role) {
      if (pendingRoleChange === "MASTER") {
        setShowPasswordPrompt(true);
        return;
      } else {
        // Para roles USER e ADMIN, aplicar diretamente
        try {
          setLoading(true);
          await onChangeRole(
            { ...editedUser, role: pendingRoleChange },
            pendingRoleChange,
          );
          await onSave(editedUser.id, {
            ...editedUser,
            role: pendingRoleChange,
          });
          setPendingRoleChange(null);
        } catch (error) {
          console.error("Erro ao salvar usuário:", error);
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    // Salvar outras alterações normalmente
    setLoading(true);
    try {
      await onSave(editedUser.id, editedUser);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      await onResetPassword(user);
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole: AdminUser["role"]) => {
    if (currentUserRole === "MASTER") {
      setPendingRoleChange(newRole);
      setEditedUser({ ...editedUser, role: newRole });
    }
  };

  const handlePasswordConfirm = async (masterKey: string) => {
    if (!pendingRoleChange) return;

    // Chama a função onChangeRole passando a masterKey
    await onChangeRole(
      { ...editedUser, role: pendingRoleChange },
      pendingRoleChange,
      masterKey,
    );

    // Atualiza o estado local e fecha o modal
    setEditedUser({ ...editedUser, role: pendingRoleChange });
    setPendingRoleChange(null);
    setShowPasswordPrompt(false);
    onClose();
  };

  const canManageRoles = currentUserRole === "MASTER";
  const canResetPassword =
    currentUserRole === "MASTER" || currentUserRole === "ADMIN";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Editar Usuário
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {["info", "permissions", "actions"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab === "info" && "Informações"}
                {tab === "permissions" && "Permissões"}
                {tab === "actions" && "Ações"}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "info" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editedUser.email}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={editedUser.name || ""}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Atual
                </label>
                <div className="flex items-center space-x-2">
                  <RoleBadge role={user.role} />
                  <span className="text-sm text-gray-500">
                    (Use a aba "Permissões" para alterar)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editedUser.is_active}
                      onChange={(e) =>
                        setEditedUser({
                          ...editedUser,
                          is_active: e.target.checked,
                        })
                      }
                      className="mr-2"
                      disabled={user.role === "MASTER"}
                    />
                    Usuário Ativo
                  </label>
                  {user.blocked_at && (
                    <span className="text-sm text-red-600">
                      Usuário bloqueado em{" "}
                      {new Date(user.blocked_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {user.role === "MASTER" && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-700">
                      <strong>Informação:</strong> Usuários MASTER não podem ser
                      desativados por questões de segurança do sistema.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">
                  Gerenciamento de Roles
                </h3>

                {canManageRoles ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nível de Acesso
                      </label>
                      <select
                        value={pendingRoleChange || user.role}
                        onChange={(e) => {
                          const newRole = e.target.value as AdminUser["role"];
                          handleRoleChange(newRole);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      >
                        <option value="USER">Usuário</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="MASTER">Master</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Permissões por Role
                        </h4>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>
                            • <strong>USER:</strong> Acesso básico ao sistema
                          </div>
                          <div>
                            • <strong>ADMIN:</strong> Gerenciar usuários e
                            relatórios
                          </div>
                          <div>
                            • <strong>MASTER:</strong> Acesso total, incluindo
                            promoção a Master
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">
                          Informação Importante
                        </h4>
                        <p className="text-xs text-blue-700">
                          Usuários promovidos a Master por outras contas Master
                          podem ser excluídos ou desabilitados. O Master
                          original do sistema não pode ser removido.
                        </p>
                      </div>

                      {pendingRoleChange && pendingRoleChange !== user.role && (
                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                          <h4 className="text-sm font-medium text-yellow-800 mb-1">
                            Alteração Pendente
                          </h4>
                          <p className="text-xs text-yellow-700">
                            Role será alterado para{" "}
                            <strong>{pendingRoleChange}</strong> ao salvar.
                            {pendingRoleChange === "MASTER" &&
                              " Senha Master será solicitada."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Você não tem permissão para alterar roles de usuários.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "actions" && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">
                  Ações Administrativas
                </h3>

                <div className="space-y-3">
                  {canResetPassword && (
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Reset de Senha
                        </h4>
                        <p className="text-sm text-gray-500">
                          Gera uma nova senha temporária para o usuário
                        </p>
                      </div>
                      <button
                        onClick={handleResetPassword}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {loading ? "Processando..." : "Reset Senha"}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Histórico de Atividades
                      </h4>
                      <p className="text-sm text-gray-500">
                        Ver logs de auditoria do usuário
                      </p>
                    </div>
                    <button
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      onClick={() => {
                        // TODO: Implementar visualização de logs
                        alert("Funcionalidade em desenvolvimento");
                      }}
                    >
                      Ver Logs
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Sessões Ativas
                      </h4>
                      <p className="text-sm text-gray-500">
                        Gerenciar sessões ativas do usuário
                      </p>
                    </div>
                    <button
                      className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                      onClick={() => {
                        // TODO: Implementar logout forçado
                        alert("Funcionalidade em desenvolvimento");
                      }}
                    >
                      Logout Forçado
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Senha Master */}
      {showPasswordPrompt && (
        <MasterPasswordPrompt
          title="Confirmar Promoção a Master"
          onConfirm={handlePasswordConfirm}
          onClose={() => {
            setShowPasswordPrompt(false);
            setPendingRoleChange(null);
          }}
        />
      )}
    </div>
  );
};
