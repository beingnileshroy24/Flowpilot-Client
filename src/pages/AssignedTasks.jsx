import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import { usersApi } from '../api/users';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TaskCard from '../components/TaskCard';
import TaskDetailModal from '../components/TaskDetailModal';
import { Search, Filter, Loader, AlertTriangle } from 'lucide-react';

const COLUMNS = [
  { id: 'TODO',        title: 'Backlog',     accent: '#94a3b8' },
  { id: 'IN_PROGRESS', title: 'In Progress', accent: '#f59e0b' },
  { id: 'IN_REVIEW',   title: 'In Review',   accent: '#3b82f6' },
  { id: 'DONE',        title: 'Done',        accent: '#22c55e' },
];

export default function AssignedTasks() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState(null);
  const currentUser = useSelector((state) => state.auth.user);

  const { data: tasks = [], isLoading, isError, error } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => tasksApi.getTasks(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.listUsers,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksApi.updateTaskStatus(taskId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-tasks'] }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }) => tasksApi.updateTaskDetails(taskId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-tasks'] }),
  });

  const projectMap = React.useMemo(() => {
    return projects.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [projects]);

  const handleStatusChange = async (taskId, newStatus) => {
    const previous = queryClient.getQueryData(['my-tasks']);

    // Optimistic update
    queryClient.setQueryData(['my-tasks'], (old) =>
      (old || []).map((t) => t.id === taskId ? { ...t, status: newStatus } : t)
    );

    try {
      await updateStatusMutation.mutateAsync({ taskId, status: newStatus });
    } catch {
      if (previous) queryClient.setQueryData(['my-tasks'], previous);
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
        <Header title="My Assigned Tasks" />

        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
            <div>
              <h2 className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>
                Assigned to Me
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} across your active projects
              </p>
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
                  placeholder="Search my tasks…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm outline-none w-36 sm:w-48"
                />
              </div>

              {/* Priority Filter */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  color: 'var(--text-muted)',
                }}
              >
                <Filter size={14} />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold outline-none cursor-pointer border-0 p-0 m-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <option value="ALL">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
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
                Syncing your tasks…
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
                  {error.response?.data?.detail || 'An error occurred while loading your tasks.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-2 min-h-0">
              {COLUMNS.map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.id);
                return (
                  <div
                    key={col.id}
                    className="flex flex-col rounded-2xl min-w-[240px] min-h-0 kanban-column"
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
                        className="column-count-badge text-xs font-bold px-2 py-0.5 rounded-lg"
                        style={{
                          background: `${col.accent}15`,
                          color: col.accent,
                          border: `1px solid ${col.accent}25`,
                        }}
                      >
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Column Area */}
                    <div
                      className="flex-1 overflow-y-auto p-3 space-y-3 transition-colors duration-200"
                      style={{ minHeight: '120px' }}
                    >
                      {colTasks.length === 0 ? (
                        <div className="kanban-empty-state">
                          <span className="text-xs font-medium">No tasks</span>
                        </div>
                      ) : (
                        colTasks.map((task) => {
                          const taskProject = projectMap[task.project_id];
                          return (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onClick={() => setSelectedTask(task)}
                              currentUser={currentUser}
                              project={taskProject}
                              projectName={taskProject?.name}
                              projectMembers={
                                users.filter((u) =>
                                  u.id === taskProject?.lead_developer_id ||
                                  (taskProject?.developer_ids && taskProject.developer_ids.includes(u.id))
                                )
                              }
                              onAssign={(assignedToId) =>
                                updateTaskMutation.mutate({
                                  taskId: task.id,
                                  payload: { assigned_to_id: assignedToId || null }
                                })
                              }
                              onStatusChange={handleStatusChange}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          currentUser={currentUser}
          project={projectMap[selectedTask.project_id]}
          projectMembers={
            users.filter((u) =>
              u.id === projectMap[selectedTask.project_id]?.lead_developer_id ||
              (projectMap[selectedTask.project_id]?.developer_ids && projectMap[selectedTask.project_id].developer_ids.includes(u.id))
            )
          }
          onAssign={async (assignedToId) => {
            await updateTaskMutation.mutateAsync({
              taskId: selectedTask.id,
              payload: { assigned_to_id: assignedToId || null }
            });
            const member = users.find(u => u.id === assignedToId);
            setSelectedTask(prev => ({
              ...prev,
              assigned_to_id: assignedToId,
              assigned_to: member || null
            }));
          }}
        />
      )}
    </div>
  );
}
