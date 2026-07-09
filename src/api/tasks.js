import client from './client';

export const tasksApi = {
  getTasks: async (projectId) => {
    const response = await client.get('/api/v1/tasks/', {
      params: { project_id: projectId },
    });
    return response.data;
  },

  createTask: async (payload) => {
    const response = await client.post('/api/v1/tasks/', payload);
    return response.data;
  },

  updateTaskStatus: async (taskId, status) => {
    const response = await client.patch(`/api/v1/tasks/${taskId}/status`, null, {
      params: { current_status: status },
    });
    return response.data;
  },

  updateTaskDetails: async (taskId, payload) => {
    const response = await client.patch(`/api/v1/tasks/${taskId}`, payload);
    return response.data;
  },
};
