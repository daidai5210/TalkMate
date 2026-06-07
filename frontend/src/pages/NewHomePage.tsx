import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  TrendingUp,
  Flame,
  Target,
  Clock,
} from 'lucide-react';
import { listConversations } from '../features/conversation/conversationService';
import type { ConversationHistoryItem } from '../features/conversation/types';
import TrainingRecommendBanner from '../components/TrainingRecommendBanner';
import { useScenarioStore } from '../features/scenario/scenarioStore';
import { getTrainingTaskMeta } from '../features/training/trainingDesign';
import { getScenarioLucideIcon } from '../features/scenario/ScenarioCard';
import { fetchHeatmap, computeStreakDays } from '../services/userStatsService';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

/* ---------- Page ---------- */

export default function NewHomePage() {
  const navigate = useNavigate();
  const { scenarios, loading: scenariosLoading, error: scenariosError, fetched, fetchScenarios } = useScenarioStore();
  const [history, setHistory] = useState<ConversationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchHistory = useCallback(async () => {
    const rid = requestIdRef.current + 1;
    requestIdRef.current = rid;
    if (mountedRef.current) { setHistoryLoading(true); setHistoryError(null); }
    try {
      const records = await listConversations();
      if (mountedRef.current && requestIdRef.current === rid) setHistory(records);
    } catch (err) {
      if (mountedRef.current && requestIdRef.current === rid) {
        setHistoryError(err instanceof Error ? err.message : '获取练习记录失败');
      }
    } finally {
      if (mountedRef.current && requestIdRef.current === rid) setHistoryLoading(false);
    }
  }, []);

  const fetchStreak = useCallback(async () => {
    try {
      const heatmap = await fetchHeatmap(90);
      if (mountedRef.current) setStreakDays(computeStreakDays(heatmap));
    } catch {
      // streak is non-critical; keep 0
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!fetched) fetchScenarios();
    fetchHistory();
    fetchStreak();
    return () => { mountedRef.current = false; };
  }, [fetched, fetchScenarios, fetchHistory, fetchStreak]);

  const completedCount = history.filter((h) => h.has_summary).length;
  const scoredHistory = history.filter((h) => h.summary_score !== null);
  const averageScore = scoredHistory.length === 0
    ? null
    : Math.round(scoredHistory.reduce((s, h) => s + (h.summary_score ?? 0), 0) / scoredHistory.length);

  const todayTask = scenarios[0] ?? null;
  const todayTaskMeta = todayTask ? getTrainingTaskMeta(todayTask.name) : null;

  const stats = [
    { label: '完成练习', value: completedCount, icon: Target, color: 'text-brand-500' },
    { label: '平均评分', value: averageScore ?? '-', icon: TrendingUp, color: 'text-emerald-500' },
    { label: '连续天数', value: streakDays, icon: Flame, color: 'text-amber-500' },
  ];

  const pageLoading = (scenariosLoading || historyLoading) && history.length === 0 && scenarios.length === 0;
  const pageError = scenariosError && historyError && history.length === 0 && scenarios.length === 0;

  return (
    <div className="bg-white pb-[calc(var(--app-bottom-nav-height)+var(--app-safe-bottom))]">
      <header className="border-b border-slate-100 px-4 pb-4 pt-5">
        <h1 className="text-[20px] font-black text-slate-950">{greeting()}，练习者</h1>
        <p className="mt-0.5 text-[13px] text-slate-400">今天继续开口练口语吧</p>
      </header>

      <div className="px-4 pt-4">
        {pageLoading && (
          <div className="space-y-4" data-testid="home-loading">
            <div className="h-24 animate-pulse rounded-[12px] bg-slate-100" />
            <div className="h-16 animate-pulse rounded-[12px] bg-slate-100" />
            <div className="h-20 animate-pulse rounded-[12px] bg-slate-100" />
            <div className="h-32 animate-pulse rounded-[12px] bg-slate-100" />
          </div>
        )}

        {!pageLoading && pageError && (
          <div className="rounded-[12px] border border-red-200 bg-red-50 p-6 text-center" data-testid="home-error">
            <p className="mb-3 text-red-700">加载失败，请检查网络后重试</p>
            <button
              onClick={() => { fetchScenarios(); fetchHistory(); fetchStreak(); }}
              className="min-h-11 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              重试
            </button>
          </div>
        )}

        {!pageLoading && !pageError && (
          <main className="space-y-4 animate-fade-in-up">
            {/* 今日任务 — 极简卡片 */}
            {todayTask && todayTaskMeta && (
              <section
                className="rounded-[12px] border border-slate-100 bg-white p-4 shadow-sm"
                data-testid="home-hero"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">今日任务</p>
                <h2 className="mt-1 text-[16px] font-bold text-slate-900">{todayTask.name}</h2>
                <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-400">
                  {todayTaskMeta.goal || todayTask.description}
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-[12px] text-slate-400">
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>{todayTaskMeta.duration}</span>
                  <span className="text-slate-200">|</span>
                  <span>{todayTaskMeta.level}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/conversation/${todayTask.id}`)}
                  className="mt-3 h-10 w-full rounded-[10px] bg-brand-600 text-[14px] font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98]"
                >
                  开始训练
                </button>
              </section>
            )}

            {/* 统计概览 */}
            <section className="grid grid-cols-3 gap-2.5" data-testid="home-stats">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center rounded-[12px] border border-slate-100 bg-white py-3.5">
                  <stat.icon className={`mb-1 h-4 w-4 ${stat.color}`} strokeWidth={1.5} />
                  <p className="text-[20px] font-black text-slate-900">{stat.value}</p>
                  <p className="text-[11px] text-slate-400">{stat.label}</p>
                </div>
              ))}
            </section>

            <TrainingRecommendBanner />

            {/* 最近练习 — 飞书风格列表 */}
            <section data-testid="home-history">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-slate-700">最近练习</h2>
                <button
                  onClick={fetchHistory}
                  disabled={historyLoading}
                  className="text-[12px] font-medium text-brand-600 disabled:opacity-50"
                >
                  刷新
                </button>
              </div>

              {historyLoading && history.length === 0 && (
                <div className="overflow-hidden rounded-[12px] border border-slate-100 bg-white">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-16 animate-pulse bg-slate-50 ${i < 3 ? 'border-b border-slate-100' : ''}`} />
                  ))}
                </div>
              )}

              {historyError && history.length === 0 && (
                <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
                  {historyError}
                  <button onClick={fetchHistory} className="ml-2 underline">重试</button>
                </div>
              )}

              {!historyLoading && !historyError && history.length === 0 && (
                <div className="rounded-[12px] border border-dashed border-slate-200 bg-white p-6 text-center">
                  <p className="text-[14px] font-bold text-slate-700">暂无练习记录</p>
                  <p className="mt-1 text-[12px] text-slate-400">完成第一次对话后，记录会显示在这里</p>
                </div>
              )}

              {history.length > 0 && (
                <div className="overflow-hidden rounded-[12px] border border-slate-100 bg-white">
                  {history.slice(0, 5).map((item, index) => {
                    const { icon: Icon, color } = getScenarioLucideIcon(item.scenario.name);
                    const [iconColor, iconBg] = color.split(' ');
                    const isLast = index === Math.min(history.length, 5) - 1;

                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/conversation/${item.id}/summary`)}
                        className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100 ${!isLast ? 'border-b border-slate-100' : ''}`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold text-slate-900">{item.scenario.name}</span>
                          <span className="block text-[12px] text-slate-400">{formatDate(item.created_at)} · {item.message_count} 条消息</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${item.summary_score !== null ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                          {item.summary_score !== null ? `${item.summary_score}分` : '未评分'}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
