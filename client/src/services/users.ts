import { api } from '../api';
import { UserListResponseSchema, UserResponseSchema } from '../apiSchemas';
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

export function listUsers(search: string, signal?: AbortSignal) {
  return api(`/api/users?q=${encodeURIComponent(search)}`, {
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