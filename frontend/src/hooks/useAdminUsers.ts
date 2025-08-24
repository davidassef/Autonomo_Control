import { useCallback, useEffect, useState } from "react";
import {
  AdminUser,
  listUsers,
  createUser,
  changeRole,
  changeStatus,
  resetUserPassword,
  blockUser,
  unblockUser,
  toggleAdminVisibility,
  deleteUser,
} from "../services/adminUsers";

interface State {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  actionId: number | null;
}

export function useAdminUsers() {
  const [state, setState] = useState<State>({
    users: [],
    loading: true,
    error: null,
    actionId: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await listUsers();
      setState((s) => ({ ...s, users: data, loading: false }));
    } catch (e: any) {
      setState((s) => ({
        ...s,
        error: e?.response?.data?.detail || "Erro ao carregar usuários",
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (
      email: string,
      name: string,
      role: "USER" | "ADMIN",
      masterKey?: string,
    ) => {
      const user = await createUser({ email, name }, { role, masterKey });
      setState((s) => ({ ...s, users: [user, ...s.users] }));
      return user;
    },
    [],
  );

  const setAction = (id: number | null) =>
    setState((s) => ({ ...s, actionId: id }));

  const toggleStatus = useCallback(async (user: AdminUser) => {
    setAction(user.id);
    try {
      const updated = await changeStatus(user.id, {
        is_active: !user.is_active,
      });
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === user.id ? updated : u)),
      }));
      return updated;
    } finally {
      setAction(null);
    }
  }, []);

  const changeUserRole = useCallback(
    async (user: AdminUser, newRole: AdminUser["role"], masterKey: string) => {
      if (user.role === newRole) return user;
      setAction(user.id);
      try {
        const updated = await changeRole(user.id, { role: newRole }, masterKey);
        setState((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === user.id ? updated : u)),
        }));
        return updated;
      } finally {
        setAction(null);
      }
    },
    [],
  );

  // Manter funções legacy para compatibilidade
  const promote = useCallback(
    async (user: AdminUser, masterKey: string) => {
      return changeUserRole(user, "ADMIN", masterKey);
    },
    [changeUserRole],
  );

  const demote = useCallback(
    async (user: AdminUser, masterKey: string) => {
      return changeUserRole(user, "USER", masterKey);
    },
    [changeUserRole],
  );

  const resetPassword = useCallback(async (user: AdminUser) => {
    setAction(user.id);
    try {
      const result = await resetUserPassword(user.id);
      return result;
    } finally {
      setAction(null);
    }
  }, []);

  const block = useCallback(async (user: AdminUser) => {
    setAction(user.id);
    try {
      const result = await blockUser(user.id);
      // Atualizar o usuário como inativo e bloqueado
      const updatedUser = {
        ...user,
        is_active: false,
        blocked_at: result.blocked_at,
      };
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === user.id ? updatedUser : u)),
      }));
      return result;
    } finally {
      setAction(null);
    }
  }, []);

  const unblock = useCallback(async (user: AdminUser) => {
    setAction(user.id);
    try {
      const result = await unblockUser(user.id);
      // Atualizar o usuário como ativo e desbloqueado
      const updatedUser = { ...user, is_active: true, blocked_at: undefined };
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === user.id ? updatedUser : u)),
      }));
      return result;
    } finally {
      setAction(null);
    }
  }, []);

  const toggleVisibility = useCallback(
    async (user: AdminUser, masterKey: string) => {
      if (user.role !== "ADMIN") return user;
      setAction(user.id);
      try {
        const updated = await toggleAdminVisibility(
          user.id,
          { can_view_admins: !user.can_view_admins },
          masterKey,
        );
        setState((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === user.id ? updated : u)),
        }));
        return updated;
      } finally {
        setAction(null);
      }
    },
    [],
  );

  const deleteUserAccount = useCallback(async (user: AdminUser) => {
    setAction(user.id);
    try {
      const result = await deleteUser(user.id);
      // Remove o usuário da lista
      setState((s) => ({
        ...s,
        users: s.users.filter((u) => u.id !== user.id),
      }));
      return result;
    } finally {
      setAction(null);
    }
  }, []);

  const updateUser = useCallback(async (user: AdminUser) => {
    setAction(user.id);
    try {
      // Atualizar apenas campos básicos como email, nome e status
      const updated = await changeStatus(user.id, {
        is_active: user.is_active,
      });
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === user.id ? { ...u, ...user } : u)),
      }));
      return updated;
    } finally {
      setAction(null);
    }
  }, []);

  return {
    ...state,
    reload: load,
    create,
    toggleStatus,
    promote,
    demote,
    changeUserRole,
    resetPassword,
    block,
    unblock,
    toggleVisibility,
    deleteUserAccount,
    updateUser,
  };
}
