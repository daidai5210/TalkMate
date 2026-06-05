import { useEffect } from 'react';
import NavBar from './NavBar';
import ScenarioList, {
  ScenarioListEmpty,
  ScenarioListSkeleton,
} from '../features/scenario/ScenarioList';
import { useScenarioStore } from '../features/scenario/scenarioStore';

export default function HomePage() {
  const { scenarios, loading, error, fetched, fetchScenarios } = useScenarioStore();

  useEffect(() => {
    if (!fetched) {
      fetchScenarios();
    }
  }, [fetched, fetchScenarios]);

  return (
    <div className="min-h-screen px-4 py-6 max-w-6xl mx-auto">
      <NavBar />

      <main>
        <div className="mb-4">
          <h2 className="text-lg font-medium">选择你的练习场景</h2>
          <p className="text-sm text-gray-500">点击卡片开始一段英语口语练习</p>
        </div>

        {loading && <ScenarioListSkeleton />}

        {!loading && error && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
            data-testid="scenarios-error"
          >
            <p className="text-red-700 mb-3">加载场景失败:{error}</p>
            <button
              onClick={fetchScenarios}
              className="text-sm px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              data-testid="scenarios-retry"
            >
              重试
            </button>
          </div>
        )}

        {!loading && !error && scenarios.length === 0 && <ScenarioListEmpty />}

        {!loading && !error && scenarios.length > 0 && <ScenarioList scenarios={scenarios} />}
      </main>
    </div>
  );
}
