import React from 'react';
import { AdminUser } from '../../services/adminUsers';

interface Props { user: AdminUser; disabled?: boolean; onToggle: (u: AdminUser) => void; loading: boolean; }
export const StatusToggle: React.FC<Props> = ({ user, disabled, onToggle, loading }) => {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={() => onToggle(user)}
      className={`text-xs border px-2 py-1 rounded ${loading ? 'opacity-50 cursor-wait' : ''}`}
    >
      {user.is_active ? 'Desativar' : 'Ativar'}
    </button>
  );
};
