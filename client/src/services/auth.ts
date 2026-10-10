import { api } from '../api';
import { OkResponseSchema, UserResponseSchema } from '../apiSchemas';
import { LoginCredentials } from '../types';

export function getCurrentUser(signal?: AbortSignal) {
  return api('/api/auth/me', { signal, responseSchema: UserResponseSchema });
}

export function login(credentials: LoginCredentials) {
  return api('/api/auth/login', { method: 'POST', json: credentials, responseSchema: UserResponseSchema });
}

export function logout() {
  return api('/api/auth/logout', { method: 'POST', responseSchema: OkResponseSchema });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return api('/api/auth/change-password', {
    method: 'POST',
    json: { currentPassword, newPassword },
    responseSchema: OkResponseSchema,
  });
}