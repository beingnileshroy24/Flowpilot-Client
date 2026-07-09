import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TaskCard from '../components/TaskCard';
import EditProjectModal from '../components/EditProjectModal';
import TicketModal from '../components/TicketModal';
import { Plus, Search, Filter, ArrowLeft, Loader, AlertTriangle, Settings } from 'lucide-react';

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

const COLUMNS = [
  { id: 'TODO',        title: 'Backlog',     accent: '#94a3b8' },
  { id: 'IN_PROGRESS', title: 'In Progress', accent: '#f59e0b' },
  { id: 'IN_REVIEW',   title: 'In Review',   accent: '#3b82f6' },
  { id: 'DONE',        title: 'Done',        accent: '#22c55e' },
];

export default function ProjectBoard() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

  const { data: currentProject = { name: 'Project Board', desc: '' } } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId),
    enabled: !!projectId,
  });

  const { data: tasks = [], isLoading, isError, error } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.getTasks(projectId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksApi.updateTaskStatus(taskId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const previous = queryClient.getQueryData(['tasks', projectId]);

    // Optimistic update
    queryClient.setQueryData(['tasks', projectId], (old) =>
      (old || []).map((t) => t.id === draggableId ? { ...t, status: newStatus } : t)
    );

    try {
      await updateStatusMutation.mutateAsync({ taskId: draggableId, status: newStatus });
    } catch {
      if (previous) queryClient.setQueryData(['tasks', projectId], previous);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={currentProject.name} />

        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <Link
                to="/"
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <ArrowLeft size={15} />
              </Link>
              <div>
                <h2 className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>
                  {currentProject.name}
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm outline-none w-36 sm:w-48"
                  style={{ color: 'var(--text)' }}
                />
              </div>

              {/* Priority filter */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent text-sm outline-none cursor-pointer font-medium"
                  style={{ color: 'var(--text)' }}
                >
                  {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                    <option key={p} value={p} style={{ background: 'var(--surface-solid)', color: 'var(--text)' }}>
                      {p === 'ALL' ? 'All Priorities' : p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Configure Project */}
              <button
                onClick={() => setIsEditProjectModalOpen(true)}
                className="btn-secondary text-sm flex items-center gap-1.5"
                title="Configure project repository and server details"
              >
                <Settings size={15} />
                Configure
              </button>

              {/* Add ticket */}
              <button onClick={() => setIsModalOpen(true)} className="btn-primary text-sm">
                <Plus size={16} />
                Add Issue
              </button>
            </div>
          </div>

          {/* Project Details / Metadata Ribbon */}
          {(currentProject.github_frontend || currentProject.github_backend || currentProject.test_server || currentProject.prod_server || currentProject.test_mongodb_url || currentProject.prod_mongodb_url) && (
            <div
              className="p-3.5 rounded-2xl flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs shrink-0 animate-fade-in"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Description */}
              {currentProject.description && (
                <div className="text-[11px] font-medium pr-4 border-r" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  {currentProject.description}
                </div>
              )}

              {/* GitHub Repos */}
              {(currentProject.github_frontend || currentProject.github_backend) && (
                <div className="flex items-center gap-2 border-r pr-4" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-muted)' }}>Repos:</span>
                  {currentProject.github_frontend && (
                    <a
                      href={currentProject.github_frontend}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 font-semibold"
                      style={{ color: '#3b82f6' }}
                    >
                      <GithubIcon size={12} /> Frontend
                    </a>
                  )}
                  {currentProject.github_backend && (
                    <a
                      href={currentProject.github_backend}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 font-semibold"
                      style={{ color: '#3b82f6' }}
                    >
                      <GithubIcon size={12} /> Backend
                    </a>
                  )}
                </div>
              )}

              {/* Servers */}
              {(currentProject.test_server || currentProject.prod_server) && (
                <div className="flex items-center gap-2 border-r pr-4" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-muted)' }}>Servers:</span>
                  {currentProject.test_server && (
                    <a
                      href={currentProject.test_server}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 font-semibold"
                      style={{ color: '#f59e0b' }}
                    >
                      Staging
                    </a>
                  )}
                  {currentProject.prod_server && (
                    <a
                      href={currentProject.prod_server}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 font-semibold"
                      style={{ color: '#22c55e' }}
                    >
                      Production
                    </a>
                  )}
                </div>
              )}

              {/* Mongo Details */}
              {(currentProject.test_mongodb_url || currentProject.prod_mongodb_url) && (
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-muted)' }}>MongoDB Connection:</span>
                  {currentProject.test_mongodb_url && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentProject.test_mongodb_url);
                        alert('Staging MongoDB connection string copied to clipboard!');
                      }}
                      className="hover:underline flex items-center gap-1 font-semibold text-left cursor-pointer"
                      style={{ color: '#3b82f6' }}
                    >
                      Copy Test URI
                    </button>
                  )}
                  {currentProject.prod_mongodb_url && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentProject.prod_mongodb_url);
                        alert('Production MongoDB connection string copied to clipboard!');
                      }}
                      className="hover:underline flex items-center gap-1 font-semibold text-left cursor-pointer"
                      style={{ color: '#22c55e' }}
                    >
                      Copy Prod URI
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Kanban Body */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <Loader size={24} className="animate-spin" style={{ color: '#f59e0b' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Syncing tasks from MongoDB…
              </p>
            </div>
          ) : isError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)' }}
              >
                <AlertTriangle size={24} style={{ color: '#dc2626' }} />
              </div>
              <div>
                <h4 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>Failed to Load Tasks</h4>
                <p className="text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
                  {error.response?.data?.detail || 'Ensure the FastAPI server is running on port 8000.'}
                </p>
              </div>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-2 min-h-0">
                {COLUMNS.map((col) => {
                  const colTasks = filteredTasks.filter((t) => t.status === col.id);
                  return (
                    <div
                      key={col.id}
                      className="flex flex-col rounded-2xl min-w-[240px] min-h-0"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {/* Column Header */}
                      <div
                        className="flex items-center justify-between px-4 py-3 shrink-0"
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: col.accent }}
                          />
                          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                            {col.title}
                          </span>
                        </div>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-lg"
                          style={{
                            background: `${col.accent}15`,
                            color: col.accent,
                            border: `1px solid ${col.accent}25`,
                          }}
                        >
                          {colTasks.length}
                        </span>
                      </div>

                      {/* Droppable Area */}
                      <Droppable droppableId={col.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex-1 overflow-y-auto p-3 space-y-3 transition-colors duration-200"
                            style={{
                              background: snapshot.isDraggingOver
                                ? `${col.accent}06`
                                : 'transparent',
                              minHeight: '120px',
                            }}
                          >
                            {colTasks.length === 0 ? (
                              <div
                                className="h-24 flex flex-col items-center justify-center rounded-xl text-center"
                                style={{
                                  border: `1.5px dashed ${col.accent}30`,
                                  color: 'var(--text-muted)',
                                }}
                              >
                                <span className="text-xs font-medium">Empty</span>
                              </div>
                            ) : (
                              colTasks.map((task, idx) => (
                                <TaskCard key={task.id} task={task} index={idx} />
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>

      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultProjectId={projectId}
      />
      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        project={currentProject}
      />
    </div>
  );
}
