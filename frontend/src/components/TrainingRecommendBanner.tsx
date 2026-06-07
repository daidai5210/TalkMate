import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="recommend-banner-loading">
        <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-3 h-6 w-3/4 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-100" />
      </section>
    );
  }

  if (error || !goal) return null;

  if (!goal.has_enough_data || !goal.recommended_scenario_id) {
    return (
      <section className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm" data-testid="recommend-banner-empty">
        <p className="text-xs font-bold uppercase text-brand-600">Chinese English Profile</p>
        <h2 className="mt-2 text-xl font-black text-slate-950">中式英语画像</h2>
        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
          {goal.hint ?? '完成 5 次练习后解锁你的中式英语画像'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/conversation/1')}
          className="mt-4 min-h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          开始练习
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-brand-100 bg-brand-50 p-5 shadow-sm" data-testid="recommend-banner">
      <p className="text-xs font-bold uppercase text-brand-700">Next Training</p>
      <h2 className="mt-2 text-xl font-black text-slate-950">
        建议练习：{goal.recommended_scenario_name}
      </h2>
      <p className="mt-2 text-sm font-semibold text-brand-700">
        重点改善：{goal.focus_error_label}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-slate-700">
        {goal.reason}
      </p>
      <button
        type="button"
        onClick={() => goal.recommended_scenario_id && navigate(`/conversation/${goal.recommended_scenario_id}`)}
        className="mt-4 min-h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        开始针对性练习
      </button>
    </section>
  );
}