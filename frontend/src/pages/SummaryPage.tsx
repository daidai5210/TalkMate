import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../app/AppShell';
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

function scoreTone(score: number): string {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-rose-600';
}

function formatKey(key: string): string {
  return grammarLabels[key] ?? key.split('_').join(' ');
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
      <AppShell className="flex items-center justify-center px-4 py-6" data-testid="summary-loading" role="status" aria-live="polite">
          <div className="w-full rounded-3xl bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
            <p className="text-sm font-medium text-slate-600">正在读取课后总结…</p>
          </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell className="px-4 py-6" data-testid="summary-error">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-lg font-semibold text-red-700">总结加载失败</p>
            <p className="mt-2 break-words text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-5 min-h-11 rounded-2xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
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
      <AppShell className="px-4 py-6" data-testid="summary-empty">
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-800">暂无总结数据</p>
            <p className="mt-2 break-words text-sm leading-6 text-slate-500">
              {emptyMessage ?? '这段对话还没有生成总结。你可以返回对话页点击结束对话,或在这里直接生成。'}
            </p>
            {generateError && (
              <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700" data-testid="summary-generate-error" role="alert">
                生成总结失败:{generateError}
              </p>
            )}
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={generating}
              className="mt-5 min-h-11 rounded-2xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              data-testid="summary-empty-generate-button"
            >
              {generating ? '生成总结中…' : '生成总结'}
            </button>
          </div>
      </AppShell>
    );
  }

  return (
    <AppShell className="bg-slate-50" data-testid="summary-page">
      <div className="px-4 pb-[calc(28px+var(--app-safe-bottom))] pt-4">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="min-h-10 text-sm font-semibold text-slate-500 hover:text-brand-600"
            data-testid="summary-home-button"
          >
            ← 返回
          </button>
          <span className="max-w-[12rem] break-words rounded-full bg-white px-3 py-1 text-right text-xs text-slate-500 shadow-sm">
            {new Date(summary.created_at).toLocaleString()}
          </span>
        </div>

        <section className="mt-4 overflow-hidden rounded-[1.75rem] bg-white shadow-sm">
          <div className="p-4">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-lg" data-testid="summary-score">
              <p className="text-sm text-slate-300">综合评分</p>
              <div className={`mt-4 text-6xl font-black ${scoreTone(summary.score)}`}>
                {summary.score}
              </div>
              <div className="mt-5 rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-slate-300">任务完成度</p>
                <p className="mt-2 text-3xl font-black text-white">{taskCompletion}%</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="break-words text-xs font-bold uppercase text-brand-600">Growth Report</p>
              <h1 className="mt-2 break-words text-2xl font-black leading-tight text-slate-950">任务反馈与中式英语画像</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                优先看关键问题，再按建议回到对话复练。
              </p>
              <div className="mt-5 flex flex-wrap gap-2" data-testid="mandarin-issue-tags">
                {mandarinTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="summary-feedback">
            <h2 className="text-xl font-bold text-slate-900">详细纠错</h2>
            {summary.feedback.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">本轮未发现明显语法或表达错误，继续保持。</p>
            ) : (
              <div className="mt-5 space-y-4">
                {summary.feedback.map((item, index) => (
                  <article key={`${item.original}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                      <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-brand-700"
                      >
                        复练这句话
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="summary-grammar">
              <h2 className="text-xl font-bold text-slate-900">语法问题</h2>
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
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="summary-vocabulary">
              <h2 className="text-xl font-bold text-slate-900">词汇分析</h2>
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
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-brand-100 bg-brand-50 p-6 shadow-sm" data-testid="summary-next-action">
          <p className="text-xs font-bold uppercase text-brand-700">Next Training</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">练习后行动建议</h2>
          <p className="mt-3 break-words text-sm leading-6 text-slate-700">{nextAction}</p>
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="min-h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              回到对话复练
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="min-h-11 rounded-2xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-700 hover:bg-white/80"
            >
              选择下一任务
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="summary-suggestions">
          <h2 className="text-xl font-bold text-slate-900">改进建议</h2>
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
