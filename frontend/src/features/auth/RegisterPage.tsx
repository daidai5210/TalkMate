import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white rounded-lg shadow-md p-5 sm:p-6 space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center text-brand-600">TalkMate</h1>
        <p className="text-sm text-gray-500 text-center">创建账号</p>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="username">用户名</label>
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
            className="w-full min-h-11 px-3 py-2 text-base sm:text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="password">密码</label>
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
            className="w-full min-h-11 px-3 py-2 text-base sm:text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
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

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="confirm">确认密码</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            maxLength={32}
            className={`w-full min-h-11 px-3 py-2 text-base sm:text-sm border rounded-md focus:outline-none focus:ring-2 ${
              mismatch ? 'border-red-500 focus:ring-red-500' : 'focus:ring-brand-500'
            }`}
          />
          {mismatch && <p className="text-xs text-red-500 break-words">两次密码不一致</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-sm text-gray-700 break-words" htmlFor="captcha">验证码(MVP 固定值:1234)</label>
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
            className="w-full min-h-11 px-3 py-2 text-base sm:text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && <p className="text-sm text-red-500 break-words">{error}</p>}

        <button
          type="submit"
          disabled={loading || mismatch}
          className="w-full min-h-11 py-2 text-base sm:text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? '注册中…' : '注册'}
        </button>

        <p className="text-sm text-center text-gray-500">
          已有账号？<Link to="/login" className="text-brand-600 hover:underline">去登录</Link>
        </p>
      </form>
    </div>
  );
}
