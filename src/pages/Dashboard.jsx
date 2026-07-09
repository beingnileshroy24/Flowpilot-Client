import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import { STATIC_PROJECTS } from '../components/Sidebar';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TicketModal from '../components/TicketModal';
import { 
  FolderKanban, 
  CheckCircle2, 
  CircleDot, 
  Clock, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch tasks for all projects in parallel
  const projectQueries = useQueries({
    queries: STATIC_PROJECTS.map((proj) => ({
      queryKey: ['tasks', proj.id],
      queryFn: () => tasksApi.getTasks(proj.id),
    })),
  });

  const isLoading = projectQueries.some((q) => q.isLoading);

  // Process data for dashboard metrics
  const projectsData = STATIC_PROJECTS.map((proj, idx) => {
    const tasks = projectQueries[idx].data || [];
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'TODO').length;
    const progress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const review = tasks.filter((t) => t.status === 'IN_REVIEW').length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const hours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      ...proj,
      total,
      todo,
      progress,
      review,
      done,
      hours,
      completionRate,
    };
  });

  // Aggregated metrics
  const totalTasks = projectsData.reduce((sum, p) => sum + p.total, 0);
  const completedTasks = projectsData.reduce((sum, p) => sum + p.done, 0);
  const inProgressTasks = projectsData.reduce((sum, p) => sum + p.progress + p.review, 0);
  const totalHours = projectsData.reduce((sum, p) => sum + p.hours, 0);
  const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex h-screen bg-brand-bg text-brand-text overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Projects Dashboard" />

        <main className="p-8 space-y-8 flex-1">
          {/* Header Action block */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Workspace Overview</h2>
              <p className="text-sm text-brand-textMuted mt-1">Cross-project task telemetry & operational status</p>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-brand-primaryHover hover:to-indigo-700 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-glow-primary hover:shadow-glow-secondary transition-all"
            >
              <Plus size={18} />
              Raise New Ticket
            </button>
          </div>

          {/* Aggregated Metric Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Stat: Total Tickets */}
            <div className="glassmorphism p-6 rounded-xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-colors" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider">Total Tasks</span>
                <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                  <Layers size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{isLoading ? '...' : totalTasks}</span>
                <span className="text-xs text-brand-textMuted">active issues</span>
              </div>
            </div>

            {/* Stat: Completed Tickets */}
            <div className="glassmorphism p-6 rounded-xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/5 rounded-full blur-2xl group-hover:bg-brand-secondary/10 transition-colors" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider">Completed</span>
                <div className="p-2 bg-brand-secondary/10 rounded-lg text-brand-secondary">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{isLoading ? '...' : completedTasks}</span>
                <span className="text-xs text-brand-secondary font-semibold">
                  {isLoading ? '' : `${overallCompletionRate}% Rate`}
                </span>
              </div>
            </div>

            {/* Stat: Work In Progress */}
            <div className="glassmorphism p-6 rounded-xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider">Active WIP</span>
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                  <Activity size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{isLoading ? '...' : inProgressTasks}</span>
                <span className="text-xs text-brand-textMuted">developing/reviewing</span>
              </div>
            </div>

            {/* Stat: Total Hours Allocated */}
            <div className="glassmorphism p-6 rounded-xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider">Backlog Effort</span>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{isLoading ? '...' : totalHours}h</span>
                <span className="text-xs text-brand-textMuted">estimated effort</span>
              </div>
            </div>
          </div>

          {/* Project List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-wide">Allocated Workspaces</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projectsData.map((proj) => (
                <div 
                  key={proj.id}
                  className="glassmorphism rounded-xl border border-white/5 hover:border-white/10 transition-all flex flex-col p-6 group shadow-sm hover:shadow-glow-primary"
                >
                  {/* Card Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-brand-primary/10 rounded-lg text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                      <FolderKanban size={22} />
                    </div>
                    <span className="text-[10px] bg-white/5 border border-white/10 text-brand-textMuted px-2 py-0.5 rounded font-mono uppercase">
                      Active
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white tracking-wide">{proj.name}</h4>
                  <p className="text-xs text-brand-textMuted mt-1 line-clamp-2 min-h-[32px]">
                    {proj.desc}
                  </p>

                  {/* Micro stats table */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 py-4 my-4 border-t border-b border-white/5 text-xs">
                    <div className="flex items-center gap-1.5 text-brand-textMuted">
                      <CircleDot size={13} className="text-brand-primary" />
                      <span>Backlog:</span>
                      <span className="font-semibold text-white ml-auto">{isLoading ? '..' : proj.todo}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-brand-textMuted">
                      <Activity size={13} className="text-amber-500" />
                      <span>WIP:</span>
                      <span className="font-semibold text-white ml-auto">{isLoading ? '..' : proj.progress + proj.review}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-brand-textMuted col-span-2">
                      <CheckCircle2 size={13} className="text-brand-secondary" />
                      <span>Completed:</span>
                      <span className="font-semibold text-brand-secondary ml-auto">
                        {isLoading ? '..' : `${proj.done} / ${proj.total}`}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-6">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-brand-textMuted">Completion</span>
                      <span className="text-brand-secondary">{isLoading ? '...' : `${proj.completionRate}%`}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-brand-primary to-brand-secondary h-full rounded-full transition-all duration-500"
                        style={{ width: `${isLoading ? 0 : proj.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Link */}
                  <Link
                    to={`/project/${proj.id}`}
                    className="mt-auto w-full py-2.5 bg-white/5 hover:bg-brand-primary text-brand-textMuted hover:text-white rounded-lg text-sm font-semibold transition-all border border-white/5 flex items-center justify-center gap-2 group-hover:border-brand-primary/20"
                  >
                    Open Kanban Board
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Raise Ticket Modal */}
      <TicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
