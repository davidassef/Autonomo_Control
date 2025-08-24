import React from "react";
import { AdminUser } from "../services/adminUsers";
import { Ban, Shield } from "lucide-react";

interface BlockUserButtonProps {
  user: AdminUser;
  onBlock: (user: AdminUser) => Promise<void>;
  onUnblock: (user: AdminUser) => Promise<void>;
  loading?: boolean;
}

export function BlockUserButton({
  user,
  onBlock,
  onUnblock,
  loading,
}: BlockUserButtonProps) {
  // Não mostrar botão para MASTER
  if (user.role === "MASTER") {
    return null;
  }

  const isBlocked = !!user.blocked_at;

  const handleClick = async () => {
    try {
      if (isBlocked) {
        await onUnblock(user);
      } else {
        await onBlock(user);
      }
    } catch (error) {
      console.error("Erro ao alterar status de bloqueio:", error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md
        transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${
          isBlocked
            ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
            : "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
        }
      `}
      title={isBlocked ? "Desbloquear usuário" : "Bloquear usuário"}
    >
      {isBlocked ? (
        <>
          <Shield className="w-3 h-3" />
          Desbloquear
        </>
      ) : (
        <>
          <Ban className="w-3 h-3" />
          Bloquear
        </>
      )}
    </button>
  );
}
