import React, { useState } from 'react';
import { FileText, Save, Edit3, Check, X, ShieldAlert } from 'lucide-react';

const STATUS_COLORS = {
  PROPOSED: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
  ACCEPTED: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', border: 'rgba(34,197,94,0.2)' },
  SUPERSEDED: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  DEPRECATED: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' }
};

export default function DecisionLog({ project, canEdit, updateProjectMutation }) {
  const decisions = project?.decisions || [];
  const [isCreating, setIsCreating] = useState(false);
  const [newDecision, setNewDecision] = useState({ title: '', context: '', decision: '', alternatives: '', status: 'PROPOSED' });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newDecision.title.trim()) return;
    const entry = {
      ...newDecision,
      id: Math.random().toString(36).substring(2, 9),
      decided_date: new Date().toISOString()
    };
    updateProjectMutation.mutate({ decisions: [entry, ...decisions] });
    setNewDecision({ title: '', context: '', decision: '', alternatives: '', status: 'PROPOSED' });
    setIsCreating(false);
  };

  const handleUpdateStatus = (id, status) => {
    const updated = decisions.map(d => d.id === id ? { ...d, status } : d);
    updateProjectMutation.mutate({ decisions: updated });
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Decision Journal</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Architectural and product decisions log.</p>
        </div>
        {canEdit && !isCreating && (
          <button onClick={() => setIsCreating(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <Edit3 size={14} /> Log Decision
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {isCreating && (
          <form onSubmit={handleCreate} className="p-5 rounded-2xl border space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex gap-4">
              <input type="text" placeholder="Decision Title" value={newDecision.title} onChange={e => setNewDecision({...newDecision, title: e.target.value})} className="glass-input flex-1 text-sm font-bold px-3 py-2 rounded-lg" required />
              <select value={newDecision.status} onChange={e => setNewDecision({...newDecision, status: e.target.value})} className="glass-input text-xs px-3 py-2 rounded-lg font-bold cursor-pointer">
                <option value="PROPOSED">Proposed</option>
                <option value="ACCEPTED">Accepted</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Context & Problem</label>
                <textarea rows={2} value={newDecision.context} onChange={e => setNewDecision({...newDecision, context: e.target.value})} className="glass-input w-full text-xs p-2.5 rounded-lg" placeholder="Why are we making this decision?" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Decision Made</label>
                <textarea rows={2} value={newDecision.decision} onChange={e => setNewDecision({...newDecision, decision: e.target.value})} className="glass-input w-full text-xs p-2.5 rounded-lg" placeholder="What did we decide to do?" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Alternatives Considered</label>
                <textarea rows={2} value={newDecision.alternatives} onChange={e => setNewDecision({...newDecision, alternatives: e.target.value})} className="glass-input w-full text-xs p-2.5 rounded-lg" placeholder="What else did we think about?" />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary text-xs px-4 py-1.5">Cancel</button>
              <button type="submit" className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1"><Save size={14}/> Save Log</button>
            </div>
          </form>
        )}

        {decisions.length === 0 && !isCreating ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--border)' }}>
            <ShieldAlert size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>No decisions logged yet.</p>
          </div>
        ) : (
          decisions.map(d => {
            const style = STATUS_COLORS[d.status];
            return (
              <div key={d.id} className="p-5 rounded-2xl border transition-all hover:scale-[1.01]" style={{ background: 'var(--surface-solid)', borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>{d.title}</h3>
                    <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{new Date(d.decided_date).toLocaleDateString()}</p>
                  </div>
                  {canEdit ? (
                    <select 
                      value={d.status} 
                      onChange={e => handleUpdateStatus(d.id, e.target.value)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg outline-none cursor-pointer"
                      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
                    >
                      <option value="PROPOSED">PROPOSED</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="SUPERSEDED">SUPERSEDED</option>
                      <option value="DEPRECATED">DEPRECATED</option>
                    </select>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                      {d.status}
                    </span>
                  )}
                </div>
                
                <div className="space-y-4 text-xs">
                  {d.context && (
                    <div>
                      <h4 className="font-bold mb-1" style={{ color: 'var(--text)' }}>Context:</h4>
                      <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>{d.context}</p>
                    </div>
                  )}
                  {d.decision && (
                    <div className="pl-3 border-l-2" style={{ borderColor: 'var(--blue)' }}>
                      <h4 className="font-bold mb-1 text-blue-500">Decision:</h4>
                      <p className="leading-relaxed font-medium" style={{ color: 'var(--text)' }}>{d.decision}</p>
                    </div>
                  )}
                  {d.alternatives && (
                    <div>
                      <h4 className="font-bold mb-1" style={{ color: 'var(--text)' }}>Alternatives Considered:</h4>
                      <p className="leading-relaxed italic" style={{ color: 'var(--text-muted)' }}>{d.alternatives}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
