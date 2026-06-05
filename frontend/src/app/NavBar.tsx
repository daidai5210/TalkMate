import { useAuthStore } from '../stores/authStore';

export default function NavBar() {
  const { user, logout } = useAuthStore();
  const initial = user?.username?.[0]?.toUpperCase() ?? '?';
  return (
    <header className="flex items-center justify-between mb-8" data-testid="navbar">
      <h1 className="text-xl font-semibold text-brand-600">TalkMate</h1>
      {user && (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold"
            aria-label="用户头像"
            data-testid="user-avatar"
          >
            {initial}
          </div>
          <span className="text-sm text-gray-600 hidden sm:inline" data-testid="navbar-username">
            {user.username}
          </span>
          <button
            onClick={logout}
            className="text-sm px-3 py-1 border rounded-md hover:bg-gray-100"
            data-testid="logout-button"
          >
            登出
          </button>
        </div>
      )}
    </header>
  );
}
