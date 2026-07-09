import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock, AlertCircle, Tag, Layers, User2, Bug, HelpCircle } from 'lucide-react';

const priorityColors = {
  LOW: 'border-l-priority-low hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]',
  MEDIUM: 'border-l-priority-medium hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]',
  HIGH: 'border-l-priority-high hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]',
  CRITICAL: 'border-l-priority-critical hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]',
};

const priorityBadges = {
  LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse',
};

const typeBadges = {
  EPIC: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  TASK: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SUBTASK: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  BUG: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'EPIC': return <Layers size={12} className="text-purple-400" />;
    case 'BUG': return <Bug size={12} className="text-red-400" />;
    default: return <Tag size={12} className="text-blue-400" />;
  }
};

export default function TaskCard({ task, index, onClick }) {
  const assigneeName = task.assigned_to?.name || 'Unassigned';
  const initial = assigneeName.charAt(0).toUpperCase();

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`p-4 bg-brand-card border border-white/5 rounded-xl flex flex-col gap-3 cursor-grab active:cursor-grabbing border-l-4 transition-all hover:bg-brand-cardHover select-none ${
            priorityColors[task.priority] || 'border-l-gray-500'
          } ${snapshot.isDragging ? 'drag-active border-brand-primary' : ''}`}
        >
          {/* Card Header: Type and Priority Badge */}
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${typeBadges[task.type]}`}>
              {getTypeIcon(task.type)}
              {task.type}
            </span>

            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityBadges[task.priority]}`}>
              {task.priority}
            </span>
          </div>

          {/* Title and Short Description */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide line-clamp-2">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-brand-textMuted mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* Card Footer: Hours, tags, and Assignee */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-brand-textMuted">
            {/* Hours Estimation */}
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{task.estimated_hours || 0}h</span>
            </div>

            {/* Tags (show first if exists) */}
            {task.tags && task.tags.length > 0 && (
              <div className="bg-white/5 px-1.5 py-0.5 rounded text-[9px] border border-white/10 uppercase truncate max-w-[80px]">
                {task.tags[0]}
              </div>
            )}

            {/* Assignee Avatar */}
            <div className="flex items-center gap-1.5" title={assigneeName}>
              {task.assigned_to ? (
                <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-brand-primary to-indigo-500 flex items-center justify-center font-bold text-white text-[9px] border border-white/10 shadow-sm">
                  {initial}
                </div>
              ) : (
                <div className="w-5.5 h-5.5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-brand-textMuted">
                  <User2 size={10} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
