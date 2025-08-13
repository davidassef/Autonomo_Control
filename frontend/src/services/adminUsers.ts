import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'MASTER';
  is_active: boolean;
  created_at?: string;
  blocked_at?: string;
  blocked_by?: string;
  can_view_admins?: boolean;
  promoted_by?: string;
  demoted_by?: string;
  demoted_at?: string;
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

export async function changeStatus(userId: string, payload: ChangeStatusPayload, masterKey?: string) {
  const headers = masterKey ? { 'X-Master-Key': masterKey } : undefined;
  const res = await api.patch<AdminUser>(`/admin/users/${userId}/status`, payload, { headers });
  return res.data;
}

export interface ResetPasswordResponse {
  message: string;
  email_sent: boolean;
  expires_at: string;
}

export async function resetUserPassword(userId: string) {
  const res = await api.post<ResetPasswordResponse>(`/admin/users/${userId}/reset-password`);
  return res.data;
}

export interface BlockUserResponse {
  message: string;
  blocked_at: string;
  blocked_by: string;
}

export interface UnblockUserResponse {
  message: string;
  unblocked_at: string;
  unblocked_by: string;
}

export async function blockUser(userId: string) {
  const res = await api.post<BlockUserResponse>(`/admin/users/${userId}/block`);
  return res.data;
}

export async function unblockUser(userId: string) {
  const res = await api.post<UnblockUserResponse>(`/admin/users/${userId}/unblock`);
  return res.data;
}

export interface ToggleAdminVisibilityPayload {
  can_view_admins: boolean;
}

export async function toggleAdminVisibility(userId: string, payload: ToggleAdminVisibilityPayload, masterKey: string) {
  const res = await api.patch<AdminUser>(`/admin/users/${userId}/admin-visibility`, payload, {
    headers: { 'X-Master-Key': masterKey }
  });
  return res.data;
}

export interface DeleteUserResponse {
  message: string;
  deleted_user_data: {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string | null;
    was_blocked: boolean;
  };
}

export async function deleteUser(userId: string) {
  const res = await api.delete<DeleteUserResponse>(`/admin/users/${userId}`);
  return res.data;
}
