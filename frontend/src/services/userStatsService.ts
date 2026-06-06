import api from './api';
import type { ApiResponse } from '../types';

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface ScorePoint {
  date: string;
  score: number;
  type: 'conversation' | 'card';
}

export interface Achievement {
  key: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
}

export async function fetchHeatmap(days = 90): Promise<HeatmapDay[]> {
  const { data } = await api.get<ApiResponse<HeatmapDay[]>>('/api/v1/user/heatmap', {
    params: { days },
  });
  if (data.code !== 0 || !data.data) {
    throw new Error(data.message || '获取热力图失败');
  }
  return data.data;
}

export async function fetchScoreTrend(days = 30): Promise<ScorePoint[]> {
  const { data } = await api.get<ApiResponse<ScorePoint[]>>('/api/v1/user/score-trend', {
    params: { days },
  });
  if (data.code !== 0 || !data.data) {
    throw new Error(data.message || '获取趋势图失败');
  }
  return data.data;
}

export async function fetchAchievements(): Promise<Achievement[]> {
  const { data } = await api.get<ApiResponse<Achievement[]>>('/api/v1/practice-cards/achievements');
  if (data.code !== 0 || !data.data) {
    throw new Error(data.message || '获取成就失败');
  }
  return data.data;
}

export function computeStreakDays(heatmap: HeatmapDay[]): number {
  const sorted = [...heatmap]
    .filter((d) => d.count > 0)
    .map((d) => d.date)
    .sort()
    .reverse();

  if (sorted.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(Date.now() - (streak + 1) * 86400000)
      .toISOString()
      .split('T')[0];
    if (sorted[i] === today || sorted[i] === expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
