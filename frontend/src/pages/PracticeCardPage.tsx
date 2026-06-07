import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, AlertCircle, RotateCcw, ChevronLeft, Volume2 } from 'lucide-react';
import VoiceLongPressButton from '../components/VoiceLongPressButton';
import api from '../services/api';

interface PracticeCard {
  id: number;
  scenario: string;
  role: string;
  content: string;
  hint: string | null;
  difficulty: number;
}

interface EvaluateResult {
  id: number;
  score: number;
  pronunciation: number | null;
  grammar: number | null;
  fluency: number | null;
  feedback: string | null;
  created_at: string;
}

type PageState = 'loading' | 'ready' | 'recording' | 'evaluating' | 'result' | 'error' | 'empty';

function scoreColor(score: number) {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-rose-600';
}

function difficultyLabel(d: number) {
  if (d === 1) return '简单';
  if (d === 2) return '中等';
  return '困难';
}

function difficultyColor(d: number) {
  if (d === 1) return 'bg-emerald-50 text-emerald-700';
  if (d === 2) return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-700';
}

export default function PracticeCardPage() {
  const navigate = useNavigate();
  const [card, setCard] = useState<PracticeCard | null>(null);
  const [result, setResult] = useState<EvaluateResult | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCard = useCallback(async () => {
    setPageState('loading');
    setErrorMsg(null);
    setResult(null);
    try {
      const { data } = await api.get('/api/v1/practice-cards/random');
      if (data.code === 0 && data.data) {
        setCard(data.data);
        setPageState('ready');
      } else {
        setCard(null);
        setPageState('empty');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '获取卡片失败');
      setPageState('error');
    }
  }, []);

  useEffect(() => {
    fetchCard();
  }, [fetchCard]);

  const handleVoiceStop = useCallback(async (text: string) => {
    if (!card) return;
    setPageState('evaluating');
    setErrorMsg(null);
    try {
      const { data } = await api.post(`/api/v1/practice-cards/${card.id}/evaluate`, { text });
      if (data.code === 0 && data.data) {
        setResult(data.data);
        setPageState('result');
      } else {
        setErrorMsg(data.message || '评分失败');
        setPageState('error');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '评分请求失败');
      setPageState('error');
    }
  }, [card]);

  const handleNextCard = useCallback(() => {
    fetchCard();
  }, [fetchCard]);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-[calc(28px+var(--app-safe-bottom))] pt-4">
      {/* Header */}
      <header className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/app/home')}
          className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-600"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          返回
        </button>
        <h1 className="text-lg font-black text-slate-950">抽卡跟练</h1>
      </header>

      {/* Loading */}
      {pageState === 'loading' && (
        <div className="flex flex-1 items-center justify-center" data-testid="practice-loading">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
            <p className="mt-3 text-sm text-slate-500">抽取卡片中...</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {pageState === 'empty' && (
        <div className="flex flex-1 items-center justify-center" data-testid="practice-empty">
          <div className="text-center">
            <Layers className="mx-auto mb-2 h-10 w-10 text-slate-300" strokeWidth={1} />
            <p className="text-sm font-bold text-slate-700">暂无可用卡片</p>
            <p className="mt-1 text-xs text-slate-400">卡片数据正在准备中</p>
            <button
              onClick={fetchCard}
              className="mt-4 flex items-center justify-center gap-2 min-h-11 rounded-2xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              重试
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {pageState === 'error' && (
        <div className="flex flex-1 items-center justify-center" data-testid="practice-error">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-2 h-10 w-10 text-red-400" strokeWidth={1.5} />
            <p className="text-red-600 mb-3">{errorMsg}</p>
            <button
              onClick={fetchCard}
              className="flex items-center justify-center gap-2 min-h-11 rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              重试
            </button>
          </div>
        </div>
      )}

      {/* Card + Recording */}
      {(pageState === 'ready' || pageState === 'recording') && card && (
        <div className="flex flex-1 flex-col" data-testid="practice-card">
          <div className="rounded-[1.5rem] bg-white p-5 shadow-card border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">{card.scenario}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">{card.role}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor(card.difficulty)}`}>
                {difficultyLabel(card.difficulty)}
              </span>
            </div>
            <p className="text-lg font-bold text-slate-900 leading-relaxed">{card.content}</p>
            {card.hint && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3">
                <p className="text-xs font-bold text-amber-700">提示</p>
                <p className="mt-1 text-sm text-amber-800">{card.hint}</p>
              </div>
            )}
          </div>

          <div className="mt-auto py-6 flex justify-center">
            <VoiceLongPressButton
              onStop={handleVoiceStop}
              onError={(err) => setErrorMsg(err)}
            />
          </div>
        </div>
      )}

      {/* Evaluating */}
      {pageState === 'evaluating' && (
        <div className="flex flex-1 items-center justify-center" data-testid="practice-evaluating">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
            <p className="mt-3 text-sm font-medium text-slate-600">AI 正在评分...</p>
          </div>
        </div>
      )}

      {/* Result */}
      {pageState === 'result' && result && card && (
        <div className="flex flex-1 flex-col" data-testid="practice-result">
          {/* Original card */}
          <div className="rounded-[1.5rem] bg-white p-5 shadow-card border border-slate-200 opacity-60">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">{card.scenario}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">{card.role}</span>
            </div>
            <p className="text-lg font-bold text-slate-900 leading-relaxed">{card.content}</p>
          </div>

          {/* Score */}
          <div className="mt-4 rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
              <p className="text-sm text-slate-300">综合评分</p>
            </div>
            <div className={`mt-2 text-5xl font-black ${scoreColor(result.score)}`}>
              {result.score}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/10 p-2 text-center">
                <p className="text-[10px] text-slate-300">发音</p>
                <p className="text-lg font-bold">{result.pronunciation ?? '-'}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-2 text-center">
                <p className="text-[10px] text-slate-300">语法</p>
                <p className="text-lg font-bold">{result.grammar ?? '-'}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-2 text-center">
                <p className="text-[10px] text-slate-300">流畅度</p>
                <p className="text-lg font-bold">{result.fluency ?? '-'}</p>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {result.feedback && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <p className="text-xs font-bold text-slate-500">AI 反馈</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{result.feedback}</p>
            </div>
          )}

          {/* Next card button */}
          <div className="mt-auto py-6">
            <button
              onClick={handleNextCard}
              className="w-full min-h-12 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-brand hover:bg-brand-700 active:scale-[0.98]"
            >
              下一张卡片
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
