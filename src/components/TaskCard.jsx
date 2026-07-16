import React from 'react';
import { Clock, Layers, Bug, Tag, User2, CalendarClock, CheckSquare, FastForward, Trash2 } from 'lucide-react';
import { isBefore, startOfDay, isToday } from 'date-fns';
const PRIORITY_STYLES = {
  LOW:      { border: '#22c55e', badge: { bg: 'rgba(34,197,94,0.10)',  text: '#16a34a', border: 'rgba(34,197,94,0.20)'  } },
  MEDIUM:   { border: '#3b82f6', badge: { bg: 'rgba(59,130,246,0.10)',  text: '#2563eb', border: 'rgba(59,130,246,0.20)'  } },
  HIGH:     { border: '#f59e0b', badge: { bg: 'rgba(245,158,11,0.10)',  text: '#d97706', border: 'rgba(245,158,11,0.22)'  } },
  CRITICAL: { border: '#ef4444', badge: { bg: 'rgba(239,68,68,0.10)',   text: '#dc2626', border: 'rgba(239,68,68,0.22)'  } },
};

const TYPE_STYLES = {
  EPIC:    { bg: 'rgba(168,85,247,0.10)', text: '#9333ea', border: 'rgba(168,85,247,0.22)', icon: Layers },
  TASK:    { bg: 'rgba(59,130,246,0.10)',  text: '#2563eb', border: 'rgba(59,130,246,0.22)', icon: Tag },
  SUBTASK: { bg: 'rgba(6,182,212,0.10)',   text: '#0891b2', border: 'rgba(6,182,212,0.22)',  icon: Tag },
  BUG:     { bg: 'rgba(239,68,68,0.10)',   text: '#dc2626', border: 'rgba(239,68,68,0.22)',  icon: Bug },
};

export default function TaskCard({ 
  task, 
  onClick, 
  currentUser, 
  project, 
  projectMembers = [], 
  onAssign, 
  onStatusChange, 
  projectName,
  isSelected = false,
  onToggleSelect,
  onDelete
}) {
  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;
  const typeStyle = TYPE_STYLES[task.type] || TYPE_STYLES.TASK;
  const TypeIcon = typeStyle.icon;
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

  return (
    <div
      onClick={onClick}
      className={`task-card ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${priority.border}`,
        boxShadow: 'var(--shadow-sm)',
        padding: '14px 14px 12px 16px',
        position: 'relative',
        cursor: 'pointer'
      }}
    >
      {/* Top row: Checkbox + Type badge & Status, Priority, Delete */}
      <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  if (onToggleSelect) {
                    onToggleSelect(task.id);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold"
                style={{
                  background: typeStyle.bg,
                  color: typeStyle.text,
                  border: `1px solid ${typeStyle.border}`,
                }}
              >
                <TypeIcon size={11} />
                {task.type}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold"
                style={{
                  background: priority.badge.bg,
                  color: priority.badge.text,
                  border: `1px solid ${priority.badge.border}`,
                }}
              >
                {task.priority}
              </span>
              
              <select
                value={task.status}
                onChange={(e) => {
                  e.stopPropagation();
                  if (onStatusChange) {
                    onStatusChange(task.id, e.target.value);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg border outline-none cursor-pointer"
                style={{
                  background: 'var(--surface-solid)',
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
                title="Update status"
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN PROG</option>
                <option value="IN_REVIEW">REVIEW</option>
                <option value="DONE">DONE</option>
              </select>

              {(currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN') && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id, task.title);
                  }}
                  className="p-1 rounded text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Attachment Preview */}
          {task.attachment_url && (
            <div className="mb-2.5 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {/\.(mp4|webm|ogg|mov)$/i.test(task.attachment_url) ? (
                <div
                  className="bg-black/10 flex items-center justify-center py-6 text-[10px] font-bold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  🎥 Video Attachment
                </div>
              ) : (
                <img
                  src={`${import.meta.env.VITE_API_URL || ''}${task.attachment_url}`}
                  alt="Attachment Preview"
                  className="w-full h-24 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = task.attachment_url;
                  }}
                />
              )}
            </div>
          )}

          {/* Project Name Badge */}
          {projectName && (
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider select-none" style={{ color: 'var(--yellow)' }}>
              📁 {projectName}
            </div>
          )}

          {/* Title */}
          <h4
            className="text-sm font-semibold leading-snug line-clamp-2 mb-1"
            style={{ color: 'var(--text)' }}
          >
            {task.title}
          </h4>

          {/* Description snippet */}
          {task.description && (
            <p
              className="text-xs leading-relaxed line-clamp-2 mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              {task.description}
            </p>
          )}

          {/* New Metadata Row: Due Date & Checklist & Sprint */}
          <div className="flex flex-wrap gap-2 mb-2">
            {task.due_date && (
              (() => {
                const due = new Date(task.due_date);
                const overdue = isBefore(due, startOfDay(new Date()));
                const dueToday = isToday(due);
                const color = overdue ? '#ef4444' : (dueToday ? '#f59e0b' : 'var(--text-muted)');
                return (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-solid)', color, border: `1px solid ${color}40` }}>
                    <CalendarClock size={10} />
                    {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                );
              })()
            )}
            
            {task.checklist_items && task.checklist_items.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-solid)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                <CheckSquare size={10} className="text-blue-500" />
                {task.checklist_items.filter(i => i.done).length}/{task.checklist_items.length}
              </span>
            )}

            {task.sprint_id && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-solid)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                <FastForward size={10} className="text-purple-500" />
                Sprint
              </span>
            )}
          </div>

          {/* Footer: hours + assignee */}
          <div
            className="flex items-center justify-between pt-2.5 mt-auto"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {/* Estimated hours */}
            <div
              className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              <Clock size={11} style={{ color: '#3b82f6' }} />
              <span>{task.estimated_hours || 0}h</span>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium uppercase truncate max-w-[80px]"
                style={{
                  background: 'var(--surface-elevated, rgba(245,158,11,0.06))',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {task.tags[0]}
              </span>
            )}

            {/* Assignee avatar */}
            <div className="relative group cursor-pointer">
              {assigneeName ? (
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                  title={assigneeName}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#0f172a',
                    boxShadow: '0 2px 6px rgba(245,158,11,0.30)',
                  }}
                >
                  {assigneeName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <User2 size={11} />
                </div>
              )}

              {canAssign && (
                <select
                  value={task.assigned_to_id || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (onAssign) {
                      onAssign(e.target.value || null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                  title="Change assignment"
                >
                  <option value="">Unassigned</option>
                  {isAdmin || isLead ? (
                    assignOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.id === currentUser?.id ? '(Me)' : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      {task.assigned_to_id === currentUser?.id ? (
                        <option value="">Unassign Me</option>
                      ) : (
                        <option value={currentUser?.id}>Claim Task</option>
                      )}
                    </>
                  )}
                </select>
              )}
            </div>
          </div>
    </div>
  );
}

