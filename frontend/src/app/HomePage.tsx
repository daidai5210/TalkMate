import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from './AppShell';
import NavBar from './NavBar';
import PracticeHistoryList from '../components/PracticeHistoryList';
import TrainingRecommendBanner from '../components/TrainingRecommendBanner';
import { listConversations } from '../features/conversation/conversationService';
import type { ConversationHistoryItem } from '../features/conversation/types';
import ScenarioList, {
  ScenarioListEmpty,
  ScenarioListSkeleton,
} from '../features/scenario/ScenarioList';
import { useScenarioStore } from '../features/scenario/scenarioStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { scenarios, loading, error, fetched, fetchScenarios } = useScenarioStore();
  const [history, setHistory] = useState<ConversationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const historyMountedRef = useRef(false);
  const historyRequestIdRef = useRef(0);

  const fetchHistory = useCallback(async () => {
    const requestId = historyRequestIdRef.current + 1;
    historyRequestIdRef.current = requestId;

    if (historyMountedRef.current) {
      setHistoryLoading(true);
      setHistoryError(null);
    }

    try {
      const records = await listConversations();
      if (historyMountedRef.current && historyRequestIdRef.current === requestId) {
        setHistory(records);
      }
    } catch (err) {
      if (historyMountedRef.current && historyRequestIdRef.current === requestId) {
        setHistoryError(err instanceof Error ? err.message : '获取练习记录失败');
      }
    } finally {
      if (historyMountedRef.current && historyRequestIdRef.current === requestId) {
        setHistoryLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!fetched) {
      fetchScenarios();
    }
  }, [fetched, fetchScenarios]);

  useEffect(() => {
    historyMountedRef.current = true;
    fetchHistory();

    return () => {
      historyMountedRef.current = false;
    };
  }, [fetchHistory]);

  const scoredHistory = history.filter((item) => item.summary_score !== null);
  const averageScore = scoredHistory.length === 0
    ? null
    : Math.round(
      scoredHistory.reduce((sum, item) => sum + (item.summary_score ?? 0), 0) /
      scoredHistory.length,
    );
  const completedCount = history.filter((item) => item.has_summary).length;
  const recommendedScenario = scenarios[0];

  return (
    <AppShell className="bg-slate-50">
      <div className="px-4 pb-[calc(28px+var(--app-safe-bottom))] pt-4">
        <NavBar />

        <main className="space-y-7">
          <section className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-lg shadow-slate-200" data-testid="home-hero">
            <p className="text-xs font-bold uppercase text-brand-200">Today's training</p>
            <h1 className="mt-3 break-words text-2xl font-black leading-tight">
              今天完成一个真实英语任务
            </h1>
            <p className="mt-3 break-words text-sm leading-6 text-slate-300">
              练开口、纠中式英语、生成复练建议，让每次对话都有结果。
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3" data-testid="growth-panel">
              <GrowthMetric label="完成练习" value={`${completedCount} 次`} />
              <GrowthMetric label="平均评分" value={averageScore === null ? '待生成' : `${averageScore} 分`} />
            </div>
            <button
              type="button"
              onClick={() => recommendedScenario && navigate(`/conversation/${recommendedScenario.id}`)}
              disabled={!recommendedScenario}
              className="mt-5 min-h-12 w-full rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              开始推荐任务
            </button>
          </section>

          <TrainingRecommendBanner />

          <section data-testid="task-section">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase text-brand-600">Training tasks</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">选择一个任务开始训练</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">任务卡包含 AI 角色、训练重点和预计时长。</p>
            </div>

            {loading && <ScenarioListSkeleton />}

            {!loading && error && (
              <div
                className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-sm"
                data-testid="scenarios-error"
              >
                <p className="mb-3 break-words text-red-700">加载任务失败:{error}</p>
                <button
                  onClick={fetchScenarios}
                  className="min-h-11 rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  data-testid="scenarios-retry"
                >
                  重试
                </button>
              </div>
            )}

            {!loading && !error && scenarios.length === 0 && <ScenarioListEmpty />}

            {!loading && !error && scenarios.length > 0 && <ScenarioList scenarios={scenarios} />}
          </section>

          <section id="practice-history-section" data-testid="practice-history-section">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-brand-600">History</p>
                <h2 className="mt-2 text-xl font-black text-slate-950">口语成长记录</h2>
                <p className="mt-1 text-sm text-slate-500">回顾最近练习、评分与总结，让每次开口都有沉淀。</p>
              </div>
              <button
                type="button"
                onClick={fetchHistory}
                disabled={historyLoading}
                className="min-h-11 shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="history-refresh"
              >
                刷新
              </button>
            </div>
            <PracticeHistoryList
              records={history}
              loading={historyLoading}
              error={historyError}
              onRetry={fetchHistory}
            />
          </section>
        </main>
      </div>
    </AppShell>
  );
}

function GrowthMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-2 break-words text-xl font-black text-white">{value}</p>
    </div>
  );
}
