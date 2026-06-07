import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
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
      <AppShell className="px-4 py-6 bg-slate-950 shadow-none">
        <p className="rounded-2xl bg-red-500/20 px-4 py-3 text-sm text-red-200" role="alert">无效的对话 ID</p>
      </AppShell>
    );
  }

  if (!isHistoryMode && !Number.isFinite(scenarioId)) {
    return (
      <AppShell className="px-4 py-6 bg-slate-950 shadow-none">
        <p className="rounded-2xl bg-red-500/20 px-4 py-3 text-sm text-red-200" role="alert">无效的场景 ID</p>
      </AppShell>
    );
  }

  if (!isHistoryMode && scenariosFetched && !scenario) {
    return (
      <AppShell className="px-4 py-6 bg-slate-950 shadow-none">
        <p className="rounded-2xl bg-red-500/20 px-4 py-3 text-sm text-red-200" role="alert">无效的场景 ID</p>
      </AppShell>
    );
  }

  if (loading || (!isHistoryMode && (!scenario || scenariosLoading))) {
    return (
      <AppShell className="flex items-center justify-center bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 shadow-none animate-fade-in">
        <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/60 backdrop-blur-md" role="status">加载中…</div>
      </AppShell>
    );
  }

  const pageScenario = isHistoryMode ? conversation?.scenario : scenario;
  const task = getTrainingTaskMeta(pageScenario?.name);
  const messageCount = conversation?.messages?.length ?? 0;
  const turnCount = Math.ceil(messageCount / 2);
  const progress = Math.min(10, Math.max(1, turnCount || 1));

  return (
    <AppShell
      className="relative flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/90 to-slate-900 shadow-none animate-fade-in"
      data-testid="conversation-page"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />

      <header className="relative z-10 shrink-0 px-4 pb-2 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/home')}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            data-testid="back-to-scenarios"
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[15px] font-bold text-white">
              {isHistoryMode ? '历史训练回放' : task.title}
            </p>
            {!isHistoryMode && (
              <p className="truncate text-[11px] text-white/40">AI 角色：{task.role}</p>
            )}
          </div>
          <div
            className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md"
            data-testid="conversation-progress"
          >
            <p className="text-[10px] text-white/50">进度</p>
            <p className="text-center text-sm font-black text-white">{progress}/10</p>
          </div>
        </div>
      </header>

      {isHistoryMode && conversation && (
        <div
          className="relative z-10 mx-4 mb-2 shrink-0 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-[13px] text-amber-200/90 break-words backdrop-blur-sm"
          data-testid="history-readonly-tip"
        >
          当前为历史训练回放，仅支持查看完整消息与成长反馈，不能继续发送消息。
        </div>
      )}

      {error && !conversation && (
        <div
          className="relative z-10 mx-4 mt-2 rounded-[14px] border border-red-400/30 bg-red-500/15 p-6 text-center backdrop-blur-md break-words"
          data-testid="conversation-error"
          role="alert"
        >
          <p className="mb-3 text-red-200">
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
            className="h-11 rounded-full bg-red-500 px-5 text-sm font-semibold text-white hover:bg-red-400"
            data-testid="conversation-retry"
          >
            重试
          </button>
        </div>
      )}

      {(error && conversation) || endError ? (
        <div className="relative z-10 shrink-0 px-4 py-1">
          {error && conversation && (
            <div className="rounded-xl bg-red-500/20 px-3 py-2 text-[13px] text-red-200 break-words" data-testid="send-error-banner" role="alert">
              发送失败:{error}
            </div>
          )}
          {endError && (
            <div className="mt-1 rounded-xl bg-red-500/20 px-3 py-2 text-[13px] text-red-200 break-words" data-testid="summary-generate-error" role="alert">
              生成反馈失败:{endError}
            </div>
          )}
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <MessageList
          messages={conversation?.messages ?? []}
          sending={isHistoryMode ? false : sending}
          emptyText={isHistoryMode ? '这段历史训练暂无消息' : '开始说出你的第一句英语，AI 教练会根据任务继续追问。'}
          variant="immersive"
        />

        {isHistoryMode ? (
          <div className="shrink-0 px-4 pb-[calc(16px+var(--app-safe-bottom))] pt-2">
            <button
              type="button"
              onClick={() => conversation && navigate(`/conversation/${conversation.id}/summary`)}
              disabled={!conversation}
              className="h-12 w-full rounded-full bg-white/15 text-[15px] font-semibold text-white backdrop-blur-md hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="history-summary-button"
            >
              查看成长反馈
            </button>
          </div>
        ) : (
          <MessageInput
            onSend={send}
            disabled={sending || !conversation}
            starterPhrases={task.starterPhrases.slice(0, 3)}
            taskGoal={task.goal}
            onEndConversation={handleEndConversation}
            ending={ending}
          />
        )}
      </div>
    </AppShell>
  );
}
