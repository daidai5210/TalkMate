import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const tabs = [
  { path: '/app/home', label: '首页', icon: '🏠' },
  { path: '/app/training', label: '训练', icon: '🎯' },
  { path: '/app/profile', label: '我的', icon: '👤' },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  // If not logged in, redirect to login
  if (!token) {
    navigate('/login', { replace: true });
    return null;
  }

  // If on a non-tab route (like conversation or summary), just render the outlet without bottom nav
  const showBottomNav = ['/app/home', '/app/training', '/app/profile'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-dvh bg-slate-50">
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
      {showBottomNav && (
        <nav className="flex-shrink-0 border-t border-slate-200 bg-white" style={{ paddingBottom: 'var(--app-safe-bottom)' }}>
          <div className="mx-auto flex max-w-[var(--app-max-width)]">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center justify-center py-2 text-xs transition ${
                    isActive ? 'text-brand-600' : 'text-slate-400'
                  }`
                }
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="mt-0.5">{tab.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
