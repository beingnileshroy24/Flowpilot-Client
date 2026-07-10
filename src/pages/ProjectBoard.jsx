import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import { usersApi } from '../api/users';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TaskCard from '../components/TaskCard';
import EditProjectModal from '../components/EditProjectModal';
import TicketModal from '../components/TicketModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { 
  Plus, Search, Filter, ArrowLeft, BookOpen,
  Code, Milestone as MilestoneIcon, FileText, GitBranch, Server, 
  Trash2, Edit3, Save, Calendar, X, Settings
} from 'lucide-react';

const COLUMNS = [
  { id: 'TODO',        title: 'Backlog',     accent: '#94a3b8' },
  { id: 'IN_PROGRESS', title: 'In Progress', accent: '#f59e0b' },
  { id: 'IN_REVIEW',   title: 'In Review',   accent: '#3b82f6' },
  { id: 'DONE',        title: 'Done',        accent: '#22c55e' },
];

export default function ProjectBoard() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('planning'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const currentUser = useSelector((state) => state.auth.user);

  const [isEditingReqs, setIsEditingReqs] = useState(false);
  const [reqsText, setReqsText] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [newReleaseVersion, setNewReleaseVersion] = useState('');
  const [newReleaseDate, setNewReleaseDate] = useState('');
  const [newReleaseStatus, setNewReleaseStatus] = useState('DRAFT');
  const [newReleaseNotes, setNewReleaseNotes] = useState('');
  const [envGithubFront, setEnvGithubFront] = useState('');
  const [envGithubBack, setEnvGithubBack] = useState('');
  const [envTestServer, setEnvTestServer] = useState('');
  const [envProdServer, setEnvProdServer] = useState('');
  const [envTestMongo, setEnvTestMongo] = useState('');
  const [envProdMongo, setEnvProdMongo] = useState('');
  const [isEditingRetro, setIsEditingRetro] = useState(false);
  const [retroText, setRetroText] = useState('');

  const { data: currentProject = { name: 'Project Workspace', desc: '' } } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const data = await projectsApi.getProject(projectId);
      setReqsText(data.requirements || '');
      setRetroText(data.retrospective || '');
      setEnvGithubFront(data.github_frontend || '');
      setEnvGithubBack(data.github_backend || '');
      setEnvTestServer(data.test_server || '');
      setEnvProdServer(data.prod_server || '');
      setEnvTestMongo(data.test_mongodb_url || '');
      setEnvProdMongo(data.prod_mongodb_url || '');
      return data;
    },
    enabled: !!projectId,
  });

  const canEditProject =
    currentUser?.role === 'MANAGER' ||
    currentUser?.role === 'ADMIN' ||
    currentProject?.owner_id === currentUser?.id ||
    currentProject?.lead_developer_id === currentUser?.id;

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.getTasks(projectId),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.listUsers,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksApi.updateTaskStatus(taskId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }) => tasksApi.updateTaskDetails(taskId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const updateProjectMutation = useMutation({
    mutationFn: (payload) => projectsApi.updateProject({ projectId, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const projectMembers = users.filter((u) =>
    u.id === currentProject?.lead_developer_id ||
    (currentProject?.developer_ids && currentProject.developer_ids.includes(u.id))
  );

  const handleStatusChange = async (taskId, newStatus) => {
    const previous = queryClient.getQueryData(['tasks', projectId]);
    queryClient.setQueryData(['tasks', projectId], (old) =>
      (old || []).map((t) => t.id === taskId ? { ...t, status: newStatus } : t)
    );
    try {
      await updateStatusMutation.mutateAsync({ taskId, status: newStatus });
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

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      const updatedStack = [...(currentProject.tech_stack || []), newTag.trim()];
      updateProjectMutation.mutate({ tech_stack: updatedStack });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedStack = (currentProject.tech_stack || []).filter(t => t !== tagToRemove);
    updateProjectMutation.mutate({ tech_stack: updatedStack });
  };

  const handleSaveReqs = () => {
    updateProjectMutation.mutate({ requirements: reqsText });
    setIsEditingReqs(false);
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    const newMilestone = {
      id: Math.random().toString(36).substring(2, 9),
      title: newMilestoneTitle.trim(),
      description: newMilestoneDesc.trim(),
      due_date: newMilestoneDate || null,
      status: 'PLANNED'
    };
    const updatedMilestones = [...(currentProject.milestones || []), newMilestone];
    updateProjectMutation.mutate({ milestones: updatedMilestones });
    setNewMilestoneTitle('');
    setNewMilestoneDesc('');
    setNewMilestoneDate('');
  };

  const handleUpdateMilestoneStatus = (milestoneId, newStatus) => {
    const updatedMilestones = (currentProject.milestones || []).map(m => 
      m.id === milestoneId ? { ...m, status: newStatus } : m
    );
    updateProjectMutation.mutate({ milestones: updatedMilestones });
  };

  const handleDeleteMilestone = (milestoneId) => {
    const updatedMilestones = (currentProject.milestones || []).filter(m => m.id !== milestoneId);
    updateProjectMutation.mutate({ milestones: updatedMilestones });
  };

  const handleAddRelease = (e) => {
    e.preventDefault();
    if (!newReleaseVersion.trim()) return;
    const newRelease = {
      id: Math.random().toString(36).substring(2, 9),
      version: newReleaseVersion.trim(),
      release_date: newReleaseDate || null,
      status: newReleaseStatus,
      notes: newReleaseNotes.trim()
    };
    const updatedReleases = [...(currentProject.releases || []), newRelease];
    updateProjectMutation.mutate({ releases: updatedReleases });
    setNewReleaseVersion('');
    setNewReleaseDate('');
    setNewReleaseStatus('DRAFT');
    setNewReleaseNotes('');
  };

  const handleDeleteRelease = (releaseId) => {
    const updatedReleases = (currentProject.releases || []).filter(r => r.id !== releaseId);
    updateProjectMutation.mutate({ releases: updatedReleases });
  };

  const handleUpdateReleaseStatus = (releaseId, newStatus) => {
    const updatedReleases = (currentProject.releases || []).map(r => 
      r.id === releaseId ? { ...r, status: newStatus } : r
    );
    updateProjectMutation.mutate({ releases: updatedReleases });
  };

  const handleSaveEnvironments = () => {
    updateProjectMutation.mutate({
      github_frontend: envGithubFront,
      github_backend: envGithubBack,
      test_server: envTestServer,
      prod_server: envProdServer,
      test_mongodb_url: envTestMongo,
      prod_mongodb_url: envProdMongo
    });
  };

  const handleSaveRetro = () => {
    updateProjectMutation.mutate({ retrospective: retroText });
    setIsEditingRetro(false);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={`${currentProject.name} Workspace`} />
        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <Link to="/" className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', boxShadow: 'var(--shadow-sm)' }}>
                <ArrowLeft size={16} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--text)' }}>{currentProject.name}</h2>
                  {canEditProject && (
                    <button
                      onClick={() => setIsEditProjectModalOpen(true)}
                      className="p-1 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                      title="Configure project settings & team assignment"
                    >
                      <Settings size={15} />
                    </button>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Workspace Home &bull; {projectMembers.length} Developer{projectMembers.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)' }}>
              {[
                { id: 'planning', label: 'Planning & Scope', icon: FileText },
                { id: 'tasks', label: 'Tasks Board', icon: MilestoneIcon },
                { id: 'releases', label: 'Releases & Builds', icon: GitBranch },
                { id: 'retro', label: 'Retrospective', icon: BookOpen }
              ].map(tab => {
                const IconComp = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150" style={{ background: active ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent', color: active ? '#0f172a' : 'var(--text-muted)', boxShadow: active ? '0 2px 8px rgba(245,158,11,0.30)' : 'none' }}>
                    <IconComp size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto pb-4">
            {activeTab === 'planning' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="p-5 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}><Code size={16} className="text-amber-500" /> Tech Stack</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(currentProject.tech_stack || []).map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--yellow)', border: '1px solid rgba(245,158,11,0.2)' }}>
                          {tag}
                          {canEditProject && (<button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500"><X size={12} /></button>)}
                        </span>
                      ))}
                    </div>
                    {canEditProject && <input type="text" placeholder="Add technology (Press Enter)..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={handleAddTag} className="glass-input text-xs w-full max-w-xs px-3 py-2 rounded-lg" />}
                  </div>
                  <div className="p-5 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                      <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text)' }}><FileText size={16} className="text-blue-500" /> Requirements & Scope</h3>
                      {canEditProject && <button onClick={() => isEditingReqs ? handleSaveReqs() : setIsEditingReqs(true)} className="btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">{isEditingReqs ? <Save size={12} /> : <Edit3 size={12} />} {isEditingReqs ? 'Save' : 'Edit'}</button>}
                    </div>
                    {isEditingReqs ? <textarea value={reqsText} onChange={(e) => setReqsText(e.target.value)} rows={10} className="w-full text-sm p-3 rounded-lg border focus:outline-none" style={{ background: 'var(--surface-solid)', color: 'var(--text)', borderColor: 'var(--border)' }} /> : <div className="text-sm leading-relaxed whitespace-pre-wrap min-h-[160px]" style={{ color: 'var(--text)' }}>{currentProject.requirements || <p className="italic" style={{ color: 'var(--text-muted)' }}>No requirements defined.</p>}</div>}
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="p-5 rounded-2xl border flex-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}><MilestoneIcon size={16} className="text-purple-500" /> Milestones</h3>
                    {canEditProject && (
                      <form onSubmit={handleAddMilestone} className="mb-5 p-3.5 rounded-xl flex flex-col gap-2.5 border" style={{ background: 'var(--surface-solid)', borderColor: 'var(--border)' }}>
                        <input type="text" placeholder="Title..." value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)} className="glass-input text-xs px-2.5 py-1.5 rounded-lg w-full" required />
                        <input type="date" value={newMilestoneDate} onChange={(e) => setNewMilestoneDate(e.target.value)} className="glass-input text-xs px-2.5 py-1.5 rounded-lg w-full" />
                        <button type="submit" className="btn-primary text-xs w-full py-1.5">Create</button>
                      </form>
                    )}
                    <div className="space-y-3">
                      {(currentProject.milestones || []).map(milestone => (
                        <div key={milestone.id} className="p-3.5 rounded-xl border flex flex-col gap-2" style={{ background: 'var(--surface-solid)', borderColor: 'var(--border)' }}>
                          <div className="flex justify-between items-center"><h5 className="text-xs font-bold">{milestone.title}</h5>{canEditProject && <button onClick={() => handleDeleteMilestone(milestone.id)}><Trash2 size={12} className="text-red-500" /></button>}</div>
                          <select value={milestone.status} onChange={(e) => handleUpdateMilestoneStatus(milestone.id, e.target.value)} className="text-[10px] bg-transparent border rounded p-1">
                            <option value="PLANNED">Planned</option><option value="IN_PROGRESS">WIP</option><option value="COMPLETED">Completed</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'tasks' && (
              <div className="flex flex-col gap-4 h-full animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-solid)] p-3 rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <Search size={13} /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent outline-none w-32" />
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs py-1.5 flex items-center gap-1"><Plus size={13} /> New Ticket</button>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto">
                  {COLUMNS.map((col) => {
                    const colTasks = filteredTasks.filter((t) => t.status === col.id);
                    return (
                      <div key={col.id} className="flex flex-col rounded-2xl min-w-[230px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}><span className="text-xs font-bold" style={{ color: col.accent }}>{col.title}</span></div>
                        <div className="flex-1 p-2.5 space-y-2.5">
                          {colTasks.map((task) => <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} currentUser={currentUser} project={currentProject} projectMembers={projectMembers} onAssign={(a) => updateTaskMutation.mutate({ taskId: task.id, payload: { assigned_to_id: a } })} onStatusChange={handleStatusChange} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {activeTab === 'releases' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="lg:col-span-1 p-5 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Server size={16} /> Environments</h3>
                  <div className="space-y-3 text-xs">
                    <input type="text" placeholder="Staging URL" value={envTestServer} onChange={(e) => setEnvTestServer(e.target.value)} className="w-full p-2 rounded border bg-transparent" />
                    <input type="text" placeholder="Prod URL" value={envProdServer} onChange={(e) => setEnvProdServer(e.target.value)} className="w-full p-2 rounded border bg-transparent" />
                    <button onClick={handleSaveEnvironments} className="btn-primary w-full py-1.5">Save Config</button>
                  </div>
                </div>
                <div className="lg:col-span-2 p-5 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                   {canEditProject && (
                      <form onSubmit={handleAddRelease} className="mb-6 p-4 rounded-xl border flex flex-col gap-3" style={{ background: 'var(--surface-solid)', borderColor: 'var(--border)' }}>
                        <input type="text" placeholder="Version..." value={newReleaseVersion} onChange={(e) => setNewReleaseVersion(e.target.value)} className="glass-input text-xs px-2.5 py-1.5 rounded-lg" required />
                        <button type="submit" className="btn-primary text-xs py-1.5">Add Release</button>
                      </form>
                   )}
                   <div className="space-y-4">
                     {(currentProject.releases || []).map(r => (
                       <div key={r.id} className="p-4 rounded-xl border" style={{ background: 'var(--surface-solid)', borderColor: 'var(--border)' }}>
                         <div className="flex justify-between text-xs font-bold text-amber-500">{r.version} {canEditProject && <button onClick={() => handleDeleteRelease(r.id)}><Trash2 size={12} /></button>}</div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}
            {activeTab === 'retro' && (
              <div className="max-w-3xl mx-auto p-6 rounded-2xl border animate-fade-in" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex justify-between mb-4 border-b pb-3">
                  <h3 className="text-base font-bold flex items-center gap-2"><BookOpen size={18} /> Retrospective</h3>
                  {canEditProject && <button onClick={() => isEditingRetro ? handleSaveRetro() : setIsEditingRetro(true)} className="btn-secondary text-xs px-3 py-1">{isEditingRetro ? 'Save' : 'Edit'}</button>}
                </div>
                {isEditingRetro ? <textarea value={retroText} onChange={(e) => setRetroText(e.target.value)} rows={12} className="w-full p-4 rounded-xl border" /> : <div className="text-sm whitespace-pre-wrap">{currentProject.retrospective || "No entries yet."}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
      <TicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultProjectId={projectId} />
      <EditProjectModal isOpen={isEditProjectModalOpen} onClose={() => setIsEditProjectModalOpen(false)} project={currentProject} />
      <TaskDetailModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} currentUser={currentUser} project={currentProject} projectMembers={projectMembers} onAssign={async (a) => { await updateTaskMutation.mutateAsync({ taskId: selectedTask.id, payload: { assigned_to_id: a } }); setSelectedTask(p => ({ ...p, assigned_to_id: a })); }} />
    </div>
  );
}
