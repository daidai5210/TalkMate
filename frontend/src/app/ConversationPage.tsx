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
    <AppShell className="flex h-dvh flex-col bg-slate-50" data-testid="conversation-page">
      {/* 顶部导航栏 */}
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/app/home')}
            className="min-h-11 text-[13px] font-semibold text-slate-500 hover:text-brand-600"
            data-testid="back-to-scenarios"
          >
            ← 返回
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[15px] font-bold text-slate-900">
              {isHistoryMode ? '历史训练回放' : task.title}
            </p>
            <p className="truncate text-[11px] text-slate-400">AI 角色：{task.role}</p>
          </div>
          <div className="shrink-0 rounded-[10px] bg-slate-950 px-2.5 py-1.5 text-right text-white">
            <p className="text-[10px] text-slate-300">进度</p>
            <p className="text-sm font-black">{progress}/10</p>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* 任务简报（可滚动区域内） */}
        <section className="shrink-0 border-b border-slate-100 bg-white px-4 py-3" data-testid="task-briefing">
          <p className="text-[13px] leading-5 text-slate-600">{task.goal}</p>
          <div className="mt-3">
            {isHistoryMode ? (
              <button
                type="button"
                onClick={() => conversation && navigate(`/conversation/${conversation.id}/summary`)}
                disabled={!conversation}
                className="h-12 w-full rounded-[10px] bg-brand-600 text-[15px] font-semibold text-white shadow-brand hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                data-testid="history-summary-button"
              >
                查看成长反馈
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEndConversation}
                disabled={!conversation || ending || sending}
                className="h-12 w-full rounded-[10px] bg-brand-600 text-[15px] font-semibold text-white shadow-brand hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                data-testid="end-conversation-button"
              >
                {ending ? '生成反馈中…' : '结束并生成反馈'}
              </button>
            )}
          </div>

          {!isHistoryMode && (
            <div className="mt-3 rounded-[14px] bg-brand-50 p-3" data-testid="starter-phrases">
              <p className="text-[13px] font-bold text-brand-800">开口前提示卡</p>
              <p className="mt-1 text-[11px] leading-5 text-brand-700">
                以下是完整例句，可直接朗读，方便 AI 分析语法与表达。
              </p>
              <div className="mt-2 grid gap-2">
                {task.starterPhrases.slice(0, 3).map((phrase, index) => (
                  <p
                    key={phrase}
                    className="rounded-[10px] bg-white px-3 py-2 text-[13px] leading-5 text-slate-700 shadow-sm"
                    data-testid={`starter-phrase-${index}`}
                  >
                    {phrase}
                  </p>
                ))}
              </div>
            </div>
          )}
        </section>

        {isHistoryMode && conversation && (
          <div
            className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800 break-words"
            data-testid="history-readonly-tip"
          >
            当前为历史训练回放，仅支持查看完整消息与成长反馈，不能继续发送消息。
          </div>
        )}

        {error && !conversation && (
          <div
            className="mx-4 mt-4 rounded-[14px] border border-red-200 bg-red-50 p-6 text-center shadow-sm break-words"
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
              className="h-12 rounded-[10px] bg-red-600 px-5 text-[15px] font-semibold text-white hover:bg-red-700"
              data-testid="conversation-retry"
            >
              重试
            </button>
          </div>
        )}

        {error && conversation && (
          <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700 break-words" data-testid="send-error-banner" role="alert">
            发送失败:{error}
          </div>
        )}

        {endError && (
          <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700 break-words" data-testid="summary-generate-error" role="alert">
            生成反馈失败:{endError}
          </div>
        )}

        {/* 消息区 + 底部输入 */}
        <div className="flex min-h-0 flex-1 flex-col bg-white">
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
