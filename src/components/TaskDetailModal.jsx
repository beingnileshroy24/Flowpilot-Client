import React, { useState } from 'react';
import Modal from './Modal';
import { Clock, Tag, User2, Calendar, FileText, CheckSquare, MessageSquare, Activity, CalendarClock, Trash2 } from 'lucide-react';
import CommentThread from './CommentThread';
import ActivityFeed from './ActivityFeed';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import ConfirmDeleteModal from './ConfirmDeleteModal';

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

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const typeStyle = TYPE_COLORS[task.type] || TYPE_COLORS.TASK;
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;
  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.TODO;
  const assigneeName = task.assigned_to?.name || null;

  const isLead = currentUser?.id === project?.lead_developer_id;
  const isAdmin = currentUser?.role === 'ADMIN';
  const isDevInProject = project?.developer_ids?.includes(currentUser?.id);
  const canAssign = isAdmin || isLead || isDevInProject;

  const updateTaskMutation = useMutation({
    mutationFn: (payload) => tasksApi.updateTaskDetails(task.id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.deleteTask(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  const handleToggleChecklist = (index) => {
    const newItems = [...(task.checklist_items || [])];
    newItems[index].done = !newItems[index].done;
    updateTaskMutation.mutate({ checklist_items: newItems });
  };

  const handleAddChecklist = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItems = [...(task.checklist_items || []), { text: newChecklistItem.trim(), done: false }];
    updateTaskMutation.mutate({ checklist_items: newItems });
    setNewChecklistItem('');
  };

  let assignOptions = [];
  if (isAdmin || isLead) {
    assignOptions = projectMembers;
  } else if (isDevInProject) {
    assignOptions = projectMembers.filter(u => u.id === currentUser?.id);
  }

  const formattedDate = new Date(task.created_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ticket Context" size="lg">
      <div className="flex flex-col h-[70vh] max-h-[700px]">
        {/* Header Badges & Delete Button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 shrink-0">
          <div className="flex flex-wrap gap-2.5">
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider" style={{ background: typeStyle.bg, color: typeStyle.active, border: `1px solid ${typeStyle.border}` }}>
              {task.type}
            </span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider" style={{ background: priorityStyle.bg, color: priorityStyle.active, border: `1px solid ${priorityStyle.border}` }}>
              {task.priority}
            </span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider" style={{ background: statusStyle.bg, color: statusStyle.active, border: `1px solid ${statusStyle.border}` }}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
          {(currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN') && (
            <button
              onClick={() => setIsConfirmOpen(true)}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={13} />
              Delete Ticket
            </button>
          )}
        </div>

        <h2 className="text-xl font-bold leading-snug mb-5 shrink-0" style={{ color: 'var(--text)' }}>
          {task.title}
        </h2>

        {/* Tabs Header */}
        <div className="flex items-center gap-2 mb-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          {[
            { id: 'details', label: 'Details', icon: FileText },
            { id: 'checklist', label: 'Subtasks', icon: CheckSquare },
            { id: 'comments', label: 'Discussion', icon: MessageSquare },
            { id: 'activity', label: 'Activity', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold relative"
                style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}
              >
                <Icon size={14} />
                {tab.label}
                {tab.id === 'checklist' && task.checklist_items?.length > 0 && (
                  <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">
                    {task.checklist_items.filter(i => i.done).length}/{task.checklist_items.length}
                  </span>
                )}
                {active && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          
          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="h-full overflow-y-auto space-y-6 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {/* Assignee */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                    {assigneeName ? (
                      <div className="w-full h-full rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a' }}>
                        {assigneeName.charAt(0).toUpperCase()}
                      </div>
                    ) : <User2 size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Assignee</span>
                    {canAssign ? (
                      <select
                        value={task.assigned_to_id || ''}
                        onChange={(e) => onAssign && onAssign(e.target.value || null)}
                        className="bg-transparent text-sm font-semibold outline-none cursor-pointer hover:underline p-0 m-0 border-0"
                        style={{ color: 'var(--text)' }}
                      >
                        <option value="" style={{ background: 'var(--surface)', color: 'var(--text)' }}>Unassigned</option>
                        {isAdmin || isLead ? assignOptions.map((u) => (
                          <option key={u.id} value={u.id} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                            {u.name} {u.id === currentUser?.id ? '(Me)' : ''}
                          </option>
                        )) : (
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
                      <span className="block text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{assigneeName || 'Unassigned'}</span>
                    )}
                  </div>
                </div>

                {/* Due Date (NEW) */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Due Date</span>
                    {canAssign ? (
                      <input 
                        type="date" 
                        value={task.due_date || ''} 
                        onChange={(e) => updateTaskMutation.mutate({ due_date: e.target.value || null })}
                        className="bg-transparent text-sm font-semibold outline-none border-none p-0 focus:ring-0"
                        style={{ color: 'var(--text)' }}
                      />
                    ) : (
                      <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Est. Hours */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
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
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Date Raised</span>
                    <span className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>{formattedDate}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-3">
                  <Tag size={14} className="mt-0.5 text-blue-500 shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags && task.tags.length > 0 ? (
                      task.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'var(--surface-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          {tag}
                        </span>
                      ))
                    ) : <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No tags</span>}
                  </div>
              </div>

              {/* Description */}
              <div className="space-y-2 mt-4">
                <div className="p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {task.description || <span className="italic" style={{ color: 'var(--text-muted)' }}>No description provided.</span>}
                </div>
              </div>

              {/* Attachment preview */}
              {task.attachment_url && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Attachment</h4>
                  <div className="p-2 rounded-2xl border flex items-center justify-center bg-black/10" style={{ borderColor: 'var(--border)' }}>
                    {/\.(mp4|webm|ogg|mov)$/i.test(task.attachment_url) ? (
                      <video src={`${import.meta.env.VITE_API_URL || ''}${task.attachment_url}`} controls className="max-w-full max-h-[300px] rounded-xl" onError={(e) => e.currentTarget.src = task.attachment_url} />
                    ) : (
                      <img src={`${import.meta.env.VITE_API_URL || ''}${task.attachment_url}`} alt="Attachment" className="max-w-full max-h-[300px] rounded-xl object-contain" onError={(e) => e.currentTarget.src = task.attachment_url} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CHECKLIST TAB */}
          {activeTab === 'checklist' && (
            <div className="h-full flex flex-col gap-4 animate-fade-in">
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {(!task.checklist_items || task.checklist_items.length === 0) ? (
                  <div className="text-xs text-center py-6 italic" style={{ color: 'var(--text-muted)' }}>No subtasks defined.</div>
                ) : (
                  task.checklist_items.map((item, idx) => (
                    <label key={idx} className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:bg-black/5 transition-colors" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <input 
                        type="checkbox" 
                        checked={item.done} 
                        onChange={() => handleToggleChecklist(idx)} 
                        className="mt-0.5 rounded"
                      />
                      <span className={`text-sm flex-1 ${item.done ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--text)' }}>
                        {item.text}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <form onSubmit={handleAddChecklist} className="shrink-0 flex gap-2">
                <input 
                  type="text" 
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Add a new subtask..."
                  className="flex-1 glass-input text-xs px-3 py-2 rounded-xl"
                />
                <button type="submit" disabled={!newChecklistItem.trim() || updateTaskMutation.isPending} className="btn-primary text-xs py-2">Add</button>
              </form>
            </div>
          )}

          {/* COMMENTS TAB */}
          {activeTab === 'comments' && (
            <div className="h-full animate-fade-in">
              <CommentThread taskId={task.id} currentUser={currentUser} />
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="h-full animate-fade-in">
              <ActivityFeed taskId={task.id} />
            </div>
          )}

        </div>
      </div>
      <ConfirmDeleteModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        taskTitle={task.title}
        count={1}
      />
    </Modal>
  );
}
