import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listConversations } from '../features/conversation/conversationService';
import type { ConversationHistoryItem } from '../features/conversation/types';
import { useScenarioStore } from '../features/scenario/scenarioStore';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

export default function NewHomePage() {
  const navigate = useNavigate();
  const { scenarios, loading: scenariosLoading, error: scenariosError, fetched, fetchScenarios } = useScenarioStore();
  const [history, setHistory] = useState<ConversationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchHistory = useCallback(async () => {
    const rid = requestIdRef.current + 1;
    requestIdRef.current = rid;
    if (mountedRef.current) {
      setHistoryLoading(true);
      setHistoryError(null);
    }
    try {
      const records = await listConversations();
      if (mountedRef.current && requestIdRef.current === rid) {
        setHistory(records);
      }
    } catch (err) {
      if (mountedRef.current && requestIdRef.current === rid) {
        setHistoryError(err instanceof Error ? err.message : '获取练习记录失败');
      }
    } finally {
      if (mountedRef.current && requestIdRef.current === rid) {
        setHistoryLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!fetched) fetchScenarios();
    fetchHistory();
    return () => { mountedRef.current = false; };
  }, [fetched, fetchScenarios, fetchHistory]);

  const scoredHistory = history.filter((h) => h.summary_score !== null);
  const averageScore = scoredHistory.length === 0
    ? null
    : Math.round(scoredHistory.reduce((s, h) => s + (h.summary_score ?? 0), 0) / scoredHistory.length);
  const completedCount = history.filter((h) => h.has_summary).length;
  const todayTask = scenarios[0];

  const pageLoading = (scenariosLoading || historyLoading) && history.length === 0 && scenarios.length === 0;
  const pageError = scenariosError && historyError && scenarios.length === 0 && history.length === 0;

  return (
    <div className="px-4 pb-[calc(28px+var(--app-safe-bottom))] pt-4">
      {/* Header */}
      <header className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
          T
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-950">TalkMate</h1>
          <p className="text-xs text-slate-400">AI 口语训练教练</p>
        </div>
      </header>

      {/* Loading */}
      {pageLoading && (
        <div className="space-y-5" data-testid="home-loading">
          <div className="animate-pulse rounded-[1.75rem] bg-slate-200 h-48" />
          <div className="animate-pulse rounded-2xl bg-slate-200 h-32" />
          <div className="animate-pulse rounded-2xl bg-slate-200 h-24" />
        </div>
      )}

      {/* Error */}
      {!pageLoading && pageError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center" data-testid="home-error">
          <p className="text-red-700 mb-3">加载失败，请检查网络后重试</p>
          <button
            onClick={() => { fetchScenarios(); fetchHistory(); }}
            className="min-h-11 rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            重试
          </button>
        </div>
      )}

      {/* Content */}
      {!pageLoading && !pageError && (
        <main className="space-y-5">
          {/* Today's task */}
          <section className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-lg" data-testid="home-hero">
            <p className="text-xs font-bold uppercase text-brand-200">今日任务</p>
            <h2 className="mt-2 text-xl font-black leading-tight">
              {todayTask ? todayTask.name : '开始你的第一次口语练习'}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {todayTask ? todayTask.description : '选择一个场景，和 AI 教练进行真实对话'}
            </p>
            {todayTask && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span>预计 5-10 分钟</span>
                <span>·</span>
                <span>AI 实时反馈</span>
              </div>
            )}
            <button
              onClick={() => todayTask && navigate(`/conversation/${todayTask.id}`)}
              disabled={!todayTask}
              className="mt-4 min-h-12 w-full rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              开始训练
            </button>
          </section>

          {/* Mode selection */}
          <section data-testid="home-modes">
            <h2 className="mb-3 text-sm font-bold text-slate-700">选择训练模式</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/app/training')}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="text-2xl">💬</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">对话模式</h3>
                <p className="mt-1 text-xs text-slate-400">场景角色扮演</p>
              </button>
              <button
                onClick={() => navigate('/app/training')}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="text-2xl">🎴</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">抽卡模式</h3>
                <p className="mt-1 text-xs text-slate-400">随机卡片跟练</p>
              </button>
            </div>
          </section>

          {/* Stats */}
          {history.length > 0 && (
            <section className="grid grid-cols-3 gap-3" data-testid="home-stats">
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="text-xl font-black text-slate-900">{completedCount}</p>
                <p className="text-xs text-slate-400">完成练习</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="text-xl font-black text-slate-900">{averageScore ?? '-'}</p>
                <p className="text-xs text-slate-400">平均评分</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="text-xl font-black text-slate-900">{history.length}</p>
                <p className="text-xs text-slate-400">总练习</p>
              </div>
            </section>
          )}

          {/* Recent practice */}
          <section data-testid="home-history">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">最近练习</h2>
              <button
                onClick={fetchHistory}
                disabled={historyLoading}
                className="text-xs font-medium text-brand-600 disabled:opacity-50"
              >
                刷新
              </button>
            </div>

            {historyLoading && history.length === 0 && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl bg-slate-100 h-16" />
                ))}
              </div>
            )}

            {historyError && history.length === 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
                {historyError}
                <button onClick={fetchHistory} className="ml-2 underline">重试</button>
              </div>
            )}

            {!historyLoading && !historyError && history.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center" data-testid="home-empty">
                <p className="text-3xl mb-2">🎯</p>
                <p className="text-sm font-bold text-slate-700">开始你的第一次口语练习</p>
                <p className="mt-1 text-xs text-slate-400">选择上方训练模式，开启 AI 口语训练之旅</p>
              </div>
            )}

            {history.length > 0 && (
              <div className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/conversation/${item.id}/summary`)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:border-brand-100"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm">
                      {item.scenario.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900 truncate">{item.scenario.name}</span>
                      <span className="block text-xs text-slate-400">{formatDate(item.created_at)}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${item.summary_score !== null ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {item.summary_score !== null ? `${item.summary_score} 分` : '未评分'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}