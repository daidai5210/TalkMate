import { useNavigate, useParams } from 'react-router-dom';
import NavBar from './NavBar';

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto">
      <NavBar />
      <main data-testid="conversation-placeholder">
        <div className="bg-white rounded-lg border border-gray-100 p-10 text-center">
          <h2 className="text-lg font-medium mb-2">对话练习</h2>
          <p className="text-sm text-gray-500 mb-1">场景 ID: {id}</p>
          <p className="text-sm text-gray-400 mb-6">
            对话页面将在 T-003 实施。当前为占位路由。
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-sm px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
            data-testid="back-to-home"
          >
            返回场景选择
          </button>
        </div>
      </main>
    </div>
  );
}
