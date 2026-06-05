import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white rounded-lg shadow-md p-5 sm:p-6 space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center text-brand-600">TalkMate</h1>
        <p className="text-sm text-gray-500 text-center">登录开始练习</p>

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
        </div>

        {error && <p className="text-sm text-red-500 break-words">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-11 py-2 text-base sm:text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? '登录中…' : '登录'}
        </button>

        <p className="text-sm text-center text-gray-500">
          还没有账号？<Link to="/register" className="text-brand-600 hover:underline">去注册</Link>
        </p>
      </form>
    </div>
  );
}
