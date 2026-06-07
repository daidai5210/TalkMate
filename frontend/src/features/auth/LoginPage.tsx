import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, MessageCircle, Sparkles } from 'lucide-react';
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
    <AppShell className="flex flex-col">
      {/* 品牌视觉区 */}
      <div className="relative flex flex-col items-center justify-center bg-gradient-to-b from-brand-600 to-brand-800 px-6 pb-10 pt-14">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
          <MessageCircle className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">TalkMate</h1>
        <p className="mt-2 text-sm text-brand-200">AI 英语口语训练教练</p>
        <div className="mt-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
          <Sparkles className="h-4 w-4 text-brand-300" strokeWidth={1.5} />
          <span className="text-xs text-brand-100">每天 5 分钟，说一口流利英语</span>
        </div>
      </div>

      {/* 表单卡片 */}
      <div className="-mt-5 flex-1 rounded-t-[1.75rem] bg-white px-6 pt-8">
        <h2 className="mb-6 text-lg font-bold text-slate-900">欢迎回来</h2>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600" htmlFor="username">用户名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearError(); }}
              required
              minLength={3}
              maxLength={50}
              placeholder="请输入用户名"
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base placeholder:text-slate-300 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600" htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              required
              minLength={8}
              maxLength={32}
              placeholder="请输入密码"
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base placeholder:text-slate-300 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <LogIn className="h-5 w-5" strokeWidth={2} />
            {loading ? '登录中…' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            还没有账号？去注册
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
