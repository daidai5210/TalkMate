import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Lock, MessageCircle, ShieldCheck, User, UserPlus } from 'lucide-react';
import AppShell from '../../app/AppShell';
import { useAuthStore } from '../../stores/authStore';

type Strength = 'weak' | 'medium' | 'strong';

function passwordStrength(pwd: string): Strength {
  if (pwd.length < 8) return 'weak';
  const hasLetter = /[A-Za-z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
  const score = [hasLetter, hasDigit, hasSymbol].filter(Boolean).length + (pwd.length >= 12 ? 1 : 0);
  if (score >= 3) return 'strong';
  if (score === 2) return 'medium';
  return 'weak';
}

const STRENGTH_LABEL: Record<Strength, string> = { weak: '弱', medium: '中', strong: '强' };
const STRENGTH_COLOR: Record<Strength, string> = {
  weak: 'bg-red-500',
  medium: 'bg-amber-500',
  strong: 'bg-emerald-500',
};

const inputClass =
  'min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20';

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
    <AppShell className="relative flex min-h-dvh flex-col overflow-hidden !bg-transparent p-0 shadow-none">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-brand-900"
        aria-hidden
      />

      <div className="relative z-10 flex shrink-0 flex-col items-center justify-center px-8 py-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.125rem] bg-white/10 shadow-lg shadow-black/25 ring-1 ring-white/15 backdrop-blur-md">
          <MessageCircle className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-white">TalkMate</h1>
        <p className="mt-1.5 text-center text-sm font-medium text-slate-300">创建你的口语成长档案</p>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-end">
        <div className="max-h-[68dvh] shrink-0 overflow-y-auto rounded-t-3xl bg-white px-6 pb-[calc(1.5rem+var(--app-safe-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] animate-slide-up">
          <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-slate-200" aria-hidden />

          <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-900">创建账号</h2>

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
                  pattern="[A-Za-z0-9_]+"
                  placeholder="英文、数字、下划线"
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
                  placeholder="至少 8 位"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              {password && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${STRENGTH_COLOR[strength]}`}
                      style={{
                        width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%',
                      }}
                    />
                  </div>
                  <span className="text-slate-500">{STRENGTH_LABEL[strength]}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="confirm">
                确认密码
              </label>
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                />
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  maxLength={32}
                  placeholder="再次输入密码"
                  className={`${inputClass} ${
                    mismatch ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''
                  }`}
                  autoComplete="new-password"
                />
              </div>
              {mismatch && <p className="text-xs text-red-500">两次密码不一致</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="captcha">
                验证码
                <span className="ml-1 text-xs font-normal text-slate-400">(MVP: 1234)</span>
              </label>
              <div className="relative">
                <ShieldCheck
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                />
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
                  placeholder="4 位数字验证码"
                  className={inputClass}
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || mismatch}
              className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 text-base font-semibold text-white shadow-brand transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <UserPlus className="h-5 w-5" strokeWidth={2} />
              {loading ? '注册中…' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center justify-center text-sm font-semibold text-brand-600 transition hover:text-brand-700"
            >
              已有账号？去登录
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
