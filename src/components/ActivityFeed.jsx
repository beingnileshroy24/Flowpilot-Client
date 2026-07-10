import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity';
import { format } from 'date-fns';
import { Activity, Edit3, UserPlus, CheckSquare, MessageSquare, Flag } from 'lucide-react';

const ACTION_ICONS = {
  task_created: <Flag size={14} className="text-green-500" />,
  status_change: <Activity size={14} className="text-amber-500" />,
  assignment_change: <UserPlus size={14} className="text-blue-500" />,
  comment_added: <MessageSquare size={14} className="text-purple-500" />,
  default: <Edit3 size={14} className="text-gray-400" />
};

export default function ActivityFeed({ taskId, projectId }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity', taskId || projectId],
    queryFn: () => taskId ? activityApi.getTaskActivity(taskId) : activityApi.getProjectActivity(projectId),
    enabled: !!(taskId || projectId),
  });

  if (isLoading) {
    return <div className="p-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>Loading activity...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Activity size={16} className="text-amber-500" />
        <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Audit Log</h4>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 relative">
        {logs.length === 0 ? (
          <div className="text-xs text-center py-6 italic" style={{ color: 'var(--text-muted)' }}>
            No activity recorded yet.
          </div>
        ) : (
          <div className="space-y-6 before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-500/20 before:to-transparent">
            {logs.map((log) => (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-fade-in">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow" style={{ background: 'var(--surface)', borderColor: 'var(--bg)', zIndex: 10 }}>
                  {ACTION_ICONS[log.action] || ACTION_ICONS.default}
                </div>
                
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl border transition-all hover:scale-[1.02]" style={{ background: 'var(--surface-solid)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{log.user_name}</span>
                    <time className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(log.created_at), "MMM d, h:mm a")}
                    </time>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
