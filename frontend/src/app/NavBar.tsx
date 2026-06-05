import { useAuthStore } from '../stores/authStore';

export default function NavBar() {
  const { user, logout } = useAuthStore();
  const initial = user?.username?.[0]?.toUpperCase() ?? '?';
  return (
    <header className="mb-5 flex items-center justify-between gap-3" data-testid="navbar">
      <div className="min-w-0">
        <h1 className="text-lg font-black text-slate-950">TalkMate</h1>
        <p className="truncate text-xs font-medium text-slate-500">AI 口语训练</p>
      </div>
      {user && (
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-sm font-bold text-brand-700"
            aria-label="用户头像"
            data-testid="user-avatar"
          >
            {initial}
          </div>
          <span className="max-w-20 truncate text-sm font-medium text-slate-600" data-testid="navbar-username">
            {user.username}
          </span>
          <button
            onClick={logout}
            className="min-h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:border-brand-200 hover:text-brand-700"
            data-testid="logout-button"
          >
            登出
          </button>
        </div>
      )}
    </header>
  );
}
