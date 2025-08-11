import React from 'react';
import { AdminUser } from '../../services/adminUsers';

interface Props {
  user: AdminUser;
  loading: boolean;
  onPromote: (u: AdminUser) => void;
  onDemote: (u: AdminUser) => void;
}
export const PromoteDemoteButton: React.FC<Props> = ({ user, loading, onPromote, onDemote }) => {
  if (user.role === 'USER') {
    return <button disabled={loading} onClick={() => onPromote(user)} className="text-xs border px-2 py-1 rounded">Promover</button>;
  }
  if (user.role === 'ADMIN') {
    return <button disabled={loading} onClick={() => onDemote(user)} className="text-xs border px-2 py-1 rounded">Rebaixar</button>;
  }
  return null;
};
