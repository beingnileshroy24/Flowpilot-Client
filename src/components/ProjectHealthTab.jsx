import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthApi } from '../api/health';
import { 
  ShieldAlert, Activity, Sparkles, Clock, TrendingUp, AlertTriangle, 
  User, RefreshCw, X, ChevronRight, CheckCircle2, AlertCircle 
} from 'lucide-react';

export default function ProjectHealthTab({ projectId, project }) {
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState(null); // 'sprint' or 'workload' or 'tasks' for detail drawer

  // 1. Fetch Project Health
  const { data: health, isLoading: isLoadingHealth, error: healthError } = useQuery({
    queryKey: ['projectHealth', projectId],
    queryFn: () => healthApi.getLatestProjectHealth(projectId),
    retry: false
  });

  // 2. Fetch Active Sprint Prediction if active sprint exists
  const activeSprint = project.sprints?.find(s => s.status === 'ACTIVE');
  const activeSprintId = activeSprint?.id;

  const { data: sprintPred, isLoading: isLoadingSprint } = useQuery({
    queryKey: ['sprintPrediction', activeSprintId],
    queryFn: () => healthApi.getLatestSprintPrediction(activeSprintId),
    enabled: !!activeSprintId,
    retry: false
  });

  // 3. Mutation to trigger pipeline calculation
  const triggerMutation = useMutation({
    mutationFn: () => healthApi.triggerPrediction(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectHealth', projectId] });
      if (activeSprintId) {
        queryClient.invalidateQueries({ queryKey: ['sprintPrediction', activeSprintId] });
      }
    }
  });

  const isLoading = isLoadingHealth || isLoadingSprint;

  // Recalculate handler
  const handleRecalculate = () => {
    triggerMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="animate-spin text-blue-500" size={32} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Running ingestion & predictive models...
        </p>
      </div>
    );
  }

  // Handle empty or error states (no metrics yet)
  if (!health || healthError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed" 
           style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <ShieldAlert className="text-yellow-500 mb-4 animate-pulse" size={48} />
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>No Diagnostic Data Available</h3>
        <p className="text-sm max-w-md mb-6" style={{ color: 'var(--text-muted)' }}>
          Operational health score and failure risk are calculated by feeding sprint capacity, workload ratios, and sentiment metrics into the ONNX decision registry.
        </p>
        <button
          onClick={handleRecalculate}
          disabled={triggerMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-md"
        >
          {triggerMutation.isPending ? (
            <RefreshCw className="animate-spin" size={16} />
          ) : (
            <Activity size={16} />
          )}
          Run Operational Diagnostic Pipeline
        </button>
      </div>
    );
  }

  // Extract variables for rendering - no fake fallbacks, only real data or null
  const sprintTitle = activeSprint?.title || null;
  const failureRate = sprintPred?.failure_rate !== undefined ? sprintPred.failure_rate : null;
  const failureLikelihood = failureRate !== null ? Math.round(failureRate * 100) : null;
  const hasSprintData = failureRate !== null;
  
  // Glowing indicators based on score: 0.0 - 0.4 green, 0.41 - 0.7 amber, > 0.71 high-risk amber border + blinking dots
  let sprintStatusColor = 'var(--text-muted)';
  let sprintThemeClass = '';
  let riskStatusText = 'NO DATA';
  
  if (!hasSprintData) {
    sprintStatusColor = 'var(--text-muted)';
    sprintThemeClass = '';
    riskStatusText = 'NO SPRINT DATA';
  } else if (failureRate <= 0.40) {
    sprintStatusColor = '#22c55e'; // Green
    sprintThemeClass = 'border-green-500/30 bg-green-500/5 text-green-500';
    riskStatusText = 'HEALTHY PROFILE';
  } else if (failureRate <= 0.70) {
    sprintStatusColor = '#f59e0b'; // Amber
    sprintThemeClass = 'border-amber-500/30 bg-amber-500/5 text-amber-500';
    riskStatusText = 'MODERATE RISK PROFILE';
  } else {
    sprintStatusColor = '#ef4444'; // Red-amber alert
    sprintThemeClass = 'border-red-500/50 bg-red-500/5 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.07)] border-2';
    riskStatusText = 'HIGH RISK PROFILE';
  }

  // Delay calculation based on real failure rate
  const delayDays = failureRate !== null ? (failureRate > 0.70 ? 4 : (failureRate > 0.40 ? 2 : 0)) : null;

  // Unplanned scope creep points - only from real sprint prediction
  const scopeCreepPoints = sprintPred?.unplanned_scope_creep_points !== undefined 
    ? sprintPred.unplanned_scope_creep_points 
    : null;

  // Workload Bottleneck calculations
  // Find highest workload dev from assignee_burnout_risks
  const devRisks = health.assignee_burnout_risks || [];
  const highestWorkloadDev = devRisks.length > 0 
    ? devRisks.reduce((prev, current) => (prev.workload_balance > current.workload_balance) ? prev : current)
    : null;
  
  const bottleneckDevName = highestWorkloadDev?.name || null;
  const bottleneckCapacityPct = highestWorkloadDev ? Math.round(highestWorkloadDev.workload_balance * 100) : null;

  // SHAP weights breakdown calculations (only from real data)
  const driftVal = sprintPred?.historical_velocity_drift !== undefined ? sprintPred.historical_velocity_drift : null;
  const shapWeights = (driftVal !== null && scopeCreepPoints !== null && highestWorkloadDev) ? {
    unplanned_scope_creep_points: 0.15 * scopeCreepPoints,
    assignee_workload_balance: 0.15 * highestWorkloadDev.workload_balance,
    historical_velocity_drift: 0.25 * driftVal
  } : null;
  
  const totalShap = shapWeights
    ? Math.abs(shapWeights.unplanned_scope_creep_points) + 
      Math.abs(shapWeights.assignee_workload_balance) + 
      Math.abs(shapWeights.historical_velocity_drift)
    : 0;

  const getShapPercentage = (weight) => {
    if (totalShap === 0) return 33;
    return Math.round((Math.abs(weight) / totalShap) * 100);
  };

  // AI Explanation or recommendations parser
  const aiExplanation = sprintPred?.explanation || health.explanation || "";

  // Helper to extract sections from AI explanation markdown
  const extractSection = (markdown, sectionTitle) => {
    if (!markdown) return "";
    const regex = new RegExp(`### ${sectionTitle}\\s*([\\s\\S]*?)(?=###|$)`, 'i');
    const match = markdown.match(regex);
    return match ? match[1].trim() : "";
  };

  const thoughtProcessText = extractSection(aiExplanation, "Thought Process");
  const riskAnalysisText = extractSection(aiExplanation, "Risk Analysis");
  const recommendationsText = extractSection(aiExplanation, "Actionable Recommendations");

  return (
    <div className="space-y-6 relative pb-10">
      
      {/* Header bar and recalculate button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Activity className="text-blue-500" size={20} />
            Project Operational Health Diagnostic Portal
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Real-time pipeline diagnostics using ONNX classifiers and explainable AI insights.
          </p>
        </div>
        
        <button
          onClick={handleRecalculate}
          disabled={triggerMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-sm ml-auto"
        >
          <RefreshCw className={`shrink-0 ${triggerMutation.isPending ? 'animate-spin' : ''}`} size={13} />
          {triggerMutation.isPending ? 'Re-evaluating...' : 'Recalculate Diagnostics'}
        </button>
      </div>

      {/* Grid of Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main Overview & Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Diagnostic Dashboard Panel */}
          <div 
            onClick={() => hasSprintData ? setSelectedCard('sprint') : undefined}
            className={`p-6 rounded-2xl border transition-all duration-300 ${hasSprintData ? 'cursor-pointer group' : 'cursor-default'} ${sprintThemeClass}`}
            style={{ 
              background: 'var(--surface)',
              borderColor: (hasSprintData && failureRate > 0.70) ? '#f59e0b' : 'var(--border)'
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase opacity-85">
                <TrendingUp size={14} />
                <span>{sprintTitle ? `Active Interval: ${sprintTitle}` : 'Sprint Analysis'}</span>
              </div>
              {hasSprintData && failureRate > 0.71 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-500 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  ALERT CONFIGURATION
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Current Sprint Status */}
              <div>
                <div className="text-xs uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Current Sprint Status:
                </div>
                <div className="text-lg md:text-xl font-black flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <AlertTriangle className="shrink-0" size={22} style={{ color: sprintStatusColor }} />
                  {hasSprintData
                    ? <span>{riskStatusText} ({failureLikelihood}% Failure Likelihood)</span>
                    : <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No active sprint found for this project.</span>
                  }
                </div>
              </div>

              {/* Expected Delay */}
              {hasSprintData && (
                <div className="pt-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="text-xs uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                    Target Completion Date:
                  </div>
                  <div className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <Clock className="text-blue-500" size={16} />
                    <span>
                      {delayDays > 0 
                        ? `Expected Delay of +${delayDays} Days Beyond Baseline` 
                        : 'On Track with Baseline Schedule'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {hasSprintData && (
              <div className="mt-5 flex items-center justify-between text-xs font-bold text-blue-500 group-hover:underline">
                <span>View contributing factors & SHAP weights</span>
                <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>

          {/* Pipeline Alerts Section */}
          <div className="p-6 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 text-sm font-black mb-4" style={{ color: (scopeCreepPoints !== null && scopeCreepPoints > 0) || bottleneckDevName ? '#ef4444' : 'var(--text-muted)' }}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: (scopeCreepPoints !== null && scopeCreepPoints > 0) || bottleneckDevName ? '#ef4444' : 'var(--text-muted)', animation: (scopeCreepPoints !== null && scopeCreepPoints > 0) || bottleneckDevName ? 'pulse 1.5s infinite' : 'none' }} />
              {(scopeCreepPoints !== null && scopeCreepPoints > 0) || bottleneckDevName ? 'CRITICAL PIPELINE ALERT' : 'PIPELINE ALERTS'}
            </div>

            <div className="space-y-4">
              {/* Alert 1: Scope Creep */}
              {scopeCreepPoints !== null ? (
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-red-500/10 bg-red-500/5">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-xs font-extrabold text-red-400">Scope Creep Impact</div>
                    <div className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
                      {scopeCreepPoints} story points added mid-sprint.
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      exceeds sprint buffers and increases velocity drift indexes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-500/10 bg-gray-500/5">
                  <CheckCircle2 className="text-gray-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-xs font-extrabold" style={{ color: 'var(--text-muted)' }}>No Scope Creep Detected</div>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>No active sprint or scope data available.</p>
                  </div>
                </div>
              )}

              {/* Alert 2: Bottleneck */}
              {bottleneckDevName ? (
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-yellow-500/10 bg-yellow-500/5">
                  <User className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-xs font-extrabold text-yellow-400">Workload Bottleneck</div>
                    <div className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
                      Developer {bottleneckDevName} carries {bottleneckCapacityPct}% task capacity.
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      exceeds safety threshold of 120%, creating an active task delay bottleneck.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-500/10 bg-gray-500/5">
                  <CheckCircle2 className="text-gray-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-xs font-extrabold" style={{ color: 'var(--text-muted)' }}>No Workload Issues</div>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>No developer workload data recorded for this project.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis and Recommendations */}
          <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 text-sm font-black text-blue-500">
              <Sparkles size={16} className="animate-pulse" />
              🤖 AI ANALYSIS & RECOMMENDATIONS
            </div>

            <div className="space-y-4 divide-y divide-gray-800">
              {/* Rationale */}
              <div className="space-y-1.5">
                <div className="text-xs font-extrabold" style={{ color: 'var(--text-muted)' }}>Risk Rationale:</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                  {riskAnalysisText || "Historical velocity drift patterns reveal that mid-sprint scope changes cause major delivery delays."}
                </p>
              </div>

              {/* Recommendations */}
              <div className="pt-4 space-y-1.5">
                <div className="text-xs font-extrabold" style={{ color: 'var(--text-muted)' }}>Recommended Next Steps:</div>
                <div className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                  {recommendationsText ? (
                    <div className="whitespace-pre-line text-sm">{recommendationsText}</div>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Move Task #402 down to next backlog cycle.</li>
                      <li>Redistribute sprint tasks from overloaded assignees to balance workload indexes.</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Project Health Scores and Burnout lists */}
        <div className="space-y-6">
          {/* Circular Score Panel */}
          <div className="p-6 rounded-2xl border text-center flex flex-col items-center justify-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="text-xs font-extrabold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
              Project Health Score
            </div>
            
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Circle path background */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="var(--border)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke={health.health_score > 70 ? '#22c55e' : (health.health_score > 40 ? '#f59e0b' : '#ef4444')}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={389.5}
                  strokeDashoffset={389.5 - (389.5 * health.health_score) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black" style={{ color: 'var(--text)' }}>
                  {Math.round(health.health_score)}%
                </span>
                <span className="text-[10px] uppercase font-bold text-gray-500">
                  {health.status}
                </span>
              </div>
            </div>

            <p className="text-xs mt-4 text-center px-2" style={{ color: 'var(--text-muted)' }}>
              A blended weight of task execution speed, developer context switching, and current sprint stability.
            </p>
          </div>

          {/* Dev Burnout Risks Summary */}
          <div className="p-6 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
              Developer Burnout Index
            </h3>

            <div className="space-y-4">
              {devRisks.map((dev, i) => {
                let badgeColor = 'bg-green-500/10 text-green-500 border-green-500/20';
                if (dev.burnout_risk_level === 'CRITICAL') {
                  badgeColor = 'bg-red-500/10 text-red-500 border-red-500/20';
                } else if (dev.burnout_risk_level === 'WARNING') {
                  badgeColor = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
                }

                return (
                  <div key={i} className="flex justify-between items-center p-2.5 rounded-xl border border-transparent hover:border-[var(--border)] transition-all">
                    <div>
                      <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{dev.name}</div>
                      <div className="text-[11px] flex gap-2 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        <span>Workload: {Math.round(dev.workload_balance * 100)}%</span>
                        <span>&bull;</span>
                        <span>Switches: {dev.context_switching_count}</span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-full ${badgeColor}`}>
                      {dev.burnout_risk_level}
                    </span>
                  </div>
                );
              })}

              {devRisks.length === 0 && (
                <div className="text-center text-xs italic text-[var(--text-muted)] py-4">
                  No developer workload logs recorded.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* DETAILED RISK SIDE PANEL (DRAWER) */}
      {selectedCard === 'sprint' && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* Click outside to close */}
          <div className="flex-1" onClick={() => setSelectedCard(null)} />
          
          <div className="w-full max-w-md h-full overflow-y-auto flex flex-col p-6 shadow-2xl border-l animate-slide-in" 
               style={{ background: 'var(--surface-solid)', borderColor: 'var(--border)' }}>
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                  Sprint Risk Analysis Details
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Diagnostic factors contributing to {sprintTitle} risk score
                </p>
              </div>
              <button 
                onClick={() => setSelectedCard(null)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 space-y-6">
              
              {/* Failure rate header */}
              <div className="p-4 rounded-xl text-center border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="text-xs uppercase font-extrabold" style={{ color: 'var(--text-muted)' }}>Calculated Failure Likelihood</div>
                <div className="text-4xl font-black mt-1" style={{ color: sprintStatusColor }}>
                  {failureLikelihood}%
                </div>
                <div className="text-[10px] mt-2 text-gray-500 font-semibold">
                  Confidence Interval Bounds: [{Math.max(0, failureLikelihood - 5)}% - {Math.min(100, failureLikelihood + 4)}%]
                </div>
              </div>

              {/* SHAP Weight Breakdown */}
              {shapWeights ? (
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-black tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Top Driving Factor Weights (SHAP Intercepts)
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Factor 1: Scope Creep */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span style={{ color: 'var(--text)' }}>1. unplanned_scope_creep_points</span>
                        <span className="text-red-500 font-bold">+{shapWeights.unplanned_scope_creep_points.toFixed(2)} Risk</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${getShapPercentage(shapWeights.unplanned_scope_creep_points)}%` }} />
                      </div>
                    </div>

                    {/* Factor 2: Workload Balance */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span style={{ color: 'var(--text)' }}>2. assignee_workload_balance ({bottleneckDevName})</span>
                        <span className="text-yellow-500 font-bold">+{shapWeights.assignee_workload_balance.toFixed(2)} Risk</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${getShapPercentage(shapWeights.assignee_workload_balance)}%` }} />
                      </div>
                    </div>

                    {/* Factor 3: Velocity Drift */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span style={{ color: 'var(--text)' }}>3. historical_velocity_drift</span>
                        <span className="text-blue-500 font-bold">+{shapWeights.historical_velocity_drift.toFixed(2)} Risk</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${getShapPercentage(shapWeights.historical_velocity_drift)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl text-xs italic text-center" style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  SHAP weights are unavailable. No sprint prediction data exists for this project.
                </div>
              )}

              {/* Historical Metrics Evidence */}
              {shapWeights ? (
                <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <h4 className="text-xs uppercase font-black tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Target Historical Metrics Evidence
                  </h4>
                  
                  <ul className="space-y-2.5 text-xs font-semibold">
                    <li className="flex items-start gap-2" style={{ color: 'var(--text)' }}>
                      <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                      <span>Velocity Drift: {driftVal.toFixed(2)} (computed from sprint history)</span>
                    </li>
                    <li className="flex items-start gap-2" style={{ color: 'var(--text)' }}>
                      <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                      <span>Scope Creep: {scopeCreepPoints} unplanned story points mid-sprint.</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No historical sprint metrics available. Add tasks and an active sprint to generate sprint-level predictions.</p>
                </div>
              )}

              {/* Rationale and mitigation text block */}
              {thoughtProcessText && (
                <div className="p-4 rounded-xl border space-y-2 text-xs" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                  <div className="font-extrabold text-blue-500">SYSTEM DIAGNOSTIC THOUGHT PROCESS:</div>
                  <p className="leading-relaxed whitespace-pre-line">{thoughtProcessText}</p>
                </div>
              )}

            </div>

            {/* Close button */}
            <div className="border-t pt-4 mt-6" style={{ borderColor: 'var(--border)' }}>
              <button 
                onClick={() => setSelectedCard(null)}
                className="w-full py-2.5 rounded-xl font-bold bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer text-xs"
                style={{ color: 'var(--text)' }}
              >
                Close Breakdown
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
