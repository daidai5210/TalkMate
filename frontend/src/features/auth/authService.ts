import api, { tokenStorage } from '../../services/api';
import type { ApiResponse, LoginResult, UserPublic } from '../../types';

export interface RegisterPayload {
  username: string;
  password: string;
  captcha: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<UserPublic> {
  const { data } = await api.post<ApiResponse<UserPublic>>(
    '/api/v1/auth/register',
    payload,
  );
  if (data.code !== 0 || !data.data) {
    throw new Error(data.message);
  }
  return data.data;
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await api.post<ApiResponse<LoginResult>>(
    '/api/v1/auth/login',
    payload,
  );
  if (data.code !== 0 || !data.data) {
    throw new Error(data.message);
  }
  tokenStorage.set(data.data.token);
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post<ApiResponse<null>>('/api/v1/auth/logout');
  tokenStorage.clear();
}
