import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from '../app/NavBar';
import {
  generateSummary,
  getSummary,
  SummaryApiError,
  type ConversationSummary,
} from '../services/summaryService';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6" data-testid="summary-loading" role="status" aria-live="polite">
        <div className="mx-auto max-w-5xl">
          <NavBar />
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
            <p className="text-sm font-medium text-slate-600">正在读取课后总结…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6" data-testid="summary-error">
        <div className="mx-auto max-w-5xl">
          <NavBar />
          <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm sm:p-8">
            <p className="text-lg font-semibold text-red-700">总结加载失败</p>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-5 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
              data-testid="summary-back-button"
            >
              返回上一页
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6" data-testid="summary-empty">
        <div className="mx-auto max-w-5xl">
          <NavBar />
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-lg font-semibold text-slate-800">暂无总结数据</p>
            <p className="mt-2 text-sm text-slate-500">
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
              className="mt-5 min-h-11 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              data-testid="summary-empty-generate-button"
            >
              {generating ? '生成总结中…' : '生成总结'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff)] px-4 py-6" data-testid="summary-page">
      <div className="mx-auto max-w-5xl">
        <NavBar />
        <div className="mt-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-slate-500 hover:text-brand-600"
            data-testid="summary-home-button"
          >
            ← 返回场景
          </button>
          <span className="w-fit break-words rounded-full bg-white/80 px-3 py-1 text-xs text-slate-500 shadow-sm sm:text-right">
            生成时间 {new Date(summary.created_at).toLocaleString()}
          </span>
        </div>

        <section className="mt-4 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-xl backdrop-blur">
          <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[240px_1fr] md:p-8">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-lg sm:p-6" data-testid="summary-score">
              <p className="text-sm text-slate-300">综合评分</p>
              <div className={`mt-4 text-5xl font-black tracking-tight sm:text-7xl ${scoreTone(summary.score)}`}>
                {summary.score}
              </div>
              <p className="mt-3 text-sm text-slate-300">满分 100，根据表达自然度、语法、词汇与沟通完整度综合评估。</p>
            </div>

            <div className="flex flex-col justify-center">
              <p className="break-words text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">TalkMate Lesson Report</p>
              <h1 className="mt-3 break-words text-2xl font-black text-slate-950 sm:text-3xl md:text-4xl">课后纠错与成长建议</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                以下总结基于本轮对话自动生成，帮助你快速定位表达问题、复盘词汇使用，并形成下一轮练习目标。
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <p className="break-words rounded-xl bg-white p-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">原因：</span>{item.reason}</p>
                      <p className="break-words rounded-xl bg-white p-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">建议：</span>{item.suggestion}</p>
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

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="summary-suggestions">
          <h2 className="text-xl font-bold text-slate-900">改进建议</h2>
          {summary.suggestions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">暂无改进建议。</p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
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
  );
}
