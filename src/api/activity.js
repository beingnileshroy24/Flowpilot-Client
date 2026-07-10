import client from './client';

export const activityApi = {
  getTaskActivity: async (taskId) => {
    const response = await client.get(`/api/v1/activity/`, { params: { task_id: taskId } });
    return response.data;
  },

  getProjectActivity: async (projectId) => {
    const response = await client.get(`/api/v1/activity/`, { params: { project_id: projectId } });
    return response.data;
  },
};
