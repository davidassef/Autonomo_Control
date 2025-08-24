import React, { useState, useMemo } from "react";
import { AdminUser } from "../../services/adminUsers";
import { RoleBadge } from "./RoleBadge";
import { EditUserModal } from "./EditUserModal";

interface Props {
  users: AdminUser[];
  loading: boolean;
  actionId: number | null;
  currentUserId?: number;
  currentUserRole?: AdminUser["role"];
  onToggleStatus: (u: AdminUser) => void;
  onPromote: (u: AdminUser) => void;
  onDemote: (u: AdminUser) => void;
  onChangeRole: (u: AdminUser, newRole: "USER" | "ADMIN" | "MASTER") => void;
  onResetPassword: (u: AdminUser) => Promise<any>;
  onBlock: (u: AdminUser) => Promise<any>;
  onUnblock: (u: AdminUser) => Promise<any>;
  onDelete: (u: AdminUser) => Promise<void>;
  onUpdateUser?: (u: AdminUser) => Promise<void>;
}
export const UserTable: React.FC<Props> = ({
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
}) => {
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Calcular largura automática das colunas baseada no conteúdo
  const columnWidths = useMemo(() => {
    if (!users.length) return {};

    const maxEmailLength = Math.max(
      ...users.map((u) => u.email.length),
      "Email".length,
    );
    const maxNameLength = Math.max(
      ...users.map((u) => (u.name || "").length),
      "Nome".length,
    );

    return {
      email: Math.max(maxEmailLength * 8 + 40, 200), // 8px por char + padding
      name: Math.max(maxNameLength * 8 + 40, 150),
      role: 100,
      status: 120,
      actions: 200,
    };
  }, [users]);

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
  };

  const handleSaveUser = async (userId: number, data: Partial<AdminUser>) => {
    if (onUpdateUser) {
      const updatedUser = { ...editingUser!, ...data };
      await onUpdateUser(updatedUser);
    }
    setEditingUser(null);
  };

  const handleDeactivate = async (user: AdminUser) => {
    if (user.is_active) {
      onToggleStatus(user);
    }
  };

  const handleBlock = async (user: AdminUser) => {
    if (!user.blocked_at) {
      await onBlock(user);
    } else {
      await onUnblock(user);
    }
  };
  return (
    <>
      <div className="bg-white shadow rounded border overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="text-left px-3 py-2"
                style={{ width: columnWidths.email }}
              >
                Email
              </th>
              <th
                className="text-left px-3 py-2"
                style={{ width: columnWidths.name }}
              >
                Nome
              </th>
              <th
                className="text-left px-3 py-2"
                style={{ width: columnWidths.role }}
              >
                Role
              </th>
              <th
                className="text-left px-3 py-2"
                style={{ width: columnWidths.status }}
              >
                Status
              </th>
              <th
                className="text-left px-3 py-2"
                style={{ width: columnWidths.actions }}
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-t">
                  <td className="px-3 py-2">
                    <div className="h-3 bg-gray-200 rounded w-40" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-5 bg-gray-200 rounded w-16" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-5 bg-gray-200 rounded w-14" />
                  </td>
                  <td className="px-3 py-2 flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16" />
                    <div className="h-6 bg-gray-200 rounded w-20" />
                    <div className="h-6 bg-gray-200 rounded w-18" />
                  </td>
                </tr>
              ))}
            {!loading && users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Nenhum usuário encontrado
                    </div>
                    <div className="text-xs text-gray-400">
                      Use o formulário acima para adicionar o primeiro.
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{user.email}</td>
                  <td className="px-3 py-2">{user.name || "-"}</td>
                  <td className="px-3 py-2">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Ativo" : "Inativo"}
                      {user.blocked_at && " (Bloqueado)"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        disabled={actionId === user.id}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeactivate(user)}
                        disabled={actionId === user.id || !user.is_active}
                        className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                      >
                        Desativar
                      </button>
                      <button
                        onClick={() => handleBlock(user)}
                        disabled={actionId === user.id}
                        className={`px-3 py-1 text-xs rounded disabled:opacity-50 ${
                          user.blocked_at
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        {user.blocked_at ? "Desbloquear" : "Bloquear"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          onResetPassword={onResetPassword}
          onChangeRole={onChangeRole}
          currentUserRole={currentUserRole}
        />
      )}
    </>
  );
};
