import React, { useState } from 'react';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { CreateUserForm } from '../components/admin/CreateUserForm';
import { UserTable } from '../components/admin/UserTable';
import { MasterPasswordPrompt } from '../components/admin/MasterPasswordPrompt';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/Layout';

const AdminUsersPage: React.FC = () => {
  const { users, loading, actionId, create, toggleStatus, promote, demote, resetPassword, block, unblock, toggleVisibility, deleteUserAccount, reload, error } = useAdminUsers();
  const { user: current } = useAuth();
  const [pendingAction, setPendingAction] = useState<null | { type: 'promote' | 'demote' | 'toggleVisibility'; userId: string }>(null);
  const { push } = useToast();

  async function handleCreate(email: string, name: string, role: 'USER'|'ADMIN', masterKey?: string) {
    try {
      await create(email, name, role, masterKey);
  push({ type: 'success', message: 'Usuário criado' });
    } catch (e: any) {
  push({ type: 'error', message: e?.response?.data?.detail || 'Falha ao criar usuário' });
      throw e;
    }
  }

  function onPromote(uId: string) {
    setPendingAction({ type: 'promote', userId: uId });
  }
  function onDemote(uId: string) {
    setPendingAction({ type: 'demote', userId: uId });
  }

  function onToggleVisibility(uId: string) {
    setPendingAction({ type: 'toggleVisibility', userId: uId });
  }

  async function executeMasterAction(masterKey: string) {
    if (!pendingAction) return;
    const target = users.find(u => u.id === pendingAction.userId);
    if (!target) return;
    try {
      if (pendingAction.type === 'promote') {
        await promote(target, masterKey);
        push({ type: 'success', message: 'Usuário promovido' });
      } else if (pendingAction.type === 'demote') {
        await demote(target, masterKey);
        push({ type: 'success', message: 'Usuário rebaixado' });
      } else if (pendingAction.type === 'toggleVisibility') {
        await toggleVisibility(target, masterKey);
        const newStatus = target.can_view_admins ? 'não pode mais' : 'agora pode';
        push({ type: 'success', message: `ADMIN ${newStatus} ver outros ADMINs` });
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
      push({ type: 'success', message: `Senha resetada! Email enviado para ${user.email}` });
      return result;
    } catch (e: any) {
      push({ type: 'error', message: e?.response?.data?.detail || 'Falha ao resetar senha' });
      throw e;
    }
  }

  async function handleBlock(user: any) {
    try {
      const result = await block(user);
      push({ type: 'success', message: `Usuário ${user.name} foi bloqueado com sucesso` });
      return result;
    } catch (e: any) {
      push({ type: 'error', message: e?.response?.data?.detail || 'Falha ao bloquear usuário' });
      throw e;
    }
  }

  async function handleUnblock(user: any) {
    try {
      const result = await unblock(user);
      push({ type: 'success', message: `Usuário ${user.name} foi desbloqueado com sucesso` });
      return result;
    } catch (e: any) {
      push({ type: 'error', message: e?.response?.data?.detail || 'Falha ao desbloquear usuário' });
      throw e;
    }
  }

  async function handleDelete(user: any): Promise<void> {
    try {
      await deleteUserAccount(user);
      push({ type: 'success', message: `Usuário ${user.name} foi excluído com sucesso` });
    } catch (e: any) {
      push({ type: 'error', message: e?.response?.data?.detail || 'Falha ao excluir usuário' });
      throw e;
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Administração de Usuários</h1>

        {error && (
          <div className="border px-3 py-2 rounded text-sm bg-red-100 border-red-400 text-red-800">{error}</div>
        )}

        <CreateUserForm onCreate={handleCreate} canCreateAdmin={current?.role === 'MASTER'} />
        <div className="flex gap-2">
          <button type="button" onClick={reload} className="border px-4 py-2 rounded text-sm">Atualizar</button>
        </div>

        <UserTable
          users={users}
          loading={loading}
          actionId={actionId}
          currentUserId={current?.id}
          currentUserRole={current?.role}
          onToggleStatus={(u)=>{
            toggleStatus(u).then(()=> push({ type: 'success', message: 'Status atualizado' })).catch(e=> push({ type:'error', message: e?.response?.data?.detail || 'Erro ao alterar status'}));
          }}
          onPromote={(u)=> onPromote(u.id)}
          onDemote={(u)=> onDemote(u.id)}
          onResetPassword={handleResetPassword}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
          onToggleVisibility={current?.role === 'MASTER' ? (u) => onToggleVisibility(u.id) : undefined}
          onDelete={handleDelete}
        />

        {pendingAction && (
          <MasterPasswordPrompt
            title={
              pendingAction.type === 'promote' 
                ? 'Confirmar promoção para ADMIN' 
                : pendingAction.type === 'demote'
                  ? 'Confirmar rebaixamento para USER'
                  : 'Confirmar alteração de visibilidade'
            }
            onConfirm={(mk)=> executeMasterAction(mk)}
            onClose={()=> setPendingAction(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default AdminUsersPage;
