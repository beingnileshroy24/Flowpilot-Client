import React, { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TicketModal from '../components/TicketModal';
import ProjectModal from '../components/ProjectModal';
import {
  FolderKanban,
  CheckCircle2,
  Activity,
  Clock,
  Plus,
  ArrowRight,
  CircleDot,
  Layers,
} from 'lucide-react';

const PROJECT_ACCENT_COLORS = ['#f59e0b', '#3b82f6', '#a855f7'];

function MetricCard({ icon: Icon, label, value, accent, sublabel }) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] relative overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }}
      />
      <div className="flex items-start justify-between mb-3 relative z-10">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
      </div>
      <div className="flex items-baseline gap-2 relative z-10">
        <span className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
          {value}
        </span>
        {sublabel && (
          <span className="text-xs font-semibold" style={{ color: accent }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const currentUser = useSelector((state) => state.auth.user);
  const isManagerOrAdmin = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';

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
    return { ...proj, total, done, progress, review, todo, hours, rate };
  });

  const totalTasks = projectsData.reduce((s, p) => s + p.total, 0);
  const totalDone  = projectsData.reduce((s, p) => s + p.done, 0);
  const totalWIP   = projectsData.reduce((s, p) => s + p.progress + p.review, 0);
  const totalHours = projectsData.reduce((s, p) => s + p.hours, 0);
  const overallRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title="Dashboard" />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                Workspace Overview
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Cross-project operational telemetry
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {isManagerOrAdmin && (
                <button onClick={() => setIsProjectModalOpen(true)} className="btn-secondary text-sm">
                  <Plus size={16} />
                  New Project
                </button>
              )}
              <button onClick={() => setIsModalOpen(true)} className="btn-primary text-sm">
                <Plus size={16} />
                Raise Ticket
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={Layers}       label="Total Tasks"   value={isLoading ? '—' : totalTasks} accent="#f59e0b" />
            <MetricCard icon={CheckCircle2} label="Completed"     value={isLoading ? '—' : totalDone}  accent="#22c55e" sublabel={isLoading ? '' : `${overallRate}%`} />
            <MetricCard icon={Activity}     label="Active WIP"    value={isLoading ? '—' : totalWIP}   accent="#3b82f6" />
            <MetricCard icon={Clock}        label="Effort (hrs)"  value={isLoading ? '—' : `${totalHours}h`} accent="#a855f7" />
          </div>

          {/* Projects Grid */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
              Active Projects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {projectsData.map((proj, idx) => {
                const accent = PROJECT_ACCENT_COLORS[idx];
                return (
                  <div
                    key={proj.id}
                    className="rounded-2xl p-5 flex flex-col transition-all duration-200 hover:scale-[1.01] relative overflow-hidden group"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `var(--shadow), 0 0 24px ${accent}20`;
                      e.currentTarget.style.borderColor = `${accent}35`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    {/* Top color accent strip */}
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5"
                      style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.6 }}
                    />

                    {/* Icon + Status */}
                    <div className="flex items-start justify-between mb-4 pt-1">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{
                          background: `${accent}18`,
                          border: `1px solid ${accent}28`,
                          boxShadow: `0 4px 12px ${accent}20`,
                        }}
                      >
                        <FolderKanban size={22} style={{ color: accent }} />
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(34,197,94,0.10)',
                          color: '#16a34a',
                          border: '1px solid rgba(34,197,94,0.20)',
                        }}
                      >
                        Active
                      </span>
                    </div>

                    {/* Name + Desc */}
                    <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{proj.name}</h4>
                    <p className="text-xs mb-4 line-clamp-2 flex-1" style={{ color: 'var(--text-muted)' }}>
                      {proj.desc}
                    </p>

                    {/* Mini metrics */}
                    <div
                      className="grid grid-cols-3 gap-2 py-3 mb-4 text-center"
                      style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
                    >
                      {[
                        { label: 'Backlog', val: proj.todo },
                        { label: 'WIP',     val: proj.progress + proj.review },
                        { label: 'Done',    val: proj.done },
                      ].map((m) => (
                        <div key={m.label}>
                          <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                            {isLoading ? '–' : m.val}
                          </div>
                          <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                            {m.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                        <span style={{ color: accent }}>{isLoading ? '—' : `${proj.rate}%`}</span>
                      </div>
                      <div
                        className="w-full h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--border)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${isLoading ? 0 : proj.rate}%`,
                            background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Open Board CTA */}
                    <Link
                      to={`/project/${proj.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 group-hover:scale-[1.01]"
                      style={{
                        background: `${accent}12`,
                        color: accent,
                        border: `1px solid ${accent}25`,
                      }}
                    >
                      Open Kanban Board
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <TicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} />
    </div>
  );
}
