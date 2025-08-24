import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { AdminUser } from "../../services/adminUsers";

interface Props {
  user: AdminUser;
  loading: boolean;
  onDelete: (user: AdminUser) => Promise<void>;
  currentUserRole?: AdminUser["role"];
  currentUserId?: number;
}

export const DeleteUserButton: React.FC<Props> = ({
  user,
  loading,
  onDelete,
  currentUserRole,
  currentUserId,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  // Regras de permissão para exclusão
  const canDelete = () => {
    // Não pode excluir a própria conta
    if (user.id === currentUserId) return false;

    // MASTER pode excluir qualquer usuário exceto outros MASTERs
    if (currentUserRole === "MASTER") {
      return user.role !== "MASTER";
    }

    // ADMIN pode excluir apenas usuários USER
    if (currentUserRole === "ADMIN") {
      return user.role === "USER";
    }

    return false;
  };

  const handleDelete = async () => {
    try {
      await onDelete(user);
      setShowConfirm(false);
    } catch (error) {
      // Erro será tratado pelo componente pai
      setShowConfirm(false);
    }
  };

  if (!canDelete()) {
    return null;
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-2 py-1">
        <span className="text-xs text-red-700">Confirmar exclusão?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Excluindo..." : "Sim"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      disabled={loading}
      className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
      title={`Excluir usuário ${user.name}`}
    >
      <Trash2 size={14} />
    </button>
  );
};
