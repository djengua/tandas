import api from './client';
import type { User } from '../types';

export const usersApi = {
  search: (email: string) =>
    api.get<User[]>('/users/search', { params: { email } }).then((r) => r.data),
};
