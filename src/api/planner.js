import api from './client';

export const plannerApi = {
  generatePlan: async (projectId, targetSprintId, capacityOverride = null) => {
    const { data } = await api.post('/api/v1/planner/generate', {
      project_id: projectId,
      target_sprint_id: targetSprintId,
      capacity_override: capacityOverride,
    });
    return data;
  },

  commitPlan: async (projectId, targetSprintId, taskAssignments) => {
    const { data } = await api.post('/api/v1/planner/commit', {
      project_id: projectId,
      target_sprint_id: targetSprintId,
      task_assignments: taskAssignments,
    });
    return data;
  }
};
