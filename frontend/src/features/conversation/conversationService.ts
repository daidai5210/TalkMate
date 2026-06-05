import axios from 'axios';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import type { Conversation, SendMessageResult } from './types';

export async function createConversation(scenarioId: number): Promise<Conversation> {
  try {
    const { data } = await api.post<ApiResponse<Conversation>>(
      '/api/v1/conversations',
      { scenario_id: scenarioId },
    );
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
    throw new Error('创建对话失败');
  }
}

export async function getConversation(conversationId: number): Promise<Conversation> {
  try {
    const { data } = await api.get<ApiResponse<Conversation>>(
      `/api/v1/conversations/${conversationId}`,
    );
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
    throw new Error('获取对话失败');
  }
}

export async function sendMessage(
  conversationId: number,
  text: string,
): Promise<SendMessageResult> {
  try {
    const { data } = await api.post<ApiResponse<SendMessageResult>>(
      `/api/v1/conversations/${conversationId}/messages`,
      { text },
    );
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
    throw new Error('发送消息失败');
  }
}
