import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { tasksApi } from '../api/tasks';
import { STATIC_PROJECTS } from '../components/Sidebar';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TaskCard from '../components/TaskCard';
import TicketModal from '../components/TicketModal';
import { Plus, Search, Filter, ArrowLeft, Loader, AlertTriangle } from 'lucide-react';

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

  const currentProject = STATIC_PROJECTS.find((p) => p.id === projectId) || {
    id: projectId,
    name: 'Project Board',
    desc: 'Custom workspace',
  };

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

              {/* Add ticket */}
              <button onClick={() => setIsModalOpen(true)} className="btn-primary text-sm">
                <Plus size={16} />
                Add Issue
              </button>
            </div>
          </div>

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
    </div>
  );
}
