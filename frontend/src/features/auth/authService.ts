import axios from 'axios';
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

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function register(payload: RegisterPayload): Promise<UserPublic> {
  try {
    const { data } = await api.post<ApiResponse<UserPublic>>(
      '/api/v1/auth/register',
      payload,
    );
    if (data.code !== 0 || !data.data) {
      throw new Error(data.message);
    }
    return data.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, '注册失败'));
  }
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  try {
    const { data } = await api.post<ApiResponse<LoginResult>>(
      '/api/v1/auth/login',
      payload,
    );
    if (data.code !== 0 || !data.data) {
      throw new Error(data.message);
    }
    tokenStorage.set(data.data.token);
    return data.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, '登录失败'));
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post<ApiResponse<null>>('/api/v1/auth/logout');
  } finally {
    tokenStorage.clear();
  }
}
