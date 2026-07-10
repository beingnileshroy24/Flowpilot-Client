import React, { useState } from 'react';
import { BookOpen, ThumbsUp, ThumbsDown, Zap, Plus, X } from 'lucide-react';

export default function RetroBoard({ project, canEdit, updateProjectMutation }) {
  const retros = project?.retro_entries || [];
  
  // We'll manage a simple state for the "Active Retro" since building a full selector is out of scope.
  // We just use the first entry or an empty object if none exist.
  const activeRetro = retros[0] || { id: 'default', went_well: [], improvements: [], action_items: [] };

  const [newItemTexts, setNewItemTexts] = useState({ well: '', imp: '', act: '' });

  const handleUpdate = (newRetroData) => {
    let updatedRetros = [...retros];
    if (retros.length === 0) {
      updatedRetros = [{ ...activeRetro, ...newRetroData, id: Math.random().toString(36).substring(2, 9) }];
    } else {
      updatedRetros[0] = { ...updatedRetros[0], ...newRetroData };
    }
    updateProjectMutation.mutate({ retro_entries: updatedRetros });
  };

  const addItem = (type) => {
    const text = newItemTexts[type].trim();
    if (!text) return;

    if (type === 'well') {
      handleUpdate({ went_well: [...(activeRetro.went_well || []), text] });
    } else if (type === 'imp') {
      handleUpdate({ improvements: [...(activeRetro.improvements || []), text] });
    } else if (type === 'act') {
      const newItem = { id: Math.random().toString(36).substring(2, 9), text, done: false };
      handleUpdate({ action_items: [...(activeRetro.action_items || []), newItem] });
    }

    setNewItemTexts(prev => ({ ...prev, [type]: '' }));
  };

  const removeItem = (type, index) => {
    if (type === 'well') {
      const copy = [...(activeRetro.went_well || [])]; copy.splice(index, 1);
      handleUpdate({ went_well: copy });
    } else if (type === 'imp') {
      const copy = [...(activeRetro.improvements || [])]; copy.splice(index, 1);
      handleUpdate({ improvements: copy });
    } else if (type === 'act') {
      const copy = [...(activeRetro.action_items || [])]; copy.splice(index, 1);
      handleUpdate({ action_items: copy });
    }
  };

  const toggleActionItem = (index) => {
    const copy = [...(activeRetro.action_items || [])];
    copy[index].done = !copy[index].done;
    handleUpdate({ action_items: copy });
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <BookOpen size={20} className="text-blue-500" />
        <div>
          <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--text)' }}>Active Retrospective</h2>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sprint / Milestone Reflection</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-4">
        
        {/* Went Well Column */}
        <div className="flex flex-col rounded-2xl border bg-[var(--surface)]" style={{ borderColor: 'var(--border)' }}>
          <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <ThumbsUp size={16} className="text-green-500" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>What went well?</h3>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {(activeRetro.went_well || []).map((item, i) => (
              <div key={i} className="group relative p-3 rounded-xl text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--text)', border: '1px solid rgba(34,197,94,0.2)' }}>
                {item}
                {canEdit && <button onClick={() => removeItem('well', i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>}
              </div>
            ))}
          </div>
          {canEdit && (
            <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <form onSubmit={e => { e.preventDefault(); addItem('well'); }} className="flex gap-2">
                <input type="text" value={newItemTexts.well} onChange={e => setNewItemTexts({...newItemTexts, well: e.target.value})} placeholder="Add item..." className="glass-input flex-1 text-xs px-3 py-1.5 rounded-lg" />
                <button type="submit" disabled={!newItemTexts.well.trim()} className="btn-secondary p-1.5 rounded-lg"><Plus size={14}/></button>
              </form>
            </div>
          )}
        </div>

        {/* Improvements Column */}
        <div className="flex flex-col rounded-2xl border bg-[var(--surface)]" style={{ borderColor: 'var(--border)' }}>
          <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <ThumbsDown size={16} className="text-red-500" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>What didn't go well?</h3>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {(activeRetro.improvements || []).map((item, i) => (
              <div key={i} className="group relative p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--text)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {item}
                {canEdit && <button onClick={() => removeItem('imp', i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>}
              </div>
            ))}
          </div>
          {canEdit && (
            <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <form onSubmit={e => { e.preventDefault(); addItem('imp'); }} className="flex gap-2">
                <input type="text" value={newItemTexts.imp} onChange={e => setNewItemTexts({...newItemTexts, imp: e.target.value})} placeholder="Add item..." className="glass-input flex-1 text-xs px-3 py-1.5 rounded-lg" />
                <button type="submit" disabled={!newItemTexts.imp.trim()} className="btn-secondary p-1.5 rounded-lg"><Plus size={14}/></button>
              </form>
            </div>
          )}
        </div>

        {/* Action Items Column */}
        <div className="flex flex-col rounded-2xl border bg-[var(--surface)]" style={{ borderColor: 'var(--border)' }}>
          <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <Zap size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Action Items</h3>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {(activeRetro.action_items || []).map((item, i) => (
              <div key={i} className="group relative p-3 rounded-xl text-sm flex gap-3" style={{ background: 'var(--surface-solid)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={item.done} onChange={() => canEdit && toggleActionItem(i)} className="mt-1" />
                <span className={`flex-1 ${item.done ? 'line-through opacity-50' : ''}`}>{item.text}</span>
                {canEdit && <button onClick={() => removeItem('act', i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>}
              </div>
            ))}
          </div>
          {canEdit && (
            <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <form onSubmit={e => { e.preventDefault(); addItem('act'); }} className="flex gap-2">
                <input type="text" value={newItemTexts.act} onChange={e => setNewItemTexts({...newItemTexts, act: e.target.value})} placeholder="Add action item..." className="glass-input flex-1 text-xs px-3 py-1.5 rounded-lg" />
                <button type="submit" disabled={!newItemTexts.act.trim()} className="btn-secondary p-1.5 rounded-lg"><Plus size={14}/></button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
