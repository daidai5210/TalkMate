import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import { Layers, AlertCircle, RotateCcw, ChevronLeft, Volume2, Sparkles, Star } from 'lucide-react';
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

/** MVP 展示用积分，仅用于卡面鼓励展示 */
function displayEncourageScore(cardId: number, difficulty: number): number {
  const base = 60 + (cardId % 25);
  const bonus = difficulty === 1 ? 15 : difficulty === 2 ? 10 : 5;
  return Math.min(99, base + bonus);
}

function SparkleBurst({ show }: { show: boolean }) {
  if (!show) return null;
  const particles = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-amber-300"
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            x: Math.cos((i / 12) * Math.PI * 2) * (60 + (i % 3) * 20),
            y: Math.sin((i / 12) * Math.PI * 2) * (60 + (i % 3) * 20),
          }}
          transition={{ duration: 0.8, delay: 0.15 + i * 0.03, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export default function PracticeCardPage() {
  const navigate = useNavigate();
  const [card, setCard] = useState<PracticeCard | null>(null);
  const [result, setResult] = useState<EvaluateResult | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const evaluatingRef = useRef(false);

  const fetchCard = useCallback(async () => {
    setPageState('loading');
    setErrorMsg(null);
    setResult(null);
    setFlipped(false);
    setShowSparkle(false);
    evaluatingRef.current = false;
    try {
      const { data } = await api.get('/api/v1/practice-cards/random');
      if (data.code === 0 && data.data) {
        setCard(data.data);
        setPageState('ready');
        setTimeout(() => {
          setFlipped(true);
          setShowSparkle(true);
          setTimeout(() => setShowSparkle(false), 1200);
        }, 200);
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
    setShowSparkle(false);
    fetchCard();
  }, [fetchCard]);

  const showCard = (pageState === 'ready' || pageState === 'recording' || pageState === 'evaluating' || pageState === 'result') && card;
  const encourageScore = card ? displayEncourageScore(card.id, card.difficulty) : 0;

  return (
    <AppShell className="relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/90 to-slate-900 shadow-none animate-fade-in">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.08),transparent_50%)]" />

      <header className="relative z-10 flex shrink-0 items-center gap-3 px-4 pb-2 pt-[max(8px,env(safe-area-inset-top))]">
        <button
          onClick={() => navigate('/app/home')}
          className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rose-400" strokeWidth={2} />
          <h1 className="text-[17px] font-black text-white">抽卡跟练</h1>
        </div>
      </header>

      {pageState === 'loading' && (
        <div className="relative z-10 flex flex-1 items-center justify-center" data-testid="practice-loading">
          <div className="text-center">
            <motion.div
              className="mx-auto h-14 w-10 rounded-xl border-2 border-white/20 bg-gradient-to-b from-rose-500/40 to-indigo-600/40"
              animate={{ rotateY: [0, 180, 360], scale: [1, 1.1, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <p className="mt-4 text-sm text-white/50">正在抽取卡片…</p>
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
          <div className="relative flex flex-1 items-center justify-center [perspective:1200px]">
            <SparkleBurst show={showSparkle} />
            <AnimatePresence mode="wait">
              <motion.div
                key={card.id}
                initial={{ rotateY: -180, opacity: 0, scale: 0.85, y: 40 }}
                animate={{
                  rotateY: flipped ? 0 : -180,
                  opacity: flipped ? 1 : 0,
                  scale: flipped ? 1 : 0.85,
                  y: flipped ? 0 : 40,
                }}
                exit={{ rotateY: 180, opacity: 0, scale: 0.85, y: -20 }}
                transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
                className="relative w-full max-w-md"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-white/15 via-white/8 to-indigo-500/10 p-6 shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-rose-500/20 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl" />

                  <div className="relative mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-500/30 px-2.5 py-0.5 text-xs font-bold text-indigo-200">{card.scenario}</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/60">{card.role}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor(card.difficulty)}`}>
                      {difficultyLabel(card.difficulty)}
                    </span>
                  </div>

                  <p className="relative text-xl font-bold leading-relaxed text-white">{card.content}</p>

                  {card.hint && (
                    <div className="relative mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
                      <p className="text-xs font-bold text-amber-300">提示</p>
                      <p className="mt-1 text-sm text-amber-100/80">{card.hint}</p>
                    </div>
                  )}

                  <div
                    className="relative mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    data-testid="card-encourage-score"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-400" strokeWidth={2} fill="currentColor" />
                      <span className="text-xs font-medium text-white/50">挑战积分</span>
                    </div>
                    <motion.span
                      className="text-2xl font-black text-amber-300"
                      initial={{ scale: 0 }}
                      animate={{ scale: flipped ? 1 : 0 }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                    >
                      +{encourageScore}
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {(pageState === 'ready' || pageState === 'recording') && (
            <div className="shrink-0 py-8 flex flex-col items-center gap-2">
              <p className="text-xs text-white/40">长按录音，完成本句挑战</p>
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
                <motion.div
                  className={`mt-2 text-5xl font-black ${scoreColor(result.score)}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  {result.score}
                </motion.div>
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
