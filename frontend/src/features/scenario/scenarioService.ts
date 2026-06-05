import axios from 'axios';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import type { Scenario } from './types';

export async function listScenarios(): Promise<Scenario[]> {
  try {
    const { data } = await api.get<ApiResponse<Scenario[]>>('/api/v1/scenarios');
    if (data.code !== 0 || !data.data) {
      throw new Error(data.message);
    }
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as { message?: string } | undefined;
      if (body?.message) throw new Error(body.message);
    }
    if (err instanceof Error) throw err;
    throw new Error('获取场景失败');
  }
}
