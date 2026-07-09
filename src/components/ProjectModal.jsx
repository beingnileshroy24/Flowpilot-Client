import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import Modal from './Modal';
import { AlertCircle, Loader } from 'lucide-react';

export default function ProjectModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const createProjectMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create project.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (name.trim().length < 2) {
      setErrorMsg('Project name must be at least 2 characters.');
      return;
    }
    createProjectMutation.mutate({
      name: name.trim(),
      description: description.trim(),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
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

        <div>
          <label className="form-label">Project Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mobile App Redesign"
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            required
          />
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline goals, objectives, and scope..."
            rows={4}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
          />
        </div>

        <div
          className="flex items-center justify-end gap-3 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={createProjectMutation.isPending}
            className="btn-primary"
          >
            {createProjectMutation.isPending && <Loader size={15} className="animate-spin" />}
            {createProjectMutation.isPending ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
