import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, LogIn, MessageCircle, Sparkles, User } from 'lucide-react';
import AppShell from '../../app/AppShell';
import { useAuthStore } from '../../stores/authStore';

const inputClass =
  'min-h-12 w-full rounded-2xl border border-slate-200/80 bg-white py-3 pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch {
      // error 已在 store 中
    }
  };

  return (
    <AppShell className="relative flex min-h-dvh flex-col overflow-hidden !bg-transparent p-0 shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-auth-gradient" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.35),transparent_55%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_60%,rgba(244,63,94,0.12),transparent_45%)]" aria-hidden />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pb-4 pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="relative">
          <div className="absolute inset-0 scale-150 rounded-full bg-brand-500/20 blur-2xl" />
          <div className="relative flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-[1.5rem] bg-white/10 shadow-immersive-glow ring-1 ring-white/20 backdrop-blur-md">
            <MessageCircle className="h-11 w-11 text-white" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="mt-7 text-[2rem] font-black tracking-tight text-white">TalkMate</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" strokeWidth={2} />
          AI 英语口语训练教练
        </p>
        <p className="mt-4 max-w-[16rem] text-center text-xs leading-5 text-white/40">
          沉浸式场景对话 · 实时发音反馈 · 每日成长追踪
        </p>
      </div>

      <div className="relative z-10 shrink-0 px-5 pb-[calc(1.25rem+var(--app-safe-bottom))]">
        <div className="animate-slide-up rounded-[1.75rem] border border-white/10 bg-white/95 px-6 pb-6 pt-5 shadow-sheet backdrop-blur-xl">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">欢迎回来</h2>
          <p className="mt-1 text-sm text-slate-500">登录后继续你的口语练习之旅</p>

          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="username">
                用户名
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearError();
                  }}
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="请输入用户名"
                  className={inputClass}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                密码
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  required
                  minLength={8}
                  maxLength={32}
                  placeholder="请输入密码"
                  className={inputClass}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 text-base font-semibold text-white shadow-brand transition hover:from-brand-500 hover:to-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
            >
              <LogIn className="h-5 w-5" strokeWidth={2} />
              {loading ? '登录中…' : '登录'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/register"
              className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-brand-600 transition hover:text-brand-700"
            >
              还没有账号？去注册
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
