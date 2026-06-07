import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  UtensilsCrossed,
  Users,
  Plane,
  MessageCircle,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTrainingTaskMeta } from '../training/trainingDesign';
import type { Scenario } from './types';

interface Props {
  scenario: Scenario;
  completedCount?: number;
  bestScore?: number | null;
}

const SCENARIO_ICONS: { match: string; icon: LucideIcon; color: string }[] = [
  { match: '面试', icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
  { match: '点餐', icon: UtensilsCrossed, color: 'text-orange-600 bg-orange-50' },
  { match: '餐厅', icon: UtensilsCrossed, color: 'text-orange-600 bg-orange-50' },
  { match: '会议', icon: Users, color: 'text-purple-600 bg-purple-50' },
  { match: '旅行', icon: Plane, color: 'text-sky-600 bg-sky-50' },
  { match: '机场', icon: Plane, color: 'text-sky-600 bg-sky-50' },
  { match: '日常', icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50' },
  { match: '社交', icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50' },
];

export function getScenarioLucideIcon(name: string) {
  const found = SCENARIO_ICONS.find((item) => name.includes(item.match));
  return found ?? { match: '', icon: Layers, color: 'text-brand-600 bg-brand-50' };
}

function difficultyBadgeClass(level: string) {
  if (level.includes('基础') || level.includes('简单')) return 'bg-emerald-50 text-emerald-700';
  if (level.includes('进阶') || level.includes('困难')) return 'bg-rose-50 text-rose-700';
  return 'bg-amber-50 text-amber-700';
}

function progressHint(completedCount: number, bestScore: number | null | undefined) {
  if (completedCount === 0) return '未开始';
  if (bestScore != null) return `已练 ${completedCount} 次 · 最高 ${bestScore}`;
  return `已练 ${completedCount} 次`;
}

export default function ScenarioCard({ scenario, completedCount = 0, bestScore }: Props) {
  const navigate = useNavigate();
  const task = getTrainingTaskMeta(scenario.name);
  const { icon: Icon, color } = getScenarioLucideIcon(scenario.name);
  const [iconColor, iconBg] = color.split(' ');

  return (
    <button
      type="button"
      onClick={() => navigate(`/conversation/${scenario.id}`)}
      data-testid={`scenario-card-${scenario.id}`}
      className="group flex w-full flex-col rounded-[12px] border border-slate-100 bg-white p-3.5 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`} aria-hidden="true">
          <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={1.5} />
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${difficultyBadgeClass(task.level)}`}>
          {task.level}
        </span>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[14px] font-bold leading-5 text-slate-900 group-hover:text-brand-700">
        {scenario.name}
      </h3>
      <p className="mt-1 line-clamp-2 text-[12px] leading-4 text-slate-400">
        {task.duration}
      </p>
      <p className="mt-2 text-[11px] font-medium text-slate-500">
        {progressHint(completedCount, bestScore)}
      </p>
    </button>
  );
}
