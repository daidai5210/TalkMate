import { Link } from 'react-router-dom';
import type { ConversationHistoryItem } from '../features/conversation/types';

interface PracticeHistoryListProps {
  records: ConversationHistoryItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function formatCreatedAt(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PracticeHistoryList({
  records,
  loading,
  error,
  onRetry,
}: PracticeHistoryListProps) {
  if (loading) {
    return (
      <div className="space-y-3" data-testid="history-loading">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-100 p-4 animate-pulse"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-1/2 sm:w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 sm:w-2/3" />
                </div>
              </div>
              <div className="h-7 w-20 sm:w-16 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
        data-testid="history-error"
      >
        <p className="text-red-700 mb-3">加载练习记录失败:{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="text-sm px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          data-testid="history-retry"
        >
          重试
        </button>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-100 p-6 sm:p-10 text-center"
        data-testid="history-empty"
      >
        <p className="text-gray-600 mb-1">暂无练习记录</p>
        <p className="text-sm text-gray-400 break-words">选择上方场景开始练习，完成后记录会显示在这里。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="history-list">
      {records.map((record) => (
        <div
          key={record.id}
          className="bg-white rounded-lg border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Link
              to={`/conversation/history/${record.id}`}
              className="flex items-start gap-3 flex-1 min-w-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="history-item-link"
            >
              <span className="text-2xl leading-none" aria-hidden="true">
                {record.scenario.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-gray-900 break-words sm:truncate">
                  {record.scenario.name}
                </span>
                <span className="block text-sm text-gray-500 mt-1 break-words">
                  {formatCreatedAt(record.created_at)} · {record.message_count} 条消息
                </span>
              </span>
            </Link>

            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <span
                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium leading-5 text-blue-700 whitespace-normal break-words"
                data-testid="history-score"
              >
                {record.summary_score === null ? '未评分' : `${record.summary_score} 分`}
              </span>
              {record.has_summary && (
                <Link
                  to={`/conversation/${record.id}/summary`}
                  className="inline-flex min-h-9 items-center rounded-md px-2 text-sm font-medium text-blue-600 hover:text-blue-700 break-words focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="history-summary-link"
                >
                  查看总结
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
