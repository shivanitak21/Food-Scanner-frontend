import { api } from '@/services/api/client';
import type { AuthSession, User } from '@/types/models';
import { ApiError } from '@/utils/errors';
import { normalizeAuth, normalizeUser } from '@/utils/normalize';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const response = await api.post('/api/auth/register', {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
  try {
    return normalizeAuth(response.data);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'The server did not return a session token.');
  }
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const response = await api.post('/api/auth/login', {
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
  try {
    return normalizeAuth(response.data);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'The server did not return a session token.');
  }
}

export async function fetchMe(): Promise<User> {
  const response = await api.get('/api/users/me');
  return normalizeUser(response.data);
}
