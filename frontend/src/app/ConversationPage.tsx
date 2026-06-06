import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from './AppShell';
import MessageList from '../features/conversation/MessageList';
import MessageInput from '../features/conversation/MessageInput';
import { useConversationStore } from '../features/conversation/conversationStore';
import type { ScenarioSummary } from '../features/conversation/types';
import { useScenarioStore } from '../features/scenario/scenarioStore';
import { generateSummary } from '../services/summaryService';
import { getTrainingTaskMeta } from '../features/training/trainingDesign';

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
    return () => {
      void import('../utils/tts').then(({ ttsCancel }) => ttsCancel());
    };
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
      <AppShell className="px-4 py-6">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">无效的对话 ID</p>
      </AppShell>
    );
  }

  if (!isHistoryMode && !Number.isFinite(scenarioId)) {
    return (
      <AppShell className="px-4 py-6">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">无效的场景 ID</p>
      </AppShell>
    );
  }

  if (!isHistoryMode && scenariosFetched && !scenario) {
    return (
      <AppShell className="px-4 py-6">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">无效的场景 ID</p>
      </AppShell>
    );
  }

  if (loading || (!isHistoryMode && (!scenario || scenariosLoading))) {
    return (
      <AppShell className="flex items-center justify-center px-4 py-6">
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500" role="status">加载中…</div>
      </AppShell>
    );
  }

  const pageScenario = isHistoryMode ? conversation?.scenario : scenario;
  const task = getTrainingTaskMeta(pageScenario?.name);
  const messageCount = conversation?.messages?.length ?? 0;
  const turnCount = Math.ceil(messageCount / 2);
  const progress = Math.min(10, Math.max(1, turnCount || 1));

  return (
    <AppShell className="flex flex-col bg-slate-50" data-testid="conversation-page">
      <div className="flex min-h-dvh flex-col px-3 pb-[calc(12px+var(--app-safe-bottom))] pt-3">
        <section className="mb-3 rounded-[1.5rem] bg-white p-4 shadow-sm" data-testid="task-briefing">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <button
                onClick={() => navigate('/')}
                className="mb-3 min-h-9 text-sm font-semibold text-slate-500 hover:text-brand-600"
                data-testid="back-to-scenarios"
              >
                ← 返回
              </button>
              <p className="text-xs font-bold uppercase text-brand-600">AI 角色：{task.role}</p>
              <h1 className="mt-2 break-words text-xl font-black leading-tight text-slate-950">
                {isHistoryMode ? '历史训练回放' : task.title}
              </h1>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">{task.goal}</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-slate-950 px-3 py-2 text-right text-white">
              <p className="text-[10px] text-slate-300">进度</p>
              <p className="text-lg font-black">{progress}/10</p>
            </div>
          </div>

          <div className="mt-4">
              {isHistoryMode ? (
                <button
                  type="button"
                  onClick={() => conversation && navigate(`/conversation/${conversation.id}/summary`)}
                  disabled={!conversation}
                className="min-h-11 w-full rounded-2xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  data-testid="history-summary-button"
                >
                  查看成长反馈
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEndConversation}
                  disabled={!conversation || ending || sending}
                className="min-h-11 w-full rounded-2xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  data-testid="end-conversation-button"
                >
                  {ending ? '生成反馈中…' : '结束并生成反馈'}
                </button>
              )}
          </div>

          {!isHistoryMode && (
            <div className="mt-4 rounded-2xl bg-brand-50 p-3" data-testid="starter-phrases">
              <p className="text-sm font-bold text-brand-800">开口前提示卡</p>
              <div className="mt-3 grid gap-2">
                {task.starterPhrases.map((phrase) => (
                  <span key={phrase} className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {isHistoryMode && conversation && (
          <div
            className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 break-words"
            data-testid="history-readonly-tip"
          >
            当前为历史训练回放，仅支持查看完整消息与成长反馈，不能继续发送消息。
          </div>
        )}

        {error && !conversation && (
          <div
            className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-sm break-words"
            data-testid="conversation-error"
            role="alert"
          >
            <p className="mb-3 text-red-700">
              {isHistoryMode ? '无效的对话 ID' : `加载训练失败:${error}`}
            </p>
            <button
              onClick={() => {
                if (isHistoryMode) {
                  void loadExisting(historyConversationId, { persistCurrent: false });
                  return;
                }
                if (scenario) void initFromScenario(scenario);
              }}
              className="min-h-11 rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
              data-testid="conversation-retry"
            >
              重试
            </button>
          </div>
        )}

        {error && conversation && (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 break-words" data-testid="send-error-banner" role="alert">
            发送失败:{error}
          </div>
        )}

        {endError && (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 break-words" data-testid="summary-generate-error" role="alert">
            生成反馈失败:{endError}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-sm">
          <MessageList
            messages={conversation?.messages ?? []}
            sending={isHistoryMode ? false : sending}
            emptyText={isHistoryMode ? '这段历史训练暂无消息' : '开始说出你的第一句英语，AI 教练会根据任务继续追问。'}
          />
          {!isHistoryMode && <MessageInput onSend={send} disabled={sending} />}
        </div>
      </div>
    </AppShell>
  );
}
