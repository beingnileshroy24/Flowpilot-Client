import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity';
import { projectsApi } from '../api/projects';
import { usersApi } from '../api/users';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
  Search,
  Filter,
  Calendar,
  Folder,
  Terminal,
  RefreshCw,
  LogOut,
  LogIn,
  PlusCircle,
  CheckCircle2,
  Trash2,
  Edit,
  UserPlus,
  Download,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  User as UserIcon
} from 'lucide-react';

const ACTION_METADATA = {
  user_login: { label: 'User Login', icon: LogIn, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  user_logout: { label: 'User Logout', icon: LogOut, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  user_registered: { label: 'User Registered', icon: UserPlus, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  project_created: { label: 'Project Created', icon: PlusCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  project_updated: { label: 'Project Updated', icon: Edit, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  project_deleted: { label: 'Project Deleted', icon: Trash2, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  task_created: { label: 'Task Created', icon: PlusCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  task_updated: { label: 'Task Updated', icon: Edit, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  task_deleted: { label: 'Task Deleted', icon: Trash2, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  status_change: { label: 'Status Changed', icon: CheckCircle2, color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
  comment_added: { label: 'Comment Added', icon: Terminal, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  default: { label: 'System Action', icon: Terminal, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' }
};

export default function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedActor, setSelectedActor] = useState('ALL');
  
  // Advanced search states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Query global activity logs from the backend with server-side filters
  const { data: logs = [], isLoading: isLoadingLogs, refetch } = useQuery({
    queryKey: ['globalActivityLogs', selectedAction, selectedProject, selectedActor, startDate, endDate, searchTerm],
    queryFn: () => activityApi.getAllActivity({
      limit: 250,
      action: selectedAction !== 'ALL' ? selectedAction : undefined,
      project_id: selectedProject !== 'ALL' ? selectedProject : undefined,
      user_id: selectedActor !== 'ALL' ? selectedActor : undefined,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
      query: searchTerm || undefined
    }),
  });

  // Query projects for filter list and mapping names
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  // Query users to populate the Actor dropdown list
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.listUsers,
  });

  const isLoading = isLoadingLogs || isLoadingProjects || isLoadingUsers;

  // Create project ID -> name map
  const projectMap = projects.reduce((acc, p) => {
    acc[p.id] = p.name;
    return acc;
  }, {});

  // Extract unique actions list for the filter select
  const uniqueActions = ['ALL', ...new Set(logs.map(log => log.action))];

  // Perform client-side category logic on server-filtered results
  const filteredLogs = logs.filter(log => {
    let matchesCategory = true;
    if (selectedCategory !== 'ALL') {
      if (selectedCategory === 'AUTH') {
        matchesCategory = ['user_login', 'user_logout', 'user_registered'].includes(log.action);
      } else if (selectedCategory === 'PROJECT') {
        matchesCategory = ['project_created', 'project_updated', 'project_deleted'].includes(log.action);
      } else if (selectedCategory === 'TASK') {
        matchesCategory = ['task_created', 'task_updated', 'task_deleted', 'status_change', 'comment_added'].includes(log.action);
      }
    }
    return matchesCategory;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedAction('ALL');
    setSelectedProject('ALL');
    setSelectedActor('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('ALL');
  };

  // CSV download helper
  const handleDownloadCSV = () => {
    const headers = ['Timestamp', 'Event', 'Actor Name', 'Actor ID', 'Detail', 'Scope/Project'];
    const rows = filteredLogs.map(log => [
      `"${new Date(log.created_at).toLocaleString()}"`,
      `"${ACTION_METADATA[log.action]?.label || log.action}"`,
      `"${log.user_name}"`,
      `"${log.user_id}"`,
      `"${log.detail.replace(/"/g, '""')}"`, // escape quotes
      `"${log.project_id ? (projectMap[log.project_id] || 'Unknown Project') : 'Global'}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `flowpilot_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadMenu(false);
  };

  // JSON download helper
  const handleDownloadJSON = () => {
    const jsonLogs = filteredLogs.map(log => ({
      id: log.id,
      timestamp: log.created_at,
      action: log.action,
      actionLabel: ACTION_METADATA[log.action]?.label || log.action,
      actor: { id: log.user_id, name: log.user_name },
      detail: log.detail,
      project: log.project_id ? { id: log.project_id, name: projectMap[log.project_id] || 'Unknown Project' } : 'Global'
    }));

    const blob = new Blob([JSON.stringify(jsonLogs, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `flowpilot_activity_logs_${new Date().toISOString().slice(0, 10)}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadMenu(false);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title="System Activity Logs" />

        <main className="flex-1 overflow-hidden p-6 lg:p-8 flex flex-col space-y-6">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                System Activity Logs
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Audit trail of user logins, logouts, user signups, and project modifications.
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 relative">
              <button
                onClick={() => refetch()}
                className="btn-secondary flex items-center gap-2 text-xs py-2 px-3"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>

              {/* Download Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="btn-primary flex items-center gap-2 text-xs py-2 px-3"
                >
                  <Download size={14} />
                  Export Logs
                  <ChevronDown size={12} />
                </button>
                {showDownloadMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-40 rounded-xl shadow-lg py-1 z-20 border border-[var(--border)]"
                    style={{ background: 'var(--surface-solid)' }}
                  >
                    <button
                      onClick={handleDownloadCSV}
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                      style={{ color: 'var(--text)' }}
                    >
                      <Download size={12} className="text-green-500" /> Export as CSV
                    </button>
                    <button
                      onClick={handleDownloadJSON}
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                      style={{ color: 'var(--text)' }}
                    >
                      <Download size={12} className="text-blue-500" /> Export as JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div 
            className="p-4 rounded-2xl flex flex-col gap-4"
            style={{ 
              background: 'var(--surface)', 
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search user, action details..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-blue-500 outline-none"
                  style={{ color: 'var(--text)' }}
                />
              </div>

              {/* Action Filter */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border px-3 py-1.5 rounded-xl">
                  <Filter size={13} style={{ color: 'var(--text-muted)' }} />
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
                    style={{ color: 'var(--text)' }}
                  >
                    <option value="ALL" className="bg-[var(--surface)]">All Actions</option>
                    {uniqueActions.filter(a => a !== 'ALL').map(action => (
                      <option key={action} value={action} className="bg-[var(--surface)]">
                        {ACTION_METADATA[action]?.label || action}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Advanced Search Toggle */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ 
                    color: showAdvanced ? 'var(--blue)' : 'var(--text)', 
                    borderColor: showAdvanced ? 'var(--blue)' : 'var(--border)' 
                  }}
                >
                  <SlidersHorizontal size={13} />
                  Advanced Search
                  {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            </div>

            {/* Advanced Filters Expandable Section */}
            {showAdvanced && (
              <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-5 gap-4" style={{ borderColor: 'var(--border)' }}>
                
                {/* Actor (User) Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Actor (User)</label>
                  <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border px-3 py-2 rounded-xl">
                    <UserIcon size={13} style={{ color: 'var(--text-muted)' }} />
                    <select
                      value={selectedActor}
                      onChange={(e) => setSelectedActor(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold w-full focus:outline-none cursor-pointer"
                      style={{ color: 'var(--text)' }}
                    >
                      <option value="ALL" className="bg-[var(--surface)]">All Actors</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id} className="bg-[var(--surface)]">
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Project Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Project Scope</label>
                  <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border px-3 py-2 rounded-xl">
                    <Folder size={13} style={{ color: 'var(--text-muted)' }} />
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold w-full focus:outline-none cursor-pointer"
                      style={{ color: 'var(--text)' }}
                    >
                      <option value="ALL" className="bg-[var(--surface)]">All Projects</option>
                      {projects.map(proj => (
                        <option key={proj.id} value={proj.id} className="bg-[var(--surface)]">
                          {proj.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Category</label>
                  <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border px-3 py-2 rounded-xl">
                    <SlidersHorizontal size={13} style={{ color: 'var(--text-muted)' }} />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold w-full focus:outline-none cursor-pointer"
                      style={{ color: 'var(--text)' }}
                    >
                      <option value="ALL" className="bg-[var(--surface)]">All Categories</option>
                      <option value="AUTH" className="bg-[var(--surface)]">Authentications</option>
                      <option value="PROJECT" className="bg-[var(--surface)]">Projects Audit</option>
                      <option value="TASK" className="bg-[var(--surface)]">Tasks &amp; Board</option>
                    </select>
                  </div>
                </div>

                {/* Date Picker Start */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Start Date</label>
                  <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border px-3 py-2 rounded-xl">
                    <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold w-full focus:outline-none cursor-pointer text-[var(--text)]"
                    />
                  </div>
                </div>

                {/* Date Picker End */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">End Date</label>
                  <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border px-3 py-2 rounded-xl">
                    <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold w-full focus:outline-none cursor-pointer text-[var(--text)]"
                    />
                  </div>
                </div>

                {/* Reset Filters Option */}
                <div className="md:col-span-5 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/25 transition-all"
                  >
                    <Trash2 size={13} />
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Activity Logs Table */}
          <div 
            className="flex-1 overflow-hidden rounded-2xl flex flex-col"
            style={{ 
              background: 'var(--surface)', 
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Event</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Actor</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Detail</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Scope</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {filteredLogs.map((log) => {
                    const actionMeta = ACTION_METADATA[log.action] || ACTION_METADATA.default;
                    const ActionIcon = actionMeta.icon;

                    return (
                      <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        {/* Event Name */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center" 
                              style={{ background: actionMeta.bg, color: actionMeta.color }}
                            >
                              <ActionIcon size={14} />
                            </div>
                            <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                              {actionMeta.label}
                            </span>
                          </div>
                        </td>

                        {/* Actor User */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                              style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}
                            >
                              {log.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                                {log.user_name}
                              </span>
                              <span className="text-[9px] text-gray-500 font-mono">ID: {log.user_id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Action Detail */}
                        <td className="p-4">
                          <p className="text-xs max-w-lg leading-relaxed" style={{ color: 'var(--text)' }}>
                            {log.detail}
                          </p>
                        </td>

                        {/* Project / Scope */}
                        <td className="p-4 whitespace-nowrap">
                          {log.project_id ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text)' }}>
                              <Folder size={12} className="text-amber-500" />
                              <span>{projectMap[log.project_id] || 'Unknown Project'}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              Global Portal
                            </span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <Calendar size={12} />
                            <span>
                              {new Date(log.created_at).toLocaleString(undefined, { 
                                dateStyle: 'short', 
                                timeStyle: 'short' 
                              })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>
                        {isLoading ? 'Loading activity logs...' : 'No activity logs found matching the filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
