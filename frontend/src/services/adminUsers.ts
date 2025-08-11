import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'MASTER';
  is_active: boolean;
  created_at?: string;
}

export interface CreateUserPayload { email: string; name: string; }
export interface ChangeRolePayload { role: 'USER' | 'ADMIN'; }
export interface ChangeStatusPayload { is_active: boolean; }

export async function listUsers(params?: { role?: string; active?: boolean }) {
  const res = await api.get<AdminUser[]>('/admin/users', { params });
  return res.data;
}

export async function createUser(payload: CreateUserPayload, options?: { role?: 'USER' | 'ADMIN'; masterKey?: string }) {
  const res = await api.post<AdminUser>(`/admin/users${options?.role ? `?role=${options.role}` : ''}`,
    payload,
    { headers: options?.masterKey ? { 'X-Master-Key': options.masterKey } : undefined }
  );
  return res.data;
}

export async function changeRole(userId: string, payload: ChangeRolePayload, masterKey: string) {
  const res = await api.patch<AdminUser>(`/admin/users/${userId}/role`, payload, { headers: { 'X-Master-Key': masterKey } });
  return res.data;
}

export async function changeStatus(userId: string, payload: ChangeStatusPayload) {
  const res = await api.patch<AdminUser>(`/admin/users/${userId}/status`, payload);
  return res.data;
}
