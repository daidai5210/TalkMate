import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../app/AppShell';
import { useAuthStore } from '../../stores/authStore';

type Strength = 'weak' | 'medium' | 'strong';

function passwordStrength(pwd: string): Strength {
  if (pwd.length < 8) return 'weak';
  const hasLetter = /[A-Za-z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
  const score =
    [hasLetter, hasDigit, hasSymbol].filter(Boolean).length + (pwd.length >= 12 ? 1 : 0);
  if (score >= 3) return 'strong';
  if (score === 2) return 'medium';
  return 'weak';
}

const STRENGTH_LABEL: Record<Strength, string> = {
  weak: '弱',
  medium: '中',
  strong: '强',
};

const STRENGTH_COLOR: Record<Strength, string> = {
  weak: 'bg-red-500',
  medium: 'bg-yellow-500',
  strong: 'bg-green-500',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [captcha, setCaptcha] = useState('');

  const strength = useMemo(() => passwordStrength(password), [password]);
  const mismatch = confirm.length > 0 && password !== confirm;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mismatch) return;
    try {
      await register(username, password, captcha);
      navigate('/login');
    } catch {
      // error 已在 store 中
    }
  };

  return (
    <AppShell className="flex flex-col px-5 pb-[calc(24px+var(--app-safe-bottom))] pt-8">
      <header className="shrink-0">
        <p className="text-sm font-bold uppercase text-brand-600">TalkMate</p>
        <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950">
          创建口语成长档案
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          注册后即可进入任务制英语训练。
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="mt-8 flex min-h-0 flex-1 flex-col"
      >
        <div className="space-y-4">
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
            pattern="[A-Za-z0-9_]+"
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
          {password && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="min-w-24 flex-1 h-1.5 bg-gray-200 rounded">
                <div
                  className={`h-full ${STRENGTH_COLOR[strength]} rounded`}
                  style={{
                    width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%',
                  }}
                />
              </div>
              <span className="text-gray-600">强度: {STRENGTH_LABEL[strength]}</span>
            </div>
          )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="confirm">确认密码</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            maxLength={32}
              className={`min-h-12 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-base focus:bg-white focus:outline-none focus:ring-2 ${
                mismatch ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-200'
            }`}
          />
          {mismatch && <p className="text-xs text-red-500 break-words">两次密码不一致</p>}
          </div>

          <div className="space-y-2">
            <label className="block break-words text-sm font-semibold text-slate-700" htmlFor="captcha">验证码(MVP 固定值:1234)</label>
          <input
            id="captcha"
            type="text"
            value={captcha}
            onChange={(e) => {
              setCaptcha(e.target.value.replace(/\D/g, '').slice(0, 4));
              clearError();
            }}
            required
            minLength={4}
            maxLength={4}
            inputMode="numeric"
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          </div>
        </div>

        {error && <p className="mt-4 break-words rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="mt-auto pt-6">
          <button
            type="submit"
            disabled={loading || mismatch}
            className="min-h-12 w-full rounded-2xl bg-slate-950 px-4 py-3 text-base font-bold text-white shadow-lg shadow-slate-200 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? '注册中…' : '注册'}
          </button>

          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-brand-700 hover:border-brand-200 hover:bg-brand-50"
            >
              已有账号？去登录
            </Link>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
