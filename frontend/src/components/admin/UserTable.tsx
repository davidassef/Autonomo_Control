import React from 'react';
import { AdminUser } from '../../services/adminUsers';
import { RoleBadge } from './RoleBadge';
import { StatusToggle } from './StatusToggle';
import { PromoteDemoteButton } from './PromoteDemoteButton';
import { ResetPasswordButton } from './ResetPasswordButton';
import { BlockUserButton } from '../BlockUserButton';
import { AdminVisibilityToggle } from './AdminVisibilityToggle';
import { DeleteUserButton } from './DeleteUserButton';

interface Props {
  users: AdminUser[];
  loading: boolean;
  actionId: string | null;
  currentUserId?: string;
  currentUserRole?: AdminUser['role'];
  onToggleStatus: (u: AdminUser) => void;
  onPromote: (u: AdminUser) => void;
  onDemote: (u: AdminUser) => void;
  onResetPassword: (u: AdminUser) => Promise<any>;
  onBlock: (u: AdminUser) => Promise<any>;
  onUnblock: (u: AdminUser) => Promise<any>;
  onToggleVisibility?: (u: AdminUser) => void;
  onDelete: (u: AdminUser) => Promise<void>;
}
export const UserTable: React.FC<Props> = ({ users, loading, actionId, currentUserId, currentUserRole, onToggleStatus, onPromote, onDemote, onResetPassword, onBlock, onUnblock, onToggleVisibility, onDelete }) => {
  return (
    <div className="bg-white shadow rounded border overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-3 py-2">Email</th>
            <th className="text-left px-3 py-2">Nome</th>
            <th className="text-left px-3 py-2">Role</th>
            <th className="text-left px-3 py-2">Status</th>
            {currentUserRole === 'MASTER' && <th className="text-left px-3 py-2">Visibilidade</th>}
            <th className="text-left px-3 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            Array.from({ length: 4 }).map((_,i)=>(
              <tr key={i} className="animate-pulse border-t">
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-40" /></td>
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                <td className="px-3 py-2"><div className="h-5 bg-gray-200 rounded w-16" /></td>
                <td className="px-3 py-2"><div className="h-5 bg-gray-200 rounded w-14" /></td>
                {currentUserRole === 'MASTER' && <td className="px-3 py-2"><div className="h-5 bg-gray-200 rounded w-12" /></td>}
                <td className="px-3 py-2 flex gap-2"><div className="h-6 bg-gray-200 rounded w-20" /><div className="h-6 bg-gray-200 rounded w-20" /></td>
              </tr>
            ))
          )}
          {!loading && users.length === 0 && (
            <tr><td colSpan={currentUserRole === 'MASTER' ? 6 : 5} className="px-6 py-10 text-center text-gray-500">
              <div className="space-y-2">
                <div className="text-sm font-medium">Nenhum usuário encontrado</div>
                <div className="text-xs text-gray-400">Use o formulário acima para adicionar o primeiro.</div>
              </div>
            </td></tr>
          )}
          {users.map(u => {
            const statusCls = u.blocked_at 
              ? 'bg-orange-100 text-orange-700' 
              : u.is_active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700';
            const statusText = u.blocked_at 
              ? 'Bloqueado' 
              : u.is_active 
                ? 'Ativo' 
                : 'Inativo';
            return (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2"><RoleBadge role={u.role} /></td>
                <td className="px-3 py-2"><span className={`px-2 py-1 rounded text-xs ${statusCls}`}>{statusText}</span></td>
                {currentUserRole === 'MASTER' && (
                  <td className="px-3 py-2">
                    <AdminVisibilityToggle
                      user={u}
                      loading={actionId === u.id}
                      onToggle={onToggleVisibility || (() => {})}
                      disabled={!onToggleVisibility}
                    />
                  </td>
                )}
                <td className="px-3 py-2 flex gap-2 flex-wrap">
                  <StatusToggle
                    user={u}
                    loading={actionId===u.id}
                    onToggle={onToggleStatus}
                    disabled={u.id===currentUserId || u.role==='MASTER' || (currentUserRole==='ADMIN' && u.role==='ADMIN')}
                  />
                  <PromoteDemoteButton
                    user={u}
                    loading={actionId===u.id}
                    onPromote={(target)=>{
                      if (currentUserRole!=='MASTER') return; // only master
                      onPromote(target);
                    }}
                    onDemote={(target)=>{
                      if (currentUserRole!=='MASTER') return; // only master
                      onDemote(target);
                    }}
                  />
                  <ResetPasswordButton
                    user={u}
                    loading={actionId===u.id}
                    onResetPassword={onResetPassword}
                    currentUserRole={currentUserRole}
                  />
                  <BlockUserButton
                    user={u}
                    loading={actionId===u.id}
                    onBlock={onBlock}
                    onUnblock={onUnblock}
                  />
                  <DeleteUserButton
                    user={u}
                    loading={actionId===u.id}
                    onDelete={onDelete}
                    currentUserRole={currentUserRole}
                    currentUserId={currentUserId}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
