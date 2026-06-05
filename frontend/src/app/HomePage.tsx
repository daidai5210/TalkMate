import { useAuthStore } from '../stores/authStore';

export default function HomePage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen px-4 py-6">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-brand-600">TalkMate</h1>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.username}</span>
            <button
              onClick={logout}
              className="text-sm px-3 py-1 border rounded-md hover:bg-gray-100"
            >
              登出
            </button>
          </div>
        )}
      </header>

      <main>
        <h2 className="text-lg font-medium mb-2">选择你的练习场景</h2>
        <p className="text-sm text-gray-500 mb-4">
          T-002 场景选择页面尚未实现(T-001 仅含 auth)
        </p>
      </main>
    </div>
  );
}
