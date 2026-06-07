import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Layers, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const tabs = [
  { path: '/app/home', label: '首页', Icon: Home },
  { path: '/app/scenarios', label: '场景', Icon: Layers },
  { path: '/app/profile', label: '我的', Icon: User },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  if (!token) {
    navigate('/login', { replace: true });
    return null;
  }

  const showBottomNav = ['/app/home', '/app/scenarios', '/app/profile'].includes(location.pathname);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[var(--app-max-width)]">
          <Outlet />
        </div>
      </main>
      {showBottomNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white"
          style={{ paddingBottom: 'var(--app-safe-bottom)' }}
          data-testid="bottom-tab-bar"
        >
          <div className="mx-auto flex max-w-[var(--app-max-width)]">
            {tabs.map(({ path, label, Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition ${
                    isActive ? 'text-brand-600' : 'text-slate-400'
                  }`
                }
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
