import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Sparkles, UserPlus } from 'lucide-react';
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
const STRENGTH_COLOR: Record<Strength, string> = { weak: 'bg-red-500', medium: 'bg-amber-500', strong: 'bg-emerald-500' };

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
    <AppShell className="flex flex-col">
      {/* 品牌视觉区 */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-brand-600 to-brand-800 px-6 pb-10 pt-14">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
          <MessageCircle className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">TalkMate</h1>
        <p className="mt-2 text-sm text-brand-200">创建你的口语成长档案</p>
        <div className="mt-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
          <Sparkles className="h-4 w-4 text-brand-300" strokeWidth={1.5} />
          <span className="text-xs text-brand-100">注册即享 AI 口语训练</span>
        </div>
      </div>

      {/* 表单卡片 */}
      <div className="-mt-5 flex-1 rounded-t-[1.75rem] bg-white px-6 pt-8">
        <h2 className="mb-6 text-lg font-bold text-slate-900">创建账号</h2>

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
              pattern="[A-Za-z0-9_]+"
              placeholder="英文、数字、下划线"
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
              placeholder="至少 8 位"
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base placeholder:text-slate-300 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            {password && (
              <div className="flex items-center gap-2 text-xs">
                <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${STRENGTH_COLOR[strength]}`}
                    style={{ width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%' }}
                  />
                </div>
                <span className="text-slate-500">{STRENGTH_LABEL[strength]}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600" htmlFor="confirm">确认密码</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              maxLength={32}
              placeholder="再次输入密码"
              className={`min-h-12 w-full rounded-xl border bg-slate-50 px-4 py-3 text-base placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-2 ${
                mismatch ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
              }`}
            />
            {mismatch && <p className="text-xs text-red-500">两次密码不一致</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600" htmlFor="captcha">
              验证码 <span className="text-xs font-normal text-slate-400">(MVP: 1234)</span>
            </label>
            <input
              id="captcha"
              type="text"
              value={captcha}
              onChange={(e) => { setCaptcha(e.target.value.replace(/\D/g, '').slice(0, 4)); clearError(); }}
              required
              minLength={4}
              maxLength={4}
              inputMode="numeric"
              placeholder="4 位数字验证码"
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base placeholder:text-slate-300 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || mismatch}
            className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <UserPlus className="h-5 w-5" strokeWidth={2} />
            {loading ? '注册中…' : '注册'}
          </button>
        </form>

        <div className="mt-6 pb-8 text-center">
          <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            已有账号？去登录
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
