import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock, Layers, Bug, Tag, User2 } from 'lucide-react';

const PRIORITY_STYLES = {
  LOW:      { border: '#22c55e', glow: 'rgba(34,197,94,0.15)',  badge: { bg: 'rgba(34,197,94,0.10)',  text: '#16a34a', border: 'rgba(34,197,94,0.20)'  } },
  MEDIUM:   { border: '#3b82f6', glow: 'rgba(59,130,246,0.15)', badge: { bg: 'rgba(59,130,246,0.10)',  text: '#2563eb', border: 'rgba(59,130,246,0.20)'  } },
  HIGH:     { border: '#f59e0b', glow: 'rgba(245,158,11,0.20)', badge: { bg: 'rgba(245,158,11,0.10)',  text: '#d97706', border: 'rgba(245,158,11,0.22)'  } },
  CRITICAL: { border: '#ef4444', glow: 'rgba(239,68,68,0.20)',  badge: { bg: 'rgba(239,68,68,0.10)',   text: '#dc2626', border: 'rgba(239,68,68,0.22)'  } },
};

const TYPE_STYLES = {
  EPIC:    { bg: 'rgba(168,85,247,0.10)', text: '#9333ea', border: 'rgba(168,85,247,0.22)', icon: Layers },
  TASK:    { bg: 'rgba(59,130,246,0.10)',  text: '#2563eb', border: 'rgba(59,130,246,0.22)', icon: Tag },
  SUBTASK: { bg: 'rgba(6,182,212,0.10)',   text: '#0891b2', border: 'rgba(6,182,212,0.22)',  icon: Tag },
  BUG:     { bg: 'rgba(239,68,68,0.10)',   text: '#dc2626', border: 'rgba(239,68,68,0.22)',  icon: Bug },
};

export default function TaskCard({ task, index, onClick }) {
  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;
  const typeStyle = TYPE_STYLES[task.type] || TYPE_STYLES.TASK;
  const TypeIcon = typeStyle.icon;
  const assigneeName = task.assigned_to?.name || null;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className="select-none cursor-grab active:cursor-grabbing rounded-2xl transition-all duration-200"
          style={{
            ...provided.draggableProps.style,
            background: 'var(--surface)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid var(--border)`,
            borderLeft: `3px solid ${priority.border}`,
            boxShadow: snapshot.isDragging
              ? `0 20px 40px rgba(0,0,0,0.20), 0 0 0 2px ${priority.border}40`
              : 'var(--shadow-sm)',
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform || ''} rotate(1.5deg) scale(1.02)`
              : provided.draggableProps.style?.transform,
            padding: '14px 14px 12px 12px',
          }}
          onMouseEnter={(e) => {
            if (!snapshot.isDragging) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `var(--shadow), 0 0 16px ${priority.glow}`;
            }
          }}
          onMouseLeave={(e) => {
            if (!snapshot.isDragging) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }
          }}
        >
          {/* Top row: Type badge + Priority badge */}
          <div className="flex items-center justify-between mb-2.5">
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
          </div>

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
          </div>
        </div>
      )}
    </Draggable>
  );
}
