import api from './client';
import type { User } from '../types';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  register: (data: { email: string; nombre: string; password: string; telefono?: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
};
