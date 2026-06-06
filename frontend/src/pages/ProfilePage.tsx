import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { listConversations } from '../features/conversation/conversationService';
import type { ConversationHistoryItem } from '../features/conversation/types';
import {
  fetchHeatmap,
  fetchScoreTrend,
  fetchAchievements,
  computeStreakDays,
  type Achievement,
  type HeatmapDay,
  type ScorePoint,
} from '../services/userStatsService';

/* ---------- helpers ---------- */

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

/* ---------- HeatmapCalendar ---------- */

function HeatmapCalendar({ data }: { data: HeatmapDay[] }) {
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  data.forEach((day, i) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || i === data.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  function colorClass(count: number) {
    if (count === 0) return 'bg-slate-100';
    if (count <= 2) return 'bg-indigo-200';
    if (count <= 5) return 'bg-indigo-400';
    return 'bg-indigo-600';
  }

  return (
    <div className="overflow-x-auto" data-testid="heatmap">
      <div className="flex gap-[2px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((day) => (
              <div
                key={day.date}
                className={`h-[10px] w-[10px] rounded-sm ${colorClass(day.count)}`}
                title={`${day.date}: ${day.count} 次练习`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
        <span>少</span>
        <span className="h-[10px] w-[10px] rounded-sm bg-slate-100" />
        <span className="h-[10px] w-[10px] rounded-sm bg-indigo-200" />
        <span className="h-[10px] w-[10px] rounded-sm bg-indigo-400" />
        <span className="h-[10px] w-[10px] rounded-sm bg-indigo-600" />
        <span>多</span>
      </div>
    </div>
  );
}

/* ---------- ScoreChart (SVG, 无外部依赖) ---------- */

function ScoreChart({ data }: { data: ScorePoint[] }) {
  const [range, setRange] = useState<7 | 30>(30);
  const cutoff = daysAgo(range);
  const filtered = data.filter((p) => p.date >= cutoff);
  const w = 320;
  const h = 120;
  const pad = { top: 10, right: 10, bottom: 20, left: 30 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const scores = filtered.map((p) => p.score);
  const minS = scores.length > 0 ? Math.min(...scores) : 0;
  const maxS = scores.length > 0 ? Math.max(...scores) : 100;
  const yRange = maxS - minS || 1;

  function x(i: number) {
    if (filtered.length <= 1) return pad.left + plotW / 2;
    return pad.left + (i / (filtered.length - 1)) * plotW;
  }
  function y(score: number) {
    return pad.top + plotH - ((score - minS) / yRange) * plotH;
  }

  const linePath =
    filtered.length === 0
      ? ''
      : filtered
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.score)}`)
          .join(' ');

  return (
    <div data-testid="score-chart">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">得分趋势</h3>
        <div className="flex gap-1">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${range === r ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              {r} 天
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">暂无数据</p>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" aria-label="得分趋势图">
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const yy = pad.top + plotH * (1 - frac);
            return (
              <g key={frac}>
                <line x1={pad.left} x2={w - pad.right} y1={yy} y2={yy} stroke="#e2e8f0" strokeWidth="0.5" />
                <text x={pad.left - 4} y={yy + 3} textAnchor="end" className="text-[8px] fill-slate-400">
                  {Math.round(minS + frac * yRange)}
                </text>
              </g>
            );
          })}
          <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {filtered.map((p, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(p.score)}
              r="3"
              fill={p.type === 'conversation' ? '#6366f1' : '#f59e0b'}
              stroke="white"
              strokeWidth="1"
            />
          ))}
        </svg>
      )}
      <div className="mt-1 flex items-center justify-center gap-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> 对话</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> 抽卡</span>
      </div>
    </div>
  );
}

/* ---------- ProfilePage ---------- */

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [history, setHistory] = useState<ConversationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const ridRef = useRef(0);

  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [scoreTrend, setScoreTrend] = useState<ScorePoint[]>([]);
  const [scoreTrendLoading, setScoreTrendLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    const rid = ridRef.current + 1;
    ridRef.current = rid;
    if (mountedRef.current) {
      setHistoryLoading(true);
      setHistoryError(null);
    }
    try {
      const records = await listConversations();
      if (mountedRef.current && ridRef.current === rid) setHistory(records);
    } catch (err) {
      if (mountedRef.current && ridRef.current === rid) {
        setHistoryError(err instanceof Error ? err.message : '获取记录失败');
      }
    } finally {
      if (mountedRef.current && ridRef.current === rid) setHistoryLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setHeatmapLoading(true);
    setScoreTrendLoading(true);
    setAchievementsLoading(true);
    try {
      const [heatmapData, trendData, achievementsData] = await Promise.all([
        fetchHeatmap(),
        fetchScoreTrend(),
        fetchAchievements(),
      ]);
      if (mountedRef.current) {
        setHeatmap(heatmapData);
        setScoreTrend(trendData);
        setAchievements(achievementsData);
      }
    } catch {
      // 统计加载失败静默处理，不影响主流程
    } finally {
      if (mountedRef.current) {
        setHeatmapLoading(false);
        setScoreTrendLoading(false);
        setAchievementsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchHistory();
    fetchStats();
    return () => { mountedRef.current = false; };
  }, [fetchHistory, fetchStats]);

  const scoredHistory = history.filter((h) => h.summary_score !== null);
  const averageScore = scoredHistory.length === 0
    ? null
    : Math.round(scoredHistory.reduce((s, h) => s + (h.summary_score ?? 0), 0) / scoredHistory.length);
  const completedCount = history.filter((h) => h.has_summary).length;
  const streakDays = computeStreakDays(heatmap);

  const initial = user?.username?.[0]?.toUpperCase() ?? '?';

  const pageLoading = historyLoading && history.length === 0;
  const pageError = historyError && history.length === 0;

  return (
    <div className="px-4 pb-[calc(28px+var(--app-safe-bottom))] pt-4">
      {/* Profile header */}
      <section className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-lg font-bold text-brand-700">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-black text-slate-950 truncate">{user?.username ?? '用户'}</h1>
          <p className="text-xs text-slate-400">坚持练习，每天进步</p>
        </div>
        <button
          onClick={logout}
          className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 hover:border-red-200 hover:text-red-600"
        >
          退出登录
        </button>
      </section>

      {/* Loading */}
      {pageLoading && (
        <div className="space-y-4" data-testid="profile-loading">
          <div className="animate-pulse rounded-2xl bg-slate-200 h-20" />
          <div className="animate-pulse rounded-2xl bg-slate-200 h-32" />
          <div className="animate-pulse rounded-2xl bg-slate-200 h-40" />
        </div>
      )}

      {/* Error */}
      {!pageLoading && pageError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center" data-testid="profile-error">
          <p className="text-red-700 mb-3">加载失败：{historyError}</p>
          <button
            onClick={fetchHistory}
            className="min-h-11 rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            重试
          </button>
        </div>
      )}

      {/* Empty */}
      {!pageLoading && !pageError && history.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center" data-testid="profile-empty">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm font-bold text-slate-700">还没有练习数据</p>
          <p className="mt-1 text-xs text-slate-400">完成第一次口语练习后，这里会展示你的成长数据</p>
          <button
            onClick={() => navigate('/app/training')}
            className="mt-4 min-h-11 rounded-2xl bg-slate-950 px-5 py-2 text-sm font-semibold text-white"
          >
            开始练习
          </button>
        </div>
      )}

      {/* Content */}
      {!pageLoading && !pageError && history.length > 0 && (
        <div className="space-y-5">
          {/* Stats */}
          <section className="grid grid-cols-3 gap-3" data-testid="profile-stats">
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
              <p className="text-xl font-black text-slate-900">{completedCount}</p>
              <p className="text-xs text-slate-400">总练习</p>
            </div>
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
              <p className="text-xl font-black text-slate-900">{averageScore ?? '-'}</p>
              <p className="text-xs text-slate-400">平均分</p>
            </div>
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
              <p className="text-xl font-black text-slate-900">{streakDays}</p>
              <p className="text-xs text-slate-400">连续天数</p>
            </div>
          </section>

          {/* Heatmap */}
          <section className="rounded-2xl bg-white p-4 shadow-sm" data-testid="profile-heatmap">
            <h2 className="text-sm font-bold text-slate-700 mb-3">练习热力图（近 3 个月）</h2>
            {heatmapLoading ? (
              <div className="animate-pulse rounded-xl bg-slate-200 h-24" />
            ) : (
              <HeatmapCalendar data={heatmap} />
            )}
          </section>

          {/* Achievements */}
          <section className="rounded-2xl bg-white p-4 shadow-sm" data-testid="profile-achievements">
            <h2 className="text-sm font-bold text-slate-700 mb-3">成就徽章</h2>
            {achievementsLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-slate-200 h-20" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((a) => (
                  <div
                    key={a.key}
                    className={`rounded-xl p-3 text-center transition ${a.unlocked ? 'bg-brand-50' : 'bg-slate-50 opacity-50'}`}
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <p className={`mt-1 text-xs font-bold ${a.unlocked ? 'text-slate-900' : 'text-slate-400'}`}>
                      {a.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400 leading-tight">{a.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Score trend */}
          <section className="rounded-2xl bg-white p-4 shadow-sm" data-testid="profile-trend">
            {scoreTrendLoading ? (
              <div className="animate-pulse rounded-xl bg-slate-200 h-36" />
            ) : (
              <ScoreChart data={scoreTrend} />
            )}
          </section>

          {/* Report list */}
          <section data-testid="profile-reports">
            <h2 className="text-sm font-bold text-slate-700 mb-3">分析报告</h2>
            <div className="space-y-2">
              {history
                .filter((h) => h.has_summary)
                .slice(0, 10)
                .map((item) => (
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
                      <span className="block text-xs text-slate-400">{formatDateLabel(item.created_at)}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      {item.summary_score} 分
                    </span>
                  </button>
                ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}