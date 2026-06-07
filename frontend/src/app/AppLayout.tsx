import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Layers, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const tabs = [
  { path: '/app/home', label: '首页', Icon: Home },
  { path: '/app/scenarios', label: '场景', Icon: Layers },
  { path: '/app/profile', label: '我的', Icon: User },
];

const TAB_ROUTES = tabs.map((t) => t.path);

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  if (!token) {
    navigate('/login', { replace: true });
    return null;
  }

  const showBottomNav = TAB_ROUTES.includes(location.pathname);

  return (
    <div className="flex h-dvh justify-center bg-slate-100">
      <div className="relative flex h-dvh w-full max-w-app flex-col overflow-hidden bg-app-muted shadow-app-shell">
        <main
          className="app-scroll min-h-0 flex-1"
          style={
            showBottomNav
              ? {
                  paddingBottom: 'calc(var(--app-bottom-nav-height) + var(--app-safe-bottom))',
                }
              : undefined
          }
        >
          <Outlet />
        </main>

        {showBottomNav && (
          <nav
            className="absolute inset-x-0 bottom-0 z-50 border-t border-app-border bg-app-surface"
            style={{
              height: 'calc(var(--app-bottom-nav-height) + var(--app-safe-bottom))',
              paddingBottom: 'var(--app-safe-bottom)',
            }}
            data-testid="bottom-tab-bar"
          >
            <div className="mx-auto flex h-bottom-nav max-w-app">
              {tabs.map(({ path, label, Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex min-h-touch flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition active:scale-95 ${
                      isActive ? 'text-brand-600' : 'text-slate-400'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
