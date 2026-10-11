import { api } from '../api';
import { OkResponseSchema, UserListResponseSchema, UserResponseSchema } from '../apiSchemas';
import { User } from '../types';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: User['role'];
  phone: string;
  dob: string;
  isActive: boolean;
}

export function listUsers(search: string, signal?: AbortSignal, role?: User['role']) {
  const roleQuery = role ? `&role=${role}` : '';
  return api(`/api/users?q=${encodeURIComponent(search)}${roleQuery}`, {
    signal,
    responseSchema: UserListResponseSchema,
  });
}

export function createUser(payload: CreateUserPayload) {
  return api('/api/users', { method: 'POST', json: payload, responseSchema: UserResponseSchema });
}

export function setUserActive(id: string, isActive: boolean) {
  return api(`/api/users/${id}`, {
    method: 'PATCH',
    json: { isActive },
    responseSchema: UserResponseSchema,
  });
}

export function permanentlyDeleteUser(id: string) {
  return api(`/api/users/${id}`, { method: 'DELETE', responseSchema: OkResponseSchema });
}