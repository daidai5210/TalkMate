import { Link } from 'react-router-dom';
import { History, ChevronRight } from 'lucide-react';
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
      <div className="grid gap-3" data-testid="history-loading">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-2xl bg-slate-200 p-4">
            <div className="flex gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-300" />
              <div className="min-w-0 flex-1">
                <div className="mb-2 h-4 w-1/2 rounded bg-slate-300 sm:w-1/3" />
                <div className="h-3 w-3/4 rounded bg-slate-300 sm:w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="overflow-hidden rounded-2xl bg-white p-6 text-center shadow-sm"
        data-testid="history-error"
      >
        <p className="mb-3 text-red-700">加载练习记录失败:{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
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
        className="overflow-hidden rounded-2xl bg-white p-8 text-center shadow-sm"
        data-testid="history-empty"
      >
        <p className="mb-1 text-lg font-bold text-slate-700">暂无成长记录</p>
        <p className="break-words text-sm text-slate-500">
          选择上方任务开始训练，完成后评分、总结和复练入口会显示在这里。
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm" data-testid="history-list">
      {records.map((record, index) => (
        <div
          key={record.id}
          className={`p-4 transition hover:bg-slate-50 ${index < records.length - 1 ? 'border-b border-slate-100' : ''}`}
        >
          <div className="flex flex-col gap-3">
            <Link
              to={`/conversation/history/${record.id}`}
              className="flex min-w-0 flex-1 items-start gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              data-testid="history-item-link"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"
                aria-hidden="true"
              >
                <History className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-[15px] font-bold text-slate-900 sm:truncate">
                  {record.scenario.name}成长记录
                </span>
                <span className="mt-1 block break-words text-sm text-slate-500">
                  {formatCreatedAt(record.created_at)} · {record.message_count} 条消息
                </span>
                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {record.has_summary ? '已生成反馈' : '待生成总结'}
                </span>
              </span>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" strokeWidth={2} />
            </Link>

            <div className="flex flex-wrap items-center gap-3 pl-14 sm:justify-end">
              <span
                className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold leading-5 text-emerald-700"
                data-testid="history-score"
              >
                {record.summary_score === null ? '未评分' : `${record.summary_score} 分`}
              </span>
              {record.has_summary && (
                <Link
                  to={`/conversation/${record.id}/summary`}
                  className="inline-flex min-h-9 items-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  data-testid="history-summary-link"
                >
                  查看成长反馈
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
