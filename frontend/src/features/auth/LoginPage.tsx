import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../app/AppShell';
import { useAuthStore } from '../../stores/authStore';

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
    <AppShell className="flex flex-col px-5 pb-[calc(24px+var(--app-safe-bottom))] pt-10">
      <header className="shrink-0">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-600">TalkMate</p>
        <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950">
          开始今天的英语口语训练
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          登录后进入任务训练、AI 对话、纠错反馈和历史复练。
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="mt-10 flex min-h-0 flex-1 flex-col"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="username">用户名</label>
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
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="password">密码</label>
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
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          </div>
        </div>

        {error && <p className="mt-4 break-words rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="mt-auto pt-8">
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-2xl bg-slate-950 px-4 py-3 text-base font-bold text-white shadow-lg shadow-slate-200 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? '登录中…' : '登录'}
          </button>

          <div className="mt-4 text-center">
            <Link
              to="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-brand-700 hover:border-brand-200 hover:bg-brand-50"
            >
              还没有账号？去注册
            </Link>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
