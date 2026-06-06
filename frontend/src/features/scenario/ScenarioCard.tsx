import { useNavigate } from 'react-router-dom';
import { getTrainingTaskMeta } from '../training/trainingDesign';
import type { Scenario } from './types';

interface Props {
  scenario: Scenario;
}

export default function ScenarioCard({ scenario }: Props) {
  const navigate = useNavigate();
  const task = getTrainingTaskMeta(scenario.name);

  return (
    <button
      type="button"
      onClick={() => navigate(`/conversation/${scenario.id}`)}
      data-testid={`scenario-card-${scenario.id}`}
      className="group flex min-h-52 w-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm shadow-slate-200/80 transition hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/70 focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-sky-50 p-3 text-brand-700" aria-hidden="true">
          <TaskIcon />
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {task.level} · {task.duration}
        </span>
      </div>

      <div className="mt-4 min-w-0">
        <p className="text-xs font-semibold uppercase text-brand-600">{scenario.name}任务</p>
        <h3 className="mt-2 break-words text-lg font-black text-slate-950 group-hover:text-brand-700">
          {task.title}
        </h3>
        <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-slate-600">{task.goal || scenario.description}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {task.focus.slice(0, 3).map((item) => (
          <span key={item} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
            {item}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="min-w-0 break-words text-sm text-slate-500">AI 角色：{task.role}</span>
        <span className="inline-flex min-h-10 shrink-0 items-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition group-hover:bg-brand-700">
          开始训练
          <span aria-hidden="true" className="ml-1">→</span>
        </span>
      </div>
    </button>
  );
}

function TaskIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="M7 3h10" />
      <path d="M8 11h8" />
      <path d="M9 15h6" />
    </svg>
  );
}
