import { useCallback, useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Target,
  TrendingUp,
  Flame,
  ChevronRight,
  Star,
  Award,
  Zap,
  Clock,
  Lock,
  Briefcase,
  UtensilsCrossed,
  BarChart3,
  Plane,
  MessageCircle,
  Settings,
  Bell,
  BarChart2,
  type LucideIcon,
} from 'lucide-react';
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

/* ---------- 虚拟数据 ---------- */

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { key: 'first-step', label: '初出茅庐', description: '完成第一次练习', icon: 'Target', unlocked: true, unlocked_at: '2026-06-01' },
  { key: 'week-streak', label: '坚持7天', description: '连续练习7天', icon: 'Flame', unlocked: true, unlocked_at: '2026-06-07' },
  { key: 'perfect-score', label: '完美发音', description: '单次评分达到90分以上', icon: 'Star', unlocked: false },
  { key: 'hundred-minutes', label: '百分钟达人', description: '累计练习超过100分钟', icon: 'Clock', unlocked: true, unlocked_at: '2026-06-05' },
  { key: 'all-scenarios', label: '场景通', description: '完成所有场景练习', icon: 'Award', unlocked: false },
  { key: 'early-bird', label: '早起鸟', description: '在早上6点前完成练习', icon: 'Zap', unlocked: false },
];

const MOCK_HEATMAP: HeatmapDay[] = [
  { date: '2026-05-25', count: 0 },
  { date: '2026-05-26', count: 1 },
  { date: '2026-05-27', count: 2 },
  { date: '2026-05-28', count: 0 },
  { date: '2026-05-29', count: 3 },
  { date: '2026-05-30', count: 1 },
  { date: '2026-05-31', count: 2 },
  { date: '2026-06-01', count: 2 },
  { date: '2026-06-02', count: 1 },
  { date: '2026-06-03', count: 3 },
  { date: '2026-06-04', count: 0 },
  { date: '2026-06-05', count: 2 },
  { date: '2026-06-06', count: 1 },
];

const MOCK_SCORE_TREND: ScorePoint[] = [
  { date: '2026-06-01', score: 72, type: 'conversation' },
  { date: '2026-06-02', score: 78, type: 'card' },
  { date: '2026-06-03', score: 85, type: 'conversation' },
  { date: '2026-06-04', score: 80, type: 'conversation' },
  { date: '2026-06-05', score: 82, type: 'card' },
  { date: '2026-06-06', score: 88, type: 'conversation' },
];

const MOCK_REPORTS = [
  { id: 1, scenario: { name: '面试场景', icon: '💼' }, date: '06/05', score: 82 },
  { id: 2, scenario: { name: '餐厅点餐', icon: '🍽️' }, date: '06/04', score: 78 },
  { id: 3, scenario: { name: '会议讨论', icon: '📊' }, date: '06/02', score: 88 },
  { id: 4, scenario: { name: '日常社交', icon: '💬' }, date: '06/01', score: 75 },
];

const ACHIEVEMENT_ICONS: Record<string, ElementType> = {
  Target,
  Flame,
  Star,
  Clock,
  Award,
  Zap,
};

const SCENARIO_ICON_MAP: Record<string, LucideIcon> = {
  '💼': Briefcase,
  '🍽️': UtensilsCrossed,
  '📊': BarChart3,
  '✈️': Plane,
  '💬': MessageCircle,
};

function resolveScenarioIcon(icon: string): LucideIcon {
  return SCENARIO_ICON_MAP[icon] ?? MessageCircle;
}

function getUserLevel(completed: number, streak: number) {
  if (streak >= 7) return { label: '坚持达人', className: 'bg-amber-100 text-amber-700' };
  if (completed >= 10) return { label: '练习高手', className: 'bg-brand-100 text-brand-700' };
  if (completed >= 3) return { label: '进阶学员', className: 'bg-emerald-100 text-emerald-700' };
  return { label: '新手学员', className: 'bg-slate-100 text-slate-600' };
}

function heatmapColor(count: number) {
  if (count === 0) return 'bg-slate-100';
  if (count <= 2) return 'bg-brand-200';
  if (count <= 5) return 'bg-brand-400';
  return 'bg-brand-600';
}

/* ---------- iOS Settings 分组 ---------- */

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">{children}</div>
    </section>
  );
}

