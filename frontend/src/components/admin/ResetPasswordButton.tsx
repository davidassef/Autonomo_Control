import React, { useState } from 'react';
import { AdminUser } from '../../services/adminUsers';
import { Key, Mail } from 'lucide-react';

interface Props {
  user: AdminUser;
  loading: boolean;
  onResetPassword: (user: AdminUser) => Promise<any>;
  currentUserRole?: AdminUser['role'];
}

export const ResetPasswordButton: React.FC<Props> = ({ user, loading, onResetPassword, currentUserRole }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Não permitir reset de senha do MASTER
  if (user.role === 'MASTER') {
    return null;
  }

  // Verificar se o usuário tem email válido
  const hasValidEmail = user.email && user.email.includes('@') && !user.email.includes('placeholder');

  const handleReset = async () => {
    if (!hasValidEmail) {
      alert('Usuário não possui email válido para receber a senha temporária.');
      return;
    }

    setIsResetting(true);
    try {
      await onResetPassword(user);
      alert(`Senha resetada com sucesso! Email enviado para ${user.email}. A senha temporária expira em 24 horas.`);
      setShowConfirm(false);
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Erro ao resetar senha';
      alert(`Erro: ${message}`);
    } finally {
      setIsResetting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleReset}
          disabled={isResetting || loading}
          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
        >
          {isResetting ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Key size={12} />
          )}
          Confirmar
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isResetting || loading}
          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      disabled={loading || !hasValidEmail}
      className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
        hasValidEmail
          ? 'bg-orange-600 text-white hover:bg-orange-700'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      } disabled:opacity-50`}
      title={hasValidEmail ? 'Resetar senha e enviar nova senha por email' : 'Usuário não possui email válido'}
    >
      <Key size={12} />
      {hasValidEmail && <Mail size={12} />}
      Reset
    </button>
  );
};