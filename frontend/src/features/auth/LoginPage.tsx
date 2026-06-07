import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, LogIn, MessageCircle, User } from 'lucide-react';
import AppShell from '../../app/AppShell';
import { useAuthStore } from '../../stores/authStore';

const inputClass =
  'min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20';

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
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-brand-900"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pb-6 pt-14">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.25rem] bg-white/10 shadow-lg shadow-black/25 ring-1 ring-white/15 backdrop-blur-md">
          <MessageCircle className="h-10 w-10 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 text-[1.75rem] font-black tracking-tight text-white">TalkMate</h1>
        <p className="mt-2 text-center text-sm font-medium text-slate-300">AI 英语口语训练教练</p>
      </div>

      <div className="relative z-10 shrink-0 animate-slide-up rounded-t-3xl bg-white px-6 pb-[calc(1.5rem+var(--app-safe-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.35)]">
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-slate-200" aria-hidden />

        <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-900">欢迎回来</h2>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
            className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 text-base font-semibold text-white shadow-brand transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <LogIn className="h-5 w-5" strokeWidth={2} />
            {loading ? '登录中…' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="inline-flex min-h-12 items-center justify-center text-sm font-semibold text-brand-600 transition hover:text-brand-700"
          >
            还没有账号？去注册
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
