import api from './api';
import type { ApiResponse } from '../types';

export interface ErrorProfileItem {
  error_type: string;
  label: string;
  total_count: number;
  recent_count: number;
}

export interface ErrorSummaryResponse {
  total_conversations: number;
  window_size: number;
  profiles: ErrorProfileItem[];
  has_enough_data: boolean;
}

export interface NextGoalResponse {
  has_enough_data: boolean;
  recommended_scenario_id?: number;
  recommended_scenario_name?: string;
  focus_error_type?: string;
  focus_error_label?: string;
  reason?: string;
  hint?: string;
}

export async function getErrorSummary(): Promise<ErrorSummaryResponse> {
  const { data } = await api.get<ApiResponse<ErrorSummaryResponse>>(
    '/api/v1/profile/error-summary',
  );
  if (data.code !== 0 || !data.data) {
    throw new Error(data.message || '获取画像失败');
  }
  return data.data;
}

export async function getNextGoal(): Promise<NextGoalResponse> {
  const { data } = await api.get<ApiResponse<NextGoalResponse>>(
    '/api/v1/profile/next-goal',
  );
  if (data.code !== 0 || !data.data) {
    throw new Error(data.message || '获取推荐失败');
  }
  return data.data;
}