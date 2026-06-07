import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Layers,
  ChevronRight,
  TrendingUp,
  Flame,
  Target,
  Zap,
  Users,
  Star,
} from 'lucide-react';
import { listConversations } from '../features/conversation/conversationService';
import type { ConversationHistoryItem } from '../features/conversation/types';
import TrainingRecommendBanner from '../components/TrainingRecommendBanner';
import { useScenarioStore } from '../features/scenario/scenarioStore';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

/* ---------- 虚拟数据 ---------- */

const MOCK_STATS = [
  { label: '完成练习', value: 12, icon: Target, color: 'text-brand-500' },
  { label: '平均评分', value: 85, icon: TrendingUp, color: 'text-emerald-500' },
  { label: '连续天数', value: 7, icon: Flame, color: 'text-amber-500' },
];

const MOCK_HISTORY: ConversationHistoryItem[] = [
  {
    id: 101,
    scenario: { id: 1, name: '面试场景', icon: '💼' },
    created_at: '2026-06-05T10:00:00Z',
    finished_at: '2026-06-05T10:15:00Z',
    message_count: 8,
    has_summary: true,
    summary_score: 82,
  },
  {
    id: 102,
    scenario: { id: 2, name: '餐厅点餐', icon: '🍽️' },
    created_at: '2026-06-04T14:30:00Z',
    finished_at: '2026-06-04T14:42:00Z',
    message_count: 6,
    has_summary: true,
    summary_score: 78,
  },
  {
    id: 103,
    scenario: { id: 4, name: '机场旅行', icon: '✈️' },
    created_at: '2026-06-03T09:00:00Z',
    finished_at: null,
    message_count: 4,
    has_summary: false,
    summary_score: null,
  },
  {
    id: 104,
    scenario: { id: 3, name: '会议讨论', icon: '📊' },
    created_at: '2026-06-02T16:00:00Z',
    finished_at: '2026-06-02T16:18:00Z',
    message_count: 10,
    has_summary: true,
    summary_score: 88,
  },
  {
    id: 105,
    scenario: { id: 5, name: '日常社交', icon: '💬' },
    created_at: '2026-06-01T11:00:00Z',
    finished_at: '2026-06-01T11:12:00Z',
    message_count: 6,
    has_summary: true,
    summary_score: 75,
  },
];

/* ---------- Page ---------- */

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

  useEffect(() => {
    mountedRef.current = true;
    if (!fetched) fetchScenarios();
    fetchHistory();
    return () => { mountedRef.current = false; };
  }, [fetched, fetchScenarios, fetchHistory]);

  // 使用真实数据或虚拟数据
  const displayHistory = history.length > 0 ? history : MOCK_HISTORY;
  const completedCount = displayHistory.filter((h) => h.has_summary).length;
  const scoredHistory = displayHistory.filter((h) => h.summary_score !== null);
  const averageScore = scoredHistory.length === 0
    ? null
    : Math.round(scoredHistory.reduce((s, h) => s + (h.summary_score ?? 0), 0) / scoredHistory.length);
  const streakDays = 7;

  const stats = [
    { label: '完成练习', value: completedCount || MOCK_STATS[0].value, icon: Target, color: 'text-brand-500' },
    { label: '平均评分', value: averageScore ?? MOCK_STATS[1].value, icon: TrendingUp, color: 'text-emerald-500' },
    { label: '连续天数', value: streakDays, icon: Flame, color: 'text-amber-500' },
  ];

  const todayTask = scenarios[0] || {
    id: 1,
    name: '面试场景对话',
    description: '模拟英文面试问答，提升求职英语口语表达能力',
    icon: '💼',
  };

  const todayTaskDifficulty = '中等';
  const todayTaskParticipants = 1247;

  const pageLoading = (scenariosLoading || historyLoading) && history.length === 0 && scenarios.length === 0;
  const pageError = scenariosError && historyError && history.length === 0 && scenarios.length === 0;

  return (
    <div className="pb-[calc(var(--app-bottom-nav-height)+var(--app-safe-bottom))]">
      {/* 顶部欢迎区 - 深色渐变背景 */}
      <header className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 pb-6 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Zap className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">你好，练习者</h1>
            <p className="text-xs text-brand-200">今天也是练习的好日子！</p>
          </div>
        </div>
      </header>

      <div className="-mt-4 px-4">
        {/* Loading */}
        {pageLoading && (
          <div className="space-y-5" data-testid="home-loading">
            <div className="animate-pulse rounded-2xl bg-slate-200 h-40" />
            <div className="animate-pulse rounded-2xl bg-slate-200 h-24" />
            <div className="animate-pulse rounded-2xl bg-slate-200 h-32" />
          </div>
        )}

        {/* Error */}
        {!pageLoading && pageError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center" data-testid="home-error">
            <p className="text-red-700 mb-3">加载失败，请检查网络后重试</p>
            <button
              onClick={() => { fetchScenarios(); fetchHistory(); }}
              className="min-h-11 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              重试
            </button>
          </div>
        )}

        {!pageLoading && !pageError && (
          <main className="space-y-5 animate-fade-in-up">
            {/* 今日推荐 — 大卡片 */}
            <button
              onClick={() => navigate(`/conversation/${todayTask.id}`)}
              className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-left text-white shadow-brand transition active:scale-[0.98]"
              data-testid="home-hero"
            >
              <div className="absolute right-3 top-3 rounded-full bg-white/20 px-2.5 py-0.5">
                <span className="text-xs font-bold text-brand-100">今日推荐</span>
              </div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <Flame className="h-6 w-6 text-amber-300" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-black">{todayTask.name}</h2>
              <p className="mt-1.5 text-sm text-brand-200">{todayTask.description}</p>
              <div className="mt-4 flex items-center gap-3 text-xs text-brand-200">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" strokeWidth={2} />
                  {(todayTask as any).difficulty || todayTaskDifficulty}
                </span>
                <span className="h-1 w-1 rounded-full bg-brand-300" />
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" strokeWidth={2} />
                  {(todayTask as any).participants || todayTaskParticipants} 人参与
                </span>
              </div>
            </button>

            <TrainingRecommendBanner />

            {/* 快捷入口 */}
            <section>
              <h2 className="mb-3 text-sm font-bold text-slate-700">开始训练</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/app/scenarios')}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:shadow-card-hover active:scale-[0.98]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                    <MessageCircle className="h-7 w-7 text-brand-600" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-slate-900">场景对话</h3>
                    <p className="mt-0.5 text-xs text-slate-400">角色扮演练习</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/practice-card')}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:shadow-card-hover active:scale-[0.98]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
                    <Layers className="h-7 w-7 text-amber-600" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-slate-900">抽卡跟练</h3>
                    <p className="mt-0.5 text-xs text-slate-400">随机精准训练</p>
                  </div>
                </button>
              </div>
            </section>

            {/* 统计概览 */}
            <section className="grid grid-cols-3 gap-3" data-testid="home-stats">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center rounded-2xl bg-white p-3 shadow-card">
                  <stat.icon className={`mb-1 h-5 w-5 ${stat.color}`} strokeWidth={1.5} />
                  <p className="text-lg font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              ))}
            </section>

            {/* 最近练习 */}
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
                <div className="space-y-2">
                  {MOCK_HISTORY.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/conversation/${item.id}/summary`)}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:border-brand-100 active:scale-[0.98]"
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
                      <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              )}

              {history.length > 0 && (
                <div className="space-y-2">
                  {history.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/conversation/${item.id}/summary`)}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:border-brand-100 active:scale-[0.98]"
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
                      <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              )}
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
