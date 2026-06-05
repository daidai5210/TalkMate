import ScenarioCard from './ScenarioCard';
import type { Scenario } from './types';

interface Props {
  scenarios: Scenario[];
}

export default function ScenarioList({ scenarios }: Props) {
  return (
    <div
      className="grid grid-cols-1 gap-3"
      data-testid="scenario-list"
    >
      {scenarios.map((s) => (
        <ScenarioCard key={s.id} scenario={s} />
      ))}
    </div>
  );
}

export function ScenarioListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="min-h-52 animate-pulse rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-slate-200" />
          </div>
          <div className="mb-3 h-3 w-24 rounded bg-slate-200" />
          <div className="mb-3 h-6 w-3/4 rounded bg-slate-200" />
          <div className="mb-2 h-3 w-full rounded bg-slate-200" />
          <div className="mb-6 h-3 w-5/6 rounded bg-slate-200" />
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScenarioListEmpty() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-sm sm:p-10">
      <p className="mb-1 text-lg font-bold text-slate-700">暂无训练任务</p>
      <p className="break-words text-sm text-slate-500">
        系统尚未配置任何口语任务，请稍后再来或联系管理员。
      </p>
    </div>
  );
}
