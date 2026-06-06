import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenarioStore } from '../features/scenario/scenarioStore';

export default function TrainingPage() {
  const navigate = useNavigate();
  const { scenarios, loading, error, fetched, fetchScenarios } = useScenarioStore();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!fetched) fetchScenarios();
  }, [fetched, fetchScenarios]);

  function handleStartConversation() {
    if (scenarios.length === 0) {
      setActionError('暂无可用场景，请联系管理员');
      return;
    }
    const first = scenarios[0];
    navigate(`/conversation/${first.id}`);
  }

  function handleStartCardPractice() {
    navigate('/practice-card');
  }

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4" data-testid="training-loading">
        <div className="animate-pulse rounded-2xl bg-slate-200 h-40" />
        <div className="animate-pulse rounded-2xl bg-slate-200 h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center" data-testid="training-error">
          <p className="text-red-700 mb-3">加载失败：{error}</p>
          <button
            onClick={fetchScenarios}
            className="min-h-11 rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!loading && !error && scenarios.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center" data-testid="training-empty">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm font-bold text-slate-700">暂无训练场景</p>
          <p className="mt-1 text-xs text-slate-400">场景数据正在准备中，请稍后再来</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-[calc(28px+var(--app-safe-bottom))] pt-4">
      <header className="mb-5">
        <h1 className="text-lg font-black text-slate-950">选择训练模式</h1>
        <p className="mt-1 text-xs text-slate-400">选择适合你的口语练习方式</p>
      </header>

      {actionError && (
        <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700" data-testid="training-action-error">
          {actionError}
        </div>
      )}

      <div className="space-y-4">
        {/* 对话模式卡片 */}
        <button
          onClick={handleStartConversation}
          className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md"
          data-testid="training-conversation-card"
        >
          <span className="text-3xl">💬</span>
          <h2 className="mt-3 text-lg font-black text-slate-900">场景对话模式</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            选择真实场景，与 AI 教练进行角色扮演对话，练习地道口语表达。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">场景化学习</span>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">实时纠错</span>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">课后总结</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">共 {scenarios.length} 个场景可用</span>
            <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white">开始对话</span>
          </div>
        </button>

        {/* 抽卡模式卡片 */}
        <button
          onClick={handleStartCardPractice}
          className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md"
          data-testid="training-card-card"
        >
          <span className="text-3xl">🎴</span>
          <h2 className="mt-3 text-lg font-black text-slate-900">抽卡跟练模式</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            随机抽取练习卡片，针对特定句子或场景进行精准发音和表达训练。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">随机挑战</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">精准评分</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">碎片时间</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">随机抽卡练习</span>
            <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white">开始抽卡</span>
          </div>
        </button>
      </div>
    </div>
  );
}