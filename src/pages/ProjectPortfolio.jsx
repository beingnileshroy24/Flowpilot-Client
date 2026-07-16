import React, { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
  FolderKanban,
  CheckCircle2,
  Activity,
  X,
  Server,
  Database,
  Key,
  Users,
  Code2,
  Clock,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Globe
} from 'lucide-react';

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

const PROJECT_ACCENT_COLORS = ['#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];

export default function ProjectPortfolio() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDevs, setShowDevs] = useState(false);
  
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const projectQueries = useQueries({
    queries: projects.map((proj) => ({
      queryKey: ['tasks', proj.id],
      queryFn: () => tasksApi.getTasks(proj.id),
      enabled: !!proj.id,
    })),
  });

  const isLoading = isLoadingProjects || projectQueries.some((q) => q.isLoading);

  const projectsData = projects.map((proj, idx) => {
    const tasks = projectQueries[idx]?.data || [];
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const progress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const review = tasks.filter((t) => t.status === 'IN_REVIEW').length;
    const todo = tasks.filter((t) => t.status === 'TODO').length;
    const hours = tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    const accent = PROJECT_ACCENT_COLORS[idx % PROJECT_ACCENT_COLORS.length];
    return { ...proj, total, done, progress, review, todo, hours, rate, accent };
  });

  const activeProject = projectsData.find(p => p.id === selectedProject?.id);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header title="Project Portfolio" />

        <main className="flex-1 overflow-hidden p-6 lg:p-8 flex gap-6">
          
          {/* Main List Area */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                Project Portfolio
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Managerial overview of all ongoing projects and their operational metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
              {projectsData.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => { setSelectedProject(proj); setShowDevs(false); }}
                  className="rounded-2xl p-5 flex flex-col transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  style={{
                    background: activeProject?.id === proj.id ? `${proj.accent}0a` : 'var(--surface)',
                    border: activeProject?.id === proj.id ? `1px solid ${proj.accent}60` : '1px solid var(--border)',
                    boxShadow: activeProject?.id === proj.id ? `0 0 20px ${proj.accent}15` : 'var(--shadow-sm)',
                    transform: activeProject?.id === proj.id ? 'translateY(-2px)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (activeProject?.id !== proj.id) {
                      e.currentTarget.style.borderColor = `${proj.accent}40`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${proj.accent}15`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeProject?.id !== proj.id) {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }
                  }}
                >
                  {/* Top color accent strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: `linear-gradient(90deg, ${proj.accent}90, ${proj.accent})` }}
                  />

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 pt-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{
                          background: `${proj.accent}15`,
                          border: `1px solid ${proj.accent}30`,
                        }}
                      >
                        <FolderKanban size={20} style={{ color: proj.accent }} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold truncate w-40" style={{ color: 'var(--text)' }}>
                          {proj.name}
                        </h4>
                        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: proj.accent }}>
                          {isLoading ? '—' : `${proj.rate}% Completed`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>

                  {/* Mini metrics */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { label: 'Total', val: proj.total, color: 'var(--text)' },
                      { label: 'Todo', val: proj.todo, color: '#f59e0b' },
                      { label: 'WIP', val: proj.progress + proj.review, color: '#3b82f6' },
                      { label: 'Done', val: proj.done, color: '#10b981' },
                    ].map((m) => (
                      <div key={m.label} className="text-center p-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                        <div className="text-xs font-bold" style={{ color: m.color }}>
                          {isLoading ? '–' : m.val}
                        </div>
                        <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-auto">
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${isLoading ? 0 : proj.rate}%`,
                          background: `linear-gradient(90deg, ${proj.accent}, ${proj.accent}dd)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side Panel (Details Preview) */}
          {activeProject && (
            <div 
              className="w-[420px] shrink-0 rounded-2xl flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300 overflow-hidden"
              style={{ 
                background: 'var(--surface)', 
                border: `1px solid ${activeProject.accent}30` 
              }}
            >
              <div 
                className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-20"
                style={{ background: activeProject.accent, transform: 'translate(40%, -40%)' }}
              />

              <div className="p-6 border-b flex items-start justify-between relative z-10" style={{ borderColor: 'var(--border)' }}>
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${activeProject.accent}dd, ${activeProject.accent})`, color: '#fff' }}
                    >
                      <FolderKanban size={16} />
                    </div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{activeProject.name}</h3>
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                    {activeProject.description}
                  </p>
                </div>
                <button 
                  onClick={() => { setSelectedProject(null); setShowDevs(false); }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 relative z-10 custom-scrollbar">
                
                {/* Metrics */}
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Activity size={12} /> Progress Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div className="p-2 rounded-lg" style={{ background: `${activeProject.accent}15`, color: activeProject.accent }}>
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{activeProject.done} / {activeProject.total}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tasks Completed</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div className="p-2 rounded-lg" style={{ background: `${activeProject.accent}15`, color: activeProject.accent }}>
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{activeProject.hours}h</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Est. Effort</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Team */}
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Users size={12} /> Team & Stack
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Owner</span>
                      <span className="font-bold" style={{ color: 'var(--text)' }}>{activeProject.owner_name || activeProject.owner_id}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Created At</span>
                      <span className="font-bold" style={{ color: 'var(--text)' }}>
                        {activeProject.created_at ? new Date(activeProject.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-col text-xs p-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowDevs(!showDevs)}>
                        <span style={{ color: 'var(--text-muted)' }}>Dev Count</span>
                        <span className="font-bold hover:underline" style={{ color: activeProject.accent }}>
                          {activeProject.developer_ids?.length || 0} Members
                        </span>
                      </div>
                      {showDevs && activeProject.developer_names && activeProject.developer_names.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
                          <ul className="space-y-1.5 pl-1">
                            {activeProject.developer_names.map((name, i) => (
                              <li key={i} className="flex items-center gap-2 font-medium" style={{ color: 'var(--text)' }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: activeProject.accent }}></span>
                                {name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  {activeProject.tech_stack?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeProject.tech_stack.map((tech, i) => (
                        <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded-md border" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                {/* Infrastructure */}
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Server size={12} /> Infrastructure
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Frontend Repo', value: activeProject.github_frontend, icon: GithubIcon },
                      { label: 'Backend Repo', value: activeProject.github_backend, icon: GithubIcon },
                      { label: 'Prod Server', value: activeProject.prod_server, icon: Globe },
                      { label: 'Test Server', value: activeProject.test_server, icon: Globe },
                      { label: 'Prod Database', value: activeProject.prod_mongodb_url ? 'Configured (Hidden)' : null, icon: Database },
                    ].map((item, i) => item.value && (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border text-xs" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                        <item.icon size={14} style={{ color: 'var(--text-muted)' }} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold" style={{ color: 'var(--text)' }}>{item.label}</div>
                          <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Secrets (Manager Only View) */}
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#ef4444' }}>
                    <Key size={12} /> Environment Secrets
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#ef4444' }}>Frontend Secrets (ENV)</div>
                      <pre className="text-[10px] font-mono p-2 rounded whitespace-pre-wrap break-all" style={{ background: '#000', color: '#10b981' }}>
                        {activeProject.frontend_secrets || 'No frontend secrets configured.'}
                      </pre>
                    </div>
                    <div className="p-3 rounded-lg border" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#ef4444' }}>Backend Secrets (ENV)</div>
                      <pre className="text-[10px] font-mono p-2 rounded whitespace-pre-wrap break-all" style={{ background: '#000', color: '#10b981' }}>
                        {activeProject.backend_secrets || 'No backend secrets configured.'}
                      </pre>
                    </div>
                  </div>
                </section>

              </div>
              
              <div className="p-4 border-t bg-black/5 dark:bg-white/5 relative z-10" style={{ borderColor: 'var(--border)' }}>
                <Link
                  to={`/project/${activeProject.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${activeProject.accent}, ${activeProject.accent}dd)`,
                    color: '#fff',
                    boxShadow: `0 4px 14px ${activeProject.accent}40`,
                  }}
                >
                  Enter Project Board <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
