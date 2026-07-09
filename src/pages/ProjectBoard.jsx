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
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Loader, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-indigo-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-amber-500' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-cyan-500' },
  { id: 'DONE', title: 'Done', color: 'bg-emerald-500' }
];

export default function ProjectBoard() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Find active project details
  const currentProject = STATIC_PROJECTS.find((p) => p.id === projectId) || {
    id: projectId,
    name: 'Unknown Project',
    desc: 'Custom project workspace'
  };

  // Fetch tasks
  const { data: tasks = [], isLoading, isError, error } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.getTasks(projectId),
  });

  // Patch status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksApi.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  // Handle Drag & Drop
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Check if item was dropped in the same spot
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId; // 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'

    // Optimistic Update
    const previousTasks = queryClient.getQueryData(['tasks', projectId]);
    queryClient.setQueryData(['tasks', projectId], (oldTasks) => {
      if (!oldTasks) return [];
      return oldTasks.map((task) =>
        task.id === draggableId ? { ...task, status: newStatus } : task
      );
    });

    try {
      await updateStatusMutation.mutateAsync({ taskId: draggableId, status: newStatus });
    } catch (err) {
      // Revert if error
      if (previousTasks) {
        queryClient.setQueryData(['tasks', projectId], previousTasks);
      }
    }
  };

  // Filter and search tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="flex h-screen bg-brand-bg text-brand-text overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={currentProject.name} />

        {/* Dashboard inner */}
        <div className="flex-1 flex flex-col p-8 space-y-6 overflow-hidden">
          {/* Top Bar with back link & actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link to="/" className="text-brand-textMuted hover:text-white transition-colors">
                  <ArrowLeft size={16} />
                </Link>
                <h2 className="text-xl font-bold text-white tracking-wide">{currentProject.name}</h2>
              </div>
              <p className="text-xs text-brand-textMuted">{currentProject.desc}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textMuted" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-primary w-48 sm:w-60 transition-all"
                />
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                <Filter size={14} className="text-brand-textMuted" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-brand-bg text-white">All Priority</option>
                  <option value="LOW" className="bg-brand-bg text-white">LOW</option>
                  <option value="MEDIUM" className="bg-brand-bg text-white">MEDIUM</option>
                  <option value="HIGH" className="bg-brand-bg text-white">HIGH</option>
                  <option value="CRITICAL" className="bg-brand-bg text-white">CRITICAL</option>
                </select>
              </div>

              {/* Add Ticket Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-brand-primaryHover hover:to-indigo-700 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-glow-primary hover:shadow-glow-secondary transition-all"
              >
                <Plus size={16} />
                Add Issue
              </button>
            </div>
          </div>

          {/* Kanban Board Container */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader size={36} className="text-brand-primary animate-spin" />
              <p className="text-sm text-brand-textMuted font-medium">Syncing MongoDB tasks...</p>
            </div>
          ) : isError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <AlertCircle size={40} className="text-red-500" />
              <h4 className="text-lg font-bold text-white">Failed to retrieve tasks</h4>
              <p className="text-sm text-brand-textMuted max-w-md">
                {error.response?.data?.detail || 'Make sure the FastAPI backend is running locally at port 8000.'}
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
                {COLUMNS.map((col) => {
                  const columnTasks = filteredTasks.filter((t) => t.status === col.id);

                  return (
                    <div 
                      key={col.id}
                      className="glassmorphism rounded-xl border border-white/5 flex flex-col max-h-full min-w-[250px]"
                    >
                      {/* Column Header */}
                      <div className="p-4 flex items-center justify-between border-b border-white/5 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                          <span className="text-sm font-semibold text-white tracking-wide">{col.title}</span>
                        </div>
                        <span className="bg-white/5 text-[10px] text-brand-textMuted border border-white/10 px-2 py-0.5 rounded-full font-bold">
                          {columnTasks.length}
                        </span>
                      </div>

                      {/* Column Body Droppable Area */}
                      <Droppable droppableId={col.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors duration-200 ${
                              snapshot.isDraggingOver ? 'bg-white/[0.02]' : ''
                            }`}
                          >
                            {columnTasks.length === 0 ? (
                              <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-xl">
                                <HelpCircle size={20} className="text-brand-textMuted/40 mb-1.5" />
                                <span className="text-[11px] text-brand-textMuted/50 font-medium">Empty Column</span>
                              </div>
                            ) : (
                              columnTasks.map((task, idx) => (
                                <TaskCard 
                                  key={task.id} 
                                  task={task} 
                                  index={idx}
                                />
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

      {/* Ticket Modal */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultProjectId={projectId}
      />
    </div>
  );
}
