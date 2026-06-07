import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import AppShell from '../app/AppShell';
import ErrorProfileCard from '../components/ErrorProfileCard';
import {
  generateSummary,
  getSummary,
  SummaryApiError,
  type ConversationSummary,
} from '../services/summaryService';
import {
  getMandarinIssueTags,
  getNextActionSuggestion,
  getTaskCompletionScore,
  getTrainingTaskMeta,
} from '../features/training/trainingDesign';

const grammarLabels: Record<string, string> = {
  tense_errors: '时态错误',
  subject_verb_agreement: '主谓一致',
  article_usage: '冠词使用',
  word_order: '语序问题',
  other: '其他问题',
};

const suggestionLabels: Record<string, string> = {
  grammar: '语法',
  vocabulary: '词汇',
  expression: '表达',
  pronunciation: '发音',
};

function scoreRingColor(score: number): string {
  if (score >= 85) return '#34d399';
  if (score >= 70) return '#fbbf24';
  return '#fb7185';
}

function formatKey(key: string): string {
  return grammarLabels[key] ?? key.split('_').join(' ');
}

function ScoreRing({ score, taskCompletion }: { score: number; taskCompletion: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const offset = circumference - (progress / 100) * circumference;
  const color = scoreRingColor(score);

  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center" data-testid="summary-score">
      <svg className="-rotate-90" width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white">{score}</span>
        <span className="mt-1 text-xs text-white/50">综合评分</span>
        <span className="mt-2 rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-white/70">
          完成度 {taskCompletion}%
        </span>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const conversationId = id ? Number(id) : NaN;

  useEffect(() => {
    if (!Number.isFinite(conversationId)) {
      setLoading(false);
      setError('无效的对话 ID');
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);
    setGenerateError(null);
    setEmptyMessage(null);
    getSummary(conversationId)
      .then((data) => {
        if (!alive) return;
        setSummary(data);
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof SummaryApiError && err.code === 3003) {
          setSummary(null);
          setEmptyMessage(err.message);
          return;
        }
        const message = err instanceof Error ? err.message : '获取总结失败';
        setError(message);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [conversationId]);

  async function handleGenerateSummary() {
    if (!Number.isFinite(conversationId) || generating) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const data = await generateSummary(conversationId);
      setSummary(data);
      setEmptyMessage(null);
      setGenerateError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成总结失败';
      setGenerateError(message);
    } finally {
      setGenerating(false);
    }
  }

  const grammarEntries = useMemo(
    () => Object.entries(summary?.grammar_issues ?? {}).filter(([, value]) => typeof value === 'number'),
    [summary],
  );

  const vocabulary = summary?.vocabulary_usage;
  const mandarinTags = summary ? getMandarinIssueTags(summary.feedback, summary.grammar_issues) : [];
  const taskCompletion = summary ? getTaskCompletionScore(summary.score, summary.feedback.length) : 0;
  const nextAction = summary ? getNextActionSuggestion(mandarinTags, summary.suggestions) : '';
  const task = getTrainingTaskMeta(null);

  if (loading) {
    return (
      <AppShell className="flex items-center justify-center bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 shadow-none animate-fade-in" data-testid="summary-loading" role="status" aria-live="polite">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-indigo-400" />
          <p className="text-sm font-medium text-white/60">正在读取课后总结…</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell className="px-4 py-6 bg-slate-950 shadow-none" data-testid="summary-error">
        <div className="rounded-3xl border border-red-400/30 bg-red-500/15 p-6 backdrop-blur-md">
          <p className="text-lg font-semibold text-red-200">总结加载失败</p>
          <p className="mt-2 break-words text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-5 min-h-11 rounded-full bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-400"
            data-testid="summary-back-button"
          >
            返回上一页
          </button>
        </div>
      </AppShell>
    );
  }

  if (!summary) {
    return (
      <AppShell className="flex items-center justify-center px-4 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 shadow-none" data-testid="summary-empty">
        <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur-xl">
          <p className="text-lg font-semibold text-white">暂无总结数据</p>
          <p className="mt-2 break-words text-sm leading-6 text-white/60">
            {emptyMessage ?? '这段对话还没有生成总结。你可以返回对话页点击结束对话，或在这里直接生成。'}
          </p>
          {generateError && (
            <p className="mt-3 rounded-2xl bg-red-500/20 px-4 py-2 text-sm text-red-200" data-testid="summary-generate-error" role="alert">
              生成总结失败:{generateError}
            </p>
          )}
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={generating}
            className="mt-5 min-h-11 rounded-full bg-white/15 px-5 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="summary-empty-generate-button"
          >
            {generating ? '生成总结中…' : '生成总结'}
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell className="relative min-h-dvh bg-slate-950 shadow-none animate-fade-in" data-testid="summary-page">
      <div className="relative bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900 px-4 pb-28 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.2),transparent_60%)]" />
        <div className="relative flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            data-testid="summary-home-button"
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <span className="max-w-[12rem] truncate rounded-full bg-white/10 px-3 py-1 text-xs text-white/50 backdrop-blur-md">
            {new Date(summary.created_at).toLocaleString()}
          </span>
        </div>

        <div className="relative mt-6 animate-fade-in-up">
          <ScoreRing score={summary.score} taskCompletion={taskCompletion} />
        </div>

        <div className="relative mt-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Growth Report</p>
          <h1 className="mt-2 text-xl font-black text-white">任务反馈与中式英语画像</h1>
          <div className="mt-4 flex flex-wrap justify-center gap-2" data-testid="mandarin-issue-tags">
            {mandarinTags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-indigo-200 backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-12 rounded-t-[2rem] bg-white pb-[calc(140px+var(--app-safe-bottom))] shadow-[0_-8px_40px_rgba(0,0,0,0.15)]">
        <div className="mx-auto h-1 w-10 rounded-full bg-slate-200 pt-3" />

        <div className="space-y-5 px-4 pt-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card" data-testid="summary-feedback">
            <h2 className="text-lg font-bold text-slate-900">详细纠错</h2>
            {summary.feedback.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">本轮未发现明显语法或表达错误，继续保持。</p>
            ) : (
              <div className="mt-5 space-y-4">
                {summary.feedback.map((item, index) => (
                  <article key={`${item.original}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-400">#{index + 1} 原句</p>
                    <p className="mt-1 break-words text-sm text-rose-700 line-through decoration-rose-300">{item.original}</p>
                    <p className="mt-4 text-xs font-semibold text-slate-400">建议表达</p>
                    <p className="mt-1 break-words text-base font-semibold text-emerald-700">{item.corrected}</p>
                    <div className="mt-4 grid gap-3">
                      <p className="break-words rounded-xl bg-white p-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">原因：</span>{item.reason}</p>
                      <p className="break-words rounded-xl bg-white p-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">建议：</span>{item.suggestion}</p>
                    </div>
                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <p className="text-xs font-bold text-brand-700">中式英语改写器</p>
                      <div className="mt-3 grid gap-3">
                        <RewriteCard title="正确版" content={item.corrected} />
                        <RewriteCard title="自然版" content={item.suggestion || item.corrected} />
                        <RewriteCard title="场景版" content={`在${task.title}中，建议优先使用更具体、礼貌且目标明确的表达。`} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {summary.has_enough_data && summary.error_profile && (
            <ErrorProfileCard data={summary.error_profile} />
          )}

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card" data-testid="summary-grammar">
            <h2 className="text-lg font-bold text-slate-900">语法问题</h2>
            {grammarEntries.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">暂无语法统计。</p>
            ) : (
              <div className="mt-5 space-y-3">
                {grammarEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="min-w-0 break-words pr-3 text-sm text-slate-600">{formatKey(key)}</span>
                    <span className="shrink-0 text-lg font-black text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card" data-testid="summary-vocabulary">
            <h2 className="text-lg font-bold text-slate-900">词汇分析</h2>
            {!vocabulary ? (
              <p className="mt-4 text-sm text-slate-500">暂无词汇分析。</p>
            ) : (
              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>词汇水平</span>
                  <span className="font-bold text-brand-700">{vocabulary.level ?? 'unknown'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>不同词数量</span>
                  <span className="font-bold text-slate-900">{vocabulary.unique_words ?? 0}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">高级词汇</p>
                  <p className="mt-1 break-words text-slate-500">{vocabulary.advanced_words_used?.join('、') || '暂无'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">重复词汇</p>
                  <p className="mt-1 break-words text-slate-500">{vocabulary.repetitive_words?.join('、') || '暂无'}</p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-brand-100 bg-brand-50 p-5" data-testid="summary-next-action">
            <p className="text-xs font-bold uppercase text-brand-700">Next Training</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">练习后行动建议</h2>
            <p className="mt-3 break-words text-sm leading-6 text-slate-700">
              {summary.next_practice_advice || nextAction}
            </p>
          </section>

          {summary.example_sentences && summary.example_sentences.length > 0 && (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card" data-testid="summary-examples">
              <h2 className="text-lg font-bold text-slate-900">可改进例句</h2>
              <div className="mt-4 space-y-4">
                {summary.example_sentences.map((ex, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="grid gap-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">原句</p>
                        <p className="text-sm text-rose-700 line-through decoration-rose-300">{ex.original}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">改进版</p>
                        <p className="text-sm font-semibold text-emerald-700">{ex.improved}</p>
                      </div>
                      <p className="text-xs text-slate-500">{ex.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card" data-testid="summary-suggestions">
            <h2 className="text-lg font-bold text-slate-900">改进建议</h2>
            {summary.suggestions.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">暂无改进建议。</p>
            ) : (
              <div className="mt-5 grid gap-4">
                {summary.suggestions.map((item, index) => (
                  <article key={`${item.category}-${index}`} className="rounded-2xl bg-brand-50 p-4">
                    <p className="text-xs font-bold text-brand-700">{suggestionLabels[item.category] ?? item.category}</p>
                    <p className="mt-2 break-words text-sm leading-6 text-slate-700">{item.content}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[var(--app-max-width)] border-t border-slate-100 bg-white/95 px-4 pb-[calc(12px+var(--app-safe-bottom))] pt-3 backdrop-blur-md">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-h-12 rounded-full bg-slate-950 text-sm font-semibold text-white hover:bg-brand-700"
          >
            回到对话复练
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="min-h-11 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            选择下一任务
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function RewriteCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <p className="mt-2 break-words text-sm leading-6 text-slate-700">{content}</p>
    </div>
  );
}
