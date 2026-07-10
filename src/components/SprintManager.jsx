import React, { useState } from 'react';
import { FastForward, Calendar, Edit3, Save, CheckCircle2, Play } from 'lucide-react';

export default function SprintManager({ project, canEdit, updateProjectMutation, tasks }) {
  const sprints = project?.sprints || [];
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newCapacity, setNewCapacity] = useState('');

  const handleCreateSprint = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    const newSprint = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTitle.trim(),
      goal: newGoal.trim(),
      start_date: newStart || null,
      end_date: newEnd || null,
      status: 'PLANNING',
      capacity_hours: parseFloat(newCapacity) || 0
    };
    
    const updatedSprints = [...sprints, newSprint];
    updateProjectMutation.mutate({ sprints: updatedSprints });
    
    setNewTitle(''); setNewGoal(''); setNewStart(''); setNewEnd(''); setNewCapacity('');
    setIsCreating(false);
  };

  const handleUpdateSprintStatus = (sprintId, status) => {
    const updatedSprints = sprints.map(s => s.id === sprintId ? { ...s, status } : s);
    updateProjectMutation.mutate({ sprints: updatedSprints });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <FastForward size={16} className="text-purple-500" /> Sprints
        </h3>
        {canEdit && !isCreating && (
          <button onClick={() => setIsCreating(true)} className="btn-primary text-xs py-1.5 px-3">
            Plan New Sprint
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleCreateSprint} className="p-4 rounded-xl border space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Sprint Title (e.g. Sprint 1)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="glass-input text-xs px-3 py-2 rounded-lg" required />
            <input type="number" placeholder="Capacity (Hours)" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} className="glass-input text-xs px-3 py-2 rounded-lg" />
            <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="glass-input text-xs px-3 py-2 rounded-lg" title="Start Date" />
            <input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="glass-input text-xs px-3 py-2 rounded-lg" title="End Date" />
          </div>
          <input type="text" placeholder="Sprint Goal" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} className="glass-input text-xs px-3 py-2 rounded-lg w-full" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
            <button type="submit" className="btn-primary text-xs py-1.5 px-3">Create Sprint</button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto space-y-4">
        {sprints.length === 0 ? (
          <div className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>No sprints planned yet.</div>
        ) : (
          sprints.map(sprint => {
            const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
            const doneTasks = sprintTasks.filter(t => t.status === 'DONE');
            const progress = sprintTasks.length > 0 ? (doneTasks.length / sprintTasks.length) * 100 : 0;
            const effort = sprintTasks.reduce((acc, t) => acc + (t.estimated_hours || 0), 0);

            return (
              <div key={sprint.id} className="p-4 rounded-xl border flex flex-col gap-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                      {sprint.title}
                      <span className={`text-[10px] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider ${
                        sprint.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        sprint.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                      }`}>
                        {sprint.status}
                      </span>
                    </h4>
                    {sprint.goal && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sprint.goal}</p>}
                    <div className="flex items-center gap-4 mt-2 text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {sprint.start_date || '?'} to {sprint.end_date || '?'}</span>
                      <span>Total Effort: {effort}h / {sprint.capacity_hours}h</span>
                      <span>{sprintTasks.length} Tickets</span>
                    </div>
                  </div>
                  
                  {canEdit && sprint.status === 'PLANNING' && (
                    <button onClick={() => handleUpdateSprintStatus(sprint.id, 'ACTIVE')} className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1">
                      <Play size={12} /> Start
                    </button>
                  )}
                  {canEdit && sprint.status === 'ACTIVE' && (
                    <button onClick={() => handleUpdateSprintStatus(sprint.id, 'COMPLETED')} className="bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold py-1 px-2.5 flex items-center gap-1 transition-colors">
                      <CheckCircle2 size={12} /> Complete
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-black/10 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
