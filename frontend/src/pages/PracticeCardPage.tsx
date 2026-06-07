import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import { Layers, AlertCircle, RotateCcw, ChevronLeft, Volume2 } from 'lucide-react';
import AppShell from '../app/AppShell';
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
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-rose-400';
}

function difficultyLabel(d: number) {
  if (d === 1) return '简单';
  if (d === 2) return '中等';
  return '困难';
}

function difficultyColor(d: number) {
  if (d === 1) return 'bg-emerald-500/20 text-emerald-300';
  if (d === 2) return 'bg-amber-500/20 text-amber-300';
  return 'bg-rose-500/20 text-rose-300';
}

export default function PracticeCardPage() {
  const navigate = useNavigate();
  const [card, setCard] = useState<PracticeCard | null>(null);
  const [result, setResult] = useState<EvaluateResult | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const evaluatingRef = useRef(false);

  const fetchCard = useCallback(async () => {
    setPageState('loading');
    setErrorMsg(null);
    setResult(null);
    setFlipped(false);
    evaluatingRef.current = false;
    try {
      const { data } = await api.get('/api/v1/practice-cards/random');
      if (data.code === 0 && data.data) {
        setCard(data.data);
        setPageState('ready');
        setTimeout(() => setFlipped(true), 100);
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
    if (!card || evaluatingRef.current) return;
    evaluatingRef.current = true;
    setPageState('evaluating');
    setErrorMsg(null);
    try {
      const { data } = await api.post(`/api/v1/practice-cards/${card.id}/evaluate`, { text });
      if (data.code === 0 && data.data) {
        setResult(data.data);
        setPageState('result');
      } else {
        setErrorMsg(data.message || '评分失败');
        evaluatingRef.current = false;
        setPageState('error');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '评分请求失败');
      evaluatingRef.current = false;
      setPageState('error');
    }
  }, [card]);

  const handleNextCard = useCallback(() => {
    setFlipped(false);
    fetchCard();
  }, [fetchCard]);

  const showCard = (pageState === 'ready' || pageState === 'recording' || pageState === 'evaluating' || pageState === 'result') && card;

  return (
    <AppShell className="relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/90 to-slate-900 shadow-none animate-fade-in">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_70%)]" />

      <header className="relative z-10 flex shrink-0 items-center gap-3 px-4 pb-2 pt-[max(8px,env(safe-area-inset-top))]">
        <button
          onClick={() => navigate('/app/home')}
          className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-black text-white">抽卡跟练</h1>
      </header>

      {pageState === 'loading' && (
        <div className="relative z-10 flex flex-1 items-center justify-center" data-testid="practice-loading">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-rose-400" />
            <p className="mt-3 text-sm text-white/50">抽取卡片中…</p>
          </div>
        </div>
      )}

      {pageState === 'empty' && (
        <div className="relative z-10 flex flex-1 items-center justify-center" data-testid="practice-empty">
          <div className="text-center">
            <Layers className="mx-auto mb-2 h-10 w-10 text-white/20" strokeWidth={1} />
            <p className="text-sm font-bold text-white/80">暂无可用卡片</p>
            <p className="mt-1 text-xs text-white/40">卡片数据正在准备中</p>
            <button
              onClick={fetchCard}
              className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/25"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              重试
            </button>
          </div>
        </div>
      )}

      {pageState === 'error' && (
        <div className="relative z-10 flex flex-1 items-center justify-center" data-testid="practice-error">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-2 h-10 w-10 text-red-400" strokeWidth={1.5} />
            <p className="mb-3 text-red-300">{errorMsg}</p>
            <button
              onClick={fetchCard}
              className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-400"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              重试
            </button>
          </div>
        </div>
      )}

      {showCard && (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4" data-testid="practice-card">
          <div className="flex flex-1 items-center justify-center perspective-[1200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={card.id}
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: flipped ? 0 : -90, opacity: flipped ? 1 : 0 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="w-full max-w-md"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-500/30 px-2.5 py-0.5 text-xs font-bold text-indigo-200">{card.scenario}</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/60">{card.role}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor(card.difficulty)}`}>
                      {difficultyLabel(card.difficulty)}
                    </span>
                  </div>
                  <p className="text-xl font-bold leading-relaxed text-white">{card.content}</p>
                  {card.hint && (
                    <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
                      <p className="text-xs font-bold text-amber-300">提示</p>
                      <p className="mt-1 text-sm text-amber-100/80">{card.hint}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {(pageState === 'ready' || pageState === 'recording') && (
            <div className="shrink-0 py-8 flex justify-center">
              <VoiceLongPressButton
                key={card.id}
                disabled={pageState !== 'ready' && pageState !== 'recording'}
                variant="immersive"
                onStart={() => setPageState('recording')}
                onStop={handleVoiceStop}
                onError={(err) => setErrorMsg(err)}
              />
            </div>
          )}

          {pageState === 'evaluating' && (
            <div className="shrink-0 py-8 flex justify-center" data-testid="practice-evaluating">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-rose-400" />
                <p className="mt-3 text-sm font-medium text-white/60">AI 正在评分…</p>
              </div>
            </div>
          )}
        </div>
      )}

      <Drawer.Root open={pageState === 'result' && result !== null} dismissible={false}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
          <Drawer.Content
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[var(--app-max-width)] rounded-t-[1.75rem] border border-white/10 bg-slate-900/95 backdrop-blur-xl outline-none animate-slide-up"
            data-testid="practice-result"
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />
            {result && card && (
              <div className="px-5 pb-[calc(24px+var(--app-safe-bottom))] pt-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-white/40" strokeWidth={1.5} />
                  <p className="text-sm text-white/60">综合评分</p>
                </div>
                <div className={`mt-2 text-5xl font-black ${scoreColor(result.score)}`}>
                  {result.score}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <ScorePill label="发音" value={result.pronunciation} />
                  <ScorePill label="语法" value={result.grammar} />
                  <ScorePill label="流畅度" value={result.fluency} />
                </div>
                {result.feedback && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-bold text-white/50">AI 反馈</p>
                    <p className="mt-2 text-sm leading-6 text-white/80">{result.feedback}</p>
                  </div>
                )}
                <button
                  onClick={handleNextCard}
                  className="mt-5 h-12 w-full rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-[15px] font-bold text-white shadow-[0_4px_20px_rgba(244,63,94,0.35)] hover:from-rose-400 hover:to-pink-500 active:scale-[0.98]"
                >
                  下一张卡片
                </button>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </AppShell>
  );
}

function ScorePill({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
      <p className="text-[10px] text-white/40">{label}</p>
      <p className="text-lg font-bold text-white">{value ?? '-'}</p>
    </div>
  );
}
