import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useScenarioStore } from '../features/scenario/scenarioStore';
import ScenarioList, { ScenarioListSkeleton, ScenarioListEmpty } from '../features/scenario/ScenarioList';
import type { ScenarioProgress } from '../features/scenario/ScenarioList';
import { listConversations } from '../features/conversation/conversationService';
import type { ConversationHistoryItem } from '../features/conversation/types';

function buildProgressMap(history: ConversationHistoryItem[]): Record<number, ScenarioProgress> {
  const map: Record<number, ScenarioProgress> = {};
  for (const item of history) {
    const sid = item.scenario.id;
    const existing = map[sid] ?? { completedCount: 0, bestScore: null };
    if (item.has_summary) {
      existing.completedCount += 1;
      if (item.summary_score != null) {
        existing.bestScore = existing.bestScore == null
          ? item.summary_score
          : Math.max(existing.bestScore, item.summary_score);
      }
    }
    map[sid] = existing;
  }
  return map;
}

export default function ScenariosPage() {
  const { scenarios, loading, error, fetched, fetchScenarios } = useScenarioStore();
  const [history, setHistory] = useState<ConversationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const mountedRef = useRef(false);

  const fetchHistory = useCallback(async () => {
    if (mountedRef.current) setHistoryLoading(true);
    try {
      const records = await listConversations();
      if (mountedRef.current) setHistory(records);
    } catch {
      // progress is non-critical
    } finally {
      if (mountedRef.current) setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!fetched) fetchScenarios();
    fetchHistory();
    return () => { mountedRef.current = false; };
  }, [fetched, fetchScenarios, fetchHistory]);

  const progressByScenarioId = buildProgressMap(history);

  if (loading) {
    return (
      <div className="bg-white px-4 pb-[calc(var(--app-bottom-nav-height)+var(--app-safe-bottom))] pt-4" data-testid="scenarios-loading">
        <header className="mb-4">
          <h1 className="text-[17px] font-black text-slate-950">场景对话</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">选择场景，开始角色扮演练习</p>
        </header>
        <ScenarioListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white px-4 py-6 pb-[calc(var(--app-bottom-nav-height)+var(--app-safe-bottom))]">
        <div className="rounded-[12px] border border-red-200 bg-red-50 p-6 text-center" data-testid="scenarios-error">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" strokeWidth={1.5} />
          <p className="mb-3 text-red-700">加载失败：{error}</p>
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

  if (scenarios.length === 0) {
    return (
      <div className="bg-white px-4 py-6 pb-[calc(var(--app-bottom-nav-height)+var(--app-safe-bottom))]">
        <ScenarioListEmpty />
      </div>
    );
  }

  return (
    <div className="bg-white px-4 pb-[calc(var(--app-bottom-nav-height)+var(--app-safe-bottom))] pt-4">
      <header className="mb-4">
        <h1 className="text-[17px] font-black text-slate-950">场景对话</h1>
        <p className="mt-0.5 text-[13px] text-slate-400">选择场景，开始角色扮演练习</p>
      </header>

      <div className={`animate-fade-in ${historyLoading ? 'opacity-80' : ''}`}>
        <ScenarioList scenarios={scenarios} progressByScenarioId={progressByScenarioId} />
      </div>
    </div>
  );
}
