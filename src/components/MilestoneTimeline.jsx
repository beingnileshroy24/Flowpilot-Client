import React from 'react';
import { Milestone, Calendar } from 'lucide-react';

export default function MilestoneTimeline({ milestones = [] }) {
  if (milestones.length === 0) return null;

  // Extremely simplified timeline view: just a list of items showing relative progression
  // A true Gantt chart would require a complex date math library and heavy custom rendering
  return (
    <div className="mt-8">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Milestone size={16} className="text-purple-500" /> Milestone Roadmap
      </h3>
      
      <div className="relative pl-6 border-l-2 space-y-6" style={{ borderColor: 'var(--border)' }}>
        {milestones.map((m, i) => {
          const isDone = m.status === 'COMPLETED';
          const isWip = m.status === 'IN_PROGRESS';
          
          let dotColor = 'bg-gray-400';
          if (isDone) dotColor = 'bg-green-500';
          if (isWip) dotColor = 'bg-amber-500';

          return (
            <div key={m.id} className="relative animate-fade-in">
              <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-[var(--surface)] ${dotColor}`} />
              
              <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:scale-[1.01]" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    {m.title}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      isDone ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                      isWip ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                    }`}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </h4>
                  {m.description && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{m.description}</p>}
                </div>
                
                {m.due_date && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0" style={{ background: 'var(--surface-solid)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <Calendar size={12} /> {new Date(m.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
