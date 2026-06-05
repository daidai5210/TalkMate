import { useCallback, useEffect, useRef, useState } from 'react';
import NavBar from './NavBar';
import PracticeHistoryList from '../components/PracticeHistoryList';
import { listConversations } from '../features/conversation/conversationService';
import type { ConversationHistoryItem } from '../features/conversation/types';
import ScenarioList, {
  ScenarioListEmpty,
  ScenarioListSkeleton,
} from '../features/scenario/ScenarioList';
import { useScenarioStore } from '../features/scenario/scenarioStore';

export default function HomePage() {
  const { scenarios, loading, error, fetched, fetchScenarios } = useScenarioStore();
  const [history, setHistory] = useState<ConversationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const historyMountedRef = useRef(false);
  const historyRequestIdRef = useRef(0);

  const fetchHistory = useCallback(async () => {
    const requestId = historyRequestIdRef.current + 1;
    historyRequestIdRef.current = requestId;

    if (historyMountedRef.current) {
      setHistoryLoading(true);
      setHistoryError(null);
    }

    try {
      const records = await listConversations();
      if (historyMountedRef.current && historyRequestIdRef.current === requestId) {
        setHistory(records);
      }
    } catch (err) {
      if (historyMountedRef.current && historyRequestIdRef.current === requestId) {
        setHistoryError(err instanceof Error ? err.message : '获取练习记录失败');
      }
    } finally {
      if (historyMountedRef.current && historyRequestIdRef.current === requestId) {
        setHistoryLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!fetched) {
      fetchScenarios();
    }
  }, [fetched, fetchScenarios]);

  useEffect(() => {
    historyMountedRef.current = true;
    fetchHistory();

    return () => {
      historyMountedRef.current = false;
    };
  }, [fetchHistory]);

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

        <section className="mt-10" data-testid="practice-history-section">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h2 className="text-lg font-medium">历史练习记录</h2>
              <p className="text-sm text-gray-500">回顾最近的练习表现和总结</p>
            </div>
            <button
              type="button"
              onClick={fetchHistory}
              disabled={historyLoading}
              className="w-full sm:w-auto text-sm px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              data-testid="history-refresh"
            >
              刷新
            </button>
          </div>
          <PracticeHistoryList
            records={history}
            loading={historyLoading}
            error={historyError}
            onRetry={fetchHistory}
          />
        </section>
      </main>
    </div>
  );
}
