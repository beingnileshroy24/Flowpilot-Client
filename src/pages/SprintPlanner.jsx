import React, { useState, useEffect, useMemo } from 'react';
import { Bot, AlertTriangle, ArrowRight, ArrowLeft, CheckCircle2, User, Play } from 'lucide-react';
import { plannerApi } from '../api/planner';

export default function SprintPlanner({ projectId, sprints, onPlanCommitted }) {
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [planData, setPlanData] = useState(null);
  
  // Local simulation state
  const [simulatedAssignments, setSimulatedAssignments] = useState([]);
  const [simulatedDropped, setSimulatedDropped] = useState([]);
  
  useEffect(() => {
    if (sprints && sprints.length > 0 && !selectedSprintId) {
      const activeOrPlanning = sprints.find(s => s.status === 'PLANNING' || s.status === 'ACTIVE');
      if (activeOrPlanning) setSelectedSprintId(activeOrPlanning.id);
      else setSelectedSprintId(sprints[0].id);
    }
  }, [sprints, selectedSprintId]);

  const handleGeneratePlan = async () => {
    if (!selectedSprintId) return;
    setIsGenerating(true);
    setPlanData(null);
    try {
      const result = await plannerApi.generatePlan(projectId, selectedSprintId);
      setPlanData(result);
      setSimulatedAssignments(result.assigned_tasks || []);
      setSimulatedDropped(result.dropped_tasks || []);
    } catch (err) {
      console.error("Failed to generate AI sprint plan:", err);
      alert("Failed to generate plan. Ensure you have eligible tasks and developers.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommitPlan = async () => {
    if (!selectedSprintId || simulatedAssignments.length === 0) return;
    setIsCommitting(true);
    try {
      const assignmentsMap = {};
      simulatedAssignments.forEach(t => {
        assignmentsMap[t.task_id] = t.assigned_to;
      });
      await plannerApi.commitPlan(projectId, selectedSprintId, assignmentsMap);
      if (onPlanCommitted) {
        onPlanCommitted();
      }
    } catch (err) {
      console.error("Failed to commit AI plan:", err);
      alert("Failed to commit plan to the database.");
    } finally {
      setIsCommitting(false);
    }
  };

  const moveToSprint = (task) => {
    const devIds = Object.keys(planData?.dev_capacities || {});
    const fallbackDevId = devIds.length > 0 ? devIds[0] : 'unassigned';
    const fallbackDevName = fallbackDevId !== 'unassigned' ? "Developer" : "Unassigned";
    
    setSimulatedDropped(prev => prev.filter(t => t.task_id !== task.task_id));
    setSimulatedAssignments(prev => [...prev, { ...task, assigned_to: fallbackDevId, assignee_name: fallbackDevName }]);
  };

  const moveToBacklog = (task) => {
    setSimulatedAssignments(prev => prev.filter(t => t.task_id !== task.task_id));
    setSimulatedDropped(prev => [...prev, task]);
  };

  const swimlanes = useMemo(() => {
    const groups = {};
    simulatedAssignments.forEach(t => {
      if (!groups[t.assigned_to]) {
        groups[t.assigned_to] = {
          assignee_name: t.assignee_name,
          tasks: [],
          totalPoints: 0
        };
      }
      groups[t.assigned_to].tasks.push(t);
      groups[t.assigned_to].totalPoints += (t.estimated_hours || 0);
    });
    return groups;
  }, [simulatedAssignments]);

  const checkBrokenDependencies = (task) => {
    if (!task.dependency_ids || task.dependency_ids.length === 0) return false;
    const droppedIds = new Set(simulatedDropped.map(t => t.task_id));
    return task.dependency_ids.some(depId => droppedIds.has(depId));
  };

  return (
    <div className="flex flex-col h-full animate-fade-in gap-4">
      <div className="flex items-center justify-between p-4 border rounded-xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Bot className="text-purple-500" /> AI Sprint Planner
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Automatically balance developer workloads, manage risks, and resolve dependencies using CP-SAT solving.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sprints && sprints.length > 0 ? (
            <select 
              value={selectedSprintId} 
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="glass-input text-xs px-3 py-2 rounded-lg"
            >
              {sprints.map(s => (
                <option key={s.id} value={s.id}>{s.title} ({s.status})</option>
              ))}
            </select>
          ) : (
            <span className="text-xs px-3 py-2 rounded-lg border italic" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg)' }}>
              No sprints — create one in Planning tab
            </span>
          )}
          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating || !selectedSprintId}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <><span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Computing Matrix...</>
            ) : (
              <><Play size={14} /> Generate Optimal Plan</>
            )}
          </button>
        </div>
      </div>

      {planData && (
        <div className="flex flex-1 gap-4 overflow-hidden">
          
          {/* Left Pane: Backlog */}
          <div className="w-1/3 flex flex-col border rounded-xl p-4 overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center justify-between" style={{ color: 'var(--text)' }}>
              <span>Product Backlog (Dropped/Deferred)</span>
              <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">{simulatedDropped.length}</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {simulatedDropped.map(task => (
                <div key={task.task_id} className="p-3 border rounded-lg hover:border-purple-500/50 transition-colors group relative" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{task.title}</span>
                    <button onClick={() => moveToSprint(task)} className="opacity-0 group-hover:opacity-100 p-1 bg-purple-500/20 text-purple-500 rounded hover:bg-purple-500 hover:text-white transition-all">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Priority: {task.priority}</span>
                    <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded text-gray-400">{task.estimated_hours}h</span>
                  </div>
                  <div className="absolute top-full left-0 mt-1 w-full p-2 bg-black/90 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                    Rationale: Deferred due to insufficient developer capacity or high burnout risk.
                  </div>
                </div>
              ))}
              {simulatedDropped.length === 0 && (
                <div className="text-center text-xs py-8" style={{ color: 'var(--text-muted)' }}>No deferred tasks.</div>
              )}
            </div>
          </div>

          {/* Right Pane: Sprint Board & Sidebar */}
          <div className="w-2/3 flex gap-4 overflow-hidden">
            <div className="flex-1 flex flex-col border rounded-xl p-4 overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                  AI-Proposed Sprint Board
                </h3>
                <button onClick={handleCommitPlan} disabled={isCommitting} className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs py-1.5 px-4 rounded-lg flex items-center gap-2 transition-colors">
                  {isCommitting ? 'Committing...' : <><CheckCircle2 size={14} /> Commit AI Sprint Plan</>}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {Object.entries(swimlanes).map(([devId, data]) => {
                  const capacity = (planData?.dev_capacities && planData.dev_capacities[devId]) || 40.0;
                  const loadPercentage = Math.min(100, Math.round((data.totalPoints / capacity) * 100));
                  
                  let heatColor = 'bg-green-500';
                  if (loadPercentage > 75) heatColor = 'bg-yellow-500';
                  if (loadPercentage > 90) heatColor = 'bg-red-500';

                  return (
                    <div key={devId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text)' }}>
                          <User size={12} /> {data.assignee_name}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          {data.totalPoints} / {capacity} hrs - {loadPercentage}% Load
                        </span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className={`h-full ${heatColor} transition-all duration-300`} style={{ width: `${loadPercentage}%` }} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {data.tasks.map(task => {
                          const hasBrokenDep = checkBrokenDependencies(task);
                          return (
                            <div key={task.task_id} className={`p-3 border rounded-lg transition-colors group relative ${hasBrokenDep ? 'border-red-500/50 bg-red-500/5' : 'hover:border-purple-500/50'}`} style={{ borderColor: hasBrokenDep ? '' : 'var(--border)', background: hasBrokenDep ? '' : 'var(--background)' }}>
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold flex gap-1 items-start" style={{ color: 'var(--text)' }}>
                                  {hasBrokenDep && <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />}
                                  {task.title}
                                </span>
                                <button onClick={() => moveToBacklog(task)} className="opacity-0 group-hover:opacity-100 p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all shrink-0 ml-2">
                                  <ArrowLeft size={14} />
                                </button>
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Risk: {(task.delay_risk * 100).toFixed(0)}%</span>
                                <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded text-gray-400">{task.estimated_hours}h</span>
                              </div>
                              <div className="absolute top-full left-0 mt-1 w-full p-2 bg-black/90 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                                Rationale: Selected by AI to maximize priority while balancing {data.assignee_name}'s capacity.
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-1/3 border rounded-xl p-4 flex flex-col" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Bot size={16} className="text-purple-500" /> AI Copilot Context
              </h3>
              <div className="flex-1 overflow-y-auto text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {planData.explanation ? (
                  <div className="whitespace-pre-wrap">{planData.explanation}</div>
                ) : (
                  <div className="italic">No explanation generated.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
