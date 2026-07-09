import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { usersApi } from '../api/users';
import { tasksApi } from '../api/tasks';
import { STATIC_PROJECTS } from './Sidebar';
import Modal from './Modal';
import { AlertCircle, Loader } from 'lucide-react';

export default function TicketModal({ isOpen, onClose, defaultProjectId }) {
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);

  // Form State
  const [projectId, setProjectId] = useState(defaultProjectId || STATIC_PROJECTS[0].id);
  const [type, setType] = useState('TASK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [tagsInput, setTagsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Update default project id when it changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setProjectId(defaultProjectId || STATIC_PROJECTS[0].id);
      // Reset form
      setType('TASK');
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setAssignedToId('');
      setEstimatedHours(0);
      setTagsInput('');
      setErrorMsg('');
    }
  }, [isOpen, defaultProjectId]);

  // Fetch users for the assignee dropdown list
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.listUsers,
    enabled: isOpen,
  });

  // Task creation mutation
  const createTaskMutation = useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: (data) => {
      // Invalidate both general dashboard tasks query and specific project tasks query
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create task. Please verify your fields.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (title.trim().length < 3) {
      setErrorMsg('Title must be at least 3 characters.');
      return;
    }

    const payload = {
      project_id: projectId,
      type,
      title: title.trim(),
      description: description.trim(),
      priority,
      assigned_to_id: assignedToId || null,
      estimated_hours: Number(estimatedHours) || 0.0,
      tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };

    createTaskMutation.mutate(payload);
  };

  const canCreate = currentUser?.role === 'MANAGER' || currentUser?.role === 'CLIENT' || currentUser?.role === 'ADMIN';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Raise New Issue / Task">
      {!canCreate ? (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <AlertCircle className="text-amber-500 w-12 h-12" />
          <h4 className="text-lg font-bold text-white">Access Denied</h4>
          <p className="text-sm text-brand-textMuted max-w-sm">
            Only Clients, Managers, and Admins are authorized to create new tickets in FlowPilot.
          </p>
          <button 
            type="button" 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm transition-colors border border-white/5 font-semibold"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Project selection */}
          <div>
            <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-primary"
              required
            >
              {STATIC_PROJECTS.map((p) => (
                <option key={p.id} value={p.id} className="bg-brand-bg text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Task Type */}
            <div>
              <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-primary"
              >
                <option value="TASK" className="bg-brand-bg text-white">TASK</option>
                <option value="EPIC" className="bg-brand-bg text-white">EPIC</option>
                <option value="BUG" className="bg-brand-bg text-white">BUG</option>
                <option value="SUBTASK" className="bg-brand-bg text-white">SUBTASK</option>
              </select>
            </div>

            {/* Task Priority */}
            <div>
              <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-primary"
              >
                <option value="LOW" className="bg-brand-bg text-white">LOW</option>
                <option value="MEDIUM" className="bg-brand-bg text-white">MEDIUM</option>
                <option value="HIGH" className="bg-brand-bg text-white">HIGH</option>
                <option value="CRITICAL" className="bg-brand-bg text-white">CRITICAL</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Oauth2 session state checks"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-primary placeholder:text-gray-600"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue or user story..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-primary placeholder:text-gray-600 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Assignee</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-primary"
                disabled={loadingUsers}
              >
                <option value="" className="bg-brand-bg text-white">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-brand-bg text-white">
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Estimate (Hours)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. backend, security, auth"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-primary placeholder:text-gray-600"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-brand-textMuted hover:text-white rounded-lg text-sm transition-colors border border-white/5 bg-white/5 hover:bg-white/10 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="px-5 py-2 bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-brand-primaryHover hover:to-indigo-700 text-white rounded-lg text-sm transition-all font-semibold shadow-glow-primary flex items-center gap-2"
            >
              {createTaskMutation.isPending && <Loader size={16} className="animate-spin" />}
              {createTaskMutation.isPending ? 'Saving...' : 'Raise Ticket'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
