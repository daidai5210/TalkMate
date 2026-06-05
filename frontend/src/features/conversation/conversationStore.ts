import { create } from 'zustand';
import type { Conversation, Message, ScenarioSummary } from './types';
import {
  createConversation as createApi,
  getConversation as getApi,
  sendMessage as sendApi,
} from './conversationService';

interface ConversationState {
  conversation: Conversation | null;
  loading: boolean;
  sending: boolean;
  error: string | null;
  initFromScenario: (scenario: ScenarioSummary) => Promise<void>;
  loadExisting: (conversationId: number, options?: { persistCurrent?: boolean }) => Promise<void>;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

let activeConversationRequestId = 0;

function nextConversationRequestId(): number {
  activeConversationRequestId += 1;
  return activeConversationRequestId;
}

function isLatestConversationRequest(requestId: number): boolean {
  return requestId === activeConversationRequestId;
}

function getStoredConvId(scenarioId: number): number | null {
  try {
    const raw = sessionStorage.getItem(`talkmate_conv_${scenarioId}`);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function storeConvId(scenarioId: number, conversationId: number): void {
  try {
    sessionStorage.setItem(`talkmate_conv_${scenarioId}`, String(conversationId));
  } catch {
    // ignore storage errors
  }
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversation: null,
  loading: false,
  sending: false,
  error: null,
  initFromScenario: async (scenario) => {
    const requestId = nextConversationRequestId();
    set({ loading: true, error: null });
    try {
      const existingId = getStoredConvId(scenario.id);
      if (existingId) {
        try {
          const conv = await getApi(existingId);
          if (!isLatestConversationRequest(requestId)) return;
          set({ conversation: conv, loading: false });
          return;
        } catch {
          if (!isLatestConversationRequest(requestId)) return;
          // existing conv not found, fall through to create new
          sessionStorage.removeItem(`talkmate_conv_${scenario.id}`);
        }
      }
      const conv = await createApi(scenario.id);
      if (!isLatestConversationRequest(requestId)) return;
      storeConvId(scenario.id, conv.id);
      set({ conversation: conv, loading: false });
    } catch (err) {
      if (!isLatestConversationRequest(requestId)) return;
      const message = err instanceof Error ? err.message : '加载对话失败';
      set({ loading: false, error: message });
    }
  },
  loadExisting: async (conversationId, options) => {
    const requestId = nextConversationRequestId();
    const persistCurrent = options?.persistCurrent ?? true;
    set({ loading: true, error: null });
    try {
      const conv = await getApi(conversationId);
      if (!isLatestConversationRequest(requestId)) return;
      if (persistCurrent) {
        storeConvId(conv.scenario.id, conv.id);
      }
      set({ conversation: conv, loading: false });
    } catch (err) {
      if (!isLatestConversationRequest(requestId)) return;
      const message = err instanceof Error ? err.message : '加载对话失败';
      set({ loading: false, error: message });
    }
  },
  send: async (text) => {
    const current = get().conversation;
    if (!current) {
      throw new Error('对话未就绪');
    }
    const conversationId = current.id;
    const requestId = activeConversationRequestId;
    const isCurrentSendTarget = () =>
      isLatestConversationRequest(requestId) && get().conversation?.id === conversationId;
    const tempId = -Date.now();
    const optimistic: Message = {
      id: tempId,
      role: 'user',
      text,
      created_at: new Date().toISOString(),
    };
    set({
      sending: true,
      conversation: {
        ...current,
        messages: [...current.messages, optimistic],
      },
    });
    try {
      const result = await sendApi(conversationId, text);
      if (!isCurrentSendTarget()) return;
      const updated = get().conversation;
      if (!updated) return;
      const realMessages = updated.messages.map((m) =>
        m.id === tempId ? result.user_message : m,
      );
      set({
        sending: false,
        conversation: {
          ...updated,
          messages: [...realMessages, result.ai_message],
        },
      });
    } catch (err) {
      if (!isCurrentSendTarget()) return;
      const message = err instanceof Error ? err.message : '发送消息失败';
      set((s) => ({
        sending: false,
        error: message,
        conversation: s.conversation
          ? {
              ...s.conversation,
              messages: s.conversation.messages.filter((m) => m.id !== tempId),
            }
          : s.conversation,
      }));
      throw err;
    }
  },
  reset: () => {
    nextConversationRequestId();
    set({ conversation: null, loading: false, sending: false, error: null });
  },
}));
