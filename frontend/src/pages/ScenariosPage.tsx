import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Clock, ChevronRight, AlertCircle, Users } from 'lucide-react';
import { useScenarioStore } from '../features/scenario/scenarioStore';

/* ---------- 虚拟场景数据 ---------- */
interface MockScenario {
  id: number;
  name: string;
  description: string;
  icon: string;
  duration: string;
  difficulty: string;
  participants: number;
  color: string;
}

const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: 1,
    name: '面试场景',
    description: '模拟英文面试问答，提升求职英语口语表达能力',
    icon: '💼',
    duration: '5-10 分钟',
    difficulty: '中等',
    participants: 1247,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 2,
    name: '餐厅点餐',
    description: '模拟餐厅点餐、结账等用餐场景',
    icon: '🍽️',
    duration: '5-10 分钟',
    difficulty: '简单',
    participants: 892,
    color: 'bg-orange-50 text-orange-600',
  },
  {
    id: 3,
    name: '会议讨论',
    description: '模拟英文会议发言、讨论与汇报',
    icon: '📊',
    duration: '10-15 分钟',
    difficulty: '困难',
    participants: 654,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    id: 4,
    name: '机场旅行',
    description: '模拟机场、酒店、问路、购物等旅行场景',
    icon: '✈️',
    duration: '5-10 分钟',
    difficulty: '简单',
    participants: 1083,
    color: 'bg-sky-50 text-sky-600',
  },
  {
    id: 5,
    name: '日常社交',
    description: '日常社交聊天，培养开口说英语的信心',
    icon: '💬',
    duration: '5-10 分钟',
    difficulty: '简单',
    participants: 2156,
    color: 'bg-green-50 text-green-600',
  },
];

function difficultyColor(difficulty: string) {
  switch (difficulty) {
    case '简单': return 'bg-emerald-50 text-emerald-700';
    case '中等': return 'bg-amber-50 text-amber-700';
    case '困难': return 'bg-rose-50 text-rose-700';
    default: return 'bg-slate-50 text-slate-700';
  }
}

export default function ScenariosPage() {
  const navigate = useNavigate();
  const { scenarios, loading, error, fetched, fetchScenarios } = useScenarioStore();

  useEffect(() => {
    if (!fetched) fetchScenarios();
  }, [fetched, fetchScenarios]);

  const displayScenarios: MockScenario[] = scenarios.length > 0
    ? scenarios.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        icon: s.icon,
        duration: '5-10 分钟',
        difficulty: '简单',
        participants: 0,
        color: 'bg-brand-50 text-brand-600',
      }))
    : MOCK_SCENARIOS;

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4" data-testid="scenarios-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-slate-200 h-28" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center" data-testid="scenarios-error">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" strokeWidth={1.5} />
          <p className="text-red-700 mb-3">加载失败：{error}</p>
          <button
            onClick={fetchScenarios}
            className="min-h-11 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!loading && !error && scenarios.length === 0 && MOCK_SCENARIOS.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center" data-testid="scenarios-empty">
          <MessageCircle className="mx-auto mb-2 h-10 w-10 text-slate-300" strokeWidth={1} />
          <p className="text-sm font-bold text-slate-700">暂无训练场景</p>
          <p className="mt-1 text-xs text-slate-400">场景数据正在准备中，请稍后再来</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-[calc(28px+var(--app-safe-bottom))] pt-4">
      <header className="mb-5">
        <h1 className="text-lg font-black text-slate-950">场景对话</h1>
        <p className="mt-1 text-xs text-slate-400">选择一个场景，开始角色扮演对话练习</p>
      </header>

      <div className="space-y-3 animate-fade-in">
        {displayScenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => navigate(`/conversation/${scenario.id}`)}
            className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:border-brand-200 hover:shadow-card-hover active:scale-[0.98]"
            data-testid="training-conversation-card"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${scenario.color || 'bg-brand-50 text-brand-600'}`}>
              <span className="text-xl">{scenario.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">{scenario.name}</h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${difficultyColor(scenario.difficulty || '简单')}`}>
                  {scenario.difficulty}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-2">{scenario.description}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" strokeWidth={2} />
                  {scenario.duration || '5-10 分钟'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" strokeWidth={2} />
                  {(scenario as any).participants || 0} 人参与
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </div>
  );
}
