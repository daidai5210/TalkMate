import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from './NavBar';
import MessageList from '../features/conversation/MessageList';
import MessageInput from '../features/conversation/MessageInput';
import { useConversationStore } from '../features/conversation/conversationStore';
import type { ScenarioSummary } from '../features/conversation/types';
import { useScenarioStore } from '../features/scenario/scenarioStore';
import { generateSummary } from '../services/summaryService';

export default function ConversationPage() {
  const { id: scenarioIdParam, conversationId: conversationIdParam } = useParams<{
    id?: string;
    conversationId?: string;
  }>();
  const navigate = useNavigate();
  const {
    conversation,
    loading,
    sending,
    error,
    initFromScenario,
    loadExisting,
    send,
    reset,
  } = useConversationStore();
  const { scenarios, loading: scenariosLoading, fetched: scenariosFetched, fetchScenarios } = useScenarioStore();
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  const isHistoryMode = Boolean(conversationIdParam);
  const scenarioId = scenarioIdParam ? Number(scenarioIdParam) : NaN;
  const historyConversationId = conversationIdParam ? Number(conversationIdParam) : NaN;
  const scenario: ScenarioSummary | undefined = scenarios.find(
    (s) => s.id === scenarioId,
  );

  useEffect(() => {
    if (isHistoryMode || !Number.isFinite(scenarioId)) {
      return;
    }
    if (scenarios.length === 0 && !scenariosLoading && !scenariosFetched) {
      void fetchScenarios();
    }
  }, [isHistoryMode, scenarioId, scenarios.length, scenariosLoading, scenariosFetched, fetchScenarios]);

  useEffect(() => {
    reset();
    setEndError(null);
  }, [isHistoryMode, scenarioIdParam, conversationIdParam, reset]);

  useEffect(() => {
    if (isHistoryMode) {
      return;
    }
    if (scenario && !conversation) {
      void initFromScenario(scenario);
    }
  }, [isHistoryMode, scenario, conversation, initFromScenario]);

  useEffect(() => {
    if (!isHistoryMode || !Number.isFinite(historyConversationId) || conversation) {
      return;
    }
    void loadExisting(historyConversationId, { persistCurrent: false });
  }, [isHistoryMode, historyConversationId, conversation, loadExisting]);

  async function handleEndConversation() {
    if (!conversation || ending) return;
    setEnding(true);
    setEndError(null);
    try {
      await generateSummary(conversation.id);
      navigate(`/conversation/${conversation.id}/summary`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成总结失败';
      setEndError(message);
    } finally {
      setEnding(false);
    }
  }

  if (isHistoryMode && !Number.isFinite(historyConversationId)) {
    return (
      <div className="min-h-dvh px-4 py-6 max-w-4xl mx-auto">
        <NavBar />
        <p className="text-red-600" role="alert">无效的对话 ID</p>
      </div>
    );
  }

  if (!isHistoryMode && !Number.isFinite(scenarioId)) {
    return (
      <div className="min-h-dvh px-4 py-6 max-w-4xl mx-auto">
        <NavBar />
        <p className="text-red-600" role="alert">无效的场景 ID</p>
      </div>
    );
  }

  if (!isHistoryMode && scenariosFetched && !scenario) {
    return (
      <div className="min-h-dvh px-4 py-6 max-w-4xl mx-auto">
        <NavBar />
        <p className="text-red-600" role="alert">无效的场景 ID</p>
      </div>
    );
  }

  if (loading || (!isHistoryMode && (!scenario || scenariosLoading))) {
    return (
      <div className="min-h-dvh px-4 py-6 max-w-4xl mx-auto">
        <NavBar />
        <div className="text-sm text-gray-500" role="status">加载中…</div>
      </div>
    );
  }

  const pageScenario = isHistoryMode ? conversation?.scenario : scenario;

  return (
    <div className="min-h-dvh flex flex-col max-w-4xl mx-auto" data-testid="conversation-page">
      <div className="px-4 py-4">
        <NavBar />
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-brand-600"
              data-testid="back-to-scenarios"
            >
              ← 返回场景
            </button>
            <span className="text-gray-300">/</span>
            <span className="min-w-0 break-words text-base font-medium">
              {pageScenario ? `${pageScenario.icon} ${pageScenario.name}` : '历史对话'}
            </span>
          </div>
          {isHistoryMode ? (
            <button
              type="button"
              onClick={() => conversation && navigate(`/conversation/${conversation.id}/summary`)}
              disabled={!conversation}
              className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              data-testid="history-summary-button"
            >
              查看总结
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEndConversation}
              disabled={!conversation || ending || sending}
              className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              data-testid="end-conversation-button"
            >
              {ending ? '生成总结中…' : '结束对话'}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {conversation?.messages?.length ?? 0} 条消息
        </p>
      </div>

      {isHistoryMode && conversation && (
        <div
          className="mx-4 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 break-words"
          data-testid="history-readonly-tip"
        >
          当前为历史对话回溯，仅支持查看完整消息与总结，不能继续发送消息。
        </div>
      )}

      {error && !conversation && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-6 mx-4 text-center break-words"
          data-testid="conversation-error"
          role="alert"
        >
          <p className="text-red-700 mb-3">
            {isHistoryMode ? '无效的对话 ID' : `加载对话失败:${error}`}
          </p>
          <button
            onClick={() => {
              if (isHistoryMode) {
                void loadExisting(historyConversationId, { persistCurrent: false });
                return;
              }
              if (scenario) void initFromScenario(scenario);
            }}
            className="text-sm px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            data-testid="conversation-retry"
          >
            重试
          </button>
        </div>
      )}

      {error && conversation && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700 break-words" data-testid="send-error-banner" role="alert">
          发送失败:{error}
        </div>
      )}

      {endError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700 break-words" data-testid="summary-generate-error" role="alert">
          生成总结失败:{endError}
        </div>
      )}

      <div className="flex-1 flex flex-col px-4 pb-2 min-h-0">
        <MessageList
          messages={conversation?.messages ?? []}
          sending={isHistoryMode ? false : sending}
          emptyText={isHistoryMode ? '这段历史对话暂无消息' : undefined}
        />
        {!isHistoryMode && <MessageInput onSend={send} disabled={sending} />}
      </div>
    </div>
  );
}
