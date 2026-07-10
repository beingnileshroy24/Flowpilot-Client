import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Activity, Clock, CheckCircle2, Layers } from 'lucide-react';

const STATUS_COLORS = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#f59e0b',
  IN_REVIEW: '#3b82f6',
  DONE: '#22c55e'
};

const PRIORITY_COLORS = {
  LOW: '#22c55e',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  CRITICAL: '#ef4444'
};

export default function AnalyticsTab({ tasks, project }) {
  // Status Distribution Data
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.keys(STATUS_COLORS).map(key => ({
    name: key, value: statusCounts[key] || 0, color: STATUS_COLORS[key]
  })).filter(d => d.value > 0);

  // Priority Distribution Data
  const priorityCounts = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {});
  const priorityData = Object.keys(PRIORITY_COLORS).map(key => ({
    name: key, value: priorityCounts[key] || 0, fill: PRIORITY_COLORS[key]
  }));

  // Velocity (Sprint over Sprint) Data
  const sprints = project?.sprints || [];
  const velocityData = sprints.map(sprint => {
    const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
    const completed = sprintTasks.filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const total = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    return { name: sprint.title, completed, total };
  });

  // Calculate Health Score (Simple mock logic based on progress and overdue)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE').length;
  
  let healthScore = 100;
  if (totalTasks > 0) {
    const completionRate = completedTasks / totalTasks;
    const penalty = (overdueTasks / totalTasks) * 50;
    healthScore = Math.max(0, Math.round((completionRate * 100) - penalty));
  }
  
  const healthColor = healthScore > 75 ? '#22c55e' : healthScore > 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="h-full overflow-y-auto space-y-6 pr-2 animate-fade-in">
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Layers size={20} className="mb-2 text-blue-500" />
          <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">Total Tasks</span>
          <span className="text-2xl font-black">{totalTasks}</span>
        </div>
        <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <CheckCircle2 size={20} className="mb-2 text-green-500" />
          <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">Completed</span>
          <span className="text-2xl font-black">{completedTasks}</span>
        </div>
        <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Clock size={20} className="mb-2 text-red-500" />
          <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">Overdue</span>
          <span className="text-2xl font-black text-red-500">{overdueTasks}</span>
        </div>
        <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center relative overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle, ${healthColor} 0%, transparent 70%)` }} />
          <Activity size={20} className="mb-2" style={{ color: healthColor }} />
          <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">Health Score</span>
          <span className="text-2xl font-black" style={{ color: healthColor }}>{healthScore}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Donut Chart */}
        <div className="p-5 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-bold mb-4">Task Distribution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="p-5 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-bold mb-4">Priority Breakdown</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip cursor={{ fill: 'var(--surface-elevated)' }} contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Velocity Chart (Only if sprints exist) */}
      {sprints.length > 0 && (
        <div className="p-5 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-bold mb-4">Velocity (Sprint over Sprint Effort)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis />
                <Tooltip contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="completed" name="Completed (hrs)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="total" name="Committed (hrs)" stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
