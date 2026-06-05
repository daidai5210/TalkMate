import ScenarioCard from './ScenarioCard';
import type { Scenario } from './types';

interface Props {
  scenarios: Scenario[];
}

export default function ScenarioList({ scenarios }: Props) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-100 p-4 sm:p-5 min-h-40 sm:h-44 animate-pulse"
        >
          <div className="h-10 w-10 bg-gray-200 rounded mb-3" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-full mb-1" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function ScenarioListEmpty() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 sm:p-10 text-center">
      <p className="text-gray-500 mb-1">暂无场景</p>
      <p className="text-sm text-gray-400 break-words">
        系统尚未配置任何练习场景,请稍后再来或联系管理员。
      </p>
    </div>
  );
}
