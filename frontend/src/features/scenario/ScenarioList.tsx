import ScenarioCard from './ScenarioCard';
import type { Scenario } from './types';

export interface ScenarioProgress {
  completedCount: number;
  bestScore: number | null;
}

interface Props {
  scenarios: Scenario[];
  progressByScenarioId?: Record<number, ScenarioProgress>;
}

export default function ScenarioList({ scenarios, progressByScenarioId = {} }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3" data-testid="scenario-list">
      {scenarios.map((s) => {
        const progress = progressByScenarioId[s.id];
        return (
          <ScenarioCard
            key={s.id}
            scenario={s}
            completedCount={progress?.completedCount ?? 0}
            bestScore={progress?.bestScore}
          />
        );
      })}
    </div>
  );
}

export function ScenarioListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-[12px] border border-slate-100 bg-white p-3.5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="h-4 w-10 rounded-full bg-slate-200" />
          </div>
          <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function ScenarioListEmpty() {
  return (
    <div className="rounded-[12px] border border-dashed border-slate-200 bg-white p-8 text-center">
      <p className="text-[15px] font-bold text-slate-700">暂无训练场景</p>
      <p className="mt-1 text-[13px] text-slate-400">场景数据正在准备中，请稍后再来</p>
    </div>
  );
}
