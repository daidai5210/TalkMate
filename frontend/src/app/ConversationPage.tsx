import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from './NavBar';
import MessageList from '../features/conversation/MessageList';
import MessageInput from '../features/conversation/MessageInput';
import { useConversationStore } from '../features/conversation/conversationStore';
import { useScenarioStore } from '../features/scenario/scenarioStore';
import type { ScenarioSummary } from '../features/conversation/types';

export default function ConversationPage() {
  const { id: scenarioIdParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    conversation,
    loading,
    sending,
    error,
    initFromScenario,
    send,
  } = useConversationStore();
  const { scenarios, fetchScenarios } = useScenarioStore();

  const scenarioId = scenarioIdParam ? Number(scenarioIdParam) : NaN;
  const scenario: ScenarioSummary | undefined = scenarios.find(
    (s) => s.id === scenarioId,
  );

  useEffect(() => {
    if (!Number.isFinite(scenarioId)) {
      return;
    }
    if (scenarios.length === 0) {
      void fetchScenarios();
    }
  }, [scenarioId, scenarios.length, fetchScenarios]);

  useEffect(() => {
    if (scenario && !conversation) {
      void initFromScenario(scenario);
    }
  }, [scenario, conversation, initFromScenario]);

  if (!Number.isFinite(scenarioId)) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto">
        <NavBar />
        <p className="text-red-600">无效的场景 ID</p>
      </div>
    );
  }

  if (loading || !scenario) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto">
        <NavBar />
        <div className="text-sm text-gray-500">加载中…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto" data-testid="conversation-page">
      <div className="px-4 py-4">
        <NavBar />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-brand-600"
              data-testid="back-to-scenarios"
            >
              ← 返回场景
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-base font-medium">
              {scenario.icon} {scenario.name}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          {conversation?.messages?.length ?? 0} 条消息
        </p>
      </div>

      {error && !conversation && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-6 mx-4 text-center"
          data-testid="conversation-error"
        >
          <p className="text-red-700 mb-3">加载对话失败:{error}</p>
          <button
            onClick={() => scenario && initFromScenario(scenario)}
            className="text-sm px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            data-testid="conversation-retry"
          >
            重试
          </button>
        </div>
      )}

      {error && conversation && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700" data-testid="send-error-banner">
          发送失败:{error}
        </div>
      )}

      <div className="flex-1 flex flex-col px-4 pb-2 min-h-0">
        <MessageList messages={conversation?.messages ?? []} sending={sending} />
        <MessageInput onSend={send} disabled={sending} />
      </div>
    </div>
  );
}
