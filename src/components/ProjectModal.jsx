import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { usersApi } from '../api/users';
import Modal from './Modal';
import { AlertCircle, Loader } from 'lucide-react';

export default function ProjectModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDevIds, setSelectedDevIds] = useState([]);
  const [leadDevId, setLeadDevId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch users to display developers list
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.listUsers,
    enabled: isOpen,
  });

  const developers = users.filter((u) => u.role === 'DEVELOPER');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setSelectedDevIds([]);
      setLeadDevId('');
      setErrorMsg('');
    }
  }, [isOpen]);

  // Adjust lead developer selection automatically if selection changes
  useEffect(() => {
    if (selectedDevIds.length === 1) {
      setLeadDevId(selectedDevIds[0]);
    } else if (selectedDevIds.length === 0) {
      setLeadDevId('');
    } else if (selectedDevIds.length > 1 && !selectedDevIds.includes(leadDevId)) {
      setLeadDevId('');
    }
  }, [selectedDevIds, leadDevId]);

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

  const handleDevCheckboxChange = (devId) => {
    setSelectedDevIds((prev) =>
      prev.includes(devId) ? prev.filter((id) => id !== devId) : [...prev, devId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (name.trim().length < 2) {
      setErrorMsg('Project name must be at least 2 characters.');
      return;
    }
    if (selectedDevIds.length > 1 && !leadDevId) {
      setErrorMsg('Please designate a Lead Developer.');
      return;
    }

    createProjectMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      developer_ids: selectedDevIds,
      lead_developer_id: leadDevId || null,
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
            rows={3}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
          />
        </div>

        {/* Developers Assignment Section */}
        <div className="space-y-3">
          <label className="form-label">Assign Developers</label>
          {loadingUsers ? (
            <div className="text-xs text-muted flex items-center gap-1.5 py-1">
              <Loader size={12} className="animate-spin" /> Fetching developers...
            </div>
          ) : developers.length === 0 ? (
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              No developers found in workspace.
            </div>
          ) : (
            <div
              className="max-h-36 overflow-y-auto p-3 rounded-xl space-y-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {developers.map((dev) => (
                <label key={dev.id} className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedDevIds.includes(dev.id)}
                    onChange={() => handleDevCheckboxChange(dev.id)}
                    className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span style={{ color: 'var(--text)' }}>
                    {dev.name} <span className="text-[10px] text-muted">({dev.email})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Lead Developer Designation (Required if more than 1 developer chosen) */}
        {selectedDevIds.length > 1 && (
          <div className="space-y-2 animate-fade-in">
            <label className="form-label" style={{ color: 'var(--yellow)' }}>
              Designate Lead Developer *
            </label>
            <select
              value={leadDevId}
              onChange={(e) => setLeadDevId(e.target.value)}
              className="form-select"
              required
            >
              <option value="">-- Choose Lead --</option>
              {developers
                .filter((d) => selectedDevIds.includes(d.id))
                .map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} (Lead)
                  </option>
                ))}
            </select>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              The lead developer is the only developer authorized to modify project deployment parameters.
            </p>
          </div>
        )}

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
