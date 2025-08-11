import React, { useState } from 'react';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { CreateUserForm } from '../components/admin/CreateUserForm';
import { UserTable } from '../components/admin/UserTable';
import { MasterPasswordPrompt } from '../components/admin/MasterPasswordPrompt';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Toast { type: 'success' | 'error'; message: string; }

const AdminUsersPage: React.FC = () => {
  const { users, loading, actionId, create, toggleStatus, promote, demote, reload, error } = useAdminUsers();
  const { user: current } = useAuth();
  const [toast, setToast] = useState<Toast | null>(null);
  const [pendingAction, setPendingAction] = useState<null | { type: 'promote' | 'demote'; userId: string }>(null);
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

  async function executeMasterAction(masterKey: string) {
    if (!pendingAction) return;
    const target = users.find(u => u.id === pendingAction.userId);
    if (!target) return;
    try {
      if (pendingAction.type === 'promote') {
  await promote(target, masterKey);
  push({ type: 'success', message: 'Usuário promovido' });
      } else {
  await demote(target, masterKey);
  push({ type: 'success', message: 'Usuário rebaixado' });
      }
    } catch (e: any) {
      // MasterPasswordPrompt lida com erro; aqui somente mantemos estado
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Administração de Usuários</h1>

      {error && !toast && (
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
      />

      {pendingAction && (
        <MasterPasswordPrompt
          title={pendingAction.type === 'promote' ? 'Confirmar promoção para ADMIN' : 'Confirmar rebaixamento para USER'}
          onConfirm={(mk)=> executeMasterAction(mk)}
          onClose={()=> setPendingAction(null)}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
