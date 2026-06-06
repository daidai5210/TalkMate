import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './AppLayout';
import ConversationPage from './ConversationPage';
import SummaryPage from '../pages/SummaryPage';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import { useAuthStore } from '../stores/authStore';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function NewHomePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">
      🏠 首页（待实现 T2-002）
    </div>
  );
}

function NewTrainingPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">
      🎯 训练模式选择（待实现 T2-004）
    </div>
  );
}

function NewProfilePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">
      👤 个人中心（待实现 T2-003）
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      {/* 旧路由兼容：/ 重定向到 /app/home */}
      <Route path="/" element={<Navigate to="/app/home" replace />} />

      {/* 认证页保持不变 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 新的 App 路由（带底部 Tab 导航） */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/home" replace />} />
        <Route path="home" element={<NewHomePage />} />
        <Route path="training" element={<NewTrainingPage />} />
        <Route path="profile" element={<NewProfilePage />} />
      </Route>

      {/* 旧路由兼容：/conversation/* 保持可用 */}
      <Route
        path="/conversation/:id/summary"
        element={
          <ProtectedRoute>
            <SummaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conversation/history/:conversationId"
        element={
          <ProtectedRoute>
            <ConversationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conversation/:id"
        element={
          <ProtectedRoute>
            <ConversationPage />
          </ProtectedRoute>
        }
      />

      {/* 404 兜底 */}
      <Route path="*" element={<Navigate to="/app/home" replace />} />
    </Routes>
  );
}
