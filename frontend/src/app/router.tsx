import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './AppLayout';
import ConversationPage from './ConversationPage';
import NewHomePage from '../pages/NewHomePage';
import TrainingPage from '../pages/TrainingPage';
import PracticeCardPage from '../pages/PracticeCardPage';
import ProfilePage from '../pages/ProfilePage';
import SummaryPage from '../pages/SummaryPage';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import { useAuthStore } from '../stores/authStore';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
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
        <Route path="training" element={<TrainingPage />} />
        <Route path="profile" element={<ProfilePage />} />
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

      {/* 抽卡跟练页（无底部 Tab 导航） */}
      <Route
        path="/practice-card"
        element={
          <ProtectedRoute>
            <PracticeCardPage />
          </ProtectedRoute>
        }
      />

      {/* 404 兜底 */}
      <Route path="*" element={<Navigate to="/app/home" replace />} />
    </Routes>
  );
}
