import { useMemo } from 'react';

const ERROR_LABELS: Record<string, string> = {
  word_order: '中式语序',
  tense: '时态',
  article: '冠词',
  preposition: '介词',
  direct_translation: '直译表达',
};

const ERROR_COLORS: Record<string, string> = {
  word_order: '#ef4444',
  tense: '#f59e0b',
  article: '#3b82f6',
  preposition: '#10b981',
  direct_translation: '#8b5cf6',
};

export interface ErrorProfileData {
  word_order?: number;
  tense?: number;
  article?: number;
  preposition?: number;
  direct_translation?: number;
}

interface ErrorProfileCardProps {
  data: ErrorProfileData;
}

export default function ErrorProfileCard({ data }: ErrorProfileCardProps) {
  const entries = useMemo(() => {
    return Object.entries(data)
      .filter(([, v]) => typeof v === 'number')
      .map(([key, value]) => ({
        key,
        label: ERROR_LABELS[key] ?? key,
        value: value as number,
        color: ERROR_COLORS[key] ?? '#94a3b8',
      }));
  }, [data]);

  const allZero = entries.every((e) => e.value === 0);
  if (allZero || entries.length === 0) return null;

  const total = entries.reduce((sum, e) => sum + e.value, 0);
  const maxVal = Math.max(...entries.map((e) => e.value), 1);
  const top = entries.reduce((a, b) => (a.value > b.value ? a : b));

  return (
    <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm" data-testid="error-profile-card">
      <h2 className="text-xl font-bold text-slate-900">本次中式英语画像</h2>
      <div className="mt-5 space-y-4">
        {entries.map((entry) => {
          const pct = Math.round((entry.value / maxVal) * 100);
          return (
            <div key={entry.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{entry.label}</span>
                <span className="font-black text-slate-900">{entry.value}</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: entry.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded-2xl bg-brand-50 p-4">
        <p className="text-xs font-bold text-brand-700">最高频</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">
          {top.label} — 占比 {total > 0 ? Math.round((top.value / total) * 100) : 0}%，建议针对性练习
        </p>
      </div>
    </div>
  );
}