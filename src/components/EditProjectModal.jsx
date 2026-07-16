import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { usersApi } from '../api/users';
import Modal from './Modal';
import { AlertCircle, Loader, Link, Server, Database, Users, Trash2, Lock } from 'lucide-react';

function GithubIcon({ size = 16, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function EditProjectModal({ isOpen, onClose, project }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDevIds, setSelectedDevIds] = useState([]);
  const [leadDevId, setLeadDevId] = useState('');
  const [githubFrontend, setGithubFrontend] = useState('');
  const [githubBackend, setGithubBackend] = useState('');
  const [testServer, setTestServer] = useState('');
  const [prodServer, setProdServer] = useState('');
  const [testMongodbUrl, setTestMongodbUrl] = useState('');
  const [prodMongodbUrl, setProdMongodbUrl] = useState('');
  const [backendSecrets, setBackendSecrets] = useState('');
  const [frontendSecrets, setFrontendSecrets] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isManagerOrAdmin = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';

  // Fetch users list to display developers
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.listUsers,
    enabled: isOpen,
  });

  const developers = users.filter((u) => u.role === 'DEVELOPER');

  useEffect(() => {
    if (isOpen && project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setSelectedDevIds(project.developer_ids || []);
      setLeadDevId(project.lead_developer_id || '');
      setGithubFrontend(project.github_frontend || '');
      setGithubBackend(project.github_backend || '');
      setTestServer(project.test_server || '');
      setProdServer(project.prod_server || '');
      setTestMongodbUrl(project.test_mongodb_url || '');
      setProdMongodbUrl(project.prod_mongodb_url || '');
      setBackendSecrets(project.backend_secrets || '');
      setFrontendSecrets(project.frontend_secrets || '');
      setErrorMsg('');
    }
  }, [isOpen, project]);

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

  const updateProjectMutation = useMutation({
    mutationFn: projectsApi.updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to update project.');
    },
  });


  const handleDevCheckboxChange = (devId) => {
    if (!isManagerOrAdmin) return;
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
    if (isManagerOrAdmin && selectedDevIds.length > 1 && !leadDevId) {
      setErrorMsg('Please designate a Lead Developer.');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      github_frontend: githubFrontend.trim() || null,
      github_backend: githubBackend.trim() || null,
      test_server: testServer.trim() || null,
      prod_server: prodServer.trim() || null,
      test_mongodb_url: testMongodbUrl.trim() || null,
      prod_mongodb_url: prodMongodbUrl.trim() || null,
      backend_secrets: backendSecrets.trim() || null,
      frontend_secrets: frontendSecrets.trim() || null,
    };

    if (isManagerOrAdmin) {
      payload.developer_ids = selectedDevIds;
      payload.lead_developer_id = leadDevId || null;
    }

    updateProjectMutation.mutate({
      projectId: project.id,
      payload,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Project Environments" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Section 1: Basic Info */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Basic Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Developer Assignments */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-1.5">
            <Users size={15} className="text-blue-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500">
              Developer Assignments
            </h4>
          </div>
          {isManagerOrAdmin ? (
            <div className="space-y-4">
              <div>
                <label className="form-label">Developers</label>
                {loadingUsers ? (
                  <div className="text-xs text-muted flex items-center gap-1.5 py-1">
                    <Loader size={12} className="animate-spin" /> Fetching developers...
                  </div>
                ) : (
                  <div
                    className="max-h-32 overflow-y-auto p-3 rounded-xl space-y-2"
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
                        <span style={{ color: 'var(--text)' }}>{dev.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedDevIds.length > 1 && (
                <div className="animate-fade-in">
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
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs space-y-1.5" style={{ color: 'var(--text-muted)' }}>
              <p>
                <strong>Assigned Developers:</strong>{' '}
                {selectedDevIds.length === 0
                  ? 'None'
                  : developers
                      .filter((d) => selectedDevIds.includes(d.id))
                      .map((d) => d.name)
                      .join(', ')}
              </p>
              <p>
                <strong>Lead Developer:</strong>{' '}
                {leadDevId
                  ? developers.find((d) => d.id === leadDevId)?.name || 'Unknown'
                  : 'None'}
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Repositories */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-1.5">
            <GithubIcon size={15} className="text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Repository Links
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Frontend GitHub Link</label>
              <input
                type="url"
                value={githubFrontend}
                onChange={(e) => setGithubFrontend(e.target.value)}
                placeholder="https://github.com/org/repo-client"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="form-label">Backend GitHub Link</label>
              <input
                type="url"
                value={githubBackend}
                onChange={(e) => setGithubBackend(e.target.value)}
                placeholder="https://github.com/org/repo-server"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Servers */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-1.5">
            <Server size={15} className="text-blue-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500">
              Deployment Servers
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Test Server Link</label>
              <input
                type="url"
                value={testServer}
                onChange={(e) => setTestServer(e.target.value)}
                placeholder="https://staging.flowpilot.com"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="form-label">Production Server Link</label>
              <input
                type="url"
                value={prodServer}
                onChange={(e) => setProdServer(e.target.value)}
                placeholder="https://flowpilot.com"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 5: MongoDB URLs */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-1.5">
            <Database size={15} className="text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Database URLs
            </h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="form-label">Test MongoDB URL</label>
              <input
                type="text"
                value={testMongodbUrl}
                onChange={(e) => setTestMongodbUrl(e.target.value)}
                placeholder="mongodb+srv://user:pass@cluster-test.mongodb.net"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="form-label">Production MongoDB URL</label>
              <input
                type="text"
                value={prodMongodbUrl}
                onChange={(e) => setProdMongodbUrl(e.target.value)}
                placeholder="mongodb+srv://user:pass@cluster-prod.mongodb.net"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Environment Secrets */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-1.5">
            <Lock size={15} className="text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Environment Secrets
            </h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="form-label">Frontend Secrets (.env format)</label>
              <textarea
                value={frontendSecrets}
                onChange={(e) => setFrontendSecrets(e.target.value)}
                placeholder="VITE_API_URL=https://...&#10;VITE_ANALYTICS_ID=UA-..."
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm font-mono"
                rows={3}
              />
            </div>
            <div>
              <label className="form-label">Backend Secrets (.env format)</label>
              <textarea
                value={backendSecrets}
                onChange={(e) => setBackendSecrets(e.target.value)}
                placeholder="DATABASE_URL=mongodb://...&#10;JWT_SECRET=supersecret..."
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm font-mono"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-end pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProjectMutation.isPending}
              className="btn-primary"
            >
              {updateProjectMutation.isPending && <Loader size={15} className="animate-spin" />}
              {updateProjectMutation.isPending ? 'Updating…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
