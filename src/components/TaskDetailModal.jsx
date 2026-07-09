import React from 'react';
import Modal from './Modal';
import { Clock, Tag, User2, Calendar, FileText } from 'lucide-react';

const TYPE_COLORS = {
  TASK:    { active: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.30)' },
  EPIC:    { active: '#a855f7', bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.30)' },
  BUG:     { active: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.30)'  },
  SUBTASK: { active: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.30)'  },
};

const PRIORITY_COLORS = {
  LOW:      { active: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.30)'  },
  MEDIUM:   { active: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.30)' },
  HIGH:     { active: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)' },
  CRITICAL: { active: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.30)'  },
};

const STATUS_COLORS = {
  TODO:        { active: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.30)' },
  IN_PROGRESS: { active: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.30)' },
  IN_REVIEW:   { active: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.30)' },
  DONE:        { active: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.30)'  },
};

export default function TaskDetailModal({ isOpen, onClose, task, currentUser, project, projectMembers = [], onAssign }) {
  if (!task) return null;

  const typeStyle = TYPE_COLORS[task.type] || TYPE_COLORS.TASK;
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;
  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.TODO;
  const assigneeName = task.assigned_to?.name || null;

  const isLead = currentUser?.id === project?.lead_developer_id;
  const isAdmin = currentUser?.role === 'ADMIN';
  const isDevInProject = project?.developer_ids?.includes(currentUser?.id);
  const canAssign = isAdmin || isLead || isDevInProject;

  let assignOptions = [];
  if (isAdmin || isLead) {
    assignOptions = projectMembers;
  } else if (isDevInProject) {
    assignOptions = projectMembers.filter(u => u.id === currentUser?.id);
  }

  const formattedDate = new Date(task.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ticket Details" size="lg">
      <div className="space-y-6">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2.5">
          <span
            className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider"
            style={{ background: typeStyle.bg, color: typeStyle.active, border: `1px solid ${typeStyle.border}` }}
          >
            Type: {task.type}
          </span>
          <span
            className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider"
            style={{ background: priorityStyle.bg, color: priorityStyle.active, border: `1px solid ${priorityStyle.border}` }}
          >
            Priority: {task.priority}
          </span>
          <span
            className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider"
            style={{ background: statusStyle.bg, color: statusStyle.active, border: `1px solid ${statusStyle.border}` }}
          >
            Status: {task.status.replace('_', ' ')}
          </span>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold leading-snug" style={{ color: 'var(--text)' }}>
            {task.title}
          </h2>
        </div>

        {/* Grid details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* Assignee */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
            >
              {assigneeName ? (
                <div
                  className="w-full h-full rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a' }}
                >
                  {assigneeName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <User2 size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Assignee</span>
              {canAssign ? (
                <select
                  value={task.assigned_to_id || ''}
                  onChange={(e) => {
                    if (onAssign) {
                      onAssign(e.target.value || null);
                    }
                  }}
                  className="bg-transparent text-sm font-semibold outline-none cursor-pointer hover:underline p-0 m-0 border-0"
                  style={{ color: 'var(--text)' }}
                >
                  <option value="" style={{ background: 'var(--surface)', color: 'var(--text)' }}>Unassigned</option>
                  {isAdmin || isLead ? (
                    assignOptions.map((u) => (
                      <option key={u.id} value={u.id} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                        {u.name} {u.id === currentUser?.id ? '(Me)' : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      {task.assigned_to_id === currentUser?.id ? (
                        <option value="" style={{ background: 'var(--surface)', color: 'var(--text)' }}>Unassign Me</option>
                      ) : (
                        <option value={currentUser?.id} style={{ background: 'var(--surface)', color: 'var(--text)' }}>Claim Task</option>
                      )}
                    </>
                  )}
                </select>
              ) : (
                <span className="block text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {assigneeName || 'Unassigned'}
                </span>
              )}
            </div>
          </div>

          {/* Est. Hours */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <Clock size={18} />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Estimated Effort</span>
              <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {task.estimated_hours ? `${task.estimated_hours} Hours` : 'No estimate'}
              </span>
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Date Raised</span>
              <span className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <Tag size={18} />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Tags</span>
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {task.tags && task.tags.length > 0 ? (
                  task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: 'var(--surface-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>None</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <FileText size={13} /> Description
          </h4>
          <div
            className="p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {task.description || <span className="italic" style={{ color: 'var(--text-muted)' }}>No description provided.</span>}
          </div>
        </div>

        {/* Attachment preview */}
        {task.attachment_url && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Attachment Preview
            </h4>
            <div
              className="p-2 rounded-2xl border flex items-center justify-center overflow-hidden bg-black/10"
              style={{ borderColor: 'var(--border)' }}
            >
              {/\.(mp4|webm|ogg|mov)$/i.test(task.attachment_url) ? (
                <video
                  src={`${import.meta.env.VITE_API_URL || ''}${task.attachment_url}`}
                  controls
                  className="max-w-full max-h-[300px] rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = task.attachment_url;
                  }}
                />
              ) : (
                <img
                  src={`${import.meta.env.VITE_API_URL || ''}${task.attachment_url}`}
                  alt="Attachment Preview"
                  className="max-w-full max-h-[300px] rounded-xl object-contain"
                  onError={(e) => {
                    e.currentTarget.src = task.attachment_url;
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="flex justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-primary">
            Close View
          </button>
        </div>
      </div>
    </Modal>
  );
}
