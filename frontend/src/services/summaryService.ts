import axios from 'axios';
import api from './api';
import type { ApiResponse } from '../types';

export interface FeedbackItem {
  original: string;
  corrected: string;
  reason: string;
  suggestion: string;
}

export interface SuggestionItem {
  category: string;
  content: string;
}

export interface GrammarIssues {
  tense_errors?: number;
  subject_verb_agreement?: number;
  article_usage?: number;
  word_order?: number;
  other?: number;
  [key: string]: number | undefined;
}

export interface VocabularyUsage {
  unique_words?: number;
  advanced_words_used?: string[];
  repetitive_words?: string[];
  level?: string;
  [key: string]: string | string[] | number | undefined;
}

export interface ExampleSentence {
  original: string;
  improved: string;
  explanation: string;
}

export interface ConversationSummary {
  id: number;
  conversation_id: number;
  score: number;
  feedback: FeedbackItem[];
  suggestions: SuggestionItem[];
  grammar_issues: GrammarIssues | null;
  vocabulary_usage: VocabularyUsage | null;
  example_sentences?: ExampleSentence[];
  next_practice_advice?: string;
  created_at: string;
}

export class SummaryApiError extends Error {
  code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = 'SummaryApiError';
    this.code = code;
  }
}

function normalizeApiError(err: unknown, fallback: string): Error {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { code?: number; message?: string } | undefined;
    if (body?.message) return new SummaryApiError(body.message, body.code);
  }
  if (err instanceof Error) return err;
  return new Error(fallback);
}

export async function generateSummary(
  conversationId: number,
): Promise<ConversationSummary> {
  try {
    const { data } = await api.post<ApiResponse<ConversationSummary>>(
      `/api/v1/conversations/${conversationId}/summary`,
    );
    if (data.code !== 0 || !data.data) {
      throw new Error(data.message || '生成总结失败');
    }
    return data.data;
  } catch (err) {
    throw normalizeApiError(err, '生成总结失败');
  }
}

export async function getSummary(
  conversationId: number,
): Promise<ConversationSummary> {
  try {
    const { data } = await api.get<ApiResponse<ConversationSummary>>(
      `/api/v1/conversations/${conversationId}/summary`,
    );
    if (data.code !== 0 || !data.data) {
      throw new Error(data.message || '获取总结失败');
    }
    return data.data;
  } catch (err) {
    throw normalizeApiError(err, '获取总结失败');
  }
}