function SettingsCell({
  icon: Icon,
  label,
  value,
  onClick,
  destructive = false,
  showChevron = true,
  last = false,
}: {
  icon?: LucideIcon;
  label: string;
  value?: string;
  onClick?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  last?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-slate-50 ${
        !last ? 'border-b border-slate-100' : ''
      }`}
    >
      {Icon && (
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${destructive ? 'bg-red-50' : 'bg-brand-50'}`}>
          <Icon className={`h-4 w-4 ${destructive ? 'text-red-500' : 'text-brand-600'}`} strokeWidth={1.75} />
        </span>
      )}
      <span className={`min-w-0 flex-1 text-[15px] font-medium ${destructive ? 'text-red-500' : 'text-slate-900'}`}>
        {label}
      </span>
      {value && <span className="shrink-0 text-sm text-slate-400">{value}</span>}
      {showChevron && !destructive && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2} />}
    </Tag>
  );
}

/* ---------- HeatmapStrip (GitHub 风格多行网格) ---------- */

function HeatmapStrip({ data }: { data: HeatmapDay[] }) {
  // 取最近 90 天数据（或全部，如果少于 90 天）
  const count = Math.min(90, data.length);
  const recent = data.slice(-count);

  if (recent.length === 0) {
    return <div className="py-4 text-center text-xs text-slate-400">暂无数据</div>;
  }

  // 计算第一天是周几（0=周一, 6=周日）
  const firstDate = new Date(recent[0].date);
  const firstDayOfWeek = (firstDate.getDay() + 6) % 7;

  // 构建完整的单元格数组
  type Cell = { date: string; count: number; isEmpty: boolean };
  const cells: Cell[] = [];

  // 前面补空，让第一周从周一开始
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ date: '', count: 0, isEmpty: true });
  }

  // 加入真实数据
  for (const day of recent) {
    cells.push({ date: day.date, count: day.count, isEmpty: false });
  }

  // 按 7 天分组（每周为一列）
  const weeks: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // 提取月份标签（每个月份第一周显示）
  const monthLabels: { weekIndex: number; label: string }[] = [];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  let lastMonth = -1;
  weeks.forEach((week, idx) => {
    const firstDay = week.find((d) => !d.isEmpty);
    if (firstDay) {
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ weekIndex: idx, label: monthNames[month] });
        lastMonth = month;
      }
    }
  });

  // 格式化日期为友好格式
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div data-testid="heatmap" className="w-full">
      {/* 月份标签行 */}
      <div className="flex pl-[18px] mb-1 text-[10px] text-slate-400 h-4 leading-4">
        {weeks.map((_, idx) => {
          const label = monthLabels.find((m) => m.weekIndex === idx);
          return (
            <div key={idx} className="w-[15px] flex-shrink-0 text-left">
              {label ? label.label : ''}
            </div>
          );
        })}
      </div>

      {/* 热力图主体 */}
      <div className="flex gap-[3px]">
        {/* 星期标签列（周一、三、五） */}
        <div className="flex flex-col gap-[3px] w-[15px] text-[10px] text-slate-400 flex-shrink-0">
          {['', '一', '', '三', '', '五', ''].map((label, idx) => (
            <div key={idx} className="h-3 flex items-center justify-end pr-1 leading-none">
              {label}
            </div>
          ))}
        </div>

        {/* 方块网格 */}
        <div className="flex gap-[3px] flex-1 overflow-hidden">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px] w-[12px] flex-shrink-0">
              {week.map((day, dayIdx) =>
                day.isEmpty ? (
                  <div key={dayIdx} className="h-3 w-3" />
                ) : (
                  <div
                    key={dayIdx}
                    className={`h-3 w-3 rounded-sm transition-all hover:scale-125 hover:ring-1 hover:ring-brand-400 cursor-pointer ${heatmapColor(day.count)}`}
                    title={`${formatDate(day.date)} · ${day.count} 次练习`}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
        <span className="font-medium">少</span>
        <span className="h-2.5 w-2.5 rounded-sm bg-slate-100" />
        <span className="h-2.5 w-2.5 rounded-sm bg-brand-200" />
        <span className="h-2.5 w-2.5 rounded-sm bg-brand-400" />
        <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" />
        <span className="font-medium">多</span>
      </div>
    </div>
  );
}

/* ---------- MiniScoreChart (CSS bars) ---------- */

function MiniScoreChart({ data }: { data: ScorePoint[] }) {
  const [range, setRange] = useState<7 | 30>(30);
  const cutoff = daysAgo(range);
  const filtered = data.filter((p) => p.date >= cutoff);

  return (
    <div data-testid="score-chart">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">得分趋势</h3>
        <div className="flex gap-1">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                range === r ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {r} 天
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">暂无数据</p>
      ) : (
        <>
          <div className="flex h-20 items-end gap-1.5">
            {filtered.map((point, i) => (
              <div key={`${point.date}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full max-w-[20px] rounded-t-sm transition-all ${
                    point.type === 'conversation' ? 'bg-brand-500' : 'bg-amber-500'
                  }`}
                  style={{ height: `${Math.max((point.score / 100) * 100, 8)}%` }}
                  title={`${point.date}: ${point.score} 分`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand-500" /> 对话
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> 抽卡
            </span>
          </div>
        </>
      )}
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
      // 统计加载失败静默处理
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
    return () => {
      mountedRef.current = false;
    };
  }, [fetchHistory, fetchStats]);

  const scoredHistory = history.filter((h) => h.summary_score !== null);
  const averageScore =
    scoredHistory.length === 0
      ? null
      : Math.round(scoredHistory.reduce((s, h) => s + (h.summary_score ?? 0), 0) / scoredHistory.length);
  const completedCount = history.filter((h) => h.has_summary).length;
  const displayHeatmap = heatmap.length > 0 ? heatmap : MOCK_HEATMAP;
  const streakDays = computeStreakDays(displayHeatmap);

  const initial = user?.username?.[0]?.toUpperCase() ?? '?';
  const userLevel = getUserLevel(completedCount, streakDays);

  const pageLoading = historyLoading && history.length === 0;
  const pageError = historyError && history.length === 0;

  const displayAchievements = achievements.length > 0 ? achievements : MOCK_ACHIEVEMENTS;
  const displayScoreTrend = scoreTrend.length > 0 ? scoreTrend : MOCK_SCORE_TREND;
  const displayReports =
    history.length > 0
      ? history.filter((h) => h.has_summary).slice(0, 10)
      : (MOCK_REPORTS.map(
          (r) =>
            ({
              ...r,
              created_at: `2026-${r.date.replace('/', '-')}`,
              has_summary: true,
              summary_score: r.score,
            }) as unknown as ConversationHistoryItem,
        ) as ConversationHistoryItem[]);

  return (
    <div className="min-h-full bg-slate-50 px-4 pb-[calc(var(--app-bottom-nav-height)+var(--app-safe-bottom))] pt-4">
      {/* 用户头部卡片 */}
      <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-5 shadow-lg shadow-brand-200/40">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-indigo-400/20 blur-xl" />

        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-white/20 text-2xl font-black text-white shadow-inner ring-2 ring-white/30 backdrop-blur-sm">
              {initial}
            </div>
            <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm ${userLevel.className}`}>
              {userLevel.label}
            </span>
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">我的档案</p>
            <h1 className="mt-0.5 truncate text-xl font-black text-white">{user?.username ?? '用户'}</h1>
            <p className="mt-2 text-[13px] leading-snug text-white/70">坚持练习，每天进步一点点</p>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-lg font-black text-white">{completedCount || 12}</p>
            <p className="text-[10px] text-white/50">总练习</p>
          </div>
          <div className="border-x border-white/15 text-center">
            <p className="text-lg font-black text-white">{averageScore ?? 85}</p>
            <p className="text-[10px] text-white/50">平均分</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-white">{streakDays}</p>
            <p className="text-[10px] text-white/50">连续天</p>
          </div>
        </div>
      </section>

      {pageLoading && (
        <div className="space-y-4" data-testid="profile-loading">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      )}

      {!pageLoading && pageError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center" data-testid="profile-error">
          <p className="mb-3 text-red-700">加载失败：{historyError}</p>
          <button
            type="button"
            onClick={fetchHistory}
            className="min-h-11 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            重试
          </button>
        </div>
      )}

      {!pageLoading && !pageError && (
        <div className="animate-fade-in space-y-6">
          {/* 学习数据 */}
          <SettingsSection title="学习数据">
            <div data-testid="profile-stats" className="p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center rounded-xl bg-slate-50 p-3">
                  <Target className="mb-1 h-5 w-5 text-brand-500" strokeWidth={1.5} />
                  <p className="text-xl font-black text-slate-900">{completedCount || 12}</p>
                  <p className="text-[11px] text-slate-400">总练习</p>
                </div>
                <div className="flex flex-col items-center rounded-xl bg-slate-50 p-3">
                  <TrendingUp className="mb-1 h-5 w-5 text-emerald-500" strokeWidth={1.5} />
                  <p className="text-xl font-black text-slate-900">{averageScore ?? 85}</p>
                  <p className="text-[11px] text-slate-400">平均分</p>
                </div>
                <div className="flex flex-col items-center rounded-xl bg-slate-50 p-3">
                  <Flame className="mb-1 h-5 w-5 text-amber-500" strokeWidth={1.5} />
                  <p className="text-xl font-black text-slate-900">{streakDays}</p>
                  <p className="text-[11px] text-slate-400">连续天数</p>
                </div>
              </div>

              {streakDays > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
                  <Flame className="h-4 w-4 text-amber-500" strokeWidth={2} />
                  <span className="text-xs font-semibold text-amber-700">已连续练习 {streakDays} 天，继续保持！</span>
                </div>
              )}

              <div className="mt-4 border-t border-slate-100 pt-4" data-testid="profile-heatmap">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-brand-500" strokeWidth={1.5} />
                  <h3 className="text-sm font-bold text-slate-700">练习热力</h3>
                </div>
                {heatmapLoading ? (
                  <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
                ) : (
                  <HeatmapStrip data={displayHeatmap} />
                )}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4" data-testid="profile-trend">
                {scoreTrendLoading ? (
                  <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
                ) : (
                  <MiniScoreChart data={displayScoreTrend} />
                )}
              </div>
            </div>
          </SettingsSection>

          {/* 成就徽章 */}
          <SettingsSection title="成就徽章">
            <div className="p-4" data-testid="profile-achievements">
              {achievementsLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {displayAchievements.map((a) => {
                    const IconComponent = ACHIEVEMENT_ICONS[a.icon] || Star;
                    return (
                      <div
                        key={a.key}
                        className={`rounded-xl p-3 text-center transition ${
                          a.unlocked ? 'bg-brand-50' : 'bg-slate-50 opacity-50'
                        }`}
                      >
                        <div className="mb-1 flex justify-center">
                          {a.unlocked ? (
                            <IconComponent className="h-6 w-6 text-brand-600" strokeWidth={1.5} />
                          ) : (
                            <Lock className="h-6 w-6 text-slate-400" strokeWidth={1.5} />
                          )}
                        </div>
                        <p className={`text-xs font-bold ${a.unlocked ? 'text-slate-900' : 'text-slate-400'}`}>
                          {a.label}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-tight text-slate-400">{a.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SettingsSection>

          {/* 练习报告 */}
          <SettingsSection title="练习报告">
            <div data-testid="profile-reports">
              {displayReports
                .filter((h) => h.has_summary)
                .slice(0, 10)
                .map((item, index, arr) => {
                  const ScenarioIcon = resolveScenarioIcon(item.scenario.icon);
                  const isLast = index === arr.length - 1;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(`/conversation/${item.id}/summary`)}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-slate-50 ${
                        !isLast ? 'border-b border-slate-100' : ''
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                        <ScenarioIcon className="h-4 w-4 text-brand-600" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-slate-900">{item.scenario.name}</span>
                        <span className="block text-xs text-slate-400">{formatDateLabel(item.created_at)}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-emerald-600">
                        {item.summary_score} 分
                        <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={2} />
                      </span>
                    </button>
                  );
                })}
            </div>
          </SettingsSection>

          {/* 设置 */}
          <SettingsSection title="设置">
            <SettingsCell icon={Bell} label="通知提醒" value="开启" />
            <SettingsCell icon={Settings} label="账号与安全" last />
          </SettingsSection>

          {/* 退出 */}
          <SettingsSection title="">
            <SettingsCell icon={LogOut} label="退出" onClick={logout} destructive showChevron={false} last />
          </SettingsSection>
        </div>
      )}
    </div>
  );
}
