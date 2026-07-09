import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { usersApi } from '../api/users';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import Modal from './Modal';
import { AlertCircle, Loader, ShieldOff } from 'lucide-react';

const TASK_TYPES = ['TASK', 'EPIC', 'BUG', 'SUBTASK'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

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

function PillSelector({ options, value, onChange, colorMap }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const colors = colorMap[opt];
        const isSelected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-150 hover:scale-105"
            style={{
              background: isSelected ? colors.bg : 'var(--surface)',
              color: isSelected ? colors.active : 'var(--text-muted)',
              border: `1px solid ${isSelected ? colors.border : 'var(--border)'}`,
              boxShadow: isSelected ? `0 0 10px ${colors.bg}` : 'none',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function TicketModal({ isOpen, onClose, defaultProjectId }) {
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);

  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [type, setType] = useState('TASK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [tagsInput, setTagsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setProjectId(defaultProjectId || projects[0]?.id || '');
      setType('TASK');
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setAssignedToId('');
      setEstimatedHours(0);
      setTagsInput('');
      setErrorMsg('');
    }
  }, [isOpen, defaultProjectId, projects]);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.listUsers,
    enabled: isOpen,
  });

  const createTaskMutation = useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create ticket. Please check your fields.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (title.trim().length < 3) {
      setErrorMsg('Title must be at least 3 characters.');
      return;
    }
    createTaskMutation.mutate({
      project_id: projectId,
      type,
      title: title.trim(),
      description: description.trim(),
      priority,
      assigned_to_id: assignedToId || null,
      estimated_hours: Number(estimatedHours) || 0,
      tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
  };

  const canCreate = ['MANAGER', 'CLIENT', 'ADMIN'].includes(currentUser?.role);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Raise New Issue" size="md">
      {!canCreate ? (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <ShieldOff size={28} style={{ color: '#d97706' }} />
          </div>
          <div>
            <h4 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
              Permission Required
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Only Managers, Clients, and Admins can raise tickets.
            </p>
          </div>
          <button onClick={onClose} className="btn-secondary mt-2">Close</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error */}
          {errorMsg && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.20)',
                color: '#dc2626',
              }}
            >
              <AlertCircle size={16} className="shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Project */}
          <div>
            <label className="form-label">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="form-select"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Task Type Pill Selector */}
          <div>
            <label className="form-label">Task Type</label>
            <PillSelector
              options={TASK_TYPES}
              value={type}
              onChange={setType}
              colorMap={TYPE_COLORS}
            />
          </div>

          {/* Priority Pill Selector */}
          <div>
            <label className="form-label">Priority</label>
            <PillSelector
              options={PRIORITIES}
              value={priority}
              onChange={setPriority}
              colorMap={PRIORITY_COLORS}
            />
          </div>

          {/* Title */}
          <div>
            <label className="form-label">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Oauth2 session validation"
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue or user story..."
              rows={3}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
            />
          </div>

          {/* Assignee + Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Assignee</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="form-select"
                disabled={loadingUsers}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Est. Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="form-label">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. backend, security, auth"
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-end gap-3 pt-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="btn-primary"
            >
              {createTaskMutation.isPending && <Loader size={15} className="animate-spin" />}
              {createTaskMutation.isPending ? 'Saving…' : 'Raise Ticket'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
