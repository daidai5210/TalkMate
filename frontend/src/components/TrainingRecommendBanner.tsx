import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { getNextGoal, type NextGoalResponse } from '../services/profileService';

export default function TrainingRecommendBanner() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState<NextGoalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getNextGoal()
      .then((data) => {
        if (!alive) return;
        setGoal(data);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : '推荐加载失败');
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-[12px] border border-slate-100 bg-white p-4" data-testid="recommend-banner-loading">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
        <div className="mt-2.5 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-3 w-full animate-pulse rounded bg-slate-100" />
      </section>
    );
  }

  if (error || !goal) return null;

  if (!goal.has_enough_data || !goal.recommended_scenario_id) {
    return (
      <section className="rounded-[12px] border border-slate-100 bg-white p-4" data-testid="recommend-banner-empty">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50">
            <Sparkles className="h-4 w-4 text-brand-600" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-slate-900">中式英语画像</p>
            <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
              {goal.hint ?? '完成 5 次练习后解锁个性化推荐'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <button
      type="button"
      onClick={() => goal.recommended_scenario_id && navigate(`/conversation/${goal.recommended_scenario_id}`)}
      className="flex w-full items-center gap-3 rounded-[12px] border border-brand-100 bg-brand-50/50 p-4 text-left transition hover:bg-brand-50 active:scale-[0.99]"
      data-testid="recommend-banner"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
        <Sparkles className="h-4 w-4 text-brand-600" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">针对性推荐</p>
        <p className="mt-0.5 truncate text-[14px] font-bold text-slate-900">
          {goal.recommended_scenario_name}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-slate-500">
          重点：{goal.focus_error_label}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={1.5} />
    </button>
  );
}
